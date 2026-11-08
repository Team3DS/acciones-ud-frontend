import { useEffect, useState } from 'react'
import { Icon } from '@/components/Icon'
import { readAccount } from '@/store/account'
import Onboarding from '@/pages/Onboarding'
import Dashboard from '@/pages/Dashboard'
import { useI18n } from '@/i18n/I18n'

export default function App() {
  const { t } = useI18n()
  const [account, setAccount] = useState(readAccount)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    try { localStorage.setItem('soltech.account', JSON.stringify(account)) }
    catch { setNotice(t('app.storageError')) }
  }, [account])
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(timer) }, [notice])
  return <>{account.step === 'dashboard' ? <Dashboard account={account} setAccount={setAccount} notify={setNotice}/> : <Onboarding account={account} setAccount={setAccount} notify={setNotice}/>}<div className="toast" role="status" aria-live="polite">{notice && <><Icon name="check"/>{notice}<button type="button" aria-label={t('app.closeNotice')} onClick={() => setNotice('')}><Icon name="close" size={16}/></button></>}</div></>
}
