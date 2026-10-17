// Las órdenes solo pueden salir al entorno paper. No se admite una URL configurable.
export const PAPER_URL = 'https://paper-api.alpaca.markets'
export const SYMBOLS = Object.freeze({ JNJ: 'NYSE', JPM: 'NYSE', XOM: 'NYSE', AAPL: 'NASDAQ', MSFT: 'NASDAQ', GOOGL: 'NASDAQ', AMZN: 'NASDAQ', META: 'NASDAQ', TSLA: 'NASDAQ', NVDA: 'NASDAQ' })
export const TERMINAL = new Set(['filled', 'canceled', 'expired', 'rejected', 'replaced', 'done_for_day'])
export class ApiError extends Error {
  constructor(status, message, code = 'BROKER_ERROR') { super(message); this.status = status; this.code = code }
}

export function createBroker({ env = process.env, fetcher = fetch, now = Date.now, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const key = env.ALPACA_API_KEY
  const secret = env.ALPACA_SECRET_KEY
  const feed = env.ALPACA_DATA_FEED === 'sip' ? 'sip' : 'iex'
  const inFlight = new Map()
  const ambiguous = new Set()
  const configured = Boolean(key && secret)
  function requireConfig() { if (!configured) throw new ApiError(503, 'Configura las claves de Alpaca Paper en el archivo .env del servidor.', 'NOT_CONFIGURED') }
  async function json(url, options = {}, timeout = 1400, alpaca = true) {
    let response
    try {
      response = await fetcher(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(Math.max(1, timeout)), headers: { Accept: 'application/json', ...(alpaca ? { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } : {}), ...options.headers } })
    } catch { throw new ApiError(504, 'El proveedor no respondió a tiempo. Consulta el estado antes de intentar otra operación.', 'PROVIDER_TIMEOUT') }
    if (!response.ok) {
      // No devolver respuestas crudas ni claves del proveedor al navegador.
      const messages = { 401: 'Alpaca rechazó las credenciales de paper trading.', 403: 'Tu cuenta no tiene permiso para este recurso o feed.', 404: 'No se encontró el recurso solicitado.', 422: 'Alpaca rechazó la orden. Revisa saldo, activo y restricciones de tu cuenta.', 429: 'El proveedor alcanzó su límite de consultas. Espera antes de actualizar.' }
      throw new ApiError(response.status === 404 ? 404 : 502, messages[response.status] || 'No se pudo consultar el proveedor.', `PROVIDER_${response.status}`)
    }
    try { return await response.json() } catch { throw new ApiError(502, 'El proveedor devolvió una respuesta inválida.') }
  }
  const paper = (path, options, timeout) => { requireConfig(); return json(`${PAPER_URL}/v2${path}`, options, timeout) }
  function validateSymbol(symbol) { if (!Object.hasOwn(SYMBOLS, symbol)) throw new ApiError(400, 'Elige un activo NYSE o NASDAQ disponible.', 'INVALID_SYMBOL') }
  function normalizeOrder(order) {
    return { id: order.id, clientOrderId: order.client_order_id, symbol: order.symbol, side: order.side, quantity: Number(order.qty), filledQuantity: Number(order.filled_qty || 0), filledPrice: order.filled_avg_price === null ? null : Number(order.filled_avg_price), status: order.status, submittedAt: order.submitted_at, filledAt: order.filled_at }
  }
  async function findOrder(id) {
    if (!/^soltech-[a-f0-9-]{36}$/.test(id)) throw new ApiError(400, 'Identificador de orden inválido.')
    try { return normalizeOrder(await paper(`/orders:by_client_order_id?client_order_id=${encodeURIComponent(id)}`)) }
    catch (err) { if (err.code === 'PROVIDER_404') return null; throw err }
  }
  async function quote(symbol, timeout = 1400) {
    requireConfig(); validateSymbol(symbol)
    try {
      const data = await json(`https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest?feed=${feed}`, {}, timeout)
      const q = data.quote
      if (!q || !(q.ap > 0) || !(q.bp > 0) || !Number.isFinite(Date.parse(q.t))) throw new ApiError(502, 'No hay una cotización válida de Alpaca para este activo.')
      const age = now() - Date.parse(q.t)
      return { symbol, exchange: SYMBOLS[symbol], ask: q.ap, bid: q.bp, last: null, timestamp: q.t, source: `Alpaca ${feed.toUpperCase()}`, stale: age > 90000 || age < -5000, indicative: false }
    } catch (err) {
      if (!env.FINNHUB_API_KEY) throw err
      const data = await json(`https://finnhub.io/api/v1/quote?symbol=${symbol}`, { headers: { 'X-Finnhub-Token': env.FINNHUB_API_KEY } }, Math.min(timeout, 1000), false)
      if (!(data.c > 0) || !(data.t > 0)) throw new ApiError(502, 'El proveedor de respaldo no tiene una cotización válida.')
      const age = now() - data.t * 1000
      return { symbol, exchange: SYMBOLS[symbol], ask: null, bid: null, last: data.c, timestamp: new Date(data.t * 1000).toISOString(), source: 'Finnhub · respaldo', stale: age > 90000 || age < -5000, indicative: true }
    }
  }
  async function snapshot() {
    const [account, positions, orders, clock] = await Promise.all([paper('/account'), paper('/positions'), paper('/orders?status=all&limit=100&direction=desc'), paper('/clock')])
    return {
      account: { id: account.id, number: account.account_number, cash: Number(account.cash), buyingPower: Number(account.buying_power), equity: Number(account.equity), blocked: Boolean(account.trading_blocked || account.account_blocked || account.trade_suspended_by_user), status: account.status },
      positions: positions.map(p => ({ symbol: p.symbol, quantity: Number(p.qty), available: Number(p.qty_available ?? p.qty), averagePrice: Number(p.avg_entry_price), currentPrice: Number(p.current_price), marketValue: Number(p.market_value), unrealizedPL: Number(p.unrealized_pl) })),
      orders: orders.map(normalizeOrder), clock: { isOpen: clock.is_open, timestamp: clock.timestamp, nextOpen: clock.next_open, nextClose: clock.next_close }, updatedAt: new Date(now()).toISOString(),
    }
  }
  function validateRequest(input) {
    if (!input || typeof input !== 'object') throw new ApiError(400, 'Orden inválida.')
    validateSymbol(input.symbol)
    if (!Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity > 100000 || !['buy', 'sell'].includes(input.side) || !/^soltech-[a-f0-9-]{36}$/.test(input.clientOrderId)) throw new ApiError(400, 'Cantidad, operación o identificador inválidos.')
  }
  async function submit(input) {
    requireConfig(); validateRequest(input)
    const signature = JSON.stringify([input.symbol, input.quantity, input.side])
    if (inFlight.has(input.clientOrderId)) {
      const existing = inFlight.get(input.clientOrderId)
      if (existing.signature !== signature) throw new ApiError(409, 'Ese identificador corresponde a otra operación.')
      return existing.promise
    }
    const promise = place(input)
    inFlight.set(input.clientOrderId, { signature, promise })
    try { return await promise } finally { inFlight.delete(input.clientOrderId) }
  }
  async function place(input) {
    const started = now()
    const previous = await findOrder(input.clientOrderId)
    if (previous) {
      if (previous.symbol !== input.symbol || previous.quantity !== input.quantity || previous.side !== input.side) throw new ApiError(409, 'Ese identificador corresponde a otra operación.')
      return { order: previous, clientOrderId: input.clientOrderId, elapsedMs: now() - started, uncertain: false }
    }
    if (ambiguous.has(input.clientOrderId)) return { order: null, clientOrderId: input.clientOrderId, elapsedMs: now() - started, uncertain: true }
    // En paralelo: reloj oficial (festivos y horario de verano), cuenta y activo.
    const [clock, account, asset] = await Promise.all([paper('/clock', {}, 900), paper('/account', {}, 900), paper(`/assets/${input.symbol}`, {}, 900)])
    if (!clock.is_open) throw new ApiError(409, 'El mercado está cerrado. Opera durante la sesión regular: 9:30–16:00, hora de Nueva York.', 'MARKET_CLOSED')
    if (account.status !== 'ACTIVE' || account.trading_blocked || account.account_blocked || account.trade_suspended_by_user) throw new ApiError(409, 'La cuenta de Alpaca no está habilitada para operar.', 'ACCOUNT_BLOCKED')
    if (!asset.tradable || asset.status !== 'active' || asset.class !== 'us_equity' || !['NYSE', 'NASDAQ'].includes(asset.exchange)) throw new ApiError(409, 'Este activo no está habilitado para operar en NYSE o NASDAQ.', 'ASSET_BLOCKED')
    if (input.side === 'buy') {
      const q = await quote(input.symbol, 800)
      if (q.stale) throw new ApiError(409, 'La cotización está desactualizada. Actualízala antes de comprar.', 'STALE_QUOTE')
      const estimate = (q.ask ?? q.last) * input.quantity
      // Validación conservadora con efectivo y poder de compra; Alpaca decide la aceptación final.
      const available = Math.min(Number(account.cash), Number(account.buying_power))
      if (!Number.isFinite(available) || available < estimate * 1.03) throw new ApiError(409, 'Fondos insuficientes: se requiere el importe estimado más un margen del 3 % por variación del precio.', 'INSUFFICIENT_FUNDS')
    } else {
      const positions = await paper('/positions', {}, 800)
      const position = positions.find(p => p.symbol === input.symbol)
      if (!position || Number(position.qty_available ?? position.qty) < input.quantity) throw new ApiError(409, 'No tienes suficientes acciones disponibles. No se permiten ventas en corto.', 'INSUFFICIENT_POSITION')
    }
    const remaining = 4300 - (now() - started)
    if (remaining < 300) throw new ApiError(504, 'Las comprobaciones tardaron demasiado. No se envió ninguna orden.', 'PREFLIGHT_TIMEOUT')
    let order
    try {
      order = normalizeOrder(await paper('/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: input.symbol, qty: String(input.quantity), side: input.side, type: 'market', time_in_force: 'day', extended_hours: false, client_order_id: input.clientOrderId }) }, Math.min(remaining, 1200)))
    } catch (err) {
      if (err.code === 'PROVIDER_TIMEOUT' || err.code === 'BROKER_ERROR' || /^PROVIDER_5/.test(err.code)) {
        ambiguous.add(input.clientOrderId)
        return { order: null, clientOrderId: input.clientOrderId, elapsedMs: now() - started, uncertain: true }
      }
      throw err
    }
    // Confirmación rápida cuando Alpaca ya reporta ejecución; de otro modo, seguimiento en el cliente.
    while (!TERMINAL.has(order.status) && now() - started < 3200) {
      await sleep(200)
      try { order = await findOrder(input.clientOrderId) || order } catch { break }
    }
    return { order, clientOrderId: input.clientOrderId, elapsedMs: now() - started, uncertain: false }
  }
  async function activities(pageToken = '') {
    if (typeof pageToken !== 'string' || pageToken.length > 256 || /[\u0000-\u001f]/.test(pageToken)) throw new ApiError(400, 'El cursor del historial no es válido.')
    const params = new URLSearchParams({ activity_types: 'FILL,FEE,DIVFEE,PTC,PTR', direction: 'desc', page_size: '100' })
    if (pageToken) params.set('page_token', pageToken)
    const rows = await paper(`/account/activities?${params}`)
    if (!Array.isArray(rows) || rows.length > 100 || rows.some(row => !row || typeof row.id !== 'string' || typeof row.activity_type !== 'string')) throw new ApiError(502, 'Alpaca devolvió un historial inválido.')
    const nextPageToken = rows.length === 100 ? rows.at(-1).id : null
    if (nextPageToken && nextPageToken === pageToken) throw new ApiError(502, 'Alpaca repitió una página del historial. No se puede confirmar que el reporte esté completo.')
    return { activities: rows.map(a => ({ id: a.id, activity_type: a.activity_type, transaction_time: a.transaction_time, date: a.date, symbol: a.symbol, side: a.side, qty: a.qty, price: a.price, order_id: a.order_id, net_amount: a.net_amount, description: a.description, currency: a.currency })), nextPageToken }
  }
  return { configured, feed, snapshot, quote, submit, findOrder, activities }
}
