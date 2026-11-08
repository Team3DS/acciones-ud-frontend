import { useState, type ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import { assets } from '@/services/market'
import { useI18n } from '@/i18n/I18n'
import { illustrativeSeries } from '@/utils/marketSeries'
import type { Account } from '@/types'
import '@/styles/dashboard.css'

type Asset = typeof assets[number]
interface Props { account: Account; symbol: string; onSelect: (symbol: string) => void; onTrade: (side: 'Compra' | 'Venta') => void; onNavigate: (section: string) => void; children: ReactNode }

export function MarketTicker({ paused, onPause, onSelect }: { paused: boolean; onPause: () => void; onSelect: (symbol: string) => void }) {
  const { t, money, percent } = useI18n()
  return <div className="market-ticker">
    <span className="ticker-label"><i/> {t('ov.market')}</span>
    <div className="ticker-window"><div className="ticker-track">{[0, 1].map(copy => <div className="ticker-copy" key={copy} aria-hidden={copy === 1 ? true : undefined}>{assets.map(asset => <button type="button" key={asset.symbol} tabIndex={copy === 1 ? -1 : 0} onClick={() => onSelect(asset.symbol)} aria-label={t('ov.view', { symbol: asset.symbol })}><b>{asset.symbol}</b><span>{money(asset.price)}</span><em className={asset.change > 0 ? 'positive' : 'negative'}>{asset.change > 0 ? '↗ +' : '↘ '}{percent(asset.change)}</em></button>)}</div>)}</div></div>
    <button type="button" className="ticker-pause" onClick={onPause} aria-label={paused ? t('ov.resume') : t('ov.pause')} aria-pressed={paused} title={paused ? t('ov.resume') : t('ov.pause')}><Icon name={paused ? 'play' : 'pause'} size={14}/></button>
  </div>
}

export default function DashboardOverview({ account, symbol, onSelect, onTrade, onNavigate, children }: Props) {
  const { t, money, number, percent, date, language } = useI18n()
  const asset = assets.find(item => item.symbol === symbol) || assets[0]
  const [period, setPeriod] = useState('1S')
  const [kind, setKind] = useState<'line' | 'candles'>('candles')
  const [focus, setFocus] = useState<number | null>(null)
  const [heatFilter, setHeatFilter] = useState('Todos')
  const series = illustrativeSeries(asset.price, asset.symbol, period)
  const low = Math.min(...series) * .996
  const high = Math.max(...series) * 1.004
  const y = (value: number) => 210 - (value - low) / (high - low) * 190
  const x = (index: number) => 12 + index / (series.length - 1) * 676
  const points = series.map((value, index) => `${x(index)},${y(value)}`).join(' ')
  const activeIndex = focus === null ? series.length - 1 : Math.min(focus, series.length - 1)
  const activeValue = series[activeIndex]
  const heatAssets = assets.filter(item => heatFilter === 'Todos' || (heatFilter === 'Alzas' ? item.change > 0 : item.change < 0))
  const holdings = assets.map(item => ({ ...item, quantity: account.trades.filter(trade => trade.symbol === item.symbol).reduce((sum, trade) => sum + (trade.side === 'Compra' ? trade.quantity : -trade.quantity), 0) })).filter(item => item.quantity > 0)
  const invested = holdings.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const colors = ['var(--accent)', '#5cba96', '#759fda', '#b399d4', '#cc8e67']
  let start = 0
  const slices = holdings.map((item, index) => {
    const end = start + item.quantity * item.price / invested * 100
    const slice = `${colors[index % colors.length]} ${start}% ${end}%`
    start = end
    return slice
  })
  const select = (value: string) => { onSelect(value); setFocus(null) }

  return <div className="dashboard-overview">
    <div className="overview-primary">
      <article className="card interactive-market">
        <div className="card-heading"><div><span className="section-tag">{t('ov.tag')}</span><h3>{t('ov.title')} </h3></div><span className="chart-source">NYSE · NASDAQ</span></div>
        <div className="market-symbols" role="group" aria-label={t('ov.symbolsAria')}>{assets.slice(0, 6).map(item => <button type="button" key={item.symbol} aria-pressed={symbol === item.symbol} onClick={() => select(item.symbol)}>{item.symbol}</button>)}</div>
        <div className="market-asset-detail"><div><span className="market-asset-monogram">{asset.letter}</span><div><h2>{asset.symbol}</h2><p>{asset.name}</p></div></div><div className="market-reference"><strong>{money(asset.price)}</strong><span className={asset.change > 0 ? 'positive' : 'negative'}>{asset.change > 0 ? '↗ +' : '↘ '}{percent(asset.change)} <small>USD</small></span></div></div>
        <div className="chart-toolbar"><div className="chart-periods" role="group" aria-label={t('ov.periodsAria')}>{['1D', '1S', '1M', '3M', '1A'].map(value => <button type="button" key={value} aria-pressed={period === value} onClick={() => { setPeriod(value); setFocus(null) }}>{t(`period.${value}`)}</button>)}</div><div className="chart-kinds" role="group" aria-label={t('ov.kindsAria')}><button type="button" aria-pressed={kind === 'candles'} onClick={() => setKind('candles')}><Icon name="candles" size={14}/>{t('ov.candles')}</button><button type="button" aria-pressed={kind === 'line'} onClick={() => setKind('line')}><Icon name="chart" size={14}/>{t('ov.line')}</button></div></div>
        <div className="interactive-chart-row">
          <div className="interactive-chart" role="slider" tabIndex={0} aria-label={t('ov.inspect', { symbol: asset.symbol })} aria-valuemin={1} aria-valuemax={series.length} aria-valuenow={activeIndex + 1} aria-valuetext={t('ov.point', { point: activeIndex + 1, value: money(activeValue) })} onPointerMove={event => { const bounds = event.currentTarget.getBoundingClientRect(); setFocus(Math.max(0, Math.min(series.length - 1, Math.round((event.clientX - bounds.left) / bounds.width * (series.length - 1))))) }} onPointerLeave={() => setFocus(null)} onFocus={() => setFocus(series.length - 1)} onBlur={() => setFocus(null)} onKeyDown={event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            setFocus(event.key === 'Home' ? 0 : event.key === 'End' ? series.length - 1 : Math.max(0, Math.min(series.length - 1, activeIndex + (event.key === 'ArrowRight' ? 1 : -1))))
          }}>
            <svg key={`${asset.symbol}-${period}-${kind}`} viewBox="0 0 700 240" preserveAspectRatio="none" aria-hidden="true">
              <defs><linearGradient id="market-area" x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--accent)" stopOpacity=".24"/><stop offset="1" stopColor="var(--accent)" stopOpacity="0"/></linearGradient></defs>
              {[20, 67.5, 115, 162.5, 210].map(value => <line key={value} x1="0" x2="700" y1={value} y2={value} className="market-grid-line"/>)}
              {kind === 'line' ? <><polygon points={`12,230 ${points} 688,230`} fill="url(#market-area)"/><polyline className="market-line" points={points} fill="none" stroke="var(--accent-bright)" strokeWidth="2.5" strokeLinejoin="round" pathLength="1"/></> : series.map((close, index) => {
                const open = series[Math.max(0, index - 1)]
                const rising = close >= open
                return <g className="market-candle" key={index} style={{ animationDelay: `${index * 10}ms` }}><line x1={x(index)} x2={x(index)} y1={Math.min(y(open), y(close)) - 5 - index % 4 * 2} y2={Math.max(y(open), y(close)) + 7} stroke={rising ? 'var(--positive)' : 'var(--negative)'}/><rect x={x(index) - 4.5} y={Math.min(y(open), y(close))} width="9" height={Math.max(2, Math.abs(y(open) - y(close)))} rx="1.5" fill={rising ? 'var(--positive)' : 'var(--negative)'}/></g>
              })}
              {series.map((_, index) => <rect key={index} x={x(index) - 4} y={228 - (10 + index * 7 % 15)} width="8" height={10 + index * 7 % 15} rx="1" fill="var(--accent)" opacity=".15"/>)}
              {focus !== null && <><line x1={x(activeIndex)} x2={x(activeIndex)} y1="0" y2="230" className="chart-crosshair"/><circle cx={x(activeIndex)} cy={y(activeValue)} r="4" fill="var(--accent-bright)" stroke="var(--surface)" strokeWidth="2"/></>}
            </svg>
            {focus !== null && <div className="market-tooltip" style={{ left: `${Math.max(17, Math.min(83, activeIndex / (series.length - 1) * 100))}%` }}><small>{t('ov.tooltip', { point: activeIndex + 1, period: t(`period.${period}`) })}</small><b>{money(activeValue)}</b></div>}
          </div>
          <div className="market-price-axis">{[1, .75, .5, .25, 0].map(value => <span key={value}>{number(low + (high - low) * value)}</span>)}</div>
        </div>
        <div className="market-time-axis">{(period === '1D' ? ['09:30', '10:30', '12:00', '13:30', '16:00'] : [t('ov.start'), percent(25, 0), percent(50, 0), percent(75, 0), t('ov.end')]).map(value => <span key={value}>{value}</span>)}</div>
        <div className="market-chart-footer"><span><i/> {t('ov.pricesUsd')}</span><div><button type="button" className="market-buy" onClick={() => onTrade('Compra')}>{t('trade.buy')} <Icon name="plus" size={13}/></button><button type="button" className="market-sell" onClick={() => onTrade('Venta')}>{t('trade.sell')} <Icon name="arrow" size={13}/></button></div></div>
      </article>

      <article className="card market-heatmap">
        <div className="card-heading"><div><h3>{t('heat.title')}</h3><p>{t('heat.sub')}</p></div><div className="heat-filters" role="group" aria-label={t('heat.filterAria')}>{['Todos', 'Alzas', 'Bajas'].map(value => <button type="button" key={value} aria-pressed={heatFilter === value} onClick={() => setHeatFilter(value)}>{t(`heat.${value}`)}</button>)}</div></div>
        <div className={`heatmap-grid ${heatFilter !== 'Todos' ? 'is-filtered' : ''}`}>{heatAssets.map((item, index) => <button type="button" key={item.symbol} className={`heatmap-tile ${item.change > 0 ? 'is-up' : 'is-down'} ${symbol === item.symbol ? 'is-selected' : ''}`} style={{ animationDelay: `${index * 35}ms` }} onClick={() => select(item.symbol)} aria-label={t('heat.tileAria', { symbol: item.symbol, direction: item.change > 0 ? t('heat.up') : t('heat.down'), value: number(Math.abs(item.change)) })} aria-pressed={symbol === item.symbol}><b>{item.symbol}<Icon name="arrow" size={14}/></b><span>{item.change > 0 ? '+' : ''}{percent(item.change)}</span></button>)}</div>
        <div className="heatmap-caption"><span><i/> {t('heat.Bajas')} <span className="heat-legend"/> {t('heat.Alzas')}</span><small>{t('heat.select')}</small></div>
      </article>

      <article className="card market-movers"><div className="card-heading"><div><h3>{t('movers.title')}</h3><p>{t('movers.sub')}</p></div><button type="button" className="text-link" onClick={() => onNavigate('Explorar mercado')}>{t('movers.view')} <Icon name="arrow" size={14}/></button></div>{[...assets].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 4).map((item, index) => <button type="button" key={item.symbol} className="mover-row" onClick={() => select(item.symbol)}><span className="mover-rank">0{index + 1}</span><span><b>{item.symbol}</b><small>{item.name}</small></span><MiniTrend asset={item}/><strong>{money(item.price)}</strong><em className={item.change > 0 ? 'positive' : 'negative'}>{item.change > 0 ? '+' : ''}{percent(item.change)}</em></button>)}</article>
    </div>

    <div className="overview-aside">
      <article className="card allocation-card"><div className="card-heading"><h3>{t('alloc.title')}</h3><span className="pill">{t(holdings.length === 1 ? 'alloc.positionOne' : 'alloc.positionMany', { count: holdings.length })}</span></div><div className="allocation-ring" style={{ background: invested ? `conic-gradient(${slices.join(',')})` : 'conic-gradient(var(--accent) 0% 1%, var(--border) 1% 100%)' }}><div><Icon name="wallet" size={19}/><strong>{invested ? '100' : '0'}<small>{language === 'es' ? ' %' : '%'}</small></strong><span>{invested ? t('alloc.distributed') : t('alloc.invested')}</span></div></div>{holdings.length ? <div className="allocation-legend">{holdings.map((item, index) => <div key={item.symbol}><i style={{ background: colors[index % colors.length] }}/><b>{item.symbol}</b><span>{percent(item.quantity * item.price / invested * 100, 1)}</span></div>)}</div> : <p className="allocation-empty">{t('alloc.empty')}</p>}<button type="button" className="allocation-action" onClick={() => onNavigate('Mi portafolio')}>{t('alloc.explore')} <Icon name="arrow" size={15}/></button></article>
      <article className="card dashboard-activity"><div className="card-heading"><h3>{t('activity.title')}</h3><span className="activity-count">{account.trades.length}</span></div>{account.trades.length ? account.trades.slice(0, 3).map(trade => <div className="activity-item" key={trade.id}><span className={`activity-icon ${trade.side === 'Compra' ? 'is-buy' : 'is-sell'}`}><Icon name={trade.side === 'Compra' ? 'plus' : 'arrow'} size={15}/></span><div><b>{t('activity.item', { side: t(`side.${trade.side}`), quantity: trade.quantity, symbol: trade.symbol })}</b><small>{date(trade.date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })}</small></div><strong>{money(trade.price * trade.quantity)}</strong></div>) : <div className="activity-welcome"><span><Icon name="shield" size={20}/></span><b>{t('activity.welcome')}</b><p>{t('activity.welcomeText')}</p></div>}<button type="button" className="allocation-action" onClick={() => onNavigate('Mis órdenes')}>{t('activity.view')} <Icon name="arrow" size={15}/></button></article>
      <article className="card quick-trade"><div className="card-heading"><h3>{t('modal.trade')}</h3><Icon name="chart" size={19}/></div>{children}</article>
    </div>
  </div>
}

function MiniTrend({ asset }: { asset: Asset }) {
  const values = illustrativeSeries(asset.price, asset.symbol, '1S', 16)
  const min = Math.min(...values), max = Math.max(...values)
  return <svg viewBox="0 0 90 28" className="mover-trend" aria-hidden="true"><polyline points={values.map((value, index) => `${index / 15 * 90},${24 - (value - min) / (max - min || 1) * 20}`).join(' ')} fill="none" stroke={asset.change > 0 ? 'var(--positive)' : 'var(--negative)'} strokeWidth="1.7" strokeLinejoin="round"/></svg>
}
