/** Deterministic display data. It never updates quotes, balances or orders. */
export function illustrativeSeries(price: number, symbol: string, period: string, count = 36): number[] {
  if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(count) || count < 2) throw new RangeError('La serie necesita un precio positivo y al menos dos puntos.')
  const seed = [...symbol + period].reduce((sum, letter) => sum + letter.charCodeAt(0), 0)
  const amplitude = period === '1D' ? .012 : period === '1S' ? .025 : period === '1M' ? .045 : .085
  return Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1)
    const wave = Math.sin(index * .76 + seed) * .29 + Math.sin(index * 1.83 + seed / 3) * .12
    return Math.round(price * (1 + amplitude * ((progress - 1) * .7 + wave * Math.sin(progress * Math.PI))) * 100) / 100
  })
}
