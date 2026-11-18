import { Gateway } from './api'
let storage: Storage | undefined
try { storage = window.sessionStorage } catch { /* Almacenamiento privado bloqueado. */ }
export const gateway = new Gateway(import.meta.env.VITE_API_BASE_URL || '/api/v1', storage)
