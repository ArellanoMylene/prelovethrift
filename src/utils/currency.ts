export const FREE_SHIPPING_THRESHOLD = 2900
export const STANDARD_SHIPPING = 261

export function shippingFor(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING
}

export function formatPeso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString('en-PH')}`
}
