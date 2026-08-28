import type { BranchId, Product, Sale, Variant, InventoryMap, StockMovement } from './types'
import { MONTH_BASELINE, BASELINE_UNITS_BY_STYLE, todayStr } from './mockData'
import { saleTotal, saleCost } from './calc'

function productForSku(products: Product[], sku: string) {
  return products.find((p) => sku.startsWith(p.code + '-'))
}

export function todayKpis(sales: Sale[], queue: Sale[]) {
  const td = todayStr()
  const all = [...sales, ...queue]
  const todayAll = all.filter((s) => s.date === td)
  const totalSales = todayAll.reduce((a, s) => a + saleTotal(s), 0)
  const totalUnits = todayAll.reduce((a, s) => a + s.lines.reduce((x, l) => x + l.qty, 0), 0)
  return { totalSales, totalUnits, receipts: todayAll.length }
}

export function monthTotals(sales: Sale[], queue: Sale[], products: Product[]) {
  const all = [...sales, ...queue]
  let sales_ = 0, cost = 0, units = 0
  const byBranch: Record<BranchId, { revenue: number; cost: number; units: number }> = {
    tr: { ...MONTH_BASELINE.tr, revenue: MONTH_BASELINE.tr.sales },
    bn: { ...MONTH_BASELINE.bn, revenue: MONTH_BASELINE.bn.sales },
    ms: { ...MONTH_BASELINE.ms, revenue: MONTH_BASELINE.ms.sales },
  } as unknown as Record<BranchId, { revenue: number; cost: number; units: number }>
  ;(['tr', 'bn', 'ms'] as BranchId[]).forEach((id) => {
    byBranch[id] = { revenue: MONTH_BASELINE[id].sales, cost: MONTH_BASELINE[id].cost, units: MONTH_BASELINE[id].units }
  })
  all.forEach((s) => {
    const rev = saleTotal(s)
    const c = saleCost(s, (sku) => productForSku(products, sku))
    const u = s.lines.reduce((x, l) => x + l.qty, 0)
    byBranch[s.branchId].revenue += rev
    byBranch[s.branchId].cost += c
    byBranch[s.branchId].units += u
    sales_ += rev; cost += c; units += u
  })
  const totalSales = sales_ + MONTH_BASELINE.tr.sales + MONTH_BASELINE.bn.sales + MONTH_BASELINE.ms.sales
  const totalCost = cost + MONTH_BASELINE.tr.cost + MONTH_BASELINE.bn.cost + MONTH_BASELINE.ms.cost
  const totalUnits = units + MONTH_BASELINE.tr.units + MONTH_BASELINE.bn.units + MONTH_BASELINE.ms.units
  return { totalSales, totalCost, totalUnits, byBranch }
}

