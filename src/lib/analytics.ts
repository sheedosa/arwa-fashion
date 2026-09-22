import type { BranchId, Product, Sale, Variant, InventoryMap, StockMovement } from './types'
import { MONTH_BASELINE, BASELINE_UNITS_BY_STYLE, BASELINE_SELLER_SHARE, todayStr } from './mockData'
import { saleTotal, saleCost, lineTotal } from './calc'

/** Longest-code prefix match: `ARW-1101-A-S-BLK` belongs to ARW-1101-A, not ARW-1101. */
function productForSku(products: Product[], sku: string) {
  let best: Product | undefined
  for (const p of products) if (sku.startsWith(p.code + '-') && (!best || p.code.length > best.code.length)) best = p
  return best
}

/** The reporting window is the current calendar month: live receipts dated this month
 *  plus the seeded month-to-date baseline. Every "month" figure uses this one filter. */
export function monthSales(sales: Sale[], queue: Sale[]): Sale[] {
  const ym = todayStr().slice(0, 7)
  return [...sales, ...queue].filter((s) => s.date.startsWith(ym))
}

const baselineRevenue = (products: Product[]) => products.reduce((a, p) => a + (BASELINE_UNITS_BY_STYLE[p.code] || 0) * p.price, 0)
const baselineUnits = () => Object.values(BASELINE_UNITS_BY_STYLE).reduce((a, n) => a + n, 0)

export function todayKpis(sales: Sale[], queue: Sale[]) {
  const td = todayStr()
  const todayAll = [...sales, ...queue].filter((s) => s.date === td)
  const totalSales = todayAll.reduce((a, s) => a + saleTotal(s), 0)
  const totalUnits = todayAll.reduce((a, s) => a + s.lines.reduce((x, l) => x + l.qty, 0), 0)
  return { totalSales, totalUnits, receipts: todayAll.length }
}

export function monthTotals(sales: Sale[], queue: Sale[], products: Product[]) {
  const byBranch = {} as Record<BranchId, { revenue: number; cost: number; units: number }>
  ;(['tr', 'bn', 'ms'] as BranchId[]).forEach((id) => {
    byBranch[id] = { revenue: MONTH_BASELINE[id].sales, cost: MONTH_BASELINE[id].cost, units: MONTH_BASELINE[id].units }
  })
  monthSales(sales, queue).forEach((s) => {
    const row = byBranch[s.branchId]
    row.revenue += saleTotal(s)
    row.cost += saleCost(s, (sku) => productForSku(products, sku))
    row.units += s.lines.reduce((x, l) => x + l.qty, 0)
  })
  const totalSales = byBranch.tr.revenue + byBranch.bn.revenue + byBranch.ms.revenue
  const totalCost = byBranch.tr.cost + byBranch.bn.cost + byBranch.ms.cost
  const totalUnits = byBranch.tr.units + byBranch.bn.units + byBranch.ms.units
  return { totalSales, totalCost, totalUnits, byBranch }
}

/** Live revenue honours line and order discounts; baseline units sell at list price. */
export function topSellers(sales: Sale[], queue: Sale[], products: Product[], limit = 5) {
  const dynUnits: Record<string, number> = {}
  const dynRevenue: Record<string, number> = {}
  monthSales(sales, queue).forEach((s) => s.lines.forEach((l) => {
    const p = productForSku(products, l.sku)
    if (!p) return
    dynUnits[p.code] = (dynUnits[p.code] || 0) + l.qty
    dynRevenue[p.code] = (dynRevenue[p.code] || 0) + lineTotal(l) * (1 - (s.orderDiscountPct || 0) / 100)
  }))
  return products
    .map((p) => {
      const base = BASELINE_UNITS_BY_STYLE[p.code] || 0
      return { code: p.code, product: p, units: base + (dynUnits[p.code] || 0), revenue: base * p.price + (dynRevenue[p.code] || 0) }
    })
    .sort((a, b) => b.units - a.units)
    .slice(0, limit)
}

/** Sell-through % per style = units sold (baseline+live) / (units sold + units currently on hand across branches). */
export function sellThroughByStyle(sales: Sale[], queue: Sale[], products: Product[], variants: Variant[], inventory: InventoryMap) {
  const sold = topSellers(sales, queue, products, products.length)
  return sold.map((row) => {
    const skus = variants.filter((v) => v.productCode === row.code).map((v) => v.sku)
    const onHand = skus.reduce((a, sku) => a + (inventory[sku]?.tr || 0) + (inventory[sku]?.bn || 0) + (inventory[sku]?.ms || 0), 0)
    const denom = row.units + onHand
    const pct = denom > 0 ? Math.round((row.units / denom) * 100) : 0
    return { ...row, onHand, pct }
  }).sort((a, b) => b.pct - a.pct)
}

/** A style's baseline units, attributed to one of its variants: shared evenly across
 *  its sizes, then across that size's colours. Fractions are kept so totals add up. */
function baselineForVariant(v: Variant, products: Product[]): number {
  const p = products.find((pp) => pp.code === v.productCode)
  const base = p ? BASELINE_UNITS_BY_STYLE[p.code] || 0 : 0
  if (!p || !base) return 0
  return base / (p.sizes.length * p.colors.length)
}

