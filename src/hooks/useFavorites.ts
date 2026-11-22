import { useEffect, useRef, useState } from 'react'
import { ApiError, errorText } from '@/services/api'
import { gateway } from '@/services/gateway'

export interface Favorite { symbol: string; companyName?: string; name?: string }
interface WatchlistItem { symbol: string; addedAt?: string }
export type FavoritesMode = 'loading' | 'server' | 'local'

function readLocal(key: string): Favorite[] {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(saved) ? saved.filter(x => typeof x?.symbol === 'string') : []
  } catch { return [] }
}
function writeLocal(key: string, items: Favorite[]) {
  try { items.length ? localStorage.setItem(key, JSON.stringify(items)) : localStorage.removeItem(key) } catch { /* Preferencia en memoria. */ }
}

/**
 * Favoritos del usuario. Con Premium se guardan en la watchlist de M10 (`/watchlist`) y siguen al usuario
 * entre dispositivos; los que estaban en el navegador se suben una sola vez. Sin Premium (M10 responde 403)
 * o si M10 no está disponible, se guardan en el navegador.
 */
export function useFavorites(userId: number, revision: number) {
  const key = 'acciones-ud.favoritos.' + (import.meta.env.VITE_API_BASE_URL || '/api/v1') + '.' + userId
  const [mode, setMode] = useState<FavoritesMode>('loading')
  const [items, setItems] = useState<Favorite[]>(() => readLocal(key))
  const [error, setError] = useState('')
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    const controller = new AbortController()
    gateway.request<WatchlistItem[]>('/watchlist', { signal: controller.signal }).then(async data => {
      if (controller.signal.aborted) return
      const local = readLocal(key)
      const names = new Map(local.map(f => [f.symbol, f]))
      const server = (Array.isArray(data) ? data : []).filter(i => i?.symbol).map(i => names.get(i.symbol) ?? { symbol: i.symbol })
      const pending = local.filter(f => !server.some(s => s.symbol === f.symbol))
      const uploaded = await Promise.allSettled(pending.map(f => gateway.request('/watchlist/items', { method: 'POST', body: { symbol: f.symbol } })))
      if (controller.signal.aborted) return
      const failed = pending.filter((_, i) => uploaded[i].status === 'rejected')
      writeLocal(key, failed)
      setItems([...server, ...pending.filter((_, i) => uploaded[i].status === 'fulfilled')])
      setMode('server')
      setError('')
    }).catch(() => {
      if (controller.signal.aborted) return
      setItems(readLocal(key))
      setMode('local')
    })
    return () => controller.abort()
  }, [key, revision])

  function toggle(item: Favorite) {
    const current = itemsRef.current
    const exists = current.some(f => f.symbol === item.symbol)
    const next = exists ? current.filter(f => f.symbol !== item.symbol) : [...current, { symbol: item.symbol, companyName: item.companyName ?? item.name }]
    setItems(next)
    setError('')
    if (mode !== 'server') { writeLocal(key, next); return }
    const request = exists
      ? gateway.request('/watchlist/items/' + encodeURIComponent(item.symbol), { method: 'DELETE' })
      : gateway.request('/watchlist/items', { method: 'POST', body: { symbol: item.symbol } })
    request.catch(reason => {
      // Sin Premium (403) se pasa a guardar en el navegador y se conserva el cambio.
      if (reason instanceof ApiError && reason.status === 403) { setMode('local'); writeLocal(key, itemsRef.current); return }
      // Otro error: se revierte solo este favorito.
      setItems(list => exists
        ? (list.some(f => f.symbol === item.symbol) ? list : [...list, current.find(f => f.symbol === item.symbol) ?? { symbol: item.symbol }])
        : list.filter(f => f.symbol !== item.symbol))
      setError(errorText(reason))
    })
  }

  return { favorites: items, toggle, mode, error }
}
