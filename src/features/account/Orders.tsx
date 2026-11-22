import { useState, type FormEvent } from 'react'
import { useResource } from '@/hooks/useResource'
import { gateway } from '@/services/gateway'
import { useI18n } from '@/i18n/I18n'
import { Card, Result, Table, useAction, useFormat } from './Resources'
import { known } from './Market'
import {
  isCancelable, needsQueueConfirmation, needsThreshold, ORDER_STATUSES, ORDER_TYPES, orderError, orderEstimate,
  orderRequest, sideOf, type OrderDetail, type OrderType, type Side, type TimeInForce,
} from '@/utils/orders'

export type Order = OrderDetail
export interface OrderDraft { symbol: string; side: Side; protection?: boolean }
/** EjecucionOrden de M5 (GET /orders/{id}/fills). */
interface Fill { id: number; brokerExecutionId?: string; cantidad: number; precioEjecucion: number; comision?: number; ejecutadaEn: string }
interface Instrument { id?: number; symbol: string }

/** Busca el id del instrumento en M3 para enviarlo como accionId; si no aparece, M5 usa su valor por defecto. */
async function instrumentId(symbol: string): Promise<number | undefined> {
  try {
    const data = await gateway.request<{ content?: Instrument[] } | Instrument[]>('/instruments?' + new URLSearchParams({ query: symbol, size: '10' }))
    const list = Array.isArray(data) ? data : data?.content ?? []
    return list.find(i => i.symbol?.toUpperCase() === symbol)?.id
  } catch { return undefined }
}

export function OrderForm({ draft, done }: { draft: OrderDraft; done: (order?: Order) => void }) {
  const { t } = useI18n()
  const { amount } = useFormat()
  const action = useAction()
  const types: OrderType[] = draft.protection ? ['STOP_LOSS', 'TAKE_PROFIT'] : ORDER_TYPES
  const [type, setType] = useState<OrderType>(types[0])
  const [side, setSide] = useState<Side>(draft.protection ? 'SELL' : draft.side)
  const [symbol, setSymbol] = useState(draft.symbol.trim().toUpperCase())
  const [quantity, setQuantity] = useState('1')
  const [threshold, setThreshold] = useState('')
  const [invalid, setInvalid] = useState('')
  const quote = useResource<{ price: number }>(symbol ? '/quotes/' + encodeURIComponent(symbol) : null)
  const estimate = orderEstimate({ quantity: Number(quantity), type, threshold: Number(threshold), referencePrice: quote.data?.price })

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fields = new FormData(e.currentTarget)
    const input = {
      symbol: String(fields.get('symbol') ?? '').trim().toUpperCase(), side, type,
      quantity: Number(quantity), threshold: Number(threshold), referencePrice: quote.data?.price,
      timeInForce: String(fields.get('timeInForce')) as TimeInForce,
    }
    const problem = orderError(input)
    setInvalid(problem ? t(problem) : '')
    if (problem) return
    void action.run(async () => {
      const body = orderRequest({ ...input, instrumentId: await instrumentId(input.symbol) })
      const created = await gateway.request<Order>('/orders', { method: 'POST', body })
      done(created)
    })
  }

  return <form className="trade-form" onSubmit={submit} noValidate>
    <fieldset disabled={action.busy} className="api-fields">
      <label>{t('ord.symbol')}<input name="symbol" required autoComplete="off" defaultValue={draft.symbol} onBlur={e => setSymbol(e.target.value.trim().toUpperCase())}/></label>
      {symbol && <div className="asset-price"><span>{t('ord.reference', { symbol })}</span><strong>{amount(quote.data?.price)}</strong></div>}
      <div className="field-row">
        <label>{t('ord.side')}<select value={side} disabled={draft.protection} onChange={e => setSide(e.target.value as Side)}>
          <option value="BUY">{t('ord.side.BUY')}</option><option value="SELL">{t('ord.side.SELL')}</option></select></label>
        <label>{t('ord.quantity')}<input type="number" name="qty" min="1" step="1" required value={quantity} onChange={e => setQuantity(e.target.value)}/></label>
      </div>
      <label>{t('ord.type')}<select value={type} onChange={e => setType(e.target.value as OrderType)}>
        {types.map(value => <option key={value} value={value}>{t('ord.type.' + value)}</option>)}</select></label>
      <small className="field-hint">{t('ord.typeHint.' + type)}</small>
      {needsThreshold(type) && <label>{t(type === 'LIMIT' ? 'ord.limitPrice' : 'ord.stopPrice')}<input name="threshold" type="number" min="0.0001" step="0.0001" required value={threshold} onChange={e => setThreshold(e.target.value)}/></label>}
      <label>{t('ord.timeInForce')}<select name="timeInForce" defaultValue="DIA">
        <option value="DIA">{t('ord.tif.DIA')}</option><option value="HASTA_CANCELACION">{t('ord.tif.HASTA_CANCELACION')}</option></select></label>
      {estimate != null && <p className="card-note">{t('ord.estimate', { amount: amount(estimate) })}</p>}
      {(invalid || action.error) && <p className="form-error" role="alert">{invalid || action.error}</p>}
      <button type="submit" className="button button-primary full">{action.busy ? t('api.sending') : t('ord.submit')}</button>
    </fieldset>
  </form>
}

