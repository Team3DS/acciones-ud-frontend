import { useState, type FormEvent } from 'react'
import { Brand, Icon } from '@/components/Icon'
import { OnboardingStory } from '@/components/OnboardingStory'
import { ThemeSelector } from '@/components/ThemeSelector'
import { gateway } from '@/services/gateway'
import { errorText, type Challenge } from '@/services/api'
import { LanguageSelector, useI18n } from '@/i18n/I18n'

export default function Access({ message, clearMessage }: { message: string; clearMessage: () => void }) {
  const { t } = useI18n()
  const [step, setStep] = useState<'login' | 'register' | 'mfa'>('login')
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const legacy = import.meta.env.VITE_IDENTITY_CONTRACT === 'main'

  function change(next: typeof step) {
    setChallenge(null)
    setError('')
    setNotice('')
    clearMessage()
    setStep(next)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    clearMessage()
    const form = new FormData(event.currentTarget)
    const field = (name: string) => String(form.get(name) ?? '').trim()
    try {
      if (step === 'register') {
        const result = await gateway.register({
          correo: correo.trim(), password: String(form.get('password')), nombres: field('nombres'), apellidos: field('apellidos'),
          tipoDocumento: field('tipoDocumento'), numeroDocumento: field('numeroDocumento'), telefono: field('telefono'),
          nivelInversionista: field('nivelInversionista'), solicitaReporteMensual: form.has('reporte'),
        }, legacy)
        setCorreo(result.correo || correo.trim())
        setStep('login')
        setNotice(t('acc.registered'))
      } else if (step === 'login') {
        const next = await gateway.login(correo.trim(), String(form.get('password')))
        if (next) { setChallenge(next); setStep('mfa') }
      } else if (challenge) {
        await gateway.verify(challenge, field('code'))
      }
    } catch (err) { setError(errorText(err)) }
    finally { setBusy(false) }
  }

  return <div className="onboarding">
    <section className="onboarding-main">
      <header className="onboarding-header"><Brand/><div className="preference-controls"><ThemeSelector/><LanguageSelector/></div></header>
      <main className="onboarding-content">
        <form key={step} onSubmit={submit} className="onboarding-form">
          <h1>{t('acc.title.' + step)}</h1>
          {step === 'register' && <>
            <div className="field-row"><label>{t('acc.firstNames')}<input name="nombres" autoComplete="given-name" required/></label><label>{t('acc.lastNames')}<input name="apellidos" autoComplete="family-name" required/></label></div>
            <div className="field-row"><label>{t('acc.docType')}<select name="tipoDocumento">{['CC', 'CE', 'PASAPORTE', 'PPT'].map(x => <option key={x}>{x}</option>)}</select></label><label>{t('acc.docNumber')}<input name="numeroDocumento" required/></label></div>
            <label>{t('acc.phone')}<input type="tel" autoComplete="tel" name="telefono" required/></label>
            <label>{t('acc.level')}<select name="nivelInversionista"><option value="PRINCIPIANTE">{t('level.Principiante')}</option><option value="EXPERIMENTADO">{t('level.Experimentado')}</option></select></label>
            {!legacy && <label className="checkbox-label"><input type="checkbox" name="reporte"/>{t('acc.monthlyReport')}</label>}
          </>}
          {step !== 'mfa' ? <>
            <label>{t('acc.email')}<input type="email" name="correo" value={correo} onChange={e => setCorreo(e.target.value)} autoComplete="email" required/></label>
            <label>{t('acc.password')}<input type="password" name="password" required minLength={step === 'register' ? 8 : undefined} autoComplete={step === 'register' ? 'new-password' : 'current-password'}/></label>
          </> : <>
            <p className="intro">{t('acc.mfaIntro', { email: challenge?.correo ?? '' })}</p>
            <label>{t('acc.code')}<input className="code-input" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required autoFocus/></label>
          </>}
          {(notice || message) && <p role="status" className="demo-note">{notice || message}</p>}
          {error && <p role="alert" className="form-error">{error}</p>}
          <button disabled={busy} className="button button-primary full">{busy ? t('api.sending') : t('acc.submit.' + step)} <Icon name="arrow" size={17}/></button>
          <button type="button" disabled={busy} className="demo-button" onClick={() => change(step === 'login' ? 'register' : 'login')}>
            {step === 'login' ? t('acc.toRegister') : t('acc.toLogin')}
          </button>
        </form>
      </main>
    </section>
    <OnboardingStory/>
  </div>
}
