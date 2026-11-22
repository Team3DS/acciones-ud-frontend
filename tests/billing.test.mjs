import test from 'node:test'
import assert from 'node:assert/strict'
import { annualSavings, isStripeCheckout, safeLink } from '../src/utils/billing.ts'

test('solo acepta enlaces de Stripe Checkout por HTTPS', () => {
  assert.equal(isStripeCheckout('https://checkout.stripe.com/c/pay/cs_test_123'), true)
  for (const value of ['http://checkout.stripe.com/c/pay', 'https://checkout.stripe.com.evil.co/x', 'https://evil.co/?u=checkout.stripe.com', 'javascript:alert(1)', '', undefined, null])
    assert.equal(isStripeCheckout(value), false, String(value))
})

test('los recibos solo se enlazan por HTTPS', () => {
  assert.equal(safeLink('https://pay.stripe.com/receipts/abc'), 'https://pay.stripe.com/receipts/abc')
  assert.equal(safeLink('http://pay.stripe.com/receipts/abc'), null)
  assert.equal(safeLink('javascript:alert(1)'), null)
  assert.equal(safeLink(undefined), null)
})

test('calcula el ahorro del plan anual', () => {
  assert.equal(annualSavings([{ interval: 'MENSUAL', amount: 10 }, { interval: 'ANUAL', amount: 100 }]), 17)
  assert.equal(annualSavings([{ interval: 'MENSUAL', amount: '9.99' }, { interval: 'ANUAL', amount: '99.90' }]), 17)
  assert.equal(annualSavings([{ interval: 'MENSUAL', amount: 10 }]), null)
  assert.equal(annualSavings([{ interval: 'MENSUAL', amount: 10 }, { interval: 'ANUAL', amount: 130 }]), null)
})
