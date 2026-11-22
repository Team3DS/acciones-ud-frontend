import { useEffect, useState } from 'react'
import { errorText } from '@/services/api'
import { gateway } from '@/services/gateway'
import { useQuoteStream, type Quote } from './useQuoteStream'

/** Intervalo de consulta REST mientras el WebSocket no está conectado (M4 publica cada 15 s). */
export const QUOTE_POLL_MS = 15000

const newer = (a: Quote | undefined, b: Quote) => !a || Date.parse(a.timestamp) <= Date.parse(b.timestamp)

/**
 * Últimas cotizaciones de M4 para los símbolos dados. Combina `GET /quotes/latest`
 * con el WebSocket y conserva el último precio conocido entre consultas para no
 * mostrar celdas vacías mientras se actualiza.
 */
export function useQuotes(symbols: string, revision: number) {
  const stream = useQuoteStream(symbols)
  const [rest, setRest] = useState<{ symbols: string; quotes: Map<string, Quote>; error?: string }>({ symbols: '', quotes: new Map() })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!symbols || stream.live) return
    const timer = setInterval(() => { if (document.visibilityState !== 'hidden') setTick(value => value + 1) }, QUOTE_POLL_MS)
    return () => clearInterval(timer)
  }, [symbols, stream.live])

  useEffect(() => {
    if (!symbols) return
    const controller = new AbortController()
    gateway.request<Quote[]>('/quotes/latest?' + new URLSearchParams({ symbols }), { signal: controller.signal }).then(data => {
      if (controller.signal.aborted) return
      setRest(previous => {
        const quotes = new Map(previous.symbols === symbols ? previous.quotes : [])
        for (const quote of Array.isArray(data) ? data : []) {
          if (quote?.symbol && newer(quotes.get(quote.symbol), quote)) quotes.set(quote.symbol, quote)
        }
        return { symbols, quotes }
      })
    }).catch(error => {
      if (!controller.signal.aborted) setRest(previous => ({ ...previous, symbols, quotes: previous.symbols === symbols ? previous.quotes : new Map(), error: errorText(error) }))
    })
    return () => controller.abort()
  }, [symbols, revision, tick])

  const bySymbol = new Map(rest.symbols === symbols ? rest.quotes : [])
  for (const [symbol, quote] of stream.updates) if (newer(bySymbol.get(symbol), quote)) bySymbol.set(symbol, quote)
  return { bySymbol, error: rest.symbols === symbols ? rest.error : undefined, live: stream.live }
}
