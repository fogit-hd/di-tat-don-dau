/** Public form uses billions; API/storage use millions. Accept either decimal separator. */
export function parseCapitalBillions(raw: string): number | null {
  const text = raw.trim()
  if (!/^\d+(?:[.,]\d)?$/.test(text)) return null
  const billions = Number(text.replace(',', '.'))
  return billions >= 2 && billions <= 100 ? Math.round(billions * 1000) : null
}
