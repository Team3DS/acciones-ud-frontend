import test from 'node:test'
import assert from 'node:assert/strict'
import { illustrativeSeries } from '../src/utils/marketSeries.ts'

test('Cambiar el período produce una serie ilustrativa distinta y conserva el precio de referencia', () => {
  const daily = illustrativeSeries(227.63, 'AAPL', '1D')
  const monthly = illustrativeSeries(227.63, 'AAPL', '1M')
  assert.equal(daily.length, 36)
  assert.notDeepEqual(daily, monthly)
  assert.equal(daily.at(-1), 227.63)
  assert.equal(monthly.at(-1), 227.63)
  assert.ok(daily.every(value => Number.isFinite(value) && value > 0))
})

test('La serie es estable al volver a la misma acción y no fabrica actualizaciones de precio', () => {
  const original = illustrativeSeries(135.72, 'NVDA', '1S', 16)
  illustrativeSeries(248.5, 'TSLA', '1S', 16)
  assert.deepEqual(illustrativeSeries(135.72, 'NVDA', '1S', 16), original)
  assert.equal(original.at(-1), 135.72)
  assert.throws(() => illustrativeSeries(NaN, 'NVDA', '1D'))
  assert.throws(() => illustrativeSeries(135.72, 'NVDA', '1D', 1))
})
