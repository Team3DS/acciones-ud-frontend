import test from 'node:test'
import assert from 'node:assert/strict'
import { fundsError, MAX_DEPOSIT } from '../src/utils/funds.ts'

test('acepta depósitos entre USD 0,01 y el tope de M2', () => {
  assert.equal(fundsError('deposits', 0.01), null)
  assert.equal(fundsError('deposits', 250.5), null)
  assert.equal(fundsError('deposits', MAX_DEPOSIT), null)
})

test('rechaza montos vacíos, negativos o por debajo del mínimo', () => {
  for (const value of [0, -5, 0.001, Number.NaN]) assert.equal(fundsError('deposits', value), 'funds.err.min')
})

test('rechaza más de dos decimales sin falsos positivos de coma flotante', () => {
  assert.equal(fundsError('deposits', 10.123), 'funds.err.decimals')
  for (const value of [0.29, 1.15, 19.99, 4.35]) assert.equal(fundsError('deposits', value), null)
})

test('aplica el tope por depósito, no a los retiros', () => {
  assert.equal(fundsError('deposits', MAX_DEPOSIT + 0.01), 'funds.err.max')
  assert.equal(fundsError('withdrawals', MAX_DEPOSIT + 1, MAX_DEPOSIT * 2), null)
})

test('un retiro no puede superar el saldo disponible cuando se conoce', () => {
  assert.equal(fundsError('withdrawals', 100.01, 100), 'funds.err.available')
  assert.equal(fundsError('withdrawals', 100, 100), null)
  assert.equal(fundsError('withdrawals', 100), null)
})
