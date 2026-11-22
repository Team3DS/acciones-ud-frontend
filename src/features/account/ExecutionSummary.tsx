import { useMemo, useState } from 'react'
import { useResource } from '@/hooks/useResource'
import { useI18n } from '@/i18n/I18n'
import { csvText, periodRange, REPORT_PERIODS as periods, type ReportPeriod as Period } from '@/utils/reports'
import { Card, Result, Table, useFormat } from './Resources'

/** ResumenEjecucionesResponse de M5 (GET /executions/summary, RF-65 y RF-66). */
interface Summary {
  gananciaBrutaRealizada: number; comisionesCompra: number; comisionesVenta: number
  ventasPendientesConfirmacion: number; desde?: string | null; hasta?: string | null
}
export default function ExecutionSummary({ revision }: { revision: number }) {
  const { t } = useI18n()
  const { amount } = useFormat()
  const [period, setPeriod] = useState<Period>('month')
  const query = useMemo(() => {
    const range = periodRange(period)
    const params = new URLSearchParams()
    if (range.from) params.set('from', range.from)
    if (range.to) params.set('to', range.to)
    return params.size ? '?' + params : ''
  }, [period, revision])
  const summary = useResource<Summary>('/executions/summary' + query, revision)

  return <Card title={t('exs.title')}>
    <div className="heat-filters">{periods.map(p => <button type="button" key={p} aria-pressed={p === period} onClick={() => setPeriod(p)}>{t('exs.period.' + p)}</button>)}</div>
    <Result resource={summary}>{data => {
      const commissions = Number(data.comisionesCompra ?? 0) + Number(data.comisionesVenta ?? 0)
      const rows: [string, string][] = [
        [t('exs.grossPnl'), amount(data.gananciaBrutaRealizada)],
        [t('exs.buyCommissions'), amount(data.comisionesCompra)],
        [t('exs.sellCommissions'), amount(data.comisionesVenta)],
        [t('exs.totalCommissions'), amount(commissions)],
        [t('exs.netPnl'), amount(Number(data.gananciaBrutaRealizada ?? 0) - commissions)],
      ]
      function download() {
        const csv = csvText([[t('exs.concept'), t('exs.value')], ...rows,
          [t('exs.pending'), String(data.ventasPendientesConfirmacion ?? 0)]])
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
        const link = document.createElement('a')
        link.href = url; link.download = 'resumen-ejecuciones-' + period + '.csv'; link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
      return <>
        <Table headers={[t('exs.concept'), t('exs.value')]} empty={t('exs.empty')} values={rows.map(([label, value]) => ({ key: label, cells: [label, value] }))}/>
        {data.ventasPendientesConfirmacion > 0 && <p className="card-note">{t('exs.pendingNote', { count: data.ventasPendientesConfirmacion })}</p>}
        <p className="card-note">{t('exs.note')}</p>
        <button type="button" className="button button-secondary" onClick={download}>{t('exs.download')}</button>
      </>
    }}</Result>
  </Card>
}
