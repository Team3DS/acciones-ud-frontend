import { useEffect, useState } from 'react'
import { useResource } from '@/hooks/useResource'
import { gateway } from '@/services/gateway'
import { useI18n } from '@/i18n/I18n'
import { Card, Pager, Result, rows, Table, useAction, useFormat, type Listing } from './Resources'
import { known } from './Market'
import { annualSavings, isStripeCheckout, safeLink, type Interval } from '@/utils/billing'

/** Contratos de M10 (PR #26): PlanResponse, MiSuscripcionResponse, SuscripcionResponse, ReciboResponse y CheckoutResponse. */
interface Price { interval: Interval; amount: number; currency: string }
interface Plan { code: string; name: string; description?: string; prices: Price[] }
interface Subscription {
  id: number; plan: string; interval: Interval; amount: number; currency: string; status: string
  currentPeriodStart?: string; currentPeriodEnd?: string; cancelAtPeriodEnd: boolean; canceledAt?: string; endedAt?: string
}
interface MySubscription { userId: number; premium: boolean; validUntil?: string; subscription?: Subscription | null }
interface Receipt { id: number; number?: string; amount: number; currency: string; status: string; issuedAt?: string; paidAt?: string; receiptUrl?: string; pdfUrl?: string }
interface Checkout { sessionId: string; checkoutUrl: string; expiresAt?: string }

/** Tiempo máximo esperando el webhook de Stripe después de volver del pago. */
const ACTIVATION_WAIT_MS = 30000
const ACTIVATION_POLL_MS = 3000

