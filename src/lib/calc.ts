import type { Sale, SaleLine, Product } from './types'

export function lineTotal(l: SaleLine): number {
  return l.qty * l.price * (1 - (l.discountPct || 0) / 100)
}

export function saleSubtotal(lines: SaleLine[]): number {
  return lines.reduce((a, l) => a + lineTotal(l), 0)
}

export function saleTotal(sale: Pick<Sale, 'lines' | 'orderDiscountPct'>): number {
  return saleSubtotal(sale.lines) * (1 - (sale.orderDiscountPct || 0) / 100)
}

export function saleCost(sale: Pick<Sale, 'lines'>, productForSku: (sku: string) => Product | undefined): number {
  return sale.lines.reduce((a, l) => {
    const p = productForSku(l.sku)
    return a + l.qty * (p?.cost ?? 0)
  }, 0)
}

/**
 * Change due, in the currency whose tender produced the overpayment: if the dinars
 * handed over are at least as large as the excess, change goes back in dinars (whole
 * dinars — there are no smaller notes); otherwise the excess came from the dollars.
 * Returns null when nothing (or less than a cent / a dinar) is owed back.
 */
export function computeChange(total: number, payUsd: number, payLyd: number, fxRate: number): { currency: 'USD' | 'LYD'; amount: number } | null {
  const over = payUsd + payLyd / fxRate - total
  if (over <= 0.005) return null
  if (payLyd / fxRate >= over - 0.005) {
    const lyd = Math.round(over * fxRate)
    return lyd > 0 ? { currency: 'LYD', amount: lyd } : null
  }
  const usd = Math.round(over * 100) / 100
  return usd > 0 ? { currency: 'USD', amount: usd } : null
}
