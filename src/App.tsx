import { lazy, Suspense, useState, useSyncExternalStore } from 'react'
import { gateway } from '@/services/gateway'
import { errorText } from '@/services/api'
import Access from '@/pages/Access'
import Workspace from '@/pages/Workspace'

const DemoApp = lazy(() => import('@/pages/DemoApp'))

export default function App() {
  const session = useSyncExternalStore(gateway.subscribe, gateway.snapshot)
  const [message, setMessage] = useState('')
  async function logout() {
    setMessage('Sesión cerrada.')
    try { await gateway.logout() }
    catch (error) { setMessage('Saliste de este navegador. El servidor no confirmó la revocación de la sesión. ' + errorText(error)) }
  }
  if (import.meta.env.VITE_DEMO_MODE === 'true') return <Suspense fallback={<p>Cargando demostración…</p>}><DemoApp/></Suspense>
  if (!session) return <Access message={message} clearMessage={() => setMessage('')}/>
  return <Workspace key={session.user.id} user={session.user} logout={logout}/>
}
