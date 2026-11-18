import test from 'node:test'
import assert from 'node:assert/strict'
import es from '../src/i18n/es.json' with { type: 'json' }
import en from '../src/i18n/en.json' with { type: 'json' }

const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()

test('Español e inglés tienen exactamente las mismas claves', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(es).sort())
})

test('Ningún texto queda vacío y las variables coinciden en ambos idiomas', () => {
  for (const key of Object.keys(es)) {
    assert.ok(es[key].trim(), `es.${key} está vacío`)
    assert.ok(en[key].trim(), `en.${key} está vacío`)
    assert.deepEqual(placeholders(en[key]), placeholders(es[key]), `Variables distintas en ${key}`)
  }
})
