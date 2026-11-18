export interface UserInfo {
  id: number
  correo: string
  nombres?: string
  apellidos?: string
  roles?: string[]
  estadoUsuario?: string
  solicitaReporteMensual?: boolean
}

export interface Registration {
  nombres: string
  apellidos: string
  correo: string
  password: string
  tipoDocumento: string
  numeroDocumento: string
  telefono: string
  nivelInversionista: string
  solicitaReporteMensual: boolean
}

interface Tokens { accessToken: string; refreshToken: string }
interface Session extends Tokens { user: UserInfo }
interface LoginResponse extends Partial<Tokens> {
  requiresMfa?: boolean
  userId?: string | number
  user?: UserInfo
  verified?: boolean
}
export interface Challenge { userId: number; correo: string; pendingTokens?: Tokens }
type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'
interface RequestOptions { method?: Method; body?: unknown; signal?: AbortSignal; key?: string }

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

export function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo completar la solicitud.'
}

function hasTokens<T extends Partial<Tokens>>(value: T | null): value is T & Tokens {
  return !!value && typeof value.accessToken === 'string' && !!value.accessToken &&
    typeof value.refreshToken === 'string' && !!value.refreshToken
}

function userId(value: unknown) {
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('Identidad devolvió un identificador de usuario inválido.')
  return id
}

export class Gateway {
  private base: string
  private storage?: Storage
  private sessionKey: string
  private session: Session | null = null
  private generation = 0
  private listeners = new Set<() => void>()
  private renewing?: Promise<void>
  private pendingKeys = new Map<string, string>()

  constructor(base: string, storage?: Storage) {
    this.base = base.replace(/\/+$/, '')
    this.sessionKey = 'acciones-ud.session.v1.' + this.base
    this.storage = storage
    try {
      const saved = JSON.parse(storage?.getItem(this.sessionKey) || 'null') as Session | null
      if (saved && hasTokens(saved) && userId(saved.user.id) && saved.user.correo) {
        this.session = saved
        const pending: unknown = JSON.parse(storage?.getItem(this.sessionKey + '.pending.' + saved.user.id) || '[]')
        if (Array.isArray(pending)) {
          for (const pair of pending) {
            if (Array.isArray(pair) && typeof pair[0] === 'string' && typeof pair[1] === 'string') this.pendingKeys.set(pair[0], pair[1])
          }
        }
      }
    } catch { /* Una sesión dañada o el almacenamiento desactivado requieren otro ingreso. */ }
  }

  snapshot = () => this.session
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private save(session: Session | null) {
    this.session = session
    try {
      if (session) this.storage?.setItem(this.sessionKey, JSON.stringify(session))
      else this.storage?.removeItem(this.sessionKey)
    } catch { /* La sesión sigue disponible en memoria durante esta visita. */ }
    this.listeners.forEach(listener => listener())
  }

  private clear() {
    this.generation++
    this.renewing = undefined
    this.pendingKeys.clear()
    this.savePendingKeys()
    this.save(null)
  }

  private savePendingKeys() {
    if (!this.session) return
    const key = this.sessionKey + '.pending.' + this.session.user.id
    try {
      if (this.pendingKeys.size) this.storage?.setItem(key, JSON.stringify([...this.pendingKeys]))
      else this.storage?.removeItem(key)
    } catch { /* Se conserva la clave en memoria si no hay almacenamiento. */ }
  }

  private async send<T>(path: string, options: RequestOptions, correlation: string, token?: string): Promise<T> {
    const headers = new Headers({ Accept: 'application/json, application/problem+json', 'X-Correlation-ID': correlation })
    if (token) headers.set('Authorization', 'Bearer ' + token)
    if (options.key) headers.set('Idempotency-Key', options.key)
    if (options.body !== undefined) headers.set('Content-Type', 'application/json')
    let response: Response
    try {
      response = await fetch(this.base + path, {
        method: options.method || 'GET', signal: options.signal, headers, cache: 'no-store',
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      })
    } catch (error) {
      if (options.signal?.aborted) throw error
      throw new ApiError(0, 'No hay conexión con el gateway. Comprueba la conexión y vuelve a intentar.')
    }
    const raw = await response.text()
    let data
    try { data = raw ? JSON.parse(raw) : undefined }
    catch { if (response.ok) throw new ApiError(502, 'El gateway devolvió una respuesta que no es JSON.') }
    if (!response.ok) {
      const message = [data?.detail, data?.message, data?.error, data?.title].find(x => typeof x === 'string' && x)
      const trace = data?.traceId ? ' · Referencia ' + data.traceId : ''
      throw new ApiError(response.status, (message || 'Error del servicio HTTP ' + response.status) + trace)
    }
    return data as T
  }

