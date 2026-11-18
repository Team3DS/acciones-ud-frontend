import test from 'node:test'
import assert from 'node:assert/strict'
import { Gateway } from '../src/services/api.ts'

const user = { id: 42, correo: 'persona@example.test', nombres: 'Ana', roles: ['INVERSIONISTA'] }
const tokens = { accessToken: 'a1', refreshToken: 'r1' }
const ok = (body, status = 200) => new Response(body == null ? null : JSON.stringify(body), { status })
function setup(t, handler) {
  const calls = []
  const values = new Map()
  const storage = { getItem: k => values.get(k), setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) }
  t.mock.method(globalThis, 'fetch', async (url, opts) => {
    const path = new URL(url).pathname.replace('/api/v1', '')
    const request = { path, method: opts.method, headers: opts.headers, body: opts.body && JSON.parse(opts.body) }
    calls.push(request)
    assert.ok(opts.headers.get('X-Correlation-ID'))
    if (['POST', 'PATCH'].includes(opts.method)) assert.ok(opts.headers.get('Idempotency-Key'))
    if (path.startsWith('/auth/')) assert.equal(opts.headers.has('Authorization'), false)
    if (path === '/auth/login' && !handler.login) return ok({ requiresMfa: true, userId: 42 })
    if (path === '/auth/mfa/verify' && !handler.verify) return ok({ ...tokens, user })
    return handler.respond(request)
  })
  return { api: new Gateway('https://gateway.test/api/v1/', storage), storage, values, calls }
}
async function enter(api) {
  const challenge = await api.login(user.correo, 'clave')
  assert.equal(api.snapshot(), null)
  await api.verify(challenge, '012345')
}

test('v1.1 registra el DTO, espera MFA, restaura por gateway y revoca el refresh al salir', async t => {
  const { api, storage, values, calls } = setup(t, { respond: r => {
    if (r.path === '/auth/register') return ok({ id: 42, correo: user.correo }, 201)
    if (r.path === '/users/me') return ok(user)
    if (r.path === '/auth/logout') return ok({ message: 'OK' })
    throw Error('Ruta inesperada ' + r.path)
  } })
  const form = { correo: user.correo, password: 'Ejemplo123', telefono: '3001234567', tipoDocumento: 'CC', numeroDocumento: '12', nivelInversionista: 'PRINCIPIANTE', nombres: 'Ana', apellidos: 'Test', solicitaReporteMensual: true }
  await api.register(form)
  assert.deepEqual(calls[0].body, form)
  await enter(api)
  assert.deepEqual(calls[2].body, { userId: 42, code: '012345' })
  assert.deepEqual(new Gateway('https://gateway.test/api/v1', storage).snapshot().user, user)
  assert.equal(new Gateway('https://otro.test/api/v1', storage).snapshot(), null)
  await api.request('/users/me')
  assert.equal(calls.at(-1).headers.get('Authorization'), 'Bearer a1')
  await api.logout()
  assert.deepEqual(calls.at(-1).body, { userId: 42, refreshToken: 'r1' })
  assert.equal(values.size, 0)
})

test('main recibe celular y sus tokens iniciales solo abren una sesión después de verified=true', async t => {
  let verified = false
  const { api, calls, values } = setup(t, { login: true, verify: true, respond: r => {
    if (r.path === '/auth/register') return ok({ id: 42, correo: user.correo })
    if (r.path === '/auth/login') return ok({ ...tokens, userId: '42' })
    return ok({ verified })
  } })
  await api.register({ telefono: '123', solicitaReporteMensual: true }, true)
  assert.deepEqual(calls[0].body, { celular: '123' })
  const challenge = await api.login(user.correo, 'clave')
  await assert.rejects(api.verify(challenge, '000000'), /incorrecto/)
  assert.equal(values.size, 0)
  await assert.rejects(api.request('/users/me'), /Inicia sesión/)
  verified = true
  await api.verify(challenge, '012345')
  assert.equal(api.snapshot().user.id, 42)
  assert.equal(api.snapshot().accessToken, 'a1')
})

test('dos peticiones con 401 comparten refresh y conservan las cabeceras de cada operación', async t => {
  let refreshCalls = 0
  const { api, calls } = setup(t, { respond: async r => {
    if (r.path === '/auth/refresh') {
      refreshCalls++
      assert.deepEqual(r.body, { userId: 42, refreshToken: 'r1' })
      await new Promise(resolve => setTimeout(resolve, 15))
      return ok({ accessToken: 'a2' })
    }
    if (r.headers.get('Authorization') === 'Bearer a1') return ok({}, 401)
    return ok(null, 204)
  } })
  await enter(api)
  await Promise.all([api.request('/orders', { method: 'POST', body: { qty: 2 } }), api.request('/notifications/5/read', { method: 'PATCH' })])
  assert.equal(refreshCalls, 1)
  for (const path of ['/orders', '/notifications/5/read']) {
    const pair = calls.filter(r => r.path === path)
    assert.equal(pair.length, 2)
    assert.equal(pair[1].headers.get('Authorization'), 'Bearer a2')
    for (const header of ['Idempotency-Key', 'X-Correlation-ID']) assert.equal(pair[0].headers.get(header), pair[1].headers.get(header))
  }
})

test('errores inciertos conservan la clave de envío y un éxito permite otra operación idéntica', async t => {
  let failed = false
  const { api, calls, storage } = setup(t, { respond: () => {
    if (!failed) { failed = true; throw new TypeError('connection lost') }
    return ok({ orderId: 17 }, 201)
  } })
  await enter(api)
  const options = { method: 'POST', body: { symbol: 'AAPL', side: 'BUY', type: 'MARKET', qty: 3 } }
  await assert.rejects(api.request('/orders', options), /conexión/)
  const restored = new Gateway('https://gateway.test/api/v1', storage)
  await restored.request('/orders', options)
  await restored.request('/orders', options)
  const keys = calls.filter(r => r.path === '/orders').map(r => r.headers.get('Idempotency-Key'))
  assert.equal(keys[0], keys[1])
  assert.notEqual(keys[1], keys[2])
})

test('ProblemDetail conserva el mensaje y el seguimiento, y un 403 de negocio conserva la sesión', async t => {
  const { api } = setup(t, { respond: () => ok({ detail: 'Se requiere rol administrador', traceId: 'trace-42' }, 403) })
  await enter(api)
  await assert.rejects(api.request('/funds/deposits', { method: 'POST' }), /administrador.*trace-42/)
  assert.equal(api.snapshot().user.id, 42)
})

test('un refresh revocado cierra la sesión sin reintentar la operación', async t => {
  const { api, calls } = setup(t, { respond: () => ok({ message: 'Sesión vencida' }, 401) })
  await enter(api)
  await assert.rejects(api.request('/orders'), /Sesión vencida/)
  assert.equal(api.snapshot(), null)
  assert.equal(calls.filter(r => r.path === '/orders').length, 1)
})

test('un refresh en vuelo no restaura una sesión cerrada', async t => {
  const started = Promise.withResolvers()
  const pending = Promise.withResolvers()
  const { api } = setup(t, { respond: async r => {
    if (r.path === '/auth/refresh') { started.resolve(); return pending.promise }
    if (r.path === '/auth/logout') return ok(null, 204)
    return ok({}, 401)
  } })
  await enter(api)
  const order = api.request('/orders')
  await started.promise
  await api.logout()
  pending.resolve(ok({ accessToken: 'late' }))
  await assert.rejects(order, /sesión cambió/)
  assert.equal(api.snapshot(), null)
})
