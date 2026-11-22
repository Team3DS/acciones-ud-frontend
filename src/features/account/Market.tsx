import { useEffect, useState } from 'react'
import { Icon } from '@/components/Icon'
import { useResource } from '@/hooks/useResource'
import { useQuotes } from '@/hooks/useQuotes'
import { useFavorites } from '@/hooks/useFavorites'
import { useI18n } from '@/i18n/I18n'
import { Card, Pager, Result, rows, Table, useFormat, type Listing } from './Resources'
import type { OrderDraft } from './Orders'

interface Instrument { id?: number; symbol: string; companyName?: string; name?: string }
interface Bar { timestamp: string; open: number; high: number; low: number; close: number }
/** Intervalos admitidos por M4 (`Intervalo`): 1m, 5m, 15m, 1h y 1d. */
const periods = [{ key: '1D', days: 1, interval: '5m' }, { key: '1W', days: 7, interval: '1h' }, { key: '1M', days: 30, interval: '1d' }, { key: '3M', days: 90, interval: '1d' }, { key: '1Y', days: 365, interval: '1d' }]
const heatFilters = ['all', 'up', 'down'] as const
/** Traduce un valor del backend si hay texto para él; si no, lo muestra tal cual. */
export const known = (t: (key: string) => string, key: string, fallback: string) => { const text = t(key); return text === key ? fallback : text }

function History({ symbol, revision }: { symbol: string; revision: number }) {
  const { t } = useI18n()
  const [period, setPeriod] = useState(periods[1])
  const [kind, setKind] = useState<'line' | 'candles'>('line')
  const [now, setNow] = useState(Date.now)
  useEffect(() => { setNow(Date.now()) }, [revision])
  const query = new URLSearchParams({ from: new Date(now - period.days * 86400000).toISOString(), to: new Date(now).toISOString(), interval: period.interval })
  const history = useResource<Listing<Bar>>('/quotes/' + encodeURIComponent(symbol) + '/history?' + query, revision)
  return <Card title={t('mkt.historyOf', { symbol })}>
    <div className="chart-toolbar"><div className="chart-periods">{periods.map(p => <button type="button" key={p.key} aria-pressed={p === period} onClick={() => setPeriod(p)}>{t('mkt.period.' + p.key)}</button>)}</div>
    <div className="chart-kinds">{(['line', 'candles'] as const).map(k => <button type="button" key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{t('mkt.kind.' + k)}</button>)}</div></div>
    <Result resource={history}>{data => {
      const bars = rows(data).filter(b => b.close != null && Number.isFinite(Number(b.close))).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
      if (!bars.length) return <p className="empty-state">{t('mkt.noHistory')}</p>
      return <PriceChart bars={bars} kind={kind}/>
    }}</Result>
  </Card>
}

function PriceChart({ bars, kind }: { bars: Bar[]; kind: 'line' | 'candles' }) {
  const { t } = useI18n()
  const { amount, date } = useFormat()
  const [focus, setFocus] = useState<number>()
  const index = Math.min(focus ?? bars.length - 1, bars.length - 1)
  const bar = bars[index]
  const min = Math.min(...bars.map(b => Number(b.low ?? b.close)))
  const max = Math.max(...bars.map(b => Number(b.high ?? b.close)))
  const y = (value: number) => max === min ? 75 : 145 - (value - min) / (max - min) * 140
  const x = (i: number) => (i + 0.5) / bars.length * 680
  return <><svg className="api-price-chart" viewBox="0 0 680 150" role="img" aria-label={t('mkt.chartRange', { min: amount(min), max: amount(max) })} onMouseMove={e => {
    const box = e.currentTarget.getBoundingClientRect()
    setFocus(Math.max(0, Math.min(bars.length - 1, Math.floor((e.clientX - box.left) / box.width * bars.length))))
  }}>
    {kind === 'line' ? <><polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={bars.map((b, i) => x(i) + ',' + y(b.close)).join(' ')}/><circle cx={x(index)} cy={y(bar.close)} r="3" fill="var(--accent)"/></> :
      bars.map((b, i) => <g key={b.timestamp} stroke={b.close >= b.open ? 'var(--positive)' : 'var(--negative)'}><line x1={x(i)} x2={x(i)} y1={y(b.low)} y2={y(b.high)}/><line strokeWidth={Math.max(1, 380 / bars.length)} x1={x(i)} x2={x(i)} y1={y(b.open)} y2={y(b.close) + (b.close === b.open ? 1 : 0)}/></g>)}
  </svg><label>{t('mkt.closeAt', { date: date(bar.timestamp), price: amount(bar.close) })}<input type="range" aria-label={t('mkt.inspect')} min="0" max={bars.length - 1} value={index} onChange={e => setFocus(Number(e.target.value))}/></label></>
}

