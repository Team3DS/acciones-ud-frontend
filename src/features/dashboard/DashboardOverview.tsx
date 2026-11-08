import { useState, type ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import { assets, money } from '@/services/market'
import { illustrativeSeries } from '@/utils/marketSeries'
import type { Account } from '@/types'
import '@/styles/dashboard.css'

type Asset = typeof assets[number]
interface Props { account: Account; symbol: string; onSelect: (symbol: string) => void; onTrade: (side: 'Compra' | 'Venta') => void; onNavigate: (section: string) => void; children: ReactNode }

export function MarketTicker({ paused, onPause, onSelect }: { paused: boolean; onPause: () => void; onSelect: (symbol: string) => void }) {
  return <div className="market-ticker">
    <span className="ticker-label"><i/> MERCADO</span>
    <div className="ticker-window"><div className="ticker-track">{[0, 1].map(copy => <div className="ticker-copy" key={copy} aria-hidden={copy === 1 ? true : undefined}>{assets.map(asset => <button key={asset.symbol} tabIndex={copy === 1 ? -1 : 0} onClick={() => onSelect(asset.symbol)} aria-label={`Ver ${asset.symbol}`}><b>{asset.symbol}</b><span>{money(asset.price)}</span><em className={asset.change > 0 ? 'positive' : 'negative'}>{asset.change > 0 ? '↗ +' : '↘ '}{asset.change.toFixed(2)} %</em></button>)}</div>)}</div></div>
    <button className="ticker-pause" onClick={onPause} aria-label={paused ? 'Reanudar animaciones' : 'Pausar animaciones'} aria-pressed={paused} title={paused ? 'Reanudar animaciones' : 'Pausar animaciones'}><Icon name={paused ? 'play' : 'pause'} size={14}/></button>
  </div>
}

export default function DashboardOverview({ account, symbol, onSelect, onTrade, onNavigate, children }: Props) {
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
        <div className="card-heading"><div><span className="section-tag">EL MERCADO, EN PERSPECTIVA</span><h3>Pulso del mercado </h3></div><span className="chart-source">NYSE · NASDAQ</span></div>
        <div className="market-symbols" role="group" aria-label="Acción del gráfico">{assets.slice(0, 6).map(item => <button key={item.symbol} aria-pressed={symbol === item.symbol} onClick={() => select(item.symbol)}>{item.symbol}</button>)}</div>
        <div className="market-asset-detail"><div><span className="market-asset-monogram">{asset.letter}</span><div><h2>{asset.symbol}</h2><p>{asset.name}</p></div></div><div className="market-reference"><strong>{money(asset.price)}</strong><span className={asset.change > 0 ? 'positive' : 'negative'}>{asset.change > 0 ? '↗ +' : '↘ '}{asset.change.toFixed(2)} % <small>USD</small></span></div></div>
        <div className="chart-toolbar"><div className="chart-periods" role="group" aria-label="Período del gráfico">{['1D', '1S', '1M', '3M', '1A'].map(value => <button key={value} aria-pressed={period === value} onClick={() => { setPeriod(value); setFocus(null) }}>{value}</button>)}</div><div className="chart-kinds" role="group" aria-label="Tipo de gráfico"><button aria-pressed={kind === 'candles'} onClick={() => setKind('candles')}><Icon name="candles" size={14}/>Velas</button><button aria-pressed={kind === 'line'} onClick={() => setKind('line')}><Icon name="chart" size={14}/>Línea</button></div></div>
        <div className="interactive-chart-row">
          <div className="interactive-chart" role="slider" tabIndex={0} aria-label={`Inspeccionar gráfico de ${asset.symbol}`} aria-valuemin={1} aria-valuemax={series.length} aria-valuenow={activeIndex + 1} aria-valuetext={`Punto ${activeIndex + 1}: ${money(activeValue)}`} onPointerMove={event => { const bounds = event.currentTarget.getBoundingClientRect(); setFocus(Math.max(0, Math.min(series.length - 1, Math.round((event.clientX - bounds.left) / bounds.width * (series.length - 1))))) }} onPointerLeave={() => setFocus(null)} onFocus={() => setFocus(series.length - 1)} onBlur={() => setFocus(null)} onKeyDown={event => {
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
            {focus !== null && <div className="market-tooltip" style={{ left: `${Math.max(17, Math.min(83, activeIndex / (series.length - 1) * 100))}%` }}><small>Punto {activeIndex + 1} · {period}</small><b>{money(activeValue)}</b></div>}
          </div>
          <div className="market-price-axis">{[1, .75, .5, .25, 0].map(value => <span key={value}>{(low + (high - low) * value).toFixed(2)}</span>)}</div>
        </div>
        <div className="market-time-axis">{(period === '1D' ? ['09:30', '10:30', '12:00', '13:30', '16:00'] : ['Inicio', '25 %', '50 %', '75 %', 'Fin']).map(value => <span key={value}>{value}</span>)}</div>
        <div className="market-chart-footer"><span><i/> Precios en USD</span><div><button className="market-buy" onClick={() => onTrade('Compra')}>Comprar <Icon name="plus" size={13}/></button><button className="market-sell" onClick={() => onTrade('Venta')}>Vender <Icon name="arrow" size={13}/></button></div></div>
      </article>

      <article className="card market-heatmap">
        <div className="card-heading"><div><h3>Así se ve el mercado</h3><p>Un vistazo al movimiento de cada acción.</p></div><div className="heat-filters" role="group" aria-label="Filtrar mapa de calor">{['Todos', 'Alzas', 'Bajas'].map(value => <button key={value} aria-pressed={heatFilter === value} onClick={() => setHeatFilter(value)}>{value}</button>)}</div></div>
        <div className={`heatmap-grid ${heatFilter !== 'Todos' ? 'is-filtered' : ''}`}>{heatAssets.map((item, index) => <button key={item.symbol} className={`heatmap-tile ${item.change > 0 ? 'is-up' : 'is-down'} ${symbol === item.symbol ? 'is-selected' : ''}`} style={{ animationDelay: `${index * 35}ms` }} onClick={() => select(item.symbol)} aria-label={`Seleccionar ${item.symbol}, ${item.change > 0 ? 'alza' : 'baja'} ${Math.abs(item.change)} por ciento`} aria-pressed={symbol === item.symbol}><b>{item.symbol}<Icon name="arrow" size={14}/></b><span>{item.change > 0 ? '+' : ''}{item.change.toFixed(2)} %</span></button>)}</div>
        <div className="heatmap-caption"><span><i/> Bajas <span className="heat-legend"/> Alzas</span><small>Selecciona una acción</small></div>
      </article>

      <article className="card market-movers"><div className="card-heading"><div><h3>En el radar</h3><p>Acciones con mayor variación.</p></div><button className="text-link" onClick={() => onNavigate('Explorar mercado')}>Ver mercado <Icon name="arrow" size={14}/></button></div>{[...assets].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 4).map((item, index) => <button key={item.symbol} className="mover-row" onClick={() => select(item.symbol)}><span className="mover-rank">0{index + 1}</span><span><b>{item.symbol}</b><small>{item.name}</small></span><MiniTrend asset={item}/><strong>{money(item.price)}</strong><em className={item.change > 0 ? 'positive' : 'negative'}>{item.change > 0 ? '+' : ''}{item.change.toFixed(2)} %</em></button>)}</article>
    </div>

    <div className="overview-aside">
      <article className="card allocation-card"><div className="card-heading"><h3>Tu portafolio</h3><span className="pill">{holdings.length} posiciones</span></div><div className="allocation-ring" style={{ background: invested ? `conic-gradient(${slices.join(',')})` : 'conic-gradient(var(--accent) 0% 1%, var(--border) 1% 100%)' }}><div><Icon name="wallet" size={19}/><strong>{invested ? '100' : '0'}<small> %</small></strong><span>{invested ? 'distribuido' : 'invertido'}</span></div></div>{holdings.length ? <div className="allocation-legend">{holdings.map((item, index) => <div key={item.symbol}><i style={{ background: colors[index % colors.length] }}/><b>{item.symbol}</b><span>{(item.quantity * item.price / invested * 100).toFixed(1)} %</span></div>)}</div> : <p className="allocation-empty">Tu próxima inversión dibuja el comienzo de tu portafolio.</p>}<button className="allocation-action" onClick={() => onNavigate('Mi portafolio')}>Explorar mi portafolio <Icon name="arrow" size={15}/></button></article>
      <article className="card dashboard-activity"><div className="card-heading"><h3>Tu actividad</h3><span className="activity-count">{account.trades.length}</span></div>{account.trades.length ? account.trades.slice(0, 3).map(trade => <div className="activity-item" key={trade.id}><span className={`activity-icon ${trade.side === 'Compra' ? 'is-buy' : 'is-sell'}`}><Icon name={trade.side === 'Compra' ? 'plus' : 'arrow'} size={15}/></span><div><b>{trade.side} de {trade.quantity} {trade.symbol}</b><small>{new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }).format(new Date(trade.date))}</small></div><strong>{money(trade.price * trade.quantity)}</strong></div>) : <div className="activity-welcome"><span><Icon name="shield" size={20}/></span><b>Todo listo para empezar</b><p>Aquí podrás seguir tus operaciones.</p></div>}<button className="allocation-action" onClick={() => onNavigate('Mis órdenes')}>Ver movimientos <Icon name="arrow" size={15}/></button></article>
      <article className="card quick-trade"><div className="card-heading"><h3>Tu próxima operación</h3><Icon name="chart" size={19}/></div>{children}</article>
    </div>
  </div>
}

function MiniTrend({ asset }: { asset: Asset }) {
  const values = illustrativeSeries(asset.price, asset.symbol, '1S', 16)
  const min = Math.min(...values), max = Math.max(...values)
  return <svg viewBox="0 0 90 28" className="mover-trend" aria-hidden="true"><polyline points={values.map((value, index) => `${index / 15 * 90},${24 - (value - min) / (max - min || 1) * 20}`).join(' ')} fill="none" stroke={asset.change > 0 ? 'var(--positive)' : 'var(--negative)'} strokeWidth="1.7" strokeLinejoin="round"/></svg>
}
