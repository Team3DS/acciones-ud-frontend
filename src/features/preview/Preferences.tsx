import type { Dispatch, SetStateAction } from 'react'
import type { Account } from '@/types'
import { ThemeSelector } from '@/components/ThemeSelector'
import { LanguageSelector, useI18n } from '@/i18n/I18n'

export function ProfileScreen({ account, setAccount, notify }: { account: Account; setAccount: Dispatch<SetStateAction<Account>>; notify: (message: string) => void }) {
  const { t } = useI18n()
  const update = (key: string, value: string) => setAccount(current => ({ ...current, profile: { ...current.profile, [key]: value } }))
  return <article className="card workspace-profile">
    <div className="card-heading"><h3>{t('pref.title')}</h3><span className="pill">{t('pref.saved')}</span></div>
    <form onSubmit={event => { event.preventDefault(); notify(t('pref.notice')) }}>
      <div className="field-row"><label>{t('field.name')}<input required value={account.profile.name} onChange={event => update('name', event.target.value)}/></label><label>{t('field.surname')}<input value={account.profile.surname} onChange={event => update('surname', event.target.value)}/></label></div>
      <label>{t('pref.demoEmail')}<input type="email" required value={account.profile.email} onChange={event => update('email', event.target.value)}/></label>
      <div className="field-row"><label>{t('field.phone')}<input type="tel" value={account.profile.phone || ''} onChange={event => update('phone', event.target.value)}/></label><label>{t('field.level')}<select value={account.profile.level || 'Principiante'} onChange={event => update('level', event.target.value)}><option value="Principiante">{t('level.Principiante')}</option><option value="Experimentado">{t('level.Experimentado')}</option></select></label></div>
      <label>{t('pref.country')}<input value={account.profile.country} onChange={event => update('country', event.target.value)}/></label>
      <div className="demo-note">{t('pref.note')}</div>
      <button type="submit" className="button button-primary">{t('pref.save')}</button>
    </form>
    <div className="workspace-market"><strong>{t('theme.group')}</strong><ThemeSelector/></div>
    <div className="workspace-market"><strong>{t('language.group')}</strong><LanguageSelector/></div>
  </article>
}

export function PremiumScreen() {
  const { t } = useI18n()
  return <article className="card"><div className="card-heading"><div><h3>{t('premium.title')}</h3><p>{t('premium.sub')}</p></div><span className="pill">{t('premium.demo')}</span></div><div className="workspace-plans">{(['monthly', 'annual'] as const).map(plan => <div key={plan}><strong>{t(`premium.${plan}`)}</strong><h2>{t(`premium.${plan}Price`)}</h2><p>{t('premium.desc')}</p><button type="button" className="button button-primary" disabled>{t('premium.sample')}</button></div>)}</div></article>
}
