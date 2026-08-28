import type {
  Branch, ColorDef, Product, Variant, InventoryMap, Sale, Customer, Transfer,
  StockMovement, Supplier, PurchaseOrder, Expense, StockCountSession, ColorCode, Size,
} from './types'

export const todayStr = () => new Date().toISOString().slice(0, 10)
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const BRANCHES: Branch[] = [
  { id: 'tr', name: { ar: 'قرقارش', en: 'Gargaresh' }, address: 'شارع قرقارش، طرابلس', phone: '+218 21 477 0011', active: true, openingFloatUsd: 100, openingFloatLyd: 500 },
  { id: 'bn', name: { ar: 'سوق الجمعة', en: "Souq al-Jum'a" }, address: 'سوق الجمعة، طرابلس', phone: '+218 21 483 2244', active: true, openingFloatUsd: 100, openingFloatLyd: 400 },
  { id: 'ms', name: { ar: 'بن عاشور', en: 'Ben Ashour' }, address: 'شارع بن عاشور، طرابلس', phone: '+218 21 444 5588', active: true, openingFloatUsd: 50, openingFloatLyd: 300 },
]

export const COLORS: Record<ColorCode, ColorDef> = {
  BLK: { code: 'BLK', name: { ar: 'أسود', en: 'Black' }, hex: '#1f2026' },
  WHT: { code: 'WHT', name: { ar: 'أبيض', en: 'White' }, hex: '#e8e6e0' },
  BEG: { code: 'BEG', name: { ar: 'بيج', en: 'Beige' }, hex: '#c9b697' },
  NVY: { code: 'NVY', name: { ar: 'كحلي', en: 'Navy' }, hex: '#2b3a5c' },
  MRN: { code: 'MRN', name: { ar: 'عنابي', en: 'Maroon' }, hex: '#6e2b3a' },
  OLV: { code: 'OLV', name: { ar: 'زيتي', en: 'Olive' }, hex: '#5a5f3c' },
  PNK: { code: 'PNK', name: { ar: 'وردي', en: 'Pink' }, hex: '#d9a0ac' },
}

export const PRODUCTS: Product[] = [
  { code: 'ARW-1021', name: { ar: 'فستان سهرة ساتان', en: 'Satin Evening Dress' }, category: { ar: 'فساتين', en: 'Dresses' }, season: '2026 خريف', brand: 'Arwa Atelier', price: 85, cost: 41, sizes: ['S', 'M', 'L'], colors: ['BLK', 'MRN', 'NVY'], createdAt: daysAgo(210), active: true },
  { code: 'ARW-1044', name: { ar: 'عباية مطرزة', en: 'Embroidered Abaya' }, category: { ar: 'عبايات', en: 'Abayas' }, season: '2026 خريف', brand: 'Arwa Atelier', price: 120, cost: 58, sizes: ['M', 'L', 'XL'], colors: ['BLK', 'NVY'], createdAt: daysAgo(180), active: true },
  { code: 'ARW-2010', name: { ar: 'بلوزة حرير', en: 'Silk Blouse' }, category: { ar: 'بلوزات', en: 'Tops' }, season: '2026 صيف', brand: 'Arwa Casual', price: 45, cost: 19, sizes: ['S', 'M', 'L'], colors: ['WHT', 'PNK', 'BEG'], createdAt: daysAgo(150), active: true },
  { code: 'ARW-2033', name: { ar: 'تنورة بليسيه', en: 'Pleated Skirt' }, category: { ar: 'تنانير', en: 'Skirts' }, season: '2026 صيف', brand: 'Arwa Casual', price: 38, cost: 15, sizes: ['S', 'M', 'L'], colors: ['BLK', 'BEG'], createdAt: daysAgo(140), active: true },
  { code: 'ARW-3005', name: { ar: 'جينز واسع', en: 'Wide-leg Jeans' }, category: { ar: 'بناطيل', en: 'Denim' }, season: '2026 صيف', brand: 'Arwa Casual', price: 52, cost: 22, sizes: ['S', 'M', 'L', 'XL'], colors: ['NVY', 'BLK'], createdAt: daysAgo(120), active: true },
  { code: 'ARW-4012', name: { ar: 'حجاب شيفون', en: 'Chiffon Hijab' }, category: { ar: 'حجابات', en: 'Hijabs' }, season: 'دائم', brand: 'Arwa Basics', price: 12, cost: 4, sizes: ['ONE'], colors: ['BLK', 'BEG', 'PNK', 'OLV', 'WHT'], createdAt: daysAgo(300), active: true },
  { code: 'ARW-5001', name: { ar: 'حقيبة كتف جلد', en: 'Leather Shoulder Bag' }, category: { ar: 'حقائب', en: 'Bags' }, season: 'دائم', brand: 'Arwa Accessories', price: 65, cost: 28, sizes: ['ONE'], colors: ['BLK', 'MRN', 'BEG'], createdAt: daysAgo(260), active: true },
  { code: 'ARW-1050', name: { ar: 'فستان قطن كاجوال', en: 'Cotton Day Dress' }, category: { ar: 'فساتين', en: 'Dresses' }, season: '2026 صيف', brand: 'Arwa Casual', price: 40, cost: 17, sizes: ['S', 'M', 'L', 'XL'], colors: ['OLV', 'PNK', 'NVY'], createdAt: daysAgo(100), active: true },
]

