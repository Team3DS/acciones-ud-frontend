import { useEffect, useState } from 'react'
import { Client } from '@stomp/stompjs'
import { gateway } from '@/services/gateway'

export interface Quote { symbol: string; price: number; changePct: number | null; timestamp: string }

/** Cotizaciones en vivo por STOMP. `live` indica si la conexión está abierta. */
export function useQuoteStream(symbols: string) {
  const [updates, setUpdates] = useState<Map<string, Quote>>(() => new Map())
  const [live, setLive] = useState(false)
  useEffect(() => {
    setUpdates(new Map())
    setLive(false)
    const endpoint = import.meta.env.VITE_QUOTES_WS_URL
    if (!symbols || !endpoint) return
    const url = new URL(endpoint, window.location.href)
    if (url.protocol === 'http:') url.protocol = 'ws:'
    if (url.protocol === 'https:') url.protocol = 'wss:'
    const wanted = new Set(symbols.split(','))
    let active = true
    const client = new Client({ brokerURL: url.href, connectionTimeout: 6000, reconnectDelay: 10000 })
    client.beforeConnect = () => {
      const session = gateway.snapshot()
      if (session) client.connectHeaders = { Authorization: 'Bearer ' + session.accessToken, 'X-Correlation-ID': crypto.randomUUID() }
    }
    client.onWebSocketClose = () => { if (active) setLive(false) }
    client.onStompError = () => { if (active) setLive(false) }
    client.onConnect = () => {
      if (active) setLive(true)
      client.subscribe('/topic/quotes', message => {
        if (!active) return
        let q: Quote
        try { q = JSON.parse(message.body) } catch { return }
        if (!q || !wanted.has(q.symbol) || !Number.isFinite(q.price) || !Number.isFinite(Date.parse(q.timestamp))) return
        setUpdates(previous => {
          const last = previous.get(q.symbol)
          if (last && Date.parse(last.timestamp) > Date.parse(q.timestamp)) return previous
          return new Map(previous).set(q.symbol, q)
        })
      })
      client.publish({ destination: '/app/quotes/subscribe/' + symbols })
    }
    client.activate()
    return () => { active = false; void client.deactivate() }
  }, [symbols])
  return { updates, live }
}
