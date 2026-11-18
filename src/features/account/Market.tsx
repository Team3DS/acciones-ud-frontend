import { useEffect, useState } from 'react'
import { Icon } from '@/components/Icon'
import { useResource } from '@/hooks/useResource'
import { amount, Card, date, Pager, Result, rows, Table, type Listing } from './Resources'
import type { OrderDraft } from './Orders'
import { useQuoteStream, type Quote } from '@/hooks/useQuoteStream'

interface Instrument { id?: number; symbol: string; companyName?: string; name?: string }
interface Bar { timestamp: string; open: number; high: number; low: number; close: number }
const periods = [{ label: '1D', days: 1, interval: '5m' }, { label: '1S', days: 7, interval: '1h' }, { label: '1M', days: 30, interval: '1d' }, { label: '3M', days: 90, interval: '1d' }, { label: '1A', days: 365, interval: '1d' }]

function History({ symbol, revision }: { symbol: string; revision: number }) {
  const [period, setPeriod] = useState(periods[1])
  const [kind, setKind] = useState('line')
  const [now, setNow] = useState(Date.now)
  useEffect(() => { setNow(Date.now()) }, [revision])
  const query = new URLSearchParams({ from: new Date(now - period.days * 86400000).toISOString(), to: new Date(now).toISOString(), interval: period.interval })
  const history = useResource<Listing<Bar>>('/quotes/' + encodeURIComponent(symbol) + '/history?' + query, revision)
  return <Card title={'Histórico de ' + symbol}>
    <div className="chart-toolbar"><div className="chart-periods">{periods.map(p => <button key={p.label} aria-pressed={p === period} onClick={() => setPeriod(p)}>{p.label}</button>)}</div>
    <div className="chart-kinds">{['line', 'candles'].map(k => <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{k === 'line' ? 'Línea' : 'Velas'}</button>)}</div></div>
    <Result resource={history}>{data => {
      const bars = rows(data).filter(b => b.close != null && Number.isFinite(Number(b.close))).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
      if (!bars.length) return <p className="empty-state">Sin cotizaciones para este período.</p>
      return <PriceChart bars={bars} kind={kind}/>
    }}</Result>
  </Card>
}

function PriceChart({ bars, kind }: { bars: Bar[]; kind: string }) {
  const [focus, setFocus] = useState<number>()
  const bar = bars[Math.min(focus ?? bars.length - 1, bars.length - 1)]
  const min = Math.min(...bars.map(b => Number(b.low ?? b.close)))
  const max = Math.max(...bars.map(b => Number(b.high ?? b.close)))
  const y = (value: number) => max === min ? 75 : 145 - (value - min) / (max - min) * 140
  const x = (i: number) => (i + 0.5) / bars.length * 680
  return <><svg className="api-price-chart" viewBox="0 0 680 150" role="img" aria-label={'Precios desde ' + amount(min) + ' hasta ' + amount(max)} onMouseMove={e => {
    const box = e.currentTarget.getBoundingClientRect()
    setFocus(Math.max(0, Math.min(bars.length - 1, Math.floor((e.clientX - box.left) / box.width * bars.length))))
  }}>
    {kind === 'line' ? <><polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={bars.map((b, i) => x(i) + ',' + y(b.close)).join(' ')}/><circle cx={x(Math.min(focus ?? bars.length - 1, bars.length - 1))} cy={y(bar.close)} r="3" fill="var(--accent)"/></> :
      bars.map((b, i) => <g key={b.timestamp} stroke={b.close >= b.open ? 'var(--positive)' : 'var(--negative)'}><line x1={x(i)} x2={x(i)} y1={y(b.low)} y2={y(b.high)}/><line strokeWidth={Math.max(1, 380 / bars.length)} x1={x(i)} x2={x(i)} y1={y(b.open)} y2={y(b.close) + (b.close === b.open ? 1 : 0)}/></g>)}
  </svg><label>{date(bar.timestamp)} · Cierre {amount(bar.close)}<input type="range" aria-label="Inspeccionar cotizaciones" min="0" max={bars.length - 1} value={Math.min(focus ?? bars.length - 1, bars.length - 1)} onChange={e => setFocus(Number(e.target.value))}/></label></>
}

