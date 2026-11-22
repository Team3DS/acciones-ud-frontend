import test from 'node:test'
import assert from 'node:assert/strict'
import { isCancelable, needsQueueConfirmation, orderError, orderEstimate, orderRequest, sideOf } from '../src/utils/orders.ts'

const base = { symbol: 'AAPL', side: 'BUY', quantity: 10, type: 'MARKET', timeInForce: 'DIA' }

test('arma la orden de mercado con el contrato de M5', () => {
  assert.deepEqual(orderRequest({ ...base, referencePrice: 228.4, instrumentId: 3 }),
    { ticker: 'AAPL', lado: 'COMPRA', tipo: 'MARKET', vigencia: 'DIA', cantidad: 10, precioEstimado: 228.4, accionId: 3 })
  assert.deepEqual(orderRequest(base), { ticker: 'AAPL', lado: 'COMPRA', tipo: 'MARKET', vigencia: 'DIA', cantidad: 10 })
})

test('límite usa precioLimite; stop loss y take profit usan precioActivacion', () => {
  const limit = orderRequest({ ...base, side: 'SELL', type: 'LIMIT', threshold: 150, timeInForce: 'HASTA_CANCELACION' })
  assert.equal(limit.lado, 'VENTA'); assert.equal(limit.precioLimite, 150); assert.equal(limit.precioEstimado, 150)
  assert.equal(limit.vigencia, 'HASTA_CANCELACION'); assert.equal('precioActivacion' in limit, false)
  for (const type of ['STOP_LOSS', 'TAKE_PROFIT']) {
    const order = orderRequest({ ...base, side: 'SELL', type, threshold: 140 })
    assert.equal(order.precioActivacion, 140); assert.equal('precioLimite' in order, false)
  }
})

test('valida símbolo, cantidad y precio', () => {
  assert.equal(orderError(base), null)
  assert.equal(orderError({ ...base, symbol: '' }), 'ord.err.symbol')
  assert.equal(orderError({ ...base, symbol: 'aapl' }), 'ord.err.symbol')
  for (const quantity of [0, -1, 1.5, Number.NaN]) assert.equal(orderError({ ...base, quantity }), 'ord.err.quantity')
  assert.equal(orderError({ ...base, type: 'LIMIT' }), 'ord.err.price')
  assert.equal(orderError({ ...base, type: 'STOP_LOSS', threshold: 0 }), 'ord.err.price')
  assert.equal(orderError({ ...base, type: 'LIMIT', threshold: 10 }), null)
})

test('estados que se pueden cancelar o que esperan confirmar el encolamiento', () => {
  for (const status of ['PENDIENTE', 'ENVIADA', 'PARCIALMENTE_EJECUTADA']) assert.equal(isCancelable({ status }), true)
  for (const status of ['EJECUTADA', 'CANCELADA', 'RECHAZADA', 'EXPIRADA', 'FALLIDA']) assert.equal(isCancelable({ status }), false)
  assert.equal(needsQueueConfirmation({ status: 'PENDIENTE', requiresQueuing: true, confirmedQueuingAt: null }), true)
  assert.equal(needsQueueConfirmation({ status: 'PENDIENTE', requiresQueuing: true, confirmedQueuingAt: '2026-11-22T14:00:00Z' }), false)
  assert.equal(needsQueueConfirmation({ status: 'ENVIADA', requiresQueuing: true }), false)
})

test('traduce el lado y estima el monto', () => {
  assert.equal(sideOf('VENTA'), 'SELL'); assert.equal(sideOf('COMPRA'), 'BUY'); assert.equal(sideOf('sell'), 'SELL')
  assert.equal(orderEstimate({ quantity: 10, type: 'MARKET', referencePrice: 2.5 }), 25)
  assert.equal(orderEstimate({ quantity: 2, type: 'LIMIT', threshold: 100 }), 200)
  assert.equal(orderEstimate({ quantity: 2, type: 'MARKET' }), null)
})
