import { useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'
import { commissionCsv, filterReport, formatUSD, groupReport, localReport, platformCommissions, presetPeriod, reportCsv, summarize, validatePeriod } from '@/utils/reports'
import type { Account } from '@/types'
import { useI18n } from '@/i18n/I18n'
import '@/styles/reports.css'

type Tab = 'summary' | 'transactions' | 'commissions'
const tabs: Tab[] = ['summary', 'transactions', 'commissions']
const presets = ['hoy', '7dias', 'mes', 'anterior', 'anio', 'personalizado']
const pageSize = 15
// El CSV conserva los encabezados y el origen en español para que el formato del archivo no cambie con el idioma.
const csvSource = 'Demostración local'

export default function Reports({ account, notify }: { account: Account; notify: (message: string) => void }) {
  const { t, tError, locale, number } = useI18n()
  const [preset, setPreset] = useState('mes')
  const [period, setPeriod] = useState(() => presetPeriod('mes'))
  const [grouping, setGrouping] = useState<'day' | 'month'>('day')
  const [tab, setTab] = useState<Tab>('summary')
  const [page, setPage] = useState(1)
  const error = tError(validatePeriod(period.start, period.end))
  const data = useMemo(() => filterReport(localReport(account.trades), period.start, period.end), [account.trades, period.start, period.end])
  const totals = summarize(data)
  const groups = groupReport(data, grouping)
  const commissions = platformCommissions(data)
  const count = tab === 'summary' ? groups.length : data.transactions.length
  const pages = Math.max(1, Math.ceil(count / pageSize))
  const currentPage = Math.min(page, pages)
  const offset = (currentPage - 1) * pageSize
  const source = t('rep.source')
  const usd = (value: bigint) => formatUSD(value, locale)
  const headers = tab === 'summary' ? ['rep.col.period', 'rep.col.trades', 'rep.stat.purchases', 'rep.stat.sales', 'rep.stat.net'] : tab === 'transactions' ? ['table.date', 'table.asset', 'table.side', 'table.quantity', 'rep.col.priceUsd', 'rep.col.amount'] : ['table.date', 'table.asset', 'table.side', 'rep.col.gross', 'rep.col.commission', 'table.status']

  function download() {
    if (error) return
    const csv = tab === 'commissions' ? commissionCsv(data, period.start, period.end, csvSource, account.profile.email) : reportCsv(data, period.start, period.end, csvSource, tab, grouping)
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `acciones-ud-${tab}-${period.start}-${period.end}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify(t('rep.downloaded'))
  }

  return <section className="reports-workspace" aria-label={t('rep.aria')}>
    <article className="report-hero"><div><span className="section-tag">{t('rep.tag')}</span><h2>{t('rep.title')}</h2><p>{t('rep.text')}</p></div><span className="report-hero-icon"><Icon name="orders" size={40}/></span></article>
    <article className="card report-controls">
      <div className="card-heading"><div><h3>{t('rep.choose')}</h3><p>{t('rep.meta')}</p></div><span className="pill">{source}</span></div>
      <div className="report-filters">
        <label>{t('rep.origin')}<input readOnly value={source}/></label>
        <label>{t('rep.period')}<select value={preset} onChange={event => { setPreset(event.target.value); if (event.target.value !== 'personalizado') setPeriod(presetPeriod(event.target.value)); setPage(1) }}>{presets.map(value => <option key={value} value={value}>{t(`rep.preset.${value}`)}</option>)}</select></label>
        <label>{t('rep.from')}<input type="date" value={period.start} onChange={event => { setPreset('personalizado'); setPeriod(current => ({ ...current, start: event.target.value })); setPage(1) }}/></label>
        <label>{t('rep.to')}<input type="date" value={period.end} onChange={event => { setPreset('personalizado'); setPeriod(current => ({ ...current, end: event.target.value })); setPage(1) }}/></label>
        <label>{t('rep.groupBy')}<select value={grouping} onChange={event => { setGrouping(event.target.value as 'day' | 'month'); setPage(1) }}><option value="day">{t('rep.day')}</option><option value="month">{t('rep.month')}</option></select></label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="report-source-info"><Icon name="help" size={17}/><p>{t('rep.sourceInfo')}</p></div>
    </article>
    <div className="report-stats">{[
      ['rep.stat.count', String(totals.count)], ['rep.stat.purchases', usd(totals.purchases)], ['rep.stat.sales', usd(totals.sales)], ['rep.stat.net', usd(totals.netCash)],
    ].map(([label, value]) => <article className="stat-card" key={label}><div><span>{t(label)}</span><Icon name="chart" size={18}/></div><strong>{error ? '—' : value}</strong><p>{t('rep.stat.note')}</p></article>)}</div>
    <article className="card report-details">
      <div className="card-heading"><div><h3>{t('rep.detail')}</h3><p>{period.start} → {period.end}</p></div><button type="button" className="button button-primary" disabled={Boolean(error)} onClick={download}>{t('rep.csv')} <Icon name="arrow" size={16}/></button></div>
      <div className="report-tabs" role="tablist" aria-label={t('rep.tabsAria')}>{tabs.map(value => <button type="button" key={value} role="tab" id={`report-tab-${value}`} aria-controls="report-panel" aria-selected={tab === value} tabIndex={tab === value ? 0 : -1} onClick={() => { setTab(value); setPage(1) }} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const index = tabs.indexOf(tab)
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
        setTab(tabs[next]); setPage(1); document.getElementById(`report-tab-${tabs[next]}`)?.focus()
      }}>{t(`rep.tab.${value}`)}</button>)}</div>
      <div role="tabpanel" id="report-panel" aria-labelledby={`report-tab-${tab}`} tabIndex={0}>
        {tab === 'commissions' && <div className="demo-note">{t('rep.commNote')}</div>}
        <div className="table-scroll"><table>
          <thead><tr>{headers.map(key => <th key={key}>{t(key)}</th>)}</tr></thead>
          <tbody>
            {tab === 'summary' && groups.slice(offset, offset + pageSize).map(row => <tr key={row.period}><td>{row.period}</td><td>{row.count}</td><td>{usd(row.purchases)}</td><td>{usd(row.sales)}</td><td>{usd(row.netCash)}</td></tr>)}
            {tab === 'transactions' && data.transactions.slice(offset, offset + pageSize).map(row => <tr key={row.id}><td>{row.date}</td><td>{row.symbol}</td><td>{t(`side.${row.side}`)}</td><td>{row.quantity}</td><td>{row.price}</td><td>{usd(row.grossMicros)}</td></tr>)}
            {tab === 'commissions' && commissions.slice(offset, offset + pageSize).map(row => <tr key={row.id}><td>{row.date}</td><td>{row.symbol}</td><td>{t(`side.${row.side}`)}</td><td>{number(row.gross)}</td><td>{number(row.commission)}</td><td>{t('rep.notCharged')}</td></tr>)}
          </tbody>
        </table></div>
        {!count && <div className="empty-state"><Icon name="orders" size={26}/><strong>{error ? t('rep.checkDates') : t('rep.empty')}</strong><p>{t('rep.emptyText')}</p></div>}
        <div className="report-pagination"><span>{t(count === 1 ? 'rep.recordsOne' : 'rep.recordsMany', { count })}</span><div><button type="button" className="small-button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>{t('rep.previous')}</button><span>{currentPage} / {pages}</span><button type="button" className="small-button" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>{t('rep.next')}</button></div></div>
      </div>
    </article>
    <div className="report-footnote"><Icon name="help" size={15}/><p>{t('rep.footnote')}</p></div>
  </section>
}