export function topSellers(sales: Sale[], queue: Sale[], products: Product[], limit = 5) {
  const all = [...sales, ...queue]
  const dyn: Record<string, number> = {}
  all.forEach((s) => s.lines.forEach((l) => {
    const p = productForSku(products, l.sku)
    if (p) dyn[p.code] = (dyn[p.code] || 0) + l.qty
  }))
  return products
    .map((p) => {
      const units = (BASELINE_UNITS_BY_STYLE[p.code] || 0) + (dyn[p.code] || 0)
      return { code: p.code, product: p, units, revenue: units * p.price }
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

/** Size-run analysis: for each product, sold units per size vs. remaining on hand per size. */
export function sizeRunAnalysis(sales: Sale[], queue: Sale[], variants: Variant[], inventory: InventoryMap) {
  const all = [...sales, ...queue]
  const soldBySku: Record<string, number> = {}
  all.forEach((s) => s.lines.forEach((l) => { soldBySku[l.sku] = (soldBySku[l.sku] || 0) + l.qty }))
  const bySize: Record<string, { sold: number; onHand: number }> = {}
  variants.forEach((v) => {
    const onHand = (inventory[v.sku]?.tr || 0) + (inventory[v.sku]?.bn || 0) + (inventory[v.sku]?.ms || 0)
    const sold = soldBySku[v.sku] || 0
    if (!bySize[v.size]) bySize[v.size] = { sold: 0, onHand: 0 }
    bySize[v.size].sold += sold
    bySize[v.size].onHand += onHand
  })
  return Object.entries(bySize).map(([size, v]) => {
    const denom = v.sold + v.onHand
    return { size, sold: v.sold, onHand: v.onHand, pct: denom > 0 ? Math.round((v.sold / denom) * 100) : 0 }
  })
}

/** Dead-stock aging: variants with zero sales (mock+baseline) and days since product creation. */
export function deadStockAging(sales: Sale[], queue: Sale[], variants: Variant[], products: Product[], inventory: InventoryMap) {
  const all = [...sales, ...queue]
  const soldBySku = new Set<string>()
  all.forEach((s) => s.lines.forEach((l) => soldBySku.add(l.sku)))
  const now = Date.now()
  return variants
    .map((v) => {
      const p = productForSku(products, v.sku)!
      const onHand = (inventory[v.sku]?.tr || 0) + (inventory[v.sku]?.bn || 0) + (inventory[v.sku]?.ms || 0)
      const days = Math.round((now - new Date(p.createdAt).getTime()) / 86400000)
      const everMoved = soldBySku.has(v.sku) || (BASELINE_UNITS_BY_STYLE[p.code] || 0) > 0
      return { sku: v.sku, product: p, onHand, days, everMoved }
    })
    .filter((r) => r.onHand > 0)
    .sort((a, b) => b.days - a.days)
}

export function marginByCategory(sales: Sale[], queue: Sale[], products: Product[]) {
  const all = [...sales, ...queue]
  const byCat: Record<string, { revenue: number; cost: number }> = {}
  const baselineByCat: Record<string, { revenue: number; cost: number }> = {}
  products.forEach((p) => {
    const key = p.category.en
    const baseUnits = BASELINE_UNITS_BY_STYLE[p.code] || 0
    if (!baselineByCat[key]) baselineByCat[key] = { revenue: 0, cost: 0 }
    baselineByCat[key].revenue += baseUnits * p.price
    baselineByCat[key].cost += baseUnits * p.cost
  })
  all.forEach((s) => s.lines.forEach((l) => {
    const p = productForSku(products, l.sku)
    if (!p) return
    const key = p.category.en
    if (!byCat[key]) byCat[key] = { revenue: 0, cost: 0 }
    byCat[key].revenue += l.qty * l.price * (1 - (l.discountPct || 0) / 100)
    byCat[key].cost += l.qty * p.cost
  }))
  const cats = new Set([...Object.keys(byCat), ...Object.keys(baselineByCat)])
  return [...cats].map((key) => {
    const rev = (byCat[key]?.revenue || 0) + (baselineByCat[key]?.revenue || 0)
    const cost = (byCat[key]?.cost || 0) + (baselineByCat[key]?.cost || 0)
    const catAr = products.find((p) => p.category.en === key)?.category.ar || key
    return { categoryEn: key, categoryAr: catAr, revenue: rev, cost, margin: rev - cost, marginPct: rev > 0 ? Math.round(((rev - cost) / rev) * 100) : 0 }
  }).sort((a, b) => b.revenue - a.revenue)
}

export function salesBySeller(sales: Sale[], queue: Sale[]) {
  const all = [...sales, ...queue]
  const bySeller: Record<string, { revenue: number; units: number; receipts: number }> = {}
  all.forEach((s) => {
    if (!bySeller[s.sellerName]) bySeller[s.sellerName] = { revenue: 0, units: 0, receipts: 0 }
    bySeller[s.sellerName].revenue += saleTotal(s)
    bySeller[s.sellerName].units += s.lines.reduce((x, l) => x + l.qty, 0)
    bySeller[s.sellerName].receipts += 1
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