/** Estado del mercado de M4 (`EstadoMercado`): CERRADO, PRE_MARKET, ABIERTO o AFTER_HOURS. */
export function MarketStatus({ revision }: { revision: number }) {
  const { t } = useI18n()
  const { date } = useFormat()
  const status = useResource<{ mercadoMic?: string; estado: string; consultadoEn?: string }>('/market/status', revision)
  return <Card title={t('mkt.status')}><Result resource={status}>{data => <>
    <strong className={'market-state market-state-' + data.estado.toLowerCase()}>{known(t, 'mkt.state.' + data.estado, data.estado)}</strong>
    {(data.mercadoMic || data.consultadoEn) && <p className="card-note">{[data.mercadoMic, data.consultadoEn && t('mkt.checkedAt', { date: date(data.consultadoEn) })].filter(Boolean).join(' · ')}</p>}
  </>}</Result></Card>
}

export function Market({ userId, revision, favoritesOnly = false, overview = false, trade }: { userId: number; revision: number; favoritesOnly?: boolean; overview?: boolean; trade: (draft: OrderDraft) => void }) {
  const { t } = useI18n()
  const { amount, percent } = useFormat()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState<typeof heatFilters[number]>('all')
  const { favorites, toggle, mode: favoritesMode, error: favoritesError } = useFavorites(userId, revision)
  const [term, setTerm] = useState('')
  useEffect(() => { const timer = setTimeout(() => setTerm(search.trim()), 300); return () => clearTimeout(timer) }, [search])
  // M3 busca con `query` por coincidencia parcial en el símbolo o el nombre de la empresa; `symbol` exige el símbolo exacto.
  const params = new URLSearchParams({ page: String(page), size: '20', enabled: 'true' })
  if (term) params.set('query', term)
  const catalog = useResource<Listing<Instrument>>(favoritesOnly ? null : '/instruments?' + params, revision)
  const matches = (item: Instrument) => !term || [item.symbol, item.companyName, item.name].some(value => value?.toUpperCase().includes(term.toUpperCase()))
  const list = favoritesOnly ? favorites.filter(matches) : catalog.data ? rows(catalog.data) : []
  const symbols = list.map(i => i.symbol).join(',')
  const { bySymbol, error: quotesError, live } = useQuotes(symbols, revision)
  const current = selected || list[0]?.symbol
  const liveNote = symbols && <p className="quote-source" role="status">{live ? t('mkt.live') : t('mkt.polling')}</p>

  if (overview) {
    const latest = list.flatMap(i => bySymbol.get(i.symbol) ?? [])
    const heat = latest.filter(q => q.changePct != null && (filter === 'all' || (filter === 'up' ? q.changePct > 0 : q.changePct < 0)))
    return <div className="basic-screen" data-motion-paused={paused}>
      {!!latest.length && <div className="market-ticker"><span className="ticker-label">{t('mkt.ticker')}</span><div className="ticker-window"><div className="ticker-track" style={{ animationPlayState: paused ? 'paused' : undefined }}>
        {[0, 1].map(copy => <div className="ticker-copy" key={copy} aria-hidden={copy === 1}>{latest.map(q => <button type="button" key={q.symbol} tabIndex={copy ? -1 : 0} onClick={() => setSelected(q.symbol)}><b>{q.symbol}</b> {amount(q.price)}</button>)}</div>)}
      </div></div><button type="button" className="ticker-pause" aria-label={paused ? t('mkt.resume') : t('mkt.pause')} onClick={() => setPaused(!paused)}><Icon name={paused ? 'play' : 'pause'} size={15}/></button></div>}
      <Card title={t('mkt.pulse')}><Result resource={catalog}>{() => list.length ? <>
        <div className="market-symbols">{list.slice(0, 8).map(i => <button type="button" key={i.symbol} aria-pressed={i.symbol === current} onClick={() => setSelected(i.symbol)}>{i.symbol}</button>)}</div>
        {current && <div className="market-chart-footer"><strong>{current} · {amount(bySymbol.get(current)?.price)}</strong><div><button type="button" className="market-buy" onClick={() => trade({ symbol: current, side: 'BUY' })}>{t('mkt.buy')}</button><button type="button" className="market-sell" onClick={() => trade({ symbol: current, side: 'SELL' })}>{t('mkt.sell')}</button></div></div>}
      </> : <p>{t('mkt.emptyCatalog')}</p>}</Result>{quotesError && <p className="form-error" role="alert">{quotesError}</p>}{liveNote}</Card>
      {current && <History key={current} symbol={current} revision={revision}/>}
      {!!latest.length && <Card title={t('mkt.heatmap')}><div className="heat-filters">{heatFilters.map(f => <button type="button" key={f} aria-pressed={f === filter} onClick={() => setFilter(f)}>{t('mkt.heat.' + f)}</button>)}</div>
        <div className="heatmap-grid">{heat.map(q => <button type="button" key={q.symbol} className={'heatmap-tile ' + (Number(q.changePct) >= 0 ? 'is-up' : 'is-down')} onClick={() => setSelected(q.symbol)}><b>{q.symbol}</b><span>{percent(q.changePct)}</span></button>)}</div>
        {!heat.length && <p>{t('mkt.noHeat')}</p>}</Card>}
    </div>
  }

  function table() {
    return <Table headers={[t('mkt.col.symbol'), t('mkt.col.company'), t('mkt.col.price'), t('mkt.col.change'), t('mkt.col.favorite'), t('mkt.col.trade')]} empty={favoritesOnly ? t('mkt.noFavorites') : t('mkt.noInstruments')} values={list.map(i => {
      const q = bySymbol.get(i.symbol)
      const favorite = favorites.some(f => f.symbol === i.symbol)
      return { key: i.symbol, cells: [<button type="button" className="text-link" onClick={() => setSelected(i.symbol)}>{i.symbol}</button>, i.companyName || i.name, amount(q?.price), percent(q?.changePct),
        <button type="button" className={'icon-button ' + (favorite ? 'is-favorite' : '')} aria-label={t('mkt.favoriteOf', { symbol: i.symbol })} aria-pressed={favorite} onClick={() => toggle(i)}><Icon name="star" size={17}/></button>,
        <button type="button" className="small-button" onClick={() => trade({ symbol: i.symbol, side: 'BUY' })}>{t('mkt.col.trade')}</button>] }
    })}/>
  }
  return <div className="basic-screen"><Card title={favoritesOnly ? t('mkt.myFavorites') : t('mkt.catalog')}>
    <label>{t('mkt.search')}<input type="search" value={search} placeholder={t('mkt.searchHint')} onChange={e => { setSearch(e.target.value); setSelected(''); setPage(0) }}/></label>
    {quotesError && <p className="form-error" role="alert">{t('mkt.quotesError', { error: quotesError })}</p>}
    {favoritesOnly && favoritesMode !== 'loading' && <p className="card-note">{t(favoritesMode === 'server' ? 'fav.synced' : 'fav.local')}</p>}
    {favoritesError && <p className="form-error" role="alert">{t('fav.error', { error: favoritesError })}</p>}
    {favoritesOnly ? table() : <Result resource={catalog}>{data => <>{table()}<Pager data={data} page={page} change={next => { setPage(next); setSelected('') }}/></>}</Result>}
    {liveNote}
  </Card>{current && <History key={current} symbol={current} revision={revision}/>}</div>
}