export function Market({ userId, revision, favoritesOnly = false, overview = false, trade }: { userId: number; revision: number; favoritesOnly?: boolean; overview?: boolean; trade: (draft: OrderDraft) => void }) {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState('Todos')
  const key = 'acciones-ud.favoritos.' + (import.meta.env.VITE_API_BASE_URL || '/api/v1') + '.' + userId
  const [favorites, setFavorites] = useState<Instrument[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]')
      return Array.isArray(saved) ? saved.filter(x => typeof x?.symbol === 'string') : []
    } catch { return [] }
  })
  function toggle(item: Instrument) {
    const next = favorites.some(f => f.symbol === item.symbol) ? favorites.filter(f => f.symbol !== item.symbol) : [...favorites, item]
    setFavorites(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* Preferencia en memoria. */ }
  }
  const params = new URLSearchParams({ page: String(page), size: '20', enabled: 'true' })
  if (search.trim()) params.set('symbol', search.trim().toUpperCase())
  const catalog = useResource<Listing<Instrument>>(favoritesOnly ? null : '/instruments?' + params, revision)
  const list = favoritesOnly ? favorites.filter(f => f.symbol.includes(search.trim().toUpperCase())) : catalog.data ? rows(catalog.data) : []
  const symbols = list.map(i => i.symbol).join(',')
  const quotes = useResource<Quote[]>(symbols ? '/quotes/latest?' + new URLSearchParams({ symbols }) : null, revision)
  const stream = useQuoteStream(symbols)
  const bySymbol = new Map((Array.isArray(quotes.data) ? quotes.data : []).map(q => [q.symbol, q]))
  for (const [symbol, quote] of stream) {
    const cached = bySymbol.get(symbol)
    if (!cached || Date.parse(cached.timestamp) <= Date.parse(quote.timestamp)) bySymbol.set(symbol, quote)
  }
  const current = selected || list[0]?.symbol
  if (overview) {
    const latest = list.flatMap(i => bySymbol.get(i.symbol) ?? [])
    const heat = latest.filter(q => q.changePct != null && (filter === 'Todos' || (filter === 'Alzas' ? q.changePct > 0 : q.changePct < 0)))
    return <div className="basic-screen" data-motion-paused={paused}>
      {!!latest.length && <div className="market-ticker"><span className="ticker-label">MERCADO</span><div className="ticker-window"><div className="ticker-track" style={{ animationPlayState: paused ? 'paused' : undefined }}>
        {[0, 1].map(copy => <div className="ticker-copy" key={copy} aria-hidden={copy === 1}>{latest.map(q => <button key={q.symbol} tabIndex={copy ? -1 : 0} onClick={() => setSelected(q.symbol)}><b>{q.symbol}</b> {amount(q.price)}</button>)}</div>)}
      </div></div><button className="ticker-pause" aria-label={paused ? 'Reanudar cinta' : 'Pausar cinta'} onClick={() => setPaused(!paused)}><Icon name={paused ? 'play' : 'pause'} size={15}/></button></div>}
      <Card title="Pulso del mercado"><Result resource={catalog}>{() => list.length ? <>
        <div className="market-symbols">{list.slice(0, 8).map(i => <button key={i.symbol} aria-pressed={i.symbol === current} onClick={() => setSelected(i.symbol)}>{i.symbol}</button>)}</div>
        {current && <div className="market-chart-footer"><strong>{current} · {amount(bySymbol.get(current)?.price)}</strong><div><button className="market-buy" onClick={() => trade({ symbol: current, side: 'BUY' })}>Comprar</button><button className="market-sell" onClick={() => trade({ symbol: current, side: 'SELL' })}>Vender</button></div></div>}
      </> : <p>El catálogo está vacío.</p>}</Result>{quotes.error && <p className="form-error" role="alert">{quotes.error}</p>}</Card>
      {current && <History key={current} symbol={current} revision={revision}/>}
      {!!latest.length && <Card title="Mapa del mercado"><div className="heat-filters">{['Todos', 'Alzas', 'Bajas'].map(f => <button key={f} aria-pressed={f === filter} onClick={() => setFilter(f)}>{f}</button>)}</div>
        <div className="heatmap-grid">{heat.map(q => <button key={q.symbol} className={'heatmap-tile ' + (Number(q.changePct) >= 0 ? 'is-up' : 'is-down')} onClick={() => setSelected(q.symbol)}><b>{q.symbol}</b><span>{Number(q.changePct).toFixed(2)} %</span></button>)}</div>
        {!heat.length && <p>Sin variaciones para este filtro.</p>}</Card>}
    </div>
  }
  function table() {
    return <Table headers={['Acción', 'Compañía', 'Precio', 'Cambio del día', 'Favorito', 'Operar']} empty={favoritesOnly ? 'Sin favoritos para esta búsqueda.' : 'Sin instrumentos para esta búsqueda.'} values={list.map(i => {
      const q = bySymbol.get(i.symbol)
      const favorite = favorites.some(f => f.symbol === i.symbol)
      return { key: i.symbol, cells: [<button className="text-link" onClick={() => setSelected(i.symbol)}>{i.symbol}</button>, i.companyName || i.name, amount(q?.price), q?.changePct == null ? '—' : Number(q.changePct).toFixed(2) + ' %',
        <button className={'icon-button ' + (favorite ? 'is-favorite' : '')} aria-label={'Favorito ' + i.symbol} aria-pressed={favorite} onClick={() => toggle(i)}><Icon name="star" size={17}/></button>,
        <button className="small-button" onClick={() => trade({ symbol: i.symbol, side: 'BUY' })}>Operar</button>] }
    })}/>
  }
  return <div className="basic-screen"><Card title={favoritesOnly ? 'Mis favoritos' : 'Catálogo de acciones'}>
    <label>Buscar por símbolo<input type="search" value={search} onChange={e => { setSearch(e.target.value); setSelected(''); setPage(0) }}/></label>
    {quotes.error && <p className="form-error" role="alert">Cotizaciones · {quotes.error}</p>}
    {favoritesOnly ? table() : <Result resource={catalog}>{data => <>{table()}<Pager data={data} page={page} change={next => { setPage(next); setSelected('') }}/></>}</Result>}
  </Card>{current && <History key={current} symbol={current} revision={revision}/>}</div>
}
