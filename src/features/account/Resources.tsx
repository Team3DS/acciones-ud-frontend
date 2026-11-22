import { useState, type ReactNode } from 'react'
import type { Resource } from '@/hooks/useResource'
import { errorText } from '@/services/api'
import { useI18n } from '@/i18n/I18n'

export function Result<T>({ resource, children }: { resource: Resource<T>; children: (data: T) => ReactNode }) {
  const { t } = useI18n()
  if (resource.loading) return <p role="status">{t('api.loading')}</p>
  if (resource.error) return <p className="form-error" role="alert">{resource.error}</p>
  if (resource.data == null) return <p className="empty-state">{t('api.noData')}</p>
  return <>{children(resource.data)}</>
}
export interface Page<T> { content: T[]; totalPages?: number; total?: number; size?: number; last?: boolean; page?: { totalPages?: number } | number }
export type Listing<T> = T[] | Page<T>
export const rows = <T,>(data: Listing<T>): T[] => Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : []
export function Pager<T>({ data, page, change }: { data: Listing<T>; page: number; change: (next: number) => void }) {
  const { t } = useI18n()
  if (Array.isArray(data)) return null
  const pages = data.totalPages ?? (typeof data.page === 'object' ? data.page.totalPages : undefined)
  const last = data.last ?? (pages !== undefined ? page + 1 >= pages : data.total !== undefined ? (page + 1) * (data.size || 20) >= data.total : rows(data).length < 20)
  if (!page && last) return null
  return <div className="preview-actions"><button type="button" className="small-button" disabled={!page} onClick={() => change(page - 1)}>{t('rep.previous')}</button><span>{t('api.page', { page: page + 1 })}</span><button type="button" className="small-button" disabled={last} onClick={() => change(page + 1)}>{t('rep.next')}</button></div>
}

export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function run(action: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError('')
    try { await action() } catch (err) { setError(errorText(err)) }
    finally { setBusy(false) }
  }
  return { busy, error, run }
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return <article className="card"><div className="card-heading"><h3>{title}</h3></div>{children}</article>
}
export function Table({ headers, values, empty }: { headers: string[]; values: { key: string | number; cells: ReactNode[] }[]; empty: string }) {
  if (!values.length) return <p className="empty-state">{empty}</p>
  return <div className="table-scroll"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>
    {values.map(row => <tr key={row.key}>{row.cells.map((cell, index) => <td key={headers[index]}>{cell ?? '—'}</td>)}</tr>)}
  </tbody></table></div>
}
type Amount = number | string | null | undefined
export function amount(value: Amount, currency = 'USD', locale = 'es-CO') {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return '—'
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value))
}
export function date(value?: string, locale = 'es-CO') {
  return value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString(locale) : '—'
}
/** Formatos de montos, fechas y porcentajes según el idioma elegido. */
export function useFormat() {
  const { locale, percent } = useI18n()
  return {
    amount: (value: Amount, currency = 'USD') => amount(value, currency, locale),
    date: (value?: string) => date(value, locale),
    /** Solo la fecha, sin hora (periodos de suscripción). */
    day: (value?: string | null) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '—',
    percent: (value: Amount) => value == null || value === '' || !Number.isFinite(Number(value)) ? '—' : percent(Number(value)),
  }
}
