import { lazy, Suspense, useState, useSyncExternalStore } from 'react'
import { gateway } from '@/services/gateway'
import { errorText } from '@/services/api'
import { useI18n } from '@/i18n/I18n'
import Access from '@/pages/Access'
import Workspace from '@/pages/Workspace'

const DemoApp = lazy(() => import('@/pages/DemoApp'))

export default function App() {
  const { t } = useI18n()
  const session = useSyncExternalStore(gateway.subscribe, gateway.snapshot)
  const [message, setMessage] = useState('')
  async function logout() {
    setMessage(t('app.loggedOut'))
    try { await gateway.logout() }
    catch (error) { setMessage(t('app.logoutUnconfirmed', { error: errorText(error) })) }
  }
  if (import.meta.env.VITE_DEMO_MODE === 'true') return <Suspense fallback={<p>{t('app.loadingDemo')}</p>}><DemoApp/></Suspense>
  if (!session) return <Access message={message} clearMessage={() => setMessage('')}/>
  return <Workspace key={session.user.id} user={session.user} logout={logout}/>
}
