import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import es from './es.json'
import en from './en.json'

export type Language = 'es' | 'en'
type Messages = Record<string, string>
type Vars = Record<string, string | number>

const messages: Record<Language, Messages> = { es, en }
const locales: Record<Language, string> = { es: 'es-CO', en: 'en-US' }
export const languages: { code: Language; short: string; name: string }[] = [
  { code: 'es', short: 'ES', name: 'Español' },
  { code: 'en', short: 'EN', name: 'English' },
]
const storageKey = 'acciones-ud.language'
// Mensajes de los servicios y utilidades que se muestran tal cual al usuario.
const errorKeys: Record<string, string> = {
  'Ingresa un número entero de acciones mayor a cero.': 'error.quantity',
  'El monto de la operación no es válido.': 'error.amount',
  'Tu saldo es insuficiente. Puedes agregar fondos virtuales.': 'error.balance',
  'No tienes suficientes acciones de este activo para vender.': 'error.holding',
  'El monto debe estar entre 100 y 1.000.000 USD.': 'error.fundsRange',
  'Selecciona fechas válidas de inicio y fin.': 'error.dates',
  'La fecha inicial no puede ser posterior a la fecha final.': 'error.dateOrder',
}

const isLanguage = (value: unknown): value is Language => value === 'es' || value === 'en'
export function initialLanguage(): Language {
  try { const saved = localStorage.getItem(storageKey); if (isLanguage(saved)) return saved } catch { /* Se usa el idioma del navegador. */ }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es'
}

export function translate(language: Language, key: string, vars?: Vars) {
  const text = messages[language][key] ?? messages.es[key] ?? key
  return vars ? text.replace(/\{(\w+)\}/g, (match, name: string) => name in vars ? String(vars[name]) : match) : text
}

export function formatters(language: Language) {
  const locale = locales[language]
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
  const whole = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  return {
    locale,
    money: (value: number) => currency.format(value),
    moneyWhole: (value: number) => whole.format(value),
    number: (value: number, digits = 2) => new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value),
    percent: (value: number, digits = 2) => `${new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)}${language === 'es' ? ' %' : '%'}`,
    date: (value: string | number | Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, options).format(new Date(value)),
  }
}

type I18n = ReturnType<typeof formatters> & { language: Language; setLanguage: (language: Language) => void; t: (key: string, vars?: Vars) => string; tError: (message: string) => string }
const I18nContext = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(initialLanguage)
  useEffect(() => {
    document.documentElement.lang = language
    try { localStorage.setItem(storageKey, language) } catch { /* La elección funciona durante esta sesión. */ }
    const sync = (event: StorageEvent) => { if (event.key === storageKey && isLanguage(event.newValue)) setLanguage(event.newValue) }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [language])
  const value = useMemo<I18n>(() => ({
    ...formatters(language),
    language,
    setLanguage,
    t: (key, vars) => translate(language, key, vars),
    tError: message => errorKeys[message] ? translate(language, errorKeys[message]) : message,
  }), [language])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n debe usarse dentro de I18nProvider.')
  return context
}

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n()
  return <div className="theme-selector language-selector" role="group" aria-label={t('language.group')}>
    <span className="language-icon" aria-hidden="true"><Icon name="globe" size={14}/></span>
    {languages.map(item =>
      <button key={item.code} type="button" lang={item.code} title={item.name} aria-label={t('language.aria', { name: item.name })} aria-pressed={language === item.code} onClick={() => setLanguage(item.code)}>{item.short}</button>
    )}
  </div>
}
