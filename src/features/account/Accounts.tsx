import { useState, type FormEvent } from 'react'
import { useResource } from '@/hooks/useResource'
import { gateway } from '@/services/gateway'
import { amount, Card, date, Pager, Result, rows, Table, useAction, type Listing } from './Resources'

interface Balance { available: number; reserved: number; total: number; currency: string }
interface Movement { movementId: number; createdAt: string; type: string; amount: number; balanceAfter: number }
interface Position { symbol: string; quantity: number; availableQuantity: number; currentPrice: number; averageCost: number; marketValue: number; qty?: number; avgCost?: number }
interface Portfolio { positions: Position[]; totalValue: number; totalCost: number; unrealizedPnl: number; currency: string; stale?: boolean; valuedAt?: string }
interface Props { userId: number; revision: number }

export function BalanceCard({ userId, revision }: Props) {
  const balance = useResource<Balance>(`/accounts/${userId}/balance`, revision)
  return <Card title="Saldo de la cuenta"><Result resource={balance}>{data =>
    <dl className="preview-breakdown"><div><dt>Disponible para invertir</dt><dd>{amount(data.available, data.currency)}</dd></div><div><dt>Reservado</dt><dd>{amount(data.reserved, data.currency)}</dd></div><div><dt>Total en efectivo</dt><dd>{amount(data.total, data.currency)}</dd></div></dl>
  }</Result></Card>
}

export function PortfolioCard({ userId, revision, sell }: Props & { sell: (symbol: string) => void }) {
  const portfolio = useResource<Portfolio>('/portfolio/' + userId, revision)
  return <Card title="Mi portafolio"><Result resource={portfolio}>{data => <>
    <dl className="preview-breakdown"><div><dt>Valor de las posiciones</dt><dd>{amount(data.totalValue, data.currency)}</dd></div><div><dt>Ganancia o pérdida sin realizar</dt><dd>{amount(data.unrealizedPnl, data.currency)}</dd></div></dl>
    {data.valuedAt && <p>Valoración del {date(data.valuedAt)}{data.stale && ' · Precio pendiente de actualización'}</p>}
    <Table headers={['Acción', 'Cantidad', 'Costo promedio', 'Precio actual', 'Valor', 'Operar']} empty="Aún no tienes posiciones abiertas." values={data.positions.map(p => ({
      key: p.symbol, cells: [p.symbol, p.quantity ?? p.qty, amount(p.averageCost ?? p.avgCost), amount(p.currentPrice), amount(p.marketValue), <button className="small-button" disabled={p.availableQuantity === 0} onClick={() => sell(p.symbol)}>Vender</button>],
    }))}/>
  </>}</Result></Card>
}

export function Funds({ userId, revision, admin, refresh, notify }: Props & { admin: boolean; refresh: () => void; notify: (text: string) => void }) {
  const [page, setPage] = useState(0)
  const [operation, setOperation] = useState('withdrawals')
  const action = useAction()
  const movements = useResource<Listing<Movement>>(`/accounts/${userId}/movements?page=${page}&size=20`, revision)
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const value = Number(new FormData(form).get('amount'))
    if (!(value > 0) || (operation === 'deposits' && !admin)) return
    void action.run(async () => {
      await gateway.request('/funds/' + operation, { method: 'POST', body: { userId, amount: value } })
      form.reset()
      setPage(0)
      refresh()
      notify(operation === 'deposits' ? 'Depósito registrado.' : 'Solicitud de retiro recibida.')
    })
  }
  return <div className="basic-screen">
    <div className="workspace-overview"><BalanceCard userId={userId} revision={revision}/>
      <Card title="Mover fondos"><form onSubmit={submit}>
        <label>Movimiento<select value={operation} onChange={e => setOperation(e.target.value)} disabled={action.busy}><option value="withdrawals">Retiro</option>{admin && <option value="deposits">Depósito</option>}</select></label>
        <label>Monto en USD<input required name="amount" type="number" min="0.01" step="0.01"/></label>
        {action.error && <p className="form-error" role="alert">{action.error}</p>}
        <button className="button button-primary" disabled={action.busy}>{operation === 'deposits' ? 'Registrar depósito' : 'Solicitar retiro'}</button>
      </form></Card>
    </div>
    <Card title="Historial de movimientos"><Result resource={movements}>{data => <>
      <Table headers={['Fecha', 'Movimiento', 'Monto', 'Saldo posterior']} empty="La cuenta aún no tiene movimientos." values={rows(data).map(m => ({ key: m.movementId, cells: [date(m.createdAt), m.type, amount(m.amount), amount(m.balanceAfter)] }))}/>
      <Pager data={data} page={page} change={setPage}/>
    </>}</Result></Card>
  </div>
}
