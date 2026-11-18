import { useState, type FormEvent } from 'react'
import { useResource } from '@/hooks/useResource'
import { gateway } from '@/services/gateway'
import { amount, Card, date, Pager, Result, rows, Table, useAction, type Listing } from './Resources'

export interface Order { orderId?: number; id?: number; symbol: string; side: string; type: string; qty: number; status?: string; estado?: string; createdAt?: string; creadoEn?: string }
export interface OrderDraft { symbol: string; side: 'BUY' | 'SELL'; protection?: boolean }
interface Fill { executionId: number; qty: number; price: number; timestamp: string }
const active = ['PENDING', 'RESERVED', 'SENT_TO_BROKER', 'PARTIALLY_FILLED']
const status = (order: Order) => order.status ?? order.estado ?? '—'

export function OrderForm({ draft, done }: { draft: OrderDraft; done: () => void }) {
  const action = useAction()
  const [type, setType] = useState(draft.protection ? 'STOP' : 'MARKET')
  const [side, setSide] = useState(draft.side)
  const [symbol, setSymbol] = useState(draft.symbol)
  const quote = useResource<{ price: number }>(symbol ? '/quotes/' + encodeURIComponent(symbol) : null)
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fields = new FormData(e.currentTarget)
    const ticker = String(fields.get('symbol')).trim().toUpperCase()
    const qty = Number(fields.get('qty'))
    if (!ticker || !Number.isSafeInteger(qty) || qty < 1) return
    const body = { symbol: ticker, side, qty, type, timeInForce: fields.get('timeInForce'),
      ...(type === 'LIMIT' ? { price: Number(fields.get('threshold')) } : {}),
      ...(type === 'STOP' ? { stopPrice: Number(fields.get('threshold')) } : {}),
    }
    void action.run(async () => { await gateway.request('/orders', { method: 'POST', body }); done() })
  }
  return <form className="trade-form" onSubmit={submit}>
    <fieldset disabled={action.busy} className="api-fields">
      <label>Símbolo<input name="symbol" required defaultValue={draft.symbol} onBlur={e => setSymbol(e.target.value.trim().toUpperCase())}/></label>
      {symbol && <div className="asset-price"><span>Precio de referencia · {symbol}</span><strong>{amount(quote.data?.price)}</strong></div>}
      <div className="field-row"><label>Operación<select value={side} disabled={draft.protection} onChange={e => setSide(e.target.value as OrderDraft['side'])}><option value="BUY">Compra</option><option value="SELL">Venta</option></select></label>
      <label>Cantidad de acciones<input type="number" name="qty" min="1" step="1" required defaultValue="1"/></label></div>
      <label>Tipo de orden<select value={type} onChange={e => setType(e.target.value)}>{!draft.protection && <option value="MARKET">De mercado</option>}<option value="LIMIT">{draft.protection ? 'Take Profit · venta límite' : 'Límite'}</option><option value="STOP">Stop</option></select></label>
      {type !== 'MARKET' && <label>{type === 'STOP' ? 'Precio de activación' : 'Precio límite'} en USD<input name="threshold" type="number" min="0.0001" step="0.0001" required/></label>}
      <label>Vigencia<select name="timeInForce"><option value="DAY">Día</option><option value="GTC">Hasta cancelación</option></select></label>
      {action.error && <p className="form-error" role="alert">{action.error}</p>}
      <button className="button button-primary full">{action.busy ? 'Enviando…' : 'Enviar orden'}</button>
    </fieldset>
  </form>
}

export function Orders({ revision, refresh, notify }: { revision: number; refresh: () => void; notify: (s: string) => void }) {
  const [page, setPage] = useState(0)
  const [symbol, setSymbol] = useState('')
  const [selected, setSelected] = useState<number>()
  const action = useAction()
  const params = new URLSearchParams({ page: String(page), size: '20' })
  if (symbol) params.set('symbol', symbol)
  const orders = useResource<Listing<Order>>('/orders?' + params, revision)
  const detail = useResource<Order>(selected == null ? null : '/orders/' + selected, revision)
  const fills = useResource<Listing<Fill>>(selected == null ? null : '/orders/' + selected + '/fills', revision)
  return <div className="basic-screen"><Card title="Mis órdenes">
    <label>Símbolo<input type="search" value={symbol} onChange={e => { setSymbol(e.target.value.trim().toUpperCase()); setPage(0) }}/></label>
    <Result resource={orders}>{data => <>
      <Table headers={['Acción', 'Operación', 'Cantidad', 'Estado', 'Fecha', 'Detalle', 'Cancelar']} empty="Sin órdenes para esta consulta." values={rows(data).map(order => {
        const id = order.orderId ?? order.id
        return { key: id ?? order.symbol, cells: [order.symbol, order.side === 'BUY' ? 'Compra' : order.side === 'SELL' ? 'Venta' : order.side, order.qty, status(order), date(order.createdAt ?? order.creadoEn),
          <button className="small-button" disabled={id == null} onClick={() => setSelected(id)}>Ejecuciones</button>,
          id != null && active.includes(status(order)) ? <button className="small-button" disabled={action.busy} onClick={() => {
            void action.run(async () => { await gateway.request('/orders/' + id + '/cancel', { method: 'POST' }); refresh(); notify('Cancelación solicitada.') })
          }}>Cancelar orden</button> : '—'] }
      })}/>
      <Pager data={data} page={page} change={setPage}/>
    </>}</Result>
    {action.error && <p role="alert" className="form-error">{action.error}</p>}
  </Card>{selected != null && <Card title={'Detalle de la orden ' + selected}><Result resource={detail}>{order =>
    <p>{order.symbol} · {order.type} · {status(order)}</p>
  }</Result><Result resource={fills}>{data =>
    <Table headers={['Fecha', 'Cantidad', 'Precio']} empty="La orden aún no tiene ejecuciones." values={rows(data).map(f => ({ key: f.executionId, cells: [date(f.timestamp), f.qty, amount(f.price)] }))}/>
  }</Result></Card>}</div>
}
