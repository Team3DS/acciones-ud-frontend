import { useState, type FormEvent } from 'react'
import { useResource } from '@/hooks/useResource'
import { gateway } from '@/services/gateway'
import { amount, Card, date, Pager, Result, rows, Table, useAction, type Listing } from './Resources'

interface Notice { id: number; title: string; message: string; createdAt: string; readAt: string | null }
interface Alert { id: number; symbol: string; targetPrice: number; condition: string; active: boolean }
interface Preference { type: string; channel: string; enabled: boolean }
interface Props { revision: number; refresh: () => void }

export function Notifications({ revision, refresh }: Props) {
  const [page, setPage] = useState(0)
  const [unread, setUnread] = useState(false)
  const notices = useResource<Listing<Notice>>(`/notifications?page=${page}&size=20&unreadOnly=${unread}`, revision)
  const action = useAction()
  return <Card title="Notificaciones"><label className="checkbox-label"><input type="checkbox" checked={unread} onChange={e => { setUnread(e.target.checked); setPage(0) }}/>Solo sin leer</label>
    <Result resource={notices}>{data => <>
      <Table headers={['Fecha', 'Asunto', 'Mensaje', 'Lectura']} empty="Sin notificaciones para esta consulta." values={rows(data).map(n => ({ key: n.id, cells: [
        date(n.createdAt), n.title, n.message, n.readAt ? 'Leída' : <button type="button" className="small-button" disabled={action.busy} onClick={() => void action.run(async () => {
          await gateway.request('/notifications/' + n.id + '/read', { method: 'PATCH' }); refresh()
        })}>Marcar como leída</button>,
      ] }))}/><Pager data={data} page={page} change={setPage}/>
    </>}</Result>
    {action.error && <p className="form-error" role="alert">{action.error}</p>}
  </Card>
}

export function Preferences({ revision, refresh }: Props) {
  const prefs = useResource<Preference[]>('/notifications/preferences', revision)
  const action = useAction()
  return <Card title="Preferencias de notificación"><Result resource={prefs}>{data => !data.length ? <p>No hay preferencias configuradas.</p> : data.map(pref =>
    <label key={pref.type + pref.channel} className="checkbox-label"><input type="checkbox" disabled={action.busy} checked={pref.enabled} onChange={() => void action.run(async () => {
      await gateway.request('/notifications/preferences', { method: 'PATCH', body: { ...pref, enabled: !pref.enabled } }); refresh()
    })}/>{pref.type} · {pref.channel}</label>
  )}</Result>{action.error && <p className="form-error" role="alert">{action.error}</p>}</Card>
}

export function PriceAlerts({ revision, refresh }: Props) {
  const alerts = useResource<Alert[]>('/alerts/price', revision)
  const action = useAction()
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fields = new FormData(form)
    void action.run(async () => {
      const symbol = String(fields.get('symbol')).trim().toUpperCase()
      const instrument = await gateway.request<{ id: number }>('/instruments/' + encodeURIComponent(symbol))
      if (!instrument?.id) throw new Error('El catálogo no devolvió el identificador del instrumento.')
      await gateway.request('/alerts/price', { method: 'POST', body: { instrumentId: instrument.id, condition: fields.get('condition'), targetPrice: Number(fields.get('price')) } })
      form.reset()
      refresh()
    })
  }
  return <Card title="Alertas de precio">
    <form onSubmit={submit}><div className="field-row"><label>Símbolo<input name="symbol" required/></label><label>Condición<select name="condition"><option value="SUPERA">Supera</option><option value="CAE_BAJO">Cae por debajo de</option></select></label><label>Precio objetivo USD<input name="price" type="number" min="0.0001" step="0.0001" required/></label></div>
      <button type="submit" className="small-button" disabled={action.busy}>Crear alerta</button></form>
    {action.error && <p className="form-error" role="alert">{action.error}</p>}
    <Result resource={alerts}>{data => <Table headers={['Acción', 'Condición', 'Objetivo', 'Estado']} empty="No tienes alertas de precio." values={data.map(a => ({ key: a.id, cells: [a.symbol, a.condition, amount(a.targetPrice), a.active ?
      <button type="button" className="small-button" disabled={action.busy} onClick={() => void action.run(async () => { await gateway.request('/alerts/price/' + a.id, { method: 'DELETE' }); refresh() })}>Desactivar</button> : 'Desactivada'] }))}/>}</Result>
  </Card>
}
