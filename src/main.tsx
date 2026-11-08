import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/styles/global.css'
import '@/styles/identity.css'
import { ThemeProvider } from '@/components/ThemeSelector'

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ThemeProvider><App /></ThemeProvider></React.StrictMode>)