export const VARIANTS: Variant[] = []
const variantIndex: Record<string, { product: Product; size: Size; color: ColorCode; pi: number; si: number; ci: number }> = {}
PRODUCTS.forEach((p, pi) => p.sizes.forEach((s, si) => p.colors.forEach((c, ci) => {
  const sku = `${p.code}-${s}-${c}`
  const barcode = '622' + String(pi).padStart(3, '0') + String(si).padStart(2, '0') + String(ci).padStart(2, '0') + '1'
  VARIANTS.push({ sku, productCode: p.code, size: s, color: c, barcode })
  variantIndex[sku] = { product: p, size: s, color: c, pi, si, ci }
})))

export function getVariantInfo(sku: string) {
  return variantIndex[sku]
}

export function seedInventory(): InventoryMap {
  const inv: InventoryMap = {}
  VARIANTS.forEach((v) => {
    const { pi, si, ci } = variantIndex[v.sku]
    inv[v.sku] = {
      tr: (pi * 13 + si * 7 + ci * 5) % 9,
      bn: (pi * 11 + si * 5 + ci * 7) % 8,
      ms: (pi * 7 + si * 3 + ci * 11) % 7,
    }
  })
  return inv
}

export function seedSales(): Sale[] {
  const td = todayStr()
  return [
    { no: 'S-2112', date: td, time: '13:40', branchId: 'bn', customerId: 2, sellerName: 'خالد', lines: [{ sku: 'ARW-1050-L-OLV', qty: 2, price: 40, discountPct: 0 }], orderDiscountPct: 0, payments: [{ currency: 'LYD', amount: 584, method: 'cash' }], change: null },
    { no: 'S-2111', date: td, time: '13:02', branchId: 'ms', customerId: null, sellerName: 'فرج', lines: [{ sku: 'ARW-5001-ONE-BLK', qty: 1, price: 65, discountPct: 0 }], orderDiscountPct: 0, payments: [{ currency: 'USD', amount: 65, method: 'cash' }], change: null },
    { no: 'S-2110', date: td, time: '12:15', branchId: 'bn', customerId: 3, sellerName: 'خالد', lines: [{ sku: 'ARW-3005-M-NVY', qty: 1, price: 52, discountPct: 0 }, { sku: 'ARW-2033-M-BLK', qty: 1, price: 38, discountPct: 0 }], orderDiscountPct: 0, payments: [{ currency: 'LYD', amount: 657, method: 'cash' }], change: null },
    { no: 'S-2109', date: td, time: '11:42', branchId: 'tr', customerId: 1, sellerName: 'سارة', lines: [{ sku: 'ARW-1044-M-BLK', qty: 1, price: 120, discountPct: 0 }], orderDiscountPct: 10, payments: [{ currency: 'USD', amount: 50, method: 'card' }, { currency: 'LYD', amount: 424, method: 'cash' }], change: null },
    { no: 'S-2108', date: td, time: '10:05', branchId: 'tr', customerId: 4, sellerName: 'سارة', lines: [{ sku: 'ARW-4012-ONE-BLK', qty: 2, price: 12, discountPct: 0 }, { sku: 'ARW-2010-M-WHT', qty: 1, price: 45, discountPct: 0 }], orderDiscountPct: 0, payments: [{ currency: 'LYD', amount: 504, method: 'cash' }], change: null },
    { no: 'S-2094', date: daysAgo(9), time: '17:22', branchId: 'tr', customerId: 1, sellerName: 'سارة', lines: [{ sku: 'ARW-1021-M-BLK', qty: 1, price: 85, discountPct: 0 }], orderDiscountPct: 0, payments: [{ currency: 'LYD', amount: 621, method: 'cash' }], change: null },
    { no: 'S-2081', date: daysAgo(16), time: '12:40', branchId: 'bn', customerId: 3, sellerName: 'خالد', lines: [{ sku: 'ARW-2010-S-PNK', qty: 1, price: 45, discountPct: 10 }], orderDiscountPct: 0, payments: [{ currency: 'USD', amount: 40.5, method: 'cash' }], change: null },
    { no: 'S-2066', date: daysAgo(23), time: '16:10', branchId: 'tr', customerId: 2, sellerName: 'سارة', lines: [{ sku: 'ARW-4012-ONE-PNK', qty: 3, price: 12, discountPct: 0 }], orderDiscountPct: 0, payments: [{ currency: 'LYD', amount: 263, method: 'cash' }], change: null },
  ]
}

