/** Ruta del WebSocket STOMP de M4 bajo el gateway (transporte nativo de SockJS). */
export const QUOTES_WS_PATH = '/market/ws/quotes/websocket'

/**
 * URL del WebSocket de cotizaciones.
 * - Sin `VITE_QUOTES_WS_URL`: se deriva de la base del gateway (`/api/v1` → `/api/v1/market/ws/quotes/websocket`).
 * - Con `VITE_QUOTES_WS_URL=off`: no se abre conexión y las vistas consultan REST cada 15 s.
 * - Con otra URL (relativa o absoluta): se usa esa.
 * Convierte http/https en ws/wss según la página o la URL indicada.
 */
export function quotesSocketUrl(configured: string | undefined, apiBase: string | undefined, pageUrl: string): string | null {
  const value = configured?.trim()
  if (value?.toLowerCase() === 'off') return null
  let base = apiBase?.trim() || '/api/v1'
  while (base.endsWith('/')) base = base.slice(0, -1)
  const url = new URL(value || base + QUOTES_WS_PATH, pageUrl)
  if (url.protocol === 'http:') url.protocol = 'ws:'
  else if (url.protocol === 'https:') url.protocol = 'wss:'
  else if (url.protocol !== 'ws:' && url.protocol !== 'wss:') return null
  return url.href
}
