export type Interval = 'MENSUAL' | 'ANUAL'

/** Solo se redirige a páginas de Stripe Checkout (evita abrir un enlace arbitrario devuelto por el servicio). */
export function isStripeCheckout(value: string | undefined | null): value is string {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com'
  } catch { return false }
}

/** Enlaces de recibos de Stripe: solo HTTPS. Devuelve null si el enlace no es seguro. */
export function safeLink(value: string | undefined | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : null
  } catch { return null }
}

/** Porcentaje que ahorra el plan anual frente a 12 meses del mensual, redondeado. Null si no aplica. */
export function annualSavings(prices: { interval: Interval; amount: number | string }[]): number | null {
  const monthly = Number(prices.find(p => p.interval === 'MENSUAL')?.amount)
  const annual = Number(prices.find(p => p.interval === 'ANUAL')?.amount)
  if (!(monthly > 0) || !(annual > 0)) return null
  const percent = Math.round((1 - annual / (monthly * 12)) * 100)
  return percent > 0 ? percent : null
}