export function seedMovements(): StockMovement[] {
  const td = todayStr()
  return [
    { id: 'M-4', time: '13:40', date: td, type: 'sale', sku: 'ARW-1050-L-OLV', qty: -2, branchId: 'bn', userName: 'خالد' },
    { id: 'M-3', time: '13:02', date: td, type: 'sale', sku: 'ARW-5001-ONE-BLK', qty: -1, branchId: 'ms', userName: 'فرج' },
    { id: 'M-2', time: '09:30', date: td, type: 'transferOut', sku: 'ARW-2010-M-WHT', qty: -3, branchId: 'bn', userName: 'خالد' },
    { id: 'M-1', time: '09:00', date: td, type: 'receipt', sku: 'ARW-1044-L-NVY', qty: 12, branchId: 'tr', userName: 'أروى' },
  ]
}

export const CUSTOMERS: Customer[] = [
  { id: 1, name: 'أمل الفيتوري', phone: '+218 91 234 5678', points: 120, sizePreferences: 'M / 38', lastPurchaseDate: todayStr() },
  { id: 2, name: 'هدى بن عامر', phone: '+218 92 771 0034', points: 45, sizePreferences: 'L / 40', lastPurchaseDate: todayStr() },
  { id: 3, name: 'مريم الشريف', phone: '+218 94 555 8210', points: 210, sizePreferences: 'S / 36', lastPurchaseDate: todayStr() },
  { id: 4, name: 'نجلاء التركي', phone: '+218 91 880 4471', points: 15, sizePreferences: 'M / 38', lastPurchaseDate: todayStr() },
]

export const TRANSFERS: Transfer[] = [
  { id: 'T-88', date: todayStr(), from: 'tr', to: 'bn', sku: 'ARW-1021-S-MRN', qty: 2, status: 'requested' },
  { id: 'T-87', date: daysAgo(3), from: 'bn', to: 'ms', sku: 'ARW-2010-M-WHT', qty: 3, status: 'sent' },
  { id: 'T-86', date: daysAgo(6), from: 'ms', to: 'tr', sku: 'ARW-5001-ONE-BLK', qty: 1, status: 'received' },
]

// Baseline month-to-date figures per branch, layered under live mock sales so the
// dashboard/reports read realistically without needing months of seeded transactions.
export const MONTH_BASELINE: Record<string, { sales: number; units: number; cost: number }> = {
  tr: { sales: 9840, units: 212, cost: 4410 },
  bn: { sales: 7215, units: 168, cost: 3260 },
  ms: { sales: 4130, units: 96, cost: 1890 },
}
export const BASELINE_UNITS_BY_STYLE: Record<string, number> = {
  'ARW-4012': 64, 'ARW-2010': 41, 'ARW-1050': 33, 'ARW-1021': 28, 'ARW-3005': 22, 'ARW-2033': 18, 'ARW-5001': 12, 'ARW-1044': 9,
}

