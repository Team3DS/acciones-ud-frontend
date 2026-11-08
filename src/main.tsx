import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/styles/global.css'
import '@/styles/identity.css'
import { ThemeProvider } from '@/components/ThemeSelector'
import { I18nProvider } from '@/i18n/I18n'
import '@/styles/i18n.css'

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><I18nProvider><ThemeProvider><App /></ThemeProvider></I18nProvider></React.StrictMode>)
