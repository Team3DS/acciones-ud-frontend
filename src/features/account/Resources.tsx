import { useState, type ReactNode } from 'react'
import type { Resource } from '@/hooks/useResource'
import { errorText } from '@/services/api'

export function Result<T>({ resource, children }: { resource: Resource<T>; children: (data: T) => ReactNode }) {
  if (resource.loading) return <p role="status">Consultando…</p>
  if (resource.error) return <p className="form-error" role="alert">{resource.error}</p>
  if (resource.data == null) return <p className="empty-state">Sin datos disponibles.</p>
  return <>{children(resource.data)}</>
}
export interface Page<T> { content: T[]; totalPages?: number; total?: number; size?: number; last?: boolean; page?: { totalPages?: number } | number }
export type Listing<T> = T[] | Page<T>
export const rows = <T,>(data: Listing<T>): T[] => Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : []
export function Pager<T>({ data, page, change }: { data: Listing<T>; page: number; change: (next: number) => void }) {
  if (Array.isArray(data)) return null
  const pages = data.totalPages ?? (typeof data.page === 'object' ? data.page.totalPages : undefined)
  const last = data.last ?? (pages !== undefined ? page + 1 >= pages : data.total !== undefined ? (page + 1) * (data.size || 20) >= data.total : rows(data).length < 20)
  if (!page && last) return null
  return <div className="preview-actions"><button className="small-button" disabled={!page} onClick={() => change(page - 1)}>Anterior</button><span>Página {page + 1}</span><button className="small-button" disabled={last} onClick={() => change(page + 1)}>Siguiente</button></div>
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
export function amount(value: number | string | null | undefined, currency = 'USD') {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(Number(value))
}
export function date(value?: string) {
  return value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString('es-CO') : '—'
}
