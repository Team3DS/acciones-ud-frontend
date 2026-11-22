import { useEffect, useState } from 'react'
import { Brand, Icon } from '@/components/Icon'
import { ThemeSelector } from '@/components/ThemeSelector'
import PreviewDialog from '@/components/PreviewDialog'
import { LanguageSelector, useI18n } from '@/i18n/I18n'
import { useResource } from '@/hooks/useResource'
import type { UserInfo } from '@/services/api'
import { BalanceCard, Funds, PortfolioCard } from '@/features/account/Accounts'
import { Market, MarketStatus } from '@/features/account/Market'
import { OrderForm, Orders, type OrderDraft } from '@/features/account/Orders'
import { Notifications, Preferences, PriceAlerts } from '@/features/account/Notifications'
import Billing from '@/features/account/Billing'
import ExecutionSummary from '@/features/account/ExecutionSummary'
import { Card } from '@/features/account/Resources'
import '@/styles/workspace.css'
import '@/styles/dashboard.css'
import '@/styles/account.css'

const navigation = [
  ['grid', 'overview'], ['wallet', 'portfolio'], ['chart', 'market'], ['orders', 'orders'],
  ['star', 'favorites'], ['wallet', 'funds'], ['shield', 'protection'], ['bell', 'notifications'],
  ['star', 'premium'], ['sun', 'profile'], ['orders', 'reports'], ['help', 'help'],
] as const
type Section = typeof navigation[number][1]

export default function Workspace({ user, logout }: { user: UserInfo; logout: () => void }) {
  const { t } = useI18n()
  const [section, setSection] = useState<Section>('overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [revision, setRevision] = useState(0)
  const [draft, setDraft] = useState<OrderDraft | null>(null)
  const [notice, setNotice] = useState('')
  const refresh = () => setRevision(value => value + 1)
  const profile = useResource<UserInfo>(import.meta.env.VITE_IDENTITY_CONTRACT === 'main' ? null : '/users/me', revision)
  const identity = profile.data ?? user
  const unread = useResource<{ count: number }>('/notifications/unread-count', revision)
  const title = t('ws.nav.' + section)
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
    {mobileNav && <button type="button" className="nav-backdrop" aria-label={t('nav.closeMenu')} onClick={() => setMobileNav(false)}/>}
    <aside className={'sidebar ' + (mobileNav ? 'mobile-open' : '')}><Brand/>
      <div className="account-switch"><span className="account-symbol"><Icon name="wallet"/></span><div><strong>{t('nav.account')}</strong><small>{user.id}</small></div></div>
      <nav>{navigation.map(([icon, id]) => <button type="button" key={id} className={section === id ? 'active' : ''} aria-current={section === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon name={icon}/>{t('ws.nav.' + id)}</button>)}</nav>
      <div className="sidebar-bottom"><button type="button" onClick={logout}><Icon name="exit"/>{t('nav.logout')}</button><div className="sidebar-user"><span className="avatar">{name[0]?.toUpperCase()}</span><strong>{name}</strong></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="topbar-location"><button type="button" className="mobile-menu icon-button" aria-label={t('nav.openMenu')} onClick={() => setMobileNav(true)}><Icon name="menu"/></button><span>{t('top.mySpace')}</span><span className="breadcrumb-slash">/</span><strong>{title}</strong></div>
      <div className="topbar-tools"><ThemeSelector/><LanguageSelector/><button type="button" className="icon-button" aria-label={unread.data?.count ? t('ws.unread', { count: unread.data.count }) : t('top.notifications')} onClick={() => navigate('notifications')}><Icon name="bell"/>{!!unread.data?.count && unread.data.count}</button><button type="button" className="avatar" aria-label={t('top.openProfile')} onClick={() => navigate('profile')}>{name[0]?.toUpperCase()}</button></div></header>
      <main className="dashboard-main"><div className="welcome-heading"><div><h1>{section === 'overview' && identity.nombres ? t('ws.hello', { name: identity.nombres }) : title}</h1></div>
        <div className="overview-heading-actions"><button type="button" className="button button-secondary" onClick={refresh}>{t('ws.refresh')}</button>
          <button type="button" className="button button-primary" onClick={() => setDraft({ symbol: '', side: 'BUY' })}>{t('ws.newTrade')} <Icon name="plus" size={16}/></button></div></div>
        {section === 'overview' && <><div className="workspace-overview"><BalanceCard {...props}/><MarketStatus revision={revision}/></div>
          <div className="dashboard-overview"><div className="overview-primary"><Market {...props} trade={setDraft} overview/></div><div className="overview-aside"><PortfolioCard {...props} sell={sell}/></div></div></>}
        {section === 'portfolio' && <PortfolioCard {...props} sell={sell}/>}
        {(section === 'market' || section === 'favorites') && <Market key={section} {...props} trade={setDraft} favoritesOnly={section === 'favorites'}/>}
        {section === 'orders' && <Orders revision={revision} refresh={refresh} notify={setNotice}/>}
        {section === 'funds' && <Funds {...props} refresh={refresh} notify={setNotice}/>}
        {section === 'protection' && <Card title={t('ws.protect.title')}><p>{t('ws.protect.copy')}</p><button type="button" className="button button-primary" onClick={() => setDraft({ symbol: '', side: 'SELL', protection: true })}>{t('ws.protect.action')}</button></Card>}
        {section === 'notifications' && <div className="basic-screen"><Notifications revision={revision} refresh={refresh}/><PriceAlerts revision={revision} refresh={refresh}/></div>}
        {section === 'premium' && <Billing revision={revision} refresh={refresh}/>}
        {section === 'reports' && <ExecutionSummary revision={revision}/>}
        {section === 'profile' && <div className="basic-screen"><Card title={t('ws.profile.title')}><dl className="preview-breakdown">
          <div><dt>{t('ws.profile.name')}</dt><dd>{name}</dd></div><div><dt>{t('ws.profile.email')}</dt><dd>{identity.correo}</dd></div><div><dt>{t('ws.profile.status')}</dt><dd>{identity.estadoUsuario || '—'}</dd></div>
          <div><dt>{t('ws.profile.roles')}</dt><dd>{identity.roles?.join(', ') || '—'}</dd></div>
        </dl>{profile.error && <p role="alert" className="form-error">{t('ws.profile.error', { error: profile.error })}</p>}</Card><Preferences revision={revision} refresh={refresh}/></div>}
        {section === 'help' && <Card title={t('ws.help.title')}><div className="help-questions">
          {[1, 2, 3].map(n => <details key={n}><summary>{t('ws.help.q' + n)}</summary><p>{t('ws.help.a' + n)}</p></details>)}
        </div></Card>}
      </main>
    </div>
    {draft && <PreviewDialog title={draft.protection ? t('ws.protect.dialog') : t('ws.newTrade')} preview={false} onClose={() => setDraft(null)}><OrderForm draft={draft} done={() => { setDraft(null); refresh(); navigate('orders'); setNotice(t('ws.orderReceived')) }}/></PreviewDialog>}
    {notice && <div className="toast" role="status"><Icon name="check"/>{notice}</div>}
  </div>
}
