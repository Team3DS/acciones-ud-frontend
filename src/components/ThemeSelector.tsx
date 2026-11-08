import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Icon } from '@/components/Icon'

type Theme = 'light' | 'dark' | 'system'
const storageKey = 'acciones-ud.theme'
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({ theme: 'system', setTheme: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try { const saved = localStorage.getItem(storageKey); return saved === 'light' || saved === 'dark' ? saved : 'system' }
    catch { return 'system' }
  })
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = theme === 'system' ? media.matches ? 'dark' : 'light' : theme
      document.documentElement.dataset.theme = resolved
      document.documentElement.style.colorScheme = resolved
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0c0c0e' : '#f8f6f0')
    }
    apply()
    try { localStorage.setItem(storageKey, theme) } catch { /* The choice still works for this session. */ }
    media.addEventListener('change', apply)
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) setTheme(event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : 'system')
    }
    window.addEventListener('storage', sync)
    return () => { media.removeEventListener('change', apply); window.removeEventListener('storage', sync) }
  }, [theme])
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function ThemeSelector() {
  const { theme, setTheme } = useContext(ThemeContext)
  return <div className="theme-selector" role="group" aria-label="Apariencia">
    {([['light', 'Claro', 'sun'], ['dark', 'Oscuro', 'moon'], ['system', 'Sistema', 'monitor']] as const).map(([value, label, icon]) =>
      <button key={value} type="button" title={label} aria-label={`Tema ${label.toLowerCase()}`} aria-pressed={theme === value} onClick={() => setTheme(value)}><Icon name={icon} size={15}/><span>{label}</span></button>
    )}
  </div>
}
