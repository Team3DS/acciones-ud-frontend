import test from 'node:test'
import assert from 'node:assert/strict'
import { csvText, dateInBogota, decimalUSD, filterReport, groupReport, localReport, presetPeriod, productMicros, reportCsv, summarize, usdMicros, validatePeriod } from '../src/utils/reports.ts'

const trade = (overrides = {}) => ({ id: 'demo-1', symbol: 'AAPL', name: 'Apple', side: 'Compra', price: 0.1, quantity: 3, date: '2026-10-17T15:00:00Z', ...overrides })

test('Los importes locales conservan precisión decimal', () => {
  assert.equal(productMicros('0.1', '3'), 300000n)
  assert.equal(usdMicros('-0.00012'), -120n)
  assert.equal(decimalUSD(-120n), '-0.000120')
  assert.equal(usdMicros('0.0000005'), 1n)
  assert.throws(() => usdMicros('NaN'))
})

test('El filtro incluye días completos en Bogotá y excluye las fechas adyacentes', () => {
  const data = localReport([
    trade({ id: 'before', date: '2026-10-01T04:59:59.999Z' }),
    trade({ id: 'start', date: '2026-10-01T05:00:00Z' }),
    trade({ id: 'end', date: '2026-11-01T04:59:59.999Z' }),
    trade({ id: 'after', date: '2026-11-01T05:00:00Z' }),
  ])
  assert.equal(dateInBogota('2026-10-01T04:59:59Z'), '2026-09-30')
  assert.deepEqual(filterReport(data, '2026-10-01', '2026-10-31').transactions.map(row => row.id), ['end', 'start'])
})

test('Las fechas personalizadas rechazan días inexistentes e intervalos invertidos', () => {
  assert.equal(validatePeriod('2026-10-01', '2026-10-31'), '')
  assert.ok(validatePeriod('2026-02-30', '2026-10-31'))
  assert.ok(validatePeriod('', '2026-10-31'))
  assert.ok(validatePeriod('2026-10-31', '2026-10-01'))
  assert.equal(filterReport(localReport([trade()]), '2026-10-31', '2026-10-01').transactions.length, 0)
})

test('Los períodos resuelven cambios de año y años bisiestos', () => {
  assert.deepEqual(presetPeriod('anterior', new Date('2026-01-05T12:00:00Z')), { start: '2025-12-01', end: '2025-12-31' })
  assert.deepEqual(presetPeriod('anterior', new Date('2024-03-05T12:00:00Z')), { start: '2024-02-01', end: '2024-02-29' })
  assert.deepEqual(presetPeriod('7dias', new Date('2026-01-03T12:00:00Z')), { start: '2025-12-28', end: '2026-01-03' })
})

test('Resumen y agrupación reflejan operaciones locales sin inventar comisiones', () => {
  const data = localReport([trade(), trade({ id: 'sale', side: 'Venta', price: 1, quantity: 1 })])
  assert.deepEqual(summarize(data), { count: 2, purchases: 300000n, sales: 1000000n, volume: 1300000n, charges: 0n, refunds: 0n, netFees: 0n, netCash: 700000n })
  assert.equal(groupReport(data, 'month')[0].netCash, 700000n)
  assert.equal(data.fees.length, 0)
})

test('El CSV exporta todos los registros y protege fórmulas, comillas y saltos de línea', () => {
  const data = localReport(Array.from({ length: 40 }, (_, index) => trade({ id: `local-${index}` })))
  const csv = reportCsv(data, '2026-10-01', '2026-10-31', 'Demostración local', 'transactions', 'day')
  assert.equal(csv.split('\r\n').length, 41)
  assert.ok(csv.startsWith('\ufeff'))
  assert.ok(csv.includes('America/Bogota'))
  assert.ok(csv.includes('"0.300000"'))
  assert.equal(csvText([['=HYPERLINK("bad")', 'a;b\nc', '-0.000120']]), '\ufeff"\'=HYPERLINK(""bad"")";"a;b\nc";"-0.000120"')
})