export const SUPPLIERS: Supplier[] = [
  { id: 'SUP-1', name: 'Istanbul Tekstil A.Ş.', country: 'Turkey', phone: '+90 212 555 0142' },
  { id: 'SUP-2', name: 'Al Waha Trading LLC', country: 'UAE', phone: '+971 4 555 0198' },
  { id: 'SUP-3', name: 'Guangzhou Yida Garments', country: 'China', phone: '+86 20 555 0173' },
]

export function seedPurchaseOrders(): PurchaseOrder[] {
  return [
    {
      id: 'PO-501', supplierId: 'SUP-1', branchId: 'tr', date: daysAgo(35), status: 'closed',
      items: [
        { productCode: 'ARW-1021', sizeBreakdown: { S: 20, M: 30, L: 20 }, qtyOrdered: 70, qtyReceived: 70, unitCostUsd: 34 },
        { productCode: 'ARW-1044', sizeBreakdown: { M: 15, L: 20, XL: 10 }, qtyOrdered: 45, qtyReceived: 45, unitCostUsd: 48 },
      ],
      freightUsd: 620, customsUsd: 410, clearingUsd: 180, receivedDate: daysAgo(21),
    },
    {
      id: 'PO-502', supplierId: 'SUP-2', branchId: 'tr', date: daysAgo(12), status: 'partial',
      items: [
        { productCode: 'ARW-2010', sizeBreakdown: { S: 25, M: 30, L: 25 }, qtyOrdered: 80, qtyReceived: 50, unitCostUsd: 16 },
      ],
      freightUsd: 210, customsUsd: 140, clearingUsd: 60,
    },
    {
      id: 'PO-503', supplierId: 'SUP-3', branchId: 'ms', date: daysAgo(4), status: 'ordered',
      items: [
        { productCode: 'ARW-3005', sizeBreakdown: { S: 20, M: 25, L: 25, XL: 10 }, qtyOrdered: 80, qtyReceived: 0, unitCostUsd: 18 },
      ],
      freightUsd: 260, customsUsd: 170, clearingUsd: 70,
    },
  ]
}

export function seedExpenses(): Expense[] {
  return [
    { id: 'EXP-1', branchId: 'tr', date: daysAgo(2), category: 'rent', description: ' إيجار محل قرقارش — أغسطس', amountUsd: 950 },
    { id: 'EXP-2', branchId: 'tr', date: daysAgo(2), category: 'salaries', description: 'رواتب فريق قرقارش — أغسطس', amountUsd: 1400 },
    { id: 'EXP-3', branchId: 'bn', date: daysAgo(3), category: 'rent', description: 'إيجار محل سوق الجمعة — أغسطس', amountUsd: 700 },
    { id: 'EXP-4', branchId: 'bn', date: daysAgo(3), category: 'salaries', description: 'رواتب فريق سوق الجمعة — أغسطس', amountUsd: 1100 },
    { id: 'EXP-5', branchId: 'ms', date: daysAgo(5), category: 'utilities', description: 'كهرباء وإنترنت — أغسطس', amountUsd: 180 },
    { id: 'EXP-6', branchId: 'tr', date: daysAgo(8), category: 'marketing', description: 'إعلانات سوشيال ميديا', amountUsd: 220 },
    { id: 'EXP-7', branchId: 'ms', date: daysAgo(10), category: 'salaries', description: 'رواتب فريق بن عاشور — أغسطس', amountUsd: 650 },
  ]
}

export function seedStockCounts(): StockCountSession[] {
  return [
    {
      id: 'SC-12', branchId: 'ms', date: daysAgo(30), status: 'posted', userName: 'أروى',
      postedAt: daysAgo(30),
      lines: [
        { sku: 'ARW-4012-ONE-BLK', expectedQty: 5, countedQty: 4 },
        { sku: 'ARW-5001-ONE-MRN', expectedQty: 3, countedQty: 3 },
      ],
    },
  ]
}
