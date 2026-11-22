import { useResource } from '@/hooks/useResource'
import { gateway } from '@/services/gateway'
import { amount, Card, date, Result, rows, Table, useAction, type Listing } from './Resources'

interface Plan {
  id?: number; planId?: number; code?: string; codigo?: string; name?: string; nombre?: string
  description?: string; descripcion?: string; monthlyPrice?: number; precioMensual?: number; currency?: string; moneda?: string
}
interface Subscription { id?: number; subscriptionId?: number; planId: number; estado?: string; status?: string }
interface Invoice { id?: number; invoiceId?: number; fechaEmision?: string; issuedAt?: string; monto?: number; amount?: number; moneda?: string; currency?: string; estado?: string; status?: string }

export default function Billing({ revision, refresh }: { revision: number; refresh: () => void }) {
  const plans = useResource<Listing<Plan>>('/billing/plans', revision)
  const current = useResource<Subscription>('/subscriptions/me', revision)
  const invoices = useResource<Listing<Invoice>>('/billing/invoices', revision)
  const action = useAction()
  function checkout(planId: number) {
    void action.run(async () => {
      const session = await gateway.request<{ checkoutUrl?: string; url?: string }>('/subscriptions', { method: 'POST', body: { planId } })
      const url = new URL(session?.checkoutUrl || session?.url || '', window.location.origin)
      if (url.origin !== 'https://checkout.stripe.com') throw new Error('El servicio no devolvió un enlace de Stripe Checkout válido.')
      window.location.assign(url.href)
    })
  }
  const active = ['ACTIVA', 'ACTIVE', 'TRIALING'].includes(current.data?.estado ?? current.data?.status ?? '')
  const subscriptionId = current.data?.id ?? current.data?.subscriptionId
  return <div className="basic-screen"><Card title="Mi suscripción"><Result resource={current}>{s => <div className="workspace-market"><strong>{s.estado ?? s.status}</strong>
    {subscriptionId != null && active && <button type="button" disabled={action.busy} className="small-button" onClick={() => void action.run(async () => {
      await gateway.request('/subscriptions/' + subscriptionId + '/cancel', { method: 'POST' }); refresh()
    })}>Cancelar suscripción</button>}</div>}</Result></Card>
    <Card title="Planes"><Result resource={plans}>{data =>
      <Table headers={['Plan', 'Descripción', 'Precio mensual', 'Suscripción']} empty="No hay planes publicados." values={rows(data).map((p, index) => {
        const id = p.id ?? p.planId
        const code = p.codigo ?? p.code
        return { key: id ?? code ?? index, cells: [p.nombre ?? p.name ?? code, p.descripcion ?? p.description, amount(p.precioMensual ?? p.monthlyPrice, p.moneda ?? p.currency),
          code === 'FREE' ? 'Gratis' : id == null ? '—' : <button type="button" className="small-button" disabled={action.busy || active && id === current.data?.planId} onClick={() => checkout(id)}>Continuar a Stripe</button>] }
      })}/>
    }</Result></Card>{action.error && <p className="form-error" role="alert">{action.error}</p>}
    <Card title="Facturas"><Result resource={invoices}>{data => <Table headers={['Factura', 'Emisión', 'Importe', 'Estado']} empty="Aún no tienes facturas." values={rows(data).map((i, index) => ({ key: i.id ?? i.invoiceId ?? index, cells: [i.id ?? i.invoiceId, date(i.fechaEmision ?? i.issuedAt), amount(i.monto ?? i.amount, i.moneda ?? i.currency), i.estado ?? i.status] }))}/>}</Result></Card>
  </div>
}
