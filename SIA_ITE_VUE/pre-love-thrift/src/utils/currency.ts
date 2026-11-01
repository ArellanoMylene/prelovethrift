export const USD_TO_PHP = 58

export function toPeso(amount: number): number {
  return Math.round(amount * USD_TO_PHP)
}

export function formatPeso(amount: number): string {
  return `₱${toPeso(amount).toLocaleString('en-PH')}`
}
