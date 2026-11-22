/** Contrato de M5 (OrdenController): tipos, lados, vigencias y estados en español. */
export type Side = 'BUY' | 'SELL'
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT'
export type TimeInForce = 'DIA' | 'HASTA_CANCELACION'

export const ORDER_TYPES: OrderType[] = ['MARKET', 'LIMIT', 'STOP_LOSS', 'TAKE_PROFIT']
export const ORDER_STATUSES = ['PENDIENTE', 'ENVIADA', 'FIRMADA_COMISIONISTA', 'EN_EJECUCION', 'PARCIALMENTE_EJECUTADA',
  'EJECUTADA', 'CANCELADA', 'RECHAZADA', 'EXPIRADA', 'EN_REVISION', 'FALLIDA', 'DETENIDA'] as const

/** Estados en los que la orden sigue viva y M5 permite cancelarla. */
const CANCELABLE = new Set(['PENDIENTE', 'ENVIADA', 'FIRMADA_COMISIONISTA', 'EN_EJECUCION', 'PARCIALMENTE_EJECUTADA', 'EN_REVISION', 'DETENIDA'])

export interface OrderDetail {
  id: number; symbol: string; side: string; type: string; timeInForce?: string; status: string
  quantity: number; executedQuantity?: number; remainingQuantity?: number
  limitPrice?: number | null; stopPrice?: number | null; estimatedPrice?: number | null
  requiresQueuing?: boolean | null; confirmedQueuingAt?: string | null; createdAt?: string; updatedAt?: string
}

export interface OrderInput {
  symbol: string; side: Side; quantity: number; type: OrderType; timeInForce: TimeInForce
  threshold?: number; referencePrice?: number; instrumentId?: number
}

export const isCancelable = (order: Pick<OrderDetail, 'status'>) => CANCELABLE.has(order.status)
export const needsQueueConfirmation = (order: Pick<OrderDetail, 'status' | 'requiresQueuing' | 'confirmedQueuingAt'>) =>
  order.status === 'PENDIENTE' && !!order.requiresQueuing && !order.confirmedQueuingAt
/** COMPRA/VENTA de M5 (o BUY/SELL) al lado de la interfaz. */
export const sideOf = (value: string): Side => /^(VENTA|SELL)$/i.test(value) ? 'SELL' : 'BUY'
export const needsThreshold = (type: OrderType) => type !== 'MARKET'

/** Valida la orden. Devuelve la clave del error o null. */
export function orderError(input: OrderInput): string | null {
  if (!/^[A-Z][A-Z0-9.]{0,9}$/.test(input.symbol)) return 'ord.err.symbol'
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) return 'ord.err.quantity'
  if (needsThreshold(input.type) && !(Number(input.threshold) > 0)) return 'ord.err.price'
  return null
}

/** Cuerpo de POST /orders que espera CrearOrdenRequest de M5. */
export function orderRequest(input: OrderInput) {
  const threshold = needsThreshold(input.type) ? Number(input.threshold) : undefined
  const estimate = input.type === 'MARKET' ? input.referencePrice : threshold
  return {
    ticker: input.symbol,
    lado: input.side === 'BUY' ? 'COMPRA' : 'VENTA',
    tipo: input.type,
    vigencia: input.timeInForce,
    cantidad: input.quantity,
    ...(input.type === 'LIMIT' ? { precioLimite: threshold } : {}),
    ...(input.type === 'STOP_LOSS' || input.type === 'TAKE_PROFIT' ? { precioActivacion: threshold } : {}),
    ...(estimate != null && estimate > 0 ? { precioEstimado: estimate } : {}),
    ...(input.instrumentId != null ? { accionId: input.instrumentId } : {}),
  }
}

/** Monto aproximado de la orden antes de comisión, para mostrarlo en el formulario. */
export function orderEstimate(input: Pick<OrderInput, 'quantity' | 'type' | 'threshold' | 'referencePrice'>): number | null {
  const price = input.type === 'MARKET' ? input.referencePrice : input.threshold
  return Number.isSafeInteger(input.quantity) && input.quantity > 0 && Number(price) > 0 ? input.quantity * Number(price) : null
}
