import { useState, type FormEvent } from 'react'
import { useResource } from '@/hooks/useResource'
import { gateway } from '@/services/gateway'
import { useI18n } from '@/i18n/I18n'
import { Card, Pager, Result, rows, Table, useAction, useFormat, type Listing } from './Resources'
import { known } from './Market'
import { fundsError, MAX_DEPOSIT, MIN_AMOUNT, type FundsOperation } from '@/utils/funds'

interface Balance { available: number; reserved: number; total: number; currency: string }
interface Movement { movementId: number; createdAt: string; type: string; amount: number; balanceAfter: number; description?: string }
interface Position { symbol: string; quantity: number; availableQuantity: number; currentPrice: number; averageCost: number; marketValue: number; qty?: number; avgCost?: number }
interface Portfolio { positions: Position[]; totalValue: number; totalCost: number; unrealizedPnl: number; currency: string; stale?: boolean; valuedAt?: string }
interface Props { userId: number; revision: number }
type Operation = FundsOperation

export function BalanceCard({ userId, revision }: Props) {
  const { t } = useI18n()
  const { amount } = useFormat()
  const balance = useResource<Balance>(`/accounts/${userId}/balance`, revision)
  return <Card title={t('funds.balance')}><Result resource={balance}>{data =>
    <dl className="preview-breakdown"><div><dt>{t('funds.available')}</dt><dd>{amount(data.available, data.currency)}</dd></div><div><dt>{t('funds.reserved')}</dt><dd>{amount(data.reserved, data.currency)}</dd></div><div><dt>{t('funds.total')}</dt><dd>{amount(data.total, data.currency)}</dd></div></dl>
  }</Result></Card>
}

export function PortfolioCard({ userId, revision, sell }: Props & { sell: (symbol: string) => void }) {
  const { t } = useI18n()
  const { amount, date } = useFormat()
  const portfolio = useResource<Portfolio>('/portfolio/' + userId, revision)
  return <Card title={t('pf.title')}><Result resource={portfolio}>{data => <>
    <dl className="preview-breakdown"><div><dt>{t('pf.value')}</dt><dd>{amount(data.totalValue, data.currency)}</dd></div><div><dt>{t('pf.pnl')}</dt><dd>{amount(data.unrealizedPnl, data.currency)}</dd></div></dl>
    {data.valuedAt && <p className="card-note">{t('pf.valuedAt', { date: date(data.valuedAt) })}{data.stale && ' · ' + t('pf.stale')}</p>}
    <Table headers={[t('mkt.col.symbol'), t('pf.col.quantity'), t('pf.col.avgCost'), t('pf.col.price'), t('pf.col.value'), t('mkt.col.trade')]} empty={t('pf.empty')} values={(data.positions ?? []).map(p => ({
      key: p.symbol, cells: [p.symbol, p.quantity ?? p.qty, amount(p.averageCost ?? p.avgCost), amount(p.currentPrice), amount(p.marketValue), <button type="button" className="small-button" disabled={p.availableQuantity === 0} onClick={() => sell(p.symbol)}>{t('mkt.sell')}</button>],
    }))}/>
  </>}</Result></Card>
}

export function Funds({ userId, revision, refresh, notify }: Props & { refresh: () => void; notify: (text: string) => void }) {
  const { t } = useI18n()
  const { amount, date } = useFormat()
  const [page, setPage] = useState(0)
  const [operation, setOperation] = useState<Operation>('deposits')
  const [invalid, setInvalid] = useState('')
  const action = useAction()
  const balance = useResource<Balance>(`/accounts/${userId}/balance`, revision)
  const movements = useResource<Listing<Movement>>(`/accounts/${userId}/movements?page=${page}&size=20`, revision)
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const value = Number(data.get('amount'))
    const problem = fundsError(operation, value, balance.data?.available)
    setInvalid(problem ? t(problem, { max: amount(MAX_DEPOSIT), available: amount(balance.data?.available) }) : '')
    if (problem) return
    const description = String(data.get('description') ?? '').trim()
    void action.run(async () => {
      await gateway.request('/funds/' + operation, { method: 'POST', body: { userId, amount: value, ...(description && { description }) } })
      form.reset()
      setPage(0)
      refresh()
      notify(t(operation === 'deposits' ? 'funds.depositDone' : 'funds.withdrawalDone', { amount: amount(value) }))
    })
  }
  return <div className="basic-screen">
    <div className="workspace-overview"><BalanceCard userId={userId} revision={revision}/>
      <Card title={t('funds.move')}><form onSubmit={submit} noValidate>
        <label>{t('funds.operation')}<select value={operation} onChange={e => { setOperation(e.target.value as Operation); setInvalid('') }} disabled={action.busy}>
          <option value="deposits">{t('funds.deposit')}</option><option value="withdrawals">{t('funds.withdrawal')}</option>
        </select></label>
        <label>{t('funds.amount')}<input required name="amount" type="number" inputMode="decimal" min={MIN_AMOUNT} max={operation === 'deposits' ? MAX_DEPOSIT : balance.data?.available} step="0.01" aria-describedby="funds-hint" aria-invalid={!!invalid} onChange={() => setInvalid('')}/></label>
        <small id="funds-hint" className="field-hint">{operation === 'deposits' ? t('funds.depositHint', { max: amount(MAX_DEPOSIT) }) : t('funds.withdrawalHint', { available: amount(balance.data?.available) })}</small>
        <label>{t('funds.description')}<input name="description" maxLength={500} autoComplete="off"/></label>
        {(invalid || action.error) && <p className="form-error" role="alert">{invalid || action.error}</p>}
        <button type="submit" className="button button-primary" disabled={action.busy}>{action.busy ? t('api.sending') : operation === 'deposits' ? t('funds.depositAction') : t('funds.withdrawalAction')}</button>
      </form></Card>
    </div>
    <Card title={t('funds.history')}><Result resource={movements}>{data => <>
      <Table headers={[t('funds.col.date'), t('funds.col.type'), t('funds.col.amount'), t('funds.col.after')]} empty={t('funds.empty')} values={rows(data).map(m => ({ key: m.movementId, cells: [date(m.createdAt), known(t, 'funds.type.' + m.type, m.type), amount(m.amount), amount(m.balanceAfter)] }))}/>
      <Pager data={data} page={page} change={setPage}/>
    </>}</Result></Card>
  </div>
}
