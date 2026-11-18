import { useEffect, useState } from 'react'
import { errorText } from '@/services/api'
import { gateway } from '@/services/gateway'

export interface Resource<T> { data?: T; error?: string; loading: boolean }
export function useResource<T>(path: string | null, revision = 0): Resource<T> {
  const [result, setResult] = useState<{ path: string; revision: number; data?: T; error?: string }>()
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    gateway.request<T>(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setResult({ path, revision, data })
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ path, revision, error: errorText(error) })
    })
    return () => controller.abort()
  }, [path, revision])
  if (!path || result?.path !== path || result.revision !== revision) return { loading: !!path }
  return { loading: false, data: result.data, error: result.error }
}