  private auth<T>(path: string, body: unknown) {
    return this.send<T>('/auth/' + path, { method: 'POST', key: crypto.randomUUID(), body }, crypto.randomUUID())
  }

  register(data: Registration, legacy = false) {
    if (legacy) {
      const { telefono, solicitaReporteMensual: _monthly, ...rest } = data
      return this.auth<{ id: number; correo: string }>('register', { ...rest, celular: telefono })
    }
    return this.auth<{ id: number; correo: string }>('register', data)
  }

  async login(correo: string, password: string): Promise<Challenge | null> {
    const data = await this.auth<LoginResponse>('login', { correo, password })
    const id = userId(data?.userId ?? data?.user?.id)
    if (data.requiresMfa === false && hasTokens(data) && data.user?.correo) {
      this.clear()
      this.save({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken })
      return null
    }
    return { userId: id, correo, pendingTokens: hasTokens(data) ? { accessToken: data.accessToken, refreshToken: data.refreshToken } : undefined }
  }

  async verify(challenge: Challenge, code: string) {
    const data = await this.auth<LoginResponse>('mfa/verify', { userId: challenge.userId, code })
    if (!data || data.verified === false || data.requiresMfa === true) throw new Error('El código de verificación es incorrecto o ya venció.')
    const tokens = hasTokens(data) ? data : data.verified === true ? challenge.pendingTokens : undefined
    if (!tokens) throw new Error('Identidad no confirmó la sesión. Vuelve a iniciar sesión.')
    const user = data.user ?? { id: challenge.userId, correo: challenge.correo }
    if (userId(user.id) !== challenge.userId) throw new Error('La identidad recibida no coincide con la sesión.')
    this.clear()
    this.save({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user })
  }

  async logout() {
    const session = this.session
    this.clear()
    if (session) await this.auth('logout', { userId: session.user.id, refreshToken: session.refreshToken })
  }

  private async refresh(session: Session, generation: number) {
    try {
      const data = await this.auth<Partial<Tokens>>('refresh', { userId: session.user.id, refreshToken: session.refreshToken })
      if (this.generation !== generation) throw new Error('La sesión cambió.')
      if (!data?.accessToken) throw new ApiError(401, 'La sesión venció. Ingresa de nuevo.')
      this.save({ ...session, accessToken: data.accessToken, refreshToken: data.refreshToken || session.refreshToken })
    } catch (error) {
      if (this.generation === generation && error instanceof ApiError && [401, 403].includes(error.status)) this.clear()
      throw error
    } finally {
      if (this.generation === generation) this.renewing = undefined
    }
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const session = this.session
    if (!session) throw new ApiError(401, 'Inicia sesión para continuar.')
    const generation = this.generation
    const correlation = crypto.randomUUID()
    const mutation = options.method === 'POST' || options.method === 'PATCH'
    const intent = JSON.stringify([options.method, path, options.body])
    if (mutation) {
      const key = options.key || this.pendingKeys.get(intent) || crypto.randomUUID()
      options = { ...options, key }
      this.pendingKeys.set(intent, key)
      this.savePendingKeys()
    }
    try {
      let result: T
      try { result = await this.send<T>(path, options, correlation, session.accessToken) }
      catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401 || this.generation !== generation) throw error
        if (session.accessToken === this.session?.accessToken) {
          this.renewing ??= this.refresh(session, generation)
          await this.renewing
        }
        if (!this.session || this.generation !== generation) throw new ApiError(401, 'La sesión venció.')
        try { result = await this.send<T>(path, options, correlation, this.session.accessToken) }
        catch (retryError) {
          if (retryError instanceof ApiError && retryError.status === 401 && this.generation === generation) this.clear()
          throw retryError
        }
      }
      if (this.generation !== generation) throw new Error('La sesión cambió.')
      if (mutation) { this.pendingKeys.delete(intent); this.savePendingKeys() }
      return result
    } catch (error) {
      // Si la respuesta se perdió, el siguiente intento del mismo envío conserva su clave.
      if (mutation && this.generation === generation && error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 408) {
        this.pendingKeys.delete(intent)
        this.savePendingKeys()
      }
      throw error
    }
  }
}
