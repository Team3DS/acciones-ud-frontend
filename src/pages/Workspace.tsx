import { useEffect, useState } from 'react'
import { Brand, Icon } from '@/components/Icon'
import { ThemeSelector } from '@/components/ThemeSelector'
import PreviewDialog from '@/components/PreviewDialog'
import { useResource } from '@/hooks/useResource'
import type { UserInfo } from '@/services/api'
import { BalanceCard, Funds, PortfolioCard } from '@/features/account/Accounts'
import { Market } from '@/features/account/Market'
import { OrderForm, Orders, type OrderDraft } from '@/features/account/Orders'
import { Notifications, Preferences, PriceAlerts } from '@/features/account/Notifications'
import Billing from '@/features/account/Billing'
import ExecutionSummary from '@/features/account/ExecutionSummary'
import { Card, Result } from '@/features/account/Resources'
import '@/styles/workspace.css'
import '@/styles/dashboard.css'
import '@/styles/account.css'

const navigation = [
  ['grid', 'Resumen'], ['wallet', 'Mi portafolio'], ['chart', 'Explorar mercado'], ['orders', 'Mis órdenes'],
  ['star', 'Favoritos'], ['wallet', 'Mis fondos'], ['shield', 'Órdenes de protección'], ['bell', 'Notificaciones'],
  ['star', 'Premium'], ['sun', 'Mi perfil'], ['orders', 'Reportes'], ['help', 'Centro de ayuda'],
] as const
type Section = typeof navigation[number][1]