export function Orders({ revision, refresh, notify }: { revision: number; refresh: () => void; notify: (s: string) => void }) {
  const { t } = useI18n()
  const { amount, date } = useFormat()
  const [symbol, setSymbol] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<number>()
  const action = useAction()
  const params = new URLSearchParams()
  if (symbol) params.set('symbol', symbol)
  if (statusFilter) params.set('status', statusFilter)
  const orders = useResource<Order[]>('/orders' + (params.size ? '?' + params : ''), revision)
  const detail = useResource<Order>(selected == null ? null : '/orders/' + selected, revision)
  const fills = useResource<Fill[]>(selected == null ? null : '/orders/' + selected + '/fills', revision)
  const statusText = (value: string) => known(t, 'ord.status.' + value, value)
  const sideText = (value: string) => t('ord.side.' + sideOf(value))

  function cancel(id: number) {
    void action.run(async () => {
      await gateway.request(`/orders/${id}/cancel?` + new URLSearchParams({ motivo: t('ord.cancelReason') }), { method: 'POST' })
      refresh(); notify(t('ord.cancelled'))
    })
  }
  function confirmQueue(id: number) {
    void action.run(async () => {
      await gateway.request(`/orders/${id}/confirm-queue`, { method: 'POST' })
      refresh(); notify(t('ord.queueConfirmed'))
    })
  }
  function actions(order: Order) {
    const buttons = []
    if (needsQueueConfirmation(order)) buttons.push(<button key="q" type="button" className="small-button" disabled={action.busy} onClick={() => confirmQueue(order.id)}>{t('ord.confirmQueue')}</button>)
    if (isCancelable(order)) buttons.push(<button key="c" type="button" className="small-button" disabled={action.busy} onClick={() => cancel(order.id)}>{t('ord.cancel')}</button>)
    return buttons.length ? <div className="table-actions">{buttons}</div> : '—'
  }

  return <div className="basic-screen"><Card title={t('ws.nav.orders')}>
    <div className="field-row">
      <label>{t('ord.symbol')}<input type="search" value={symbol} onChange={e => setSymbol(e.target.value.trim().toUpperCase())}/></label>
      <label>{t('ord.statusFilter')}<select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="">{t('ord.allStatuses')}</option>{ORDER_STATUSES.map(s => <option key={s} value={s}>{statusText(s)}</option>)}</select></label>
    </div>
    <Result resource={orders}>{data => {
      const list = (Array.isArray(data) ? data : []).slice().sort((a, b) => Date.parse(b.createdAt ?? '') - Date.parse(a.createdAt ?? ''))
      return <Table headers={[t('mkt.col.symbol'), t('ord.side'), t('ord.type'), t('ord.quantity'), t('ord.col.status'), t('ord.col.date'), t('ord.col.detail'), t('ord.col.actions')]} empty={t('ord.empty')} values={list.map(order => ({
        key: order.id, cells: [order.symbol, sideText(order.side), t('ord.type.' + order.type), `${order.executedQuantity ?? 0}/${order.quantity}`,
          statusText(order.status), date(order.createdAt),
          <button type="button" className="small-button" aria-pressed={selected === order.id} onClick={() => setSelected(order.id)}>{t('ord.view')}</button>,
          actions(order)],
      }))}/>
    }}</Result>
    {action.error && <p role="alert" className="form-error">{action.error}</p>}
  </Card>
  {selected != null && <Card title={t('ord.detailOf', { id: selected })}>
    <Result resource={detail}>{order => <>
      {needsQueueConfirmation(order) && <p className="card-note" role="status">{t('ord.queueHint')}</p>}
      <dl className="preview-breakdown">
        <div><dt>{t('ord.col.status')}</dt><dd>{statusText(order.status)}</dd></div>
        <div><dt>{t('ord.operation')}</dt><dd>{sideText(order.side)} · {order.symbol} · {t('ord.type.' + order.type)}</dd></div>
        <div><dt>{t('ord.executed')}</dt><dd>{t('ord.executedOf', { done: order.executedQuantity ?? 0, total: order.quantity, left: order.remainingQuantity ?? order.quantity })}</dd></div>
        {order.limitPrice != null && <div><dt>{t('ord.limitPrice')}</dt><dd>{amount(order.limitPrice)}</dd></div>}
        {order.stopPrice != null && <div><dt>{t('ord.stopPrice')}</dt><dd>{amount(order.stopPrice)}</dd></div>}
        {order.estimatedPrice != null && <div><dt>{t('ord.estimatedPrice')}</dt><dd>{amount(order.estimatedPrice)}</dd></div>}
        {order.timeInForce && <div><dt>{t('ord.timeInForce')}</dt><dd>{known(t, 'ord.tif.' + order.timeInForce, order.timeInForce)}</dd></div>}
      </dl>
    </>}</Result>
    <h4 className="card-subtitle">{t('ord.fills')}</h4>
    <Result resource={fills}>{data => <Table headers={[t('ord.col.date'), t('ord.quantity'), t('ord.col.price'), t('ord.col.commission')]} empty={t('ord.noFills')}
      values={(Array.isArray(data) ? data : []).map(f => ({ key: f.id ?? f.brokerExecutionId ?? f.ejecutadaEn, cells: [date(f.ejecutadaEn), f.cantidad, amount(f.precioEjecucion), amount(f.comision)] }))}/>}</Result>
  </Card>}</div>
}