export default function Billing({ revision, refresh, notify, returning }: { revision: number; refresh: () => void; notify: (text: string) => void; returning?: 'success' | 'cancel' }) {
  const { t } = useI18n()
  const { amount, day } = useFormat()
  const [page, setPage] = useState(0)
  const [waiting, setWaiting] = useState(returning === 'success')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const action = useAction()
  const plans = useResource<Plan[]>('/payments/plans', revision)
  const mine = useResource<MySubscription>('/subscriptions/me', revision)
  const receipts = useResource<Listing<Receipt>>(`/payments/invoices?page=${page}&size=10`, revision)

  // Stripe confirma el pago por webhook: se consulta M10 en segundo plano hasta ver el Premium activo o agotar la espera.
  useEffect(() => {
    if (!waiting) return
    if (mine.data?.premium) { setWaiting(false); notify(t('bill.activated')); return }
    const started = Date.now()
    let active = true
    const timer = setInterval(() => {
      if (Date.now() - started > ACTIVATION_WAIT_MS) { clearInterval(timer); if (active) setWaiting(false); return }
      gateway.request<MySubscription>('/subscriptions/me').then(data => {
        if (!active || !data?.premium) return
        clearInterval(timer)
        setWaiting(false)
        notify(t('bill.activated'))
        refresh()
      }).catch(() => { /* Se reintenta en la siguiente consulta. */ })
    }, ACTIVATION_POLL_MS)
    return () => { active = false; clearInterval(timer) }
  }, [waiting, mine.data?.premium])

  const subscription = mine.data?.subscription ?? undefined
  const premium = !!mine.data?.premium
  const manageable = !!subscription && ['ACTIVA', 'EN_MORA'].includes(subscription.status) && !subscription.cancelAtPeriodEnd

  function subscribe(interval: Interval) {
    void action.run(async () => {
      const session = await gateway.request<Checkout>('/subscriptions', { method: 'POST', body: { interval } })
      if (!isStripeCheckout(session?.checkoutUrl)) throw new Error(t('bill.err.checkout'))
      window.location.assign(session.checkoutUrl)
    })
  }
  function cancel(id: number) {
    void action.run(async () => {
      const updated = await gateway.request<Subscription>(`/subscriptions/${id}/cancel`, { method: 'POST' })
      setConfirmCancel(false)
      refresh()
      notify(t('bill.cancelScheduled', { date: day(updated?.currentPeriodEnd) }))
    })
  }
  function changeInterval(id: number, interval: Interval) {
    void action.run(async () => {
      await gateway.request<Subscription>(`/subscriptions/${id}/change-plan`, { method: 'POST', body: { interval } })
      refresh()
      notify(t('bill.intervalChanged', { interval: t('bill.interval.' + interval) }))
    })
  }

  return <div className="basic-screen">
    {returning === 'cancel' && <p className="card-note" role="status">{t('bill.returnCancel')}</p>}
    <Card title={t('bill.mine')}><Result resource={mine}>{data => <>
      <strong className={'market-state ' + (data.premium ? 'market-state-abierto' : '')}>{data.premium ? t('bill.premium') : t('bill.free')}</strong>
      {waiting && !data.premium && <p className="card-note" role="status">{t('bill.waiting')}</p>}
      {subscription && <dl className="preview-breakdown">
        <div><dt>{t('bill.status')}</dt><dd>{known(t, 'bill.state.' + subscription.status, subscription.status)}</dd></div>
        <div><dt>{t('bill.plan')}</dt><dd>{subscription.plan} · {t('bill.interval.' + subscription.interval)} · {amount(subscription.amount, subscription.currency)}</dd></div>
        {data.validUntil && <div><dt>{subscription.cancelAtPeriodEnd ? t('bill.endsOn') : t('bill.renewsOn')}</dt><dd>{day(data.validUntil)}</dd></div>}
      </dl>}
      {subscription?.status === 'EN_MORA' && <p className="form-error" role="alert">{t('bill.pastDue')}</p>}
      {manageable && <div className="billing-actions">
        <button type="button" className="small-button" disabled={action.busy} onClick={() => changeInterval(subscription.id, subscription.interval === 'MENSUAL' ? 'ANUAL' : 'MENSUAL')}>
          {t(subscription.interval === 'MENSUAL' ? 'bill.toAnnual' : 'bill.toMonthly')}</button>
        {confirmCancel
          ? <><span>{t('bill.confirmCancel', { date: day(data.validUntil) })}</span>
            <button type="button" className="small-button" disabled={action.busy} onClick={() => cancel(subscription.id)}>{t('bill.cancelYes')}</button>
            <button type="button" className="small-button" disabled={action.busy} onClick={() => setConfirmCancel(false)}>{t('bill.cancelNo')}</button></>
          : <button type="button" className="small-button" disabled={action.busy} onClick={() => setConfirmCancel(true)}>{t('bill.cancel')}</button>}
      </div>}
    </>}</Result>{action.error && <p className="form-error" role="alert">{action.error}</p>}</Card>

    {!premium && <Card title={t('bill.plans')}><Result resource={plans}>{data => {
      const list = Array.isArray(data) ? data : []
      if (!list.length) return <p className="empty-state">{t('bill.noPlans')}</p>
      return <div className="plan-list">{list.map(plan => {
        const savings = annualSavings(plan.prices)
        return <article key={plan.code} className="plan-option">
          <h3>{plan.name}</h3>{plan.description && <p>{plan.description}</p>}
          <div className="billing-actions">{plan.prices.map(price => <button type="button" key={price.interval} className={price.interval === 'ANUAL' ? 'button button-primary' : 'button button-secondary'} disabled={action.busy || waiting} onClick={() => subscribe(price.interval)}>
            {t('bill.subscribe.' + price.interval, { amount: amount(price.amount, price.currency) })}</button>)}</div>
          {savings != null && <p className="card-note">{t('bill.savings', { percent: savings })}</p>}
          <p className="card-note">{t('bill.stripeNote')}</p>
        </article>
      })}</div>
    }}</Result></Card>}

    <Card title={t('bill.receipts')}><Result resource={receipts}>{data => <>
      <Table headers={[t('bill.col.number'), t('bill.col.issued'), t('bill.col.amount'), t('bill.col.status'), t('bill.col.document')]} empty={t('bill.noReceipts')} values={rows(data).map(r => {
        const link = safeLink(r.receiptUrl) ?? safeLink(r.pdfUrl)
        return { key: r.id, cells: [r.number ?? r.id, day(r.issuedAt), amount(r.amount, r.currency), known(t, 'bill.receipt.' + r.status, r.status),
          link ? <a href={link} target="_blank" rel="noopener noreferrer">{t('bill.view')}</a> : '—'] }
      })}/>
      <Pager data={data} page={page} change={setPage}/>
    </>}</Result></Card>
  </div>
}