export default function Workspace({ user, logout }: { user: UserInfo; logout: () => void }) {
  const [section, setSection] = useState<Section>('Resumen')
  const [mobileNav, setMobileNav] = useState(false)
  const [revision, setRevision] = useState(0)
  const [draft, setDraft] = useState<OrderDraft | null>(null)
  const [notice, setNotice] = useState('')
  const refresh = () => setRevision(value => value + 1)
  const profile = useResource<UserInfo>(import.meta.env.VITE_IDENTITY_CONTRACT === 'main' ? null : '/users/me', revision)
  const identity = profile.data ?? user
  const unread = useResource<{ count: number }>('/notifications/unread-count', revision)
  const market = useResource<{ estado: string }>(section === 'Resumen' ? '/market/status' : null, revision)
  const name = [identity.nombres, identity.apellidos].filter(Boolean).join(' ') || identity.correo
  const props = { userId: user.id, revision }
  const sell = (symbol: string) => setDraft({ symbol, side: 'SELL' })
  function navigate(to: Section) { setSection(to); setMobileNav(false) }

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [section])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 6000)
    return () => clearTimeout(timer)
  }, [notice])

  return <div className="app-shell dynamic-dashboard">
    {mobileNav && <button className="nav-backdrop" aria-label="Cerrar menú" onClick={() => setMobileNav(false)}/>}
    <aside className={'sidebar ' + (mobileNav ? 'mobile-open' : '')}><Brand/>
      <div className="account-switch"><span className="account-symbol"><Icon name="wallet"/></span><div><strong>Cuenta de inversión</strong><small>{user.id}</small></div></div>
      <nav>{navigation.map(([icon, label]) => <button key={label} className={section === label ? 'active' : ''} onClick={() => navigate(label)}><Icon name={icon}/>{label}</button>)}</nav>
      <div className="sidebar-bottom"><button onClick={logout}><Icon name="exit"/>Cerrar sesión</button><div className="sidebar-user"><span className="avatar">{name[0]?.toUpperCase()}</span><strong>{name}</strong></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="topbar-location"><button className="mobile-menu icon-button" aria-label="Abrir menú" onClick={() => setMobileNav(true)}><Icon name="menu"/></button><span>Mi espacio</span><span>/</span><strong>{section}</strong></div>
      <div className="topbar-tools"><ThemeSelector/><button className="icon-button" aria-label={'Ver notificaciones' + (unread.data ? ', ' + unread.data.count + ' sin leer' : '')} onClick={() => navigate('Notificaciones')}><Icon name="bell"/>{!!unread.data?.count && unread.data.count}</button><button className="avatar" aria-label="Abrir perfil" onClick={() => navigate('Mi perfil')}>{name[0]?.toUpperCase()}</button></div></header>
      <main className="dashboard-main"><div className="welcome-heading"><div><h1>{section === 'Resumen' && identity.nombres ? 'Hola, ' + identity.nombres : section}</h1></div>
        <div className="overview-heading-actions"><button className="button button-secondary" onClick={refresh}>Actualizar</button>
          <button className="button button-primary" onClick={() => setDraft({ symbol: '', side: 'BUY' })}>Nueva operación <Icon name="plus" size={16}/></button></div></div>
        {section === 'Resumen' && <><div className="workspace-overview"><BalanceCard {...props}/><Card title="Estado del mercado"><Result resource={market}>{data => <strong>{data.estado}</strong>}</Result></Card></div>
          <div className="dashboard-overview"><div className="overview-primary"><Market {...props} trade={setDraft} overview/></div><div className="overview-aside"><PortfolioCard {...props} sell={sell}/></div></div></>}
        {section === 'Mi portafolio' && <PortfolioCard {...props} sell={sell}/>}
        {(section === 'Explorar mercado' || section === 'Favoritos') && <Market key={section} {...props} trade={setDraft} favoritesOnly={section === 'Favoritos'}/>}
        {section === 'Mis órdenes' && <Orders revision={revision} refresh={refresh} notify={setNotice}/>}
        {section === 'Mis fondos' && <Funds {...props} refresh={refresh} admin={identity.roles?.includes('ADMINISTRADOR') ?? false} notify={setNotice}/>}
        {section === 'Órdenes de protección' && <Card title="Proteger una posición"><p>Elige una venta stop o una venta límite para tus acciones.</p><button className="button button-primary" onClick={() => setDraft({ symbol: '', side: 'SELL', protection: true })}>Preparar orden de protección</button></Card>}
        {section === 'Notificaciones' && <div className="basic-screen"><Notifications revision={revision} refresh={refresh}/><PriceAlerts revision={revision} refresh={refresh}/></div>}
        {section === 'Premium' && <Billing revision={revision} refresh={refresh}/>}
        {section === 'Reportes' && <ExecutionSummary revision={revision}/>}
        {section === 'Mi perfil' && <div className="basic-screen"><Card title="Datos de la cuenta"><dl className="preview-breakdown">
          <div><dt>Nombre</dt><dd>{name}</dd></div><div><dt>Correo</dt><dd>{identity.correo}</dd></div><div><dt>Estado</dt><dd>{identity.estadoUsuario || '—'}</dd></div>
          <div><dt>Roles</dt><dd>{identity.roles?.join(', ') || '—'}</dd></div>
        </dl>{profile.error && <p role="alert" className="form-error">Perfil · {profile.error}</p>}</Card><Preferences revision={revision} refresh={refresh}/></div>}
        {section === 'Centro de ayuda' && <Card title="Usar mi cuenta"><div className="help-questions">
          <details><summary>¿Dónde consulto una orden?</summary><p>En Mis órdenes puedes revisar el estado y las ejecuciones. Las órdenes pendientes admiten cancelación.</p></details>
          <details><summary>¿Cómo consulto mi efectivo?</summary><p>Mis fondos muestra el saldo disponible, las reservas y los movimientos de tu cuenta. Desde allí puedes solicitar un retiro.</p></details>
          <details><summary>¿Cómo actualizo los precios y saldos?</summary><p>Selecciona Actualizar para volver a consultar los servicios.</p></details>
        </div></Card>}
      </main>
    </div>
    {draft && <PreviewDialog title={draft.protection ? 'Orden de protección' : 'Nueva operación'} preview={false} onClose={() => setDraft(null)}><OrderForm draft={draft} done={() => { setDraft(null); refresh(); navigate('Mis órdenes'); setNotice('Orden recibida. Consulta su estado en Mis órdenes.') }}/></PreviewDialog>}
    {notice && <div className="toast" role="status"><Icon name="check"/>{notice}</div>}
  </div>
}
