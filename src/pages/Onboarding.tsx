import { ThemeSelector } from '@/components/ThemeSelector'
import { useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import { Brand, Icon } from '@/components/Icon'
import type { Account, Step } from '@/types'
import { initialAccount } from '@/store/account'
import { LanguageSelector, useI18n } from '@/i18n/I18n'

interface Props { account: Account; setAccount: Dispatch<SetStateAction<Account>>; notify: (message: string) => void }
const steps = ['profile', 'verification', 'security', 'account', 'funding']
const flow: Step[] = ['registro', 'correo', 'mfa', 'alpaca', 'fondeo']
const sectors = ['Todos', 'Tecnología', 'Salud', 'Finanzas', 'Energía', 'Consumo', 'Comunicaciones']
const countries = ['Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'España', 'Estados Unidos', 'Otro']
export default function Onboarding({ account, setAccount, notify }: Props) {
  const { t, moneyWhole, money } = useI18n()
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [amount, setAmount] = useState(100000)
  const [busy, setBusy] = useState(false)
  const [resent, setResent] = useState(false)
  const [mfaDeadline, setMfaDeadline] = useState(() => Date.now() + 300000)
  const [failedCodes, setFailedCodes] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [loginMfa, setLoginMfa] = useState(false)
  const step = Math.max(0, flow.indexOf(account.step))
  const next = (value: Step) => { setError(''); setCode(''); setAccount(a => ({ ...a, step: value })) }
  const update = (key: string, value: string) => setAccount(a => ({ ...a, profile: { ...a.profile, [key]: value } }))
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('')
    if (account.step === 'registro') setAccount(a => ({ ...initialAccount, profile: a.profile, step: 'correo' }))
    else if (account.step === 'login') {
      setLoginMfa(true); setMfaDeadline(Date.now() + 300000); next('mfa')
    } else if (account.step === 'correo' || account.step === 'mfa') {
      if (Date.now() < lockedUntil) { setError(t('onb.err.locked')); return }
      if (account.step === 'mfa' && Date.now() > mfaDeadline) { setError(t('onb.err.expired')); return }
      if (code !== (account.step === 'correo' ? '123456' : '654321')) { const attempts = failedCodes + 1; setFailedCodes(attempts); if (attempts >= 5) { setLockedUntil(Date.now() + 900000); setFailedCodes(0) } setError(attempts >= 5 ? t('onb.err.fiveFailed') : t('onb.err.wrongCode', { attempt: attempts })); return }
      setFailedCodes(0)
      if (account.step === 'correo') setMfaDeadline(Date.now() + 300000)
      next(account.step === 'correo' ? 'mfa' : loginMfa ? 'dashboard' : 'alpaca')
    } else if (account.step === 'alpaca') {
      setBusy(true)
      setTimeout(() => { setAccount(a => ({ ...a, step: 'fondeo', accountId: `ST-${crypto.randomUUID().slice(0, 8).toUpperCase()}` })); setBusy(false); notify(t('onb.notify.accountReady')) }, 1000)
    } else if (account.step === 'fondeo') {
      if (!Number.isFinite(amount) || amount < 100 || amount > 1000000) { setError(t('onb.err.amount')); return }
      setAccount(a => ({ ...a, balance: amount, deposit: amount, step: 'dashboard' })); notify(t('onb.notify.ready'))
    }
  }
  function demo() { setAccount(a => ({ ...a, profile: { name: 'Paula', surname: '', email: 'paula@ejemplo.com', country: 'Colombia' }, step: 'dashboard', balance: 100000, deposit: 100000, accountId: 'ST-DEMO2026', trades: [] })) }
  return <div className="onboarding">
    <section className="onboarding-main">
      <header className="onboarding-header"><Brand/><div className="preference-controls"><ThemeSelector/><LanguageSelector/></div><span>{t('onb.haveAccount')} <button type="button" className="text-link" onClick={() => next(account.step === 'login' ? 'registro' : 'login')}>{account.step === 'login' ? t('onb.signUp') : t('onb.signIn')} <span>↗</span></button></span></header>
      <div className="onboarding-content">
        <div className="eyebrow"><span className="tiny-dot"/> {t('onb.eyebrow')}</div>
        {account.step !== 'login' && <div className="step-track" aria-label={t('onb.stepOf', { step: step + 1 })}>{steps.map((key, i) => <div key={key} className={`step-item ${i === step ? 'current' : ''} ${i < step ? 'complete' : ''}`}><span>{i < step ? <Icon name="check" size={14}/> : `0${i + 1}`}</span><small>{t(`onb.step.${key}`)}</small></div>)}</div>}
        <form onSubmit={submit} className="onboarding-form">
          {account.step === 'registro' && <>
            <span className="section-tag">{t('onb.reg.tag')}</span><h1>{t('onb.reg.title1')}<br/>{t('onb.reg.title2')} <em>{t('onb.reg.titleEm')}</em></h1><p className="intro">{t('onb.reg.intro1')}<br className="desktop-break"/> {t('onb.reg.intro2')}</p>
            <div className="field-row"><label>{t('field.name')}<input required autoComplete="given-name" placeholder={t('field.namePh')} value={account.profile.name} onChange={e => update('name', e.target.value)}/></label><label>{t('field.surname')}<input required autoComplete="family-name" placeholder={t('field.surnamePh')} value={account.profile.surname} onChange={e => update('surname', e.target.value)}/></label></div>
            <div className="field-row"><label>{t('field.document')}<input required placeholder={t('field.documentPh')} value={account.profile.document || ''} onChange={e => update('document', e.target.value)}/></label><label>{t('field.phone')}<input required type="tel" placeholder="+57 300 000 0000" value={account.profile.phone || ''} onChange={e => update('phone', e.target.value)}/></label></div>
            <label>{t('field.level')}<select value={account.profile.level || 'Principiante'} onChange={e => update('level', e.target.value)}><option value="Principiante">{t('level.Principiante')}</option><option value="Experimentado">{t('level.Experimentado')}</option></select></label>
            <div className="field-row"><label>{t('field.markets')}<select value={account.profile.markets?.join(',') || 'NYSE,NASDAQ'} onChange={e => setAccount(a => ({ ...a, profile: { ...a.profile, markets: e.target.value.split(',') } }))}><option value="NYSE,NASDAQ">{t('field.marketsBoth')}</option><option>NYSE</option><option>NASDAQ</option></select></label><label>{t('field.sector')}<select value={account.profile.sectors?.[0] || 'Todos'} onChange={e => setAccount(a => ({ ...a, profile: { ...a.profile, sectors: [e.target.value] } }))}>{sectors.map(sector => <option key={sector} value={sector}>{t(`sector.${sector}`)}</option>)}</select></label></div>
            <label className="checkbox-label"><input type="checkbox" checked={account.profile.premiumInterest || false} onChange={e => setAccount(a => ({ ...a, profile: { ...a.profile, premiumInterest: e.target.checked } }))}/><span>{t('onb.reg.premium')}</span></label>
            <label>{t('field.email')}<div className="input-icon"><Icon name="mail" size={18}/><input required type="email" autoComplete="email" placeholder={t('field.emailPh')} value={account.profile.email} onChange={e => update('email', e.target.value)}/></div></label>
            <label>{t('field.access')}<div className="input-icon"><Icon name="lock" size={18}/><input required type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder={t('field.accessPh')} minLength={8} pattern="(?=.*[a-zA-Z])(?=.*[0-9]).{8,}" title={t('field.accessRule')}/><button type="button" aria-label={showPassword ? t('field.hideAccess') : t('field.showAccess')} onClick={() => setShowPassword(!showPassword)}><Icon name="eye" size={18}/></button></div><small className="field-hint">{t('field.accessHint')}</small></label>
            <label>{t('field.taxCountry')}<select value={account.profile.country} onChange={e => update('country', e.target.value)}>{countries.map(country => <option key={country} value={country}>{t(`country.${country}`)}</option>)}</select></label>
            <label className="checkbox-label"><input type="checkbox" required/><span>{t('onb.reg.accept')} <button type="button" className="text-link" onClick={() => notify(t('onb.reg.termsNotice'))}>{t('onb.reg.terms')}</button> {t('onb.reg.and')} <button type="button" className="text-link" onClick={() => notify(t('onb.reg.privacyNotice'))}>{t('onb.reg.privacy')}</button></span></label>
          </>}
          {account.step === 'login' && <><span className="form-emblem"><Icon name="sun" size={30}/></span><h1>{t('onb.login.title1')}<br/>{t('onb.login.title2')} <em>{t('onb.login.titleEm')}</em></h1><p className="intro">{t('onb.login.intro')}</p><div className="demo-note">{t('onb.login.note')}</div><label>{t('field.email')}<input type="email" required value={account.profile.email} onChange={e => update('email', e.target.value)} placeholder={t('field.emailPh')}/></label><label>{t('field.access')}<input type="password" required minLength={8} autoComplete="current-password" placeholder={t('onb.login.accessPh')}/></label></>}
          {account.step === 'correo' && <><span className="form-emblem"><Icon name="mail" size={30}/></span><span className="section-tag">{t('onb.mail.tag')}</span><h1>{t('onb.mail.title1')}<br/>{t('onb.mail.title2')} <em>{t('onb.mail.titleEm')}</em></h1><p className="intro">{t('onb.mail.intro')}</p><div className="recipient"><Icon name="mail"/><strong>{account.profile.email}</strong></div><label>{t('onb.mail.code')}<input className="code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" required placeholder="0 0 0 0 0 0" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}/></label><div className="demo-note"><Icon name="help" size={17}/><span>{t('onb.mail.demo1')} <strong>123456</strong> {t('onb.mail.demo2')}</span></div><p className="resend">{t('onb.mail.resendQuestion')} <button type="button" className="text-link" disabled={resent} onClick={() => { setResent(true); notify(t('onb.mail.resendNotice')); setTimeout(() => setResent(false), 10000) }}>{resent ? t('onb.mail.resent') : t('onb.mail.resend')}</button></p><button type="button" className="text-link" onClick={() => next('registro')}>{t('onb.mail.change')}</button></>}
          {account.step === 'mfa' && <><span className="form-emblem"><Icon name="mail" size={30}/></span><span className="section-tag">{t('onb.mfa.tag')}</span><h1>{t('onb.mfa.title1')}<br/>{t('onb.mfa.title2')} <em>{t('onb.mfa.titleEm')}</em></h1><p className="intro">{t('onb.mfa.intro')}</p><div className="recipient"><Icon name="mail"/><strong>{account.profile.email}</strong></div><label>{t('onb.mfa.code')}<input className="code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required pattern="[0-9]{6}" placeholder="0 0 0 0 0 0" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}/></label><div className="demo-note"><Icon name="help" size={17}/><span>{t('onb.mfa.demo')}</span></div><button type="button" className="text-link" disabled={Date.now() < lockedUntil} onClick={() => { setMfaDeadline(Date.now() + 300000); setCode(''); notify(t('onb.mfa.requestNotice')) }}>{t('onb.mfa.request')}</button></>}
          {account.step === 'alpaca' && <><span className="form-emblem"><Icon name="wallet" size={30}/></span><span className="section-tag">{t('onb.acc.tag')}</span><h1>{t('onb.acc.title1')}<br/><em>{t('onb.acc.titleEm')}</em></h1><p className="intro">{t('onb.acc.intro')}</p><div className="provider-card"><span className="provider-logo">a<span>↗</span></span><div><strong>Acciones UD</strong><span>{t('onb.acc.practice')}</span></div><span className="pill">{t('onb.acc.simulated')}</span></div><ul className="benefit-list"><li><Icon name="check"/>{t('onb.acc.benefit1')}</li><li><Icon name="check"/>{t('onb.acc.benefit2')}</li><li><Icon name="check"/>{t('onb.acc.benefit3')}</li></ul><div className="demo-note">{t('onb.acc.note')}</div><label className="checkbox-label"><input type="checkbox" required/><span>{t('onb.acc.accept')}</span></label></>}
          {account.step === 'fondeo' && <><span className="form-emblem"><Icon name="sun" size={30}/></span><span className="section-tag">{t('onb.fund.tag')}</span><h1>{t('onb.fund.title1')}<br/>{t('onb.fund.title2')} <em>{t('onb.fund.titleEm')}</em></h1><p className="intro">{t('onb.fund.intro')}</p><label>{t('onb.fund.capital')}<div className="amount-input"><span>$</span><input type="number" min="100" max="1000000" required value={amount} onChange={e => setAmount(Number(e.target.value))}/><strong>USD</strong></div></label><div className="amount-options">{[10000, 50000, 100000].map(n => <button key={n} type="button" className={n === amount ? 'selected' : ''} onClick={() => setAmount(n)}>{moneyWhole(n)}</button>)}</div><div className="funding-summary"><div><span>{t('onb.fund.account')}</span><strong>{account.accountId}</strong></div><div><span>{t('onb.fund.type')}</span><strong>{t('onb.fund.virtual')}</strong></div><div><span>{t('onb.fund.initial')}</span><strong>{money(amount)} USD</strong></div></div><div className="demo-note"><Icon name="shield" size={18}/><span>{t('onb.fund.note')}</span></div></>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary full" type="submit" disabled={busy}>{busy ? t('onb.busy') : t(`onb.submit.${account.step}`)}<Icon name="arrow" size={19}/></button>
          {account.step === 'registro' && <button type="button" className="demo-button" onClick={demo}>{t('onb.demo')} <Icon name="arrow" size={15}/></button>}
          <div className="secure-caption"><Icon name="lock" size={13}/> {t('onb.secure')}</div>
        </form>
      </div>
      <footer className="onboarding-footer"><span>{t('common.footer')}</span><button type="button" onClick={() => notify(t('onb.helpNotice'))}><Icon name="help" size={15}/> {t('onb.help')}</button></footer>
    </section>
    <aside className="story-panel"><div className="story-top"><span className="story-pill"><span/> {t('story.pill')}</span><span className="story-coordinate">{t('story.coordinate')}</span></div><div className="story-copy"><h2>{t('story.title1')}<br/>{t('story.title2')}<br/><span>{t('story.titleEm')}</span></h2><p>{t('story.copy1')}<br/>{t('story.copy2')}</p></div><div className="investment-scene" aria-hidden="true"><div className="investment-grid"/><svg className="investment-chart" viewBox="0 0 520 280" fill="none"><defs><linearGradient id="area-gold" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#D4AF37" stopOpacity=".3"/><stop offset="1" stopColor="#D4AF37" stopOpacity="0"/></linearGradient></defs><path d="M0 240 35 215 65 225 95 183 125 194 160 153 190 173 225 134 255 146 290 101 325 119 355 74 390 88 425 48 460 58 500 15V280H0Z" fill="url(#area-gold)"/><path d="M0 240 35 215 65 225 95 183 125 194 160 153 190 173 225 134 255 146 290 101 325 119 355 74 390 88 425 48 460 58 500 15" stroke="#E9C96A" strokeWidth="2.5" strokeLinejoin="round"/><circle cx="500" cy="15" r="5" fill="#F6E3A1"/></svg><div className="investment-logo"><img src={`${import.meta.env.BASE_URL}acciones-ud.svg`} alt=""/></div><div className="floating-note"><span className="note-icon"><Icon name="chart"/></span><div><span>{t('story.noteLabel')}</span><strong>{t('story.noteValue')}</strong></div><span>↗</span></div></div><div className="story-bottom"><div className="story-feature"><Icon name="shield" size={21}/><div><strong>{t('story.feature1')}</strong><span>{t('story.feature1Sub')}</span></div></div><div className="story-feature"><Icon name="chart" size={21}/><div><strong>{t('story.feature2')}</strong><span>{t('story.feature2Sub')}</span></div></div><div className="story-bottom-line"><span>{t('story.bottom')}</span><Icon name="sun" size={23}/></div></div></aside>
  </div>
}
