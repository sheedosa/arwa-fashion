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