/** Size-run analysis: month units sold per size vs. remaining on hand per size. */
export function sizeRunAnalysis(sales: Sale[], queue: Sale[], products: Product[], variants: Variant[], inventory: InventoryMap) {
  const soldBySku: Record<string, number> = {}
  monthSales(sales, queue).forEach((s) => s.lines.forEach((l) => { soldBySku[l.sku] = (soldBySku[l.sku] || 0) + l.qty }))
  const bySize: Record<string, { sold: number; onHand: number }> = {}
  variants.forEach((v) => {
    const onHand = (inventory[v.sku]?.tr || 0) + (inventory[v.sku]?.bn || 0) + (inventory[v.sku]?.ms || 0)
    const sold = (soldBySku[v.sku] || 0) + baselineForVariant(v, products)
    if (!bySize[v.size]) bySize[v.size] = { sold: 0, onHand: 0 }
    bySize[v.size].sold += sold
    bySize[v.size].onHand += onHand
  })
  return Object.entries(bySize).map(([size, v]) => {
    const sold = Math.round(v.sold)
    const denom = sold + v.onHand
    return { size, sold, onHand: v.onHand, pct: denom > 0 ? Math.round((sold / denom) * 100) : 0 }
  })
}

/** Dead-stock aging: variants that have never sold (live or baseline) and days since the style was created. */
export function deadStockAging(sales: Sale[], queue: Sale[], variants: Variant[], products: Product[], inventory: InventoryMap) {
  const soldBySku = new Set<string>()
  ;[...sales, ...queue].forEach((s) => s.lines.forEach((l) => soldBySku.add(l.sku)))
  const now = Date.now()
  return variants
    .flatMap((v) => {
      const p = productForSku(products, v.sku)
      if (!p) return []
      const onHand = (inventory[v.sku]?.tr || 0) + (inventory[v.sku]?.bn || 0) + (inventory[v.sku]?.ms || 0)
      const days = Math.round((now - new Date(p.createdAt).getTime()) / 86400000)
      const everMoved = soldBySku.has(v.sku) || baselineForVariant(v, products) > 0
      return [{ sku: v.sku, product: p, onHand, days, everMoved }]
    })
    .filter((r) => r.onHand > 0)
    // Never-sold stock first, then the oldest.
    .sort((a, b) => Number(a.everMoved) - Number(b.everMoved) || b.days - a.days)
}

/** Margin by type. Products without a recorded cost are left out rather than shown at 100 %. */
export function marginByCategory(sales: Sale[], queue: Sale[], products: Product[]) {
  const priced = products.filter((p) => p.cost > 0)
  const byCat: Record<string, { revenue: number; cost: number }> = {}
  const add = (key: string, revenue: number, cost: number) => {
    if (!byCat[key]) byCat[key] = { revenue: 0, cost: 0 }
    byCat[key].revenue += revenue
    byCat[key].cost += cost
  }
  priced.forEach((p) => {
    const baseUnits = BASELINE_UNITS_BY_STYLE[p.code] || 0
    add(p.category.en, baseUnits * p.price, baseUnits * p.cost)
  })
  monthSales(sales, queue).forEach((s) => s.lines.forEach((l) => {
    const p = productForSku(priced, l.sku)
    if (!p) return
    add(p.category.en, lineTotal(l) * (1 - (s.orderDiscountPct || 0) / 100), l.qty * p.cost)
  }))
  return Object.entries(byCat).map(([key, { revenue, cost }]) => {
    const catAr = products.find((p) => p.category.en === key)?.category.ar || key
    return { categoryEn: key, categoryAr: catAr, revenue, cost, margin: revenue - cost, marginPct: revenue > 0 ? Math.round(((revenue - cost) / revenue) * 100) : 0 }
  }).sort((a, b) => b.revenue - a.revenue)
}

/** Month performance per salesperson: live receipts plus each seeded seller's share of the baseline. */
export function salesBySeller(sales: Sale[], queue: Sale[], products: Product[]) {
  const bySeller: Record<string, { revenue: number; units: number; receipts: number }> = {}
  const ensure = (name: string) => (bySeller[name] ||= { revenue: 0, units: 0, receipts: 0 })
  const baseRev = baselineRevenue(products)
  const baseUnits = baselineUnits()
  Object.entries(BASELINE_SELLER_SHARE).forEach(([name, share]) => {
    const row = ensure(name)
    row.revenue += Math.round(baseRev * share)
    row.units += Math.round(baseUnits * share)
    row.receipts += Math.round((baseUnits * share) / 1.4)
  })
  monthSales(sales, queue).forEach((s) => {
    const row = ensure(s.sellerName)
    row.revenue += saleTotal(s)
    row.units += s.lines.reduce((x, l) => x + l.qty, 0)
    row.receipts += 1
  })
  return Object.entries(bySeller).map(([seller, v]) => ({ seller, ...v })).sort((a, b) => b.revenue - a.revenue)
}

export function movementLabel(lang: 'ar' | 'en', type: StockMovement['type']) {
  const map = {
    sale: { ar: 'بيع', en: 'Sale' },
    return: { ar: 'إرجاع', en: 'Return' },
    transferOut: { ar: 'تحويل صادر', en: 'Transfer out' },
    transferIn: { ar: 'تحويل وارد', en: 'Transfer in' },
    receipt: { ar: 'استلام شحنة', en: 'Shipment' },
    countAdjustment: { ar: 'تسوية جرد', en: 'Count adjustment' },
    writeOff: { ar: 'إعدام', en: 'Write-off' },
  } as const
  return lang === 'ar' ? map[type].ar : map[type].en
}

/** Free-text movement reasons the store writes, localised for the ledger view. */
export function reasonLabel(lang: 'ar' | 'en', reason?: string): string | null {
  if (!reason) return null
  const map: Record<string, { ar: string; en: string }> = {
    'opening stock': { ar: 'رصيد افتتاحي', en: 'Opening stock' },
    'stock count': { ar: 'جرد', en: 'Stock count' },
  }
  const hit = map[reason]
  return hit ? (lang === 'ar' ? hit.ar : hit.en) : reason
}
