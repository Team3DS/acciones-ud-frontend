import { useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'
import { commissionCsv, filterReport, formatUSD, groupReport, localReport, platformCommissions, presetPeriod, reportCsv, summarize, validatePeriod } from '@/utils/reports'
import type { Account } from '@/types'
import '@/styles/reports.css'

type Tab = 'summary' | 'transactions' | 'commissions'
const tabs: [Tab, string][] = [['summary', 'Resumen por período'], ['transactions', 'Transacciones'], ['commissions', 'Comisión estimada']]
const pageSize = 15

export default function Reports({ account, notify }: { account: Account; notify: (message: string) => void }) {
  const [preset, setPreset] = useState('mes')
  const [period, setPeriod] = useState(() => presetPeriod('mes'))
  const [grouping, setGrouping] = useState<'day' | 'month'>('day')
  const [tab, setTab] = useState<Tab>('summary')
  const [page, setPage] = useState(1)
  const error = validatePeriod(period.start, period.end)
  const data = useMemo(() => filterReport(localReport(account.trades), period.start, period.end), [account.trades, period.start, period.end])
  const totals = summarize(data)
  const groups = groupReport(data, grouping)
  const commissions = platformCommissions(data)
  const count = tab === 'summary' ? groups.length : data.transactions.length
  const pages = Math.max(1, Math.ceil(count / pageSize))
  const currentPage = Math.min(page, pages)
  const offset = (currentPage - 1) * pageSize
  const source = 'Demostración local'

  function download() {
    if (error) return
    const csv = tab === 'commissions' ? commissionCsv(data, period.start, period.end, source, account.profile.email) : reportCsv(data, period.start, period.end, source, tab, grouping)
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `acciones-ud-${tab}-${period.start}-${period.end}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify('Reporte local descargado con todos los registros del período.')
  }

  return <section className="reports-workspace" aria-label="Reportes de demostración">
    <article className="report-hero"><div><span className="section-tag">CADA MOVIMIENTO CUENTA</span><h2>Tus números, con claridad.</h2><p>Explora tu actividad de práctica y descarga tus reportes.</p></div><span className="report-hero-icon"><Icon name="orders" size={40}/></span></article>
    <article className="card report-controls">
      <div className="card-heading"><div><h3>Elige qué quieres consultar</h3><p>USD · Fechas en America/Bogota · Datos de este navegador.</p></div><span className="pill">{source}</span></div>
      <div className="report-filters">
        <label>Origen<input readOnly value={source}/></label>
        <label>Período<select value={preset} onChange={event => { setPreset(event.target.value); if (event.target.value !== 'personalizado') setPeriod(presetPeriod(event.target.value)); setPage(1) }}>{[['hoy', 'Hoy'], ['7dias', 'Últimos 7 días'], ['mes', 'Este mes'], ['anterior', 'Mes anterior'], ['anio', 'Este año'], ['personalizado', 'Personalizado']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Desde<input type="date" value={period.start} onChange={event => { setPreset('personalizado'); setPeriod(current => ({ ...current, start: event.target.value })); setPage(1) }}/></label>
        <label>Hasta<input type="date" value={period.end} onChange={event => { setPreset('personalizado'); setPeriod(current => ({ ...current, end: event.target.value })); setPage(1) }}/></label>
        <label>Agrupar por<select value={grouping} onChange={event => { setGrouping(event.target.value as 'day' | 'month'); setPage(1) }}><option value="day">Día</option><option value="month">Mes</option></select></label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="report-source-info"><Icon name="help" size={17}/><p>Solo se incluyen las operaciones virtuales guardadas en este navegador. No se consultan proveedores ni se cobran comisiones.</p></div>
    </article>
    <div className="report-stats">{[
      ['Operaciones de práctica', String(totals.count)], ['Compras', formatUSD(totals.purchases)], ['Ventas', formatUSD(totals.sales)], ['Flujo neto', formatUSD(totals.netCash)],
    ].map(([label, value]) => <article className="stat-card" key={label}><div><span>{label}</span><Icon name="chart" size={18}/></div><strong>{error ? '—' : value}</strong><p>Demostración en USD</p></article>)}</div>
    <article className="card report-details">
      <div className="card-heading"><div><h3>El detalle de cada movimiento</h3><p>{period.start} → {period.end}</p></div><button className="button button-primary" disabled={Boolean(error)} onClick={download}>Descargar CSV <Icon name="arrow" size={16}/></button></div>
      <div className="report-tabs" role="tablist" aria-label="Tipo de reporte">{tabs.map(([value, label]) => <button key={value} role="tab" id={`report-tab-${value}`} aria-controls="report-panel" aria-selected={tab === value} tabIndex={tab === value ? 0 : -1} onClick={() => { setTab(value); setPage(1) }} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const index = tabs.findIndex(([key]) => key === tab)
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
        setTab(tabs[next][0]); setPage(1); document.getElementById(`report-tab-${tabs[next][0]}`)?.focus()
      }}>{label}</button>)}</div>
      <div role="tabpanel" id="report-panel" aria-labelledby={`report-tab-${tab}`} tabIndex={0}>
        {tab === 'commissions' && <div className="demo-note">Ejemplo de cálculo al 2 %. Los importes son estimaciones de diseño y no se descuentan del saldo virtual.</div>}
        <div className="table-scroll"><table>
          <thead><tr>{(tab === 'summary' ? ['Período', 'Operaciones', 'Compras', 'Ventas', 'Flujo neto'] : tab === 'transactions' ? ['Fecha', 'Activo', 'Operación', 'Cantidad', 'Precio USD', 'Importe'] : ['Fecha', 'Activo', 'Operación', 'Valor bruto USD', 'Comisión estimada USD', 'Estado']).map(label => <th key={label}>{label}</th>)}</tr></thead>
          <tbody>
            {tab === 'summary' && groups.slice(offset, offset + pageSize).map(row => <tr key={row.period}><td>{row.period}</td><td>{row.count}</td><td>{formatUSD(row.purchases)}</td><td>{formatUSD(row.sales)}</td><td>{formatUSD(row.netCash)}</td></tr>)}
            {tab === 'transactions' && data.transactions.slice(offset, offset + pageSize).map(row => <tr key={row.id}><td>{row.date}</td><td>{row.symbol}</td><td>{row.side}</td><td>{row.quantity}</td><td>{row.price}</td><td>{formatUSD(row.grossMicros)}</td></tr>)}
            {tab === 'commissions' && commissions.slice(offset, offset + pageSize).map(row => <tr key={row.id}><td>{row.date}</td><td>{row.symbol}</td><td>{row.side}</td><td>{row.gross.toFixed(2)}</td><td>{row.commission.toFixed(2)}</td><td>No cobrada</td></tr>)}
          </tbody>
        </table></div>
        {!count && <div className="empty-state"><Icon name="orders" size={26}/><strong>{error ? 'Revisa las fechas' : 'Sin movimientos en este período'}</strong><p>Realiza una operación de práctica o elige otro período.</p></div>}
        <div className="report-pagination"><span>{count} registros · El CSV incluye todo el período</span><div><button className="small-button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Anterior</button><span>{currentPage} / {pages}</span><button className="small-button" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Siguiente</button></div></div>
      </div>
    </article>
    <div className="report-footnote"><Icon name="help" size={15}/><p>El flujo neto es ventas menos compras; no representa rentabilidad ni incluye fondeos. Todos los datos son de demostración local.</p></div>
  </section>
}
