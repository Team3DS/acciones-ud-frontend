export const assets = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 227.63, change: 1.24, color: '#303632', letter: '●' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 135.72, change: 2.81, color: '#76a626', letter: 'N' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 428.76, change: 0.86, color: '#5174c7', letter: '▦' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: 248.50, change: -0.74, color: '#c95755', letter: 'T' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 189.25, change: 1.12, color: '#bf873e', letter: 'a' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 158.40, change: -0.31, color: '#c95755', letter: 'J' },
  { symbol: 'JPM', name: 'JPMorgan Chase', price: 214.60, change: 0.44, color: '#5174c7', letter: 'J' },
  { symbol: 'XOM', name: 'Exxon Mobil', price: 117.85, change: -1.18, color: '#bf873e', letter: 'X' },
  { symbol: 'META', name: 'Meta Platforms', price: 582.30, change: 0.92, color: '#5174c7', letter: 'M' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 165.80, change: 0.57, color: '#497a62', letter: 'G' },
]
export const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value)
