import { useResource } from '@/hooks/useResource'
import { csvText } from '@/utils/reports'
import { Card, Result, Table } from './Resources'

const labels: Record<string, string> = {
  grossPnl: 'Ganancia o pérdida bruta', buyCommissions: 'Comisiones de compra',
  sellCommissions: 'Comisiones de venta', currency: 'Moneda',
}

export default function ExecutionSummary({ revision }: { revision: number }) {
  // El contrato v1.1 describe las métricas pero no fija todos los nombres del DTO.
  const summary = useResource<Record<string, unknown>>('/executions/summary', revision)
  return <Card title="Resumen de ejecuciones"><Result resource={summary}>{data => {
    const entries = Object.entries(data).filter((entry): entry is [string, string | number] =>
      typeof entry[1] === 'string' || typeof entry[1] === 'number'
    ).map(([key, value]) => [labels[key] || key, value] as [string, string | number])
    function download() {
      const blob = new Blob([csvText([['Concepto', 'Valor'], ...entries])], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url; link.download = 'resumen-ejecuciones.csv'; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    return <><Table headers={['Concepto', 'Valor']} empty="No hay métricas de ejecución disponibles." values={entries.map(([label, value]) => ({ key: label, cells: [label, value] }))}/>
      {!!entries.length && <button type="button" className="button button-secondary" onClick={download}>Descargar CSV</button>}</>
  }}</Result></Card>
}
