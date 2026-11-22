export type FundsOperation = 'deposits' | 'withdrawals'

/** Tope de M2 para cada depósito (`RegistrarDepositoUseCase.LIMITE_MAXIMO_DEPOSITO`). */
export const MAX_DEPOSIT = 1_000_000
/** Mínimo de M2 para depósitos y retiros (`@DecimalMin("0.01")`). */
export const MIN_AMOUNT = 0.01

/** Valida un monto antes de enviarlo a M2. Devuelve la clave de texto del error o null si es válido. */
export function fundsError(operation: FundsOperation, value: number, available?: number): string | null {
  if (!Number.isFinite(value) || value < MIN_AMOUNT) return 'funds.err.min'
  if (Math.abs(Math.round(value * 100) - value * 100) > 1e-6) return 'funds.err.decimals'
  if (operation === 'deposits' && value > MAX_DEPOSIT) return 'funds.err.max'
  if (operation === 'withdrawals' && available !== undefined && Number.isFinite(available) && value > available) return 'funds.err.available'
  return null
}
