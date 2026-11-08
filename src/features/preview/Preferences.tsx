import type { Dispatch, SetStateAction } from 'react'
import type { Account } from '@/types'
import { ThemeSelector } from '@/components/ThemeSelector'

export function ProfileScreen({ account, setAccount, notify }: { account: Account; setAccount: Dispatch<SetStateAction<Account>>; notify: (message: string) => void }) {
  const update = (key: string, value: string) => setAccount(current => ({ ...current, profile: { ...current.profile, [key]: value } }))
  return <article className="card workspace-profile">
    <div className="card-heading"><h3>Tu perfil y preferencias</h3><span className="pill">Guardado local</span></div>
    <form onSubmit={event => { event.preventDefault(); notify('Preferencias guardadas en este navegador.') }}>
      <div className="field-row"><label>Nombre<input required value={account.profile.name} onChange={event => update('name', event.target.value)}/></label><label>Apellido<input value={account.profile.surname} onChange={event => update('surname', event.target.value)}/></label></div>
      <label>Correo de demostración<input type="email" required value={account.profile.email} onChange={event => update('email', event.target.value)}/></label>
      <div className="field-row"><label>Celular<input type="tel" value={account.profile.phone || ''} onChange={event => update('phone', event.target.value)}/></label><label>Nivel de experiencia<select value={account.profile.level || 'Principiante'} onChange={event => update('level', event.target.value)}><option>Principiante</option><option>Experimentado</option></select></label></div>
      <label>País<input value={account.profile.country} onChange={event => update('country', event.target.value)}/></label>
      <div className="demo-note">Este perfil solo se guarda en el navegador. El registro y los códigos de acceso son demostraciones de interfaz.</div>
      <button className="button button-primary">Guardar preferencias</button>
    </form>
    <div className="workspace-market"><strong>Apariencia</strong><ThemeSelector/></div>
  </article>
}

export function PremiumScreen() {
  return <article className="card"><div className="card-heading"><div><h3>Premium, a tu ritmo</h3><p>Vista previa de planes. No se realizan cobros ni suscripciones.</p></div><span className="pill">Demostración</span></div><div className="workspace-plans">{[['Mensual', 'USD 12 / mes'], ['Anual', 'USD 120 / año']].map(([name, price]) => <div key={name}><strong>{name}</strong><h2>{price}</h2><p>Listas de seguimiento y alertas de precio. Los favoritos de la demostración están disponibles desde el menú.</p><button className="button button-primary" disabled>Plan de muestra</button></div>)}</div></article>
}
