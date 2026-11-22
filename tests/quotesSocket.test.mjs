import test from 'node:test'
import assert from 'node:assert/strict'
import { quotesSocketUrl } from '../src/services/quotesSocket.ts'

const page = 'https://accionesud.dpdns.org/app/'

test('sin variable usa la ruta del gateway con wss en HTTPS', () => {
  assert.equal(quotesSocketUrl(undefined, undefined, page), 'wss://accionesud.dpdns.org/api/v1/market/ws/quotes/websocket')
  assert.equal(quotesSocketUrl('', '', 'http://127.0.0.1:5173/'), 'ws://127.0.0.1:5173/api/v1/market/ws/quotes/websocket')
})

test('respeta una base del gateway en otro origen', () => {
  assert.equal(quotesSocketUrl(undefined, 'https://api.ejemplo.edu/api/v1/', page), 'wss://api.ejemplo.edu/api/v1/market/ws/quotes/websocket')
})

test('usa la URL configurada cuando existe', () => {
  assert.equal(quotesSocketUrl('/otro/ws', undefined, page), 'wss://accionesud.dpdns.org/otro/ws')
  assert.equal(quotesSocketUrl('ws://localhost:8084/market/ws/quotes/websocket', undefined, page), 'ws://localhost:8084/market/ws/quotes/websocket')
})

test('off desactiva la conexión y otros protocolos se ignoran', () => {
  assert.equal(quotesSocketUrl('off', undefined, page), null)
  assert.equal(quotesSocketUrl(' OFF ', undefined, page), null)
  assert.equal(quotesSocketUrl('ftp://x/ws', undefined, page), null)
})
