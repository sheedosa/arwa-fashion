import type {
  Branch, ColorDef, Product, Variant, InventoryMap, Sale, Customer, Transfer,
  StockMovement, Supplier, PurchaseOrder, Expense, StockCountSession, ColorCode, Size,
} from './types'
import { ITEM_TYPE_NAMES } from './itemTypes'

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
  GLD: { code: 'GLD', name: { ar: 'ذهبي', en: 'Gold' }, hex: '#c9a227' },
  RED: { code: 'RED', name: { ar: 'أحمر', en: 'Red' }, hex: '#9b1b30' },
  EMR: { code: 'EMR', name: { ar: 'زمردي', en: 'Emerald' }, hex: '#0f6b4f' },
}

export const SUPPLIERS: Supplier[] = [
  { id: 'SUP-1', name: 'Istanbul Tekstil A.Ş.', country: 'Turkey', phone: '+90 212 555 0142' },
  { id: 'SUP-2', name: 'Al Waha Trading LLC', country: 'UAE', phone: '+971 4 555 0198' },
  { id: 'SUP-3', name: 'Guangzhou Yida Garments', country: 'China', phone: '+86 20 555 0173' },
  { id: 'SUP-4', name: 'خياطة طرابلس', country: 'Libya', phone: '+218 91 555 0164', notes: 'ستاقونة وتطريز محلي' },
]

// One demo item per item type. Prices are USD placeholders for the client to correct;
// `category` mirrors the type so POS chips, reports and CSV group by the same key.
const T = ITEM_TYPE_NAMES
export const PRODUCTS: Product[] = [
  { code: 'ARW-1101', typeId: 'cloche-dress', name: { ar: 'فستان كلوش ساتان', en: 'Satin Cloche Dress' }, category: T['cloche-dress'], supplierId: 'SUP-1', season: '2026 خريف', brand: 'Arwa Atelier', price: 220, cost: 105, sizes: ['S', 'M', 'L'], colors: ['BLK', 'MRN', 'NVY'], createdAt: daysAgo(210), active: true },
  { code: 'ARW-1102', typeId: 'straight-dress', name: { ar: 'فستان ستريت مطرز', en: 'Embroidered Straight Dress' }, category: T['straight-dress'], supplierId: 'SUP-1', season: '2026 خريف', brand: 'Arwa Atelier', price: 260, cost: 128, sizes: ['S', 'M', 'L'], colors: ['BLK', 'GLD'], createdAt: daysAgo(180), active: true },
  { code: 'ARW-1103', typeId: 'short-dress', name: { ar: 'فستان قصير دانتيل', en: 'Lace Short Dress' }, category: T['short-dress'], supplierId: 'SUP-2', season: '2026 صيف', brand: 'Arwa Atelier', price: 145, cost: 66, sizes: ['S', 'M', 'L'], colors: ['BLK', 'RED', 'PNK'], createdAt: daysAgo(150), active: true },
  { code: 'ARW-1104', typeId: 'straight-dress-train', name: { ar: 'فستان ستريت مع ديل', en: 'Straight Dress with Train' }, category: T['straight-dress-train'], supplierId: 'SUP-1', season: '2026 خريف', brand: 'Arwa Atelier', price: 340, cost: 170, sizes: ['S', 'M', 'L'], colors: ['BLK', 'MRN', 'EMR'], createdAt: daysAgo(140), active: true },
  { code: 'ARW-1105', typeId: 'hayer-dress', name: { ar: 'فستان حاير شيفون', en: 'Chiffon Hayer Dress' }, category: T['hayer-dress'], supplierId: 'SUP-2', season: '2026 صيف', brand: 'Arwa Atelier', price: 190, cost: 88, sizes: ['S', 'M', 'L', 'XL'], colors: ['NVY', 'BEG'], createdAt: daysAgo(120), active: true },
  { code: 'ARW-1106', typeId: 'simple-dress', name: { ar: 'فستان بسيط كريب', en: 'Simple Crepe Dress' }, category: T['simple-dress'], supplierId: 'SUP-3', season: 'دائم', brand: 'Arwa Atelier', price: 120, cost: 52, sizes: ['S', 'M', 'L', 'XL'], colors: ['BLK', 'NVY', 'BEG', 'WHT'], createdAt: daysAgo(300), active: true },
  { code: 'ARW-1107', typeId: 'kids-dress', name: { ar: 'فستان أطفال تول', en: "Tulle Children's Dress" }, category: T['kids-dress'], supplierId: 'SUP-3', season: 'دائم', brand: 'Arwa Kids', price: 65, cost: 28, sizes: ['S', 'M', 'L'], colors: ['PNK', 'WHT', 'RED'], createdAt: daysAgo(260), active: true },
  { code: 'ARW-1201', typeId: 'evening-trousers', name: { ar: 'سروال سهرة واسع', en: 'Wide Evening Trousers' }, category: T['evening-trousers'], supplierId: 'SUP-2', season: '2026 صيف', brand: 'Arwa Atelier', price: 95, cost: 41, sizes: ['S', 'M', 'L', 'XL'], colors: ['BLK', 'NVY'], createdAt: daysAgo(100), active: true },
  { code: 'ARW-1301', typeId: 'fur-cape-small', name: { ar: 'كاب فرو صغير', en: 'Small Fur Cape' }, category: T['fur-cape-small'], supplierId: 'SUP-1', season: '2026 خريف', brand: 'Arwa Atelier', price: 85, cost: 36, sizes: ['ONE'], colors: ['WHT', 'BEG', 'BLK'], createdAt: daysAgo(90), active: true },
  { code: 'ARW-1302', typeId: 'fur-cape-large', name: { ar: 'كاب فرو كبير', en: 'Large Fur Cape' }, category: T['fur-cape-large'], supplierId: 'SUP-1', season: '2026 خريف', brand: 'Arwa Atelier', price: 160, cost: 72, sizes: ['ONE'], colors: ['WHT', 'BLK'], createdAt: daysAgo(90), active: true },
  { code: 'ARW-1401', typeId: 'staqouna', name: { ar: 'ستاقونة مطرزة', en: 'Embroidered Staqouna' }, category: T.staqouna, supplierId: 'SUP-4', season: 'دائم', brand: 'Arwa Atelier', price: 380, cost: 190, sizes: ['S', 'M', 'L'], colors: ['GLD', 'MRN', 'EMR'], createdAt: daysAgo(75), active: true },
  { code: 'ARW-1501', typeId: 'evening-suit', name: { ar: 'بدلة سهرة قطعتين', en: 'Two-piece Evening Suit' }, category: T['evening-suit'], supplierId: 'SUP-1', season: '2026 خريف', brand: 'Arwa Atelier', price: 275, cost: 132, sizes: ['S', 'M', 'L'], colors: ['BLK', 'NVY'], createdAt: daysAgo(60), active: true },
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
  // The large fur cape is sold out at Gargaresh (still at the other branches) so the
  // demo shows a "نفدت الكمية" item alongside the "available elsewhere" hint.
  VARIANTS.filter((v) => v.productCode === 'ARW-1302').forEach((v) => { inv[v.sku] = { ...inv[v.sku], tr: 0, bn: Math.max(2, inv[v.sku].bn || 0) } })
  return inv
}

// LYD amounts are USD × 7.30 (the seeded fx rate), rounded up to the dinar.
export function seedSales(): Sale[] {
  const td = todayStr()
  return [
    { no: 'S-2112', date: td, time: '13:40', branchId: 'bn', customerId: 2, sellerName: 'خالد', lines: [{ sku: 'ARW-1106-M-BLK', qty: 1, price: 120, discountPct: 0 }], orderDiscountPct: 0, payments: [{ currency: 'LYD', amount: 876, method: 'cash' }], change: null },
    { no: 'S-2111', date: td, time: '13:02', branchId: 'ms', customerId: null, sellerName: 'فرج', lines: [{ sku: 'ARW-1301-ONE-BLK', qty: 1, price: 85, discountPct: 0 }], orderDiscountPct: 0, payments: [{ currency: 'USD', amount: 85, method: 'cash' }], change: null },
    { no: 'S-2110', date: td, time: '12:15', branchId: 'bn', customerId: 3, sellerName: 'خالد', lines: [{ sku: 'ARW-1201-M-BLK', qty: 1, price: 95, discountPct: 0 }, { sku: 'ARW-1107-M-PNK', qty: 1, price: 65, discountPct: 0 }], orderDiscountPct: 0, payments: [{ currency: 'LYD', amount: 1168, method: 'cash' }], change: null },
    { no: 'S-2109', date: td, time: '11:42', branchId: 'tr', customerId: 1, sellerName: 'سارة', lines: [{ sku: 'ARW-1102-M-BLK', qty: 1, price: 260, discountPct: 0 }], orderDiscountPct: 10, payments: [{ currency: 'USD', amount: 100, method: 'card' }, { currency: 'LYD', amount: 979, method: 'cash' }], change: null },
    { no: 'S-2108', date: td, time: '10:05', branchId: 'tr', customerId: 4, sellerName: 'سارة', lines: [{ sku: 'ARW-1301-ONE-WHT', qty: 1, price: 85, discountPct: 0 }, { sku: 'ARW-1106-S-BEG', qty: 1, price: 120, discountPct: 0 }], orderDiscountPct: 0, payments: [{ currency: 'LYD', amount: 1497, method: 'cash' }], change: null },
    { no: 'S-2094', date: daysAgo(9), time: '17:22', branchId: 'tr', customerId: 1, sellerName: 'سارة', lines: [{ sku: 'ARW-1101-M-BLK', qty: 1, price: 220, discountPct: 0 }], orderDiscountPct: 0, payments: [{ currency: 'LYD', amount: 1606, method: 'cash' }], change: null },
    { no: 'S-2081', date: daysAgo(16), time: '12:40', branchId: 'bn', customerId: 3, sellerName: 'خالد', lines: [{ sku: 'ARW-1103-S-PNK', qty: 1, price: 145, discountPct: 10 }], orderDiscountPct: 0, payments: [{ currency: 'USD', amount: 130.5, method: 'cash' }], change: null },
    { no: 'S-2066', date: daysAgo(23), time: '16:10', branchId: 'tr', customerId: 2, sellerName: 'سارة', lines: [{ sku: 'ARW-1107-S-WHT', qty: 2, price: 65, discountPct: 0 }], orderDiscountPct: 0, payments: [{ currency: 'LYD', amount: 949, method: 'cash' }], change: null },
  ]
}

export function seedMovements(): StockMovement[] {
  const td = todayStr()
  return [
    { id: 'M-4', time: '13:40', date: td, type: 'sale', sku: 'ARW-1106-M-BLK', qty: -1, branchId: 'bn', userName: 'خالد' },
    { id: 'M-3', time: '13:02', date: td, type: 'sale', sku: 'ARW-1301-ONE-BLK', qty: -1, branchId: 'ms', userName: 'فرج' },
    { id: 'M-2', time: '09:30', date: td, type: 'transferOut', sku: 'ARW-1105-M-NVY', qty: -3, branchId: 'bn', userName: 'خالد' },
    { id: 'M-1', time: '09:00', date: td, type: 'receipt', sku: 'ARW-1104-L-BLK', qty: 12, branchId: 'tr', userName: 'أروى' },
  ]
}

export const CUSTOMERS: Customer[] = [
  { id: 1, name: 'أمل الفيتوري', phone: '+218 91 234 5678', points: 120, sizePreferences: 'M / 38', lastPurchaseDate: todayStr() },
  { id: 2, name: 'هدى بن عامر', phone: '+218 92 771 0034', points: 45, sizePreferences: 'L / 40', lastPurchaseDate: todayStr() },
  { id: 3, name: 'مريم الشريف', phone: '+218 94 555 8210', points: 210, sizePreferences: 'S / 36', lastPurchaseDate: todayStr() },
  { id: 4, name: 'نجلاء التركي', phone: '+218 91 880 4471', points: 15, sizePreferences: 'M / 38', lastPurchaseDate: todayStr() },
]

export const TRANSFERS: Transfer[] = [
  { id: 'T-88', date: todayStr(), from: 'tr', to: 'bn', sku: 'ARW-1101-S-MRN', qty: 2, status: 'requested' },
  { id: 'T-87', date: daysAgo(3), from: 'bn', to: 'ms', sku: 'ARW-1105-M-NVY', qty: 3, status: 'sent' },
  { id: 'T-86', date: daysAgo(6), from: 'ms', to: 'tr', sku: 'ARW-1301-ONE-BLK', qty: 1, status: 'received' },
]

// Baseline month-to-date figures per branch, layered under live mock sales so the
// dashboard/reports read realistically without needing months of seeded transactions.
// Units total 145 = the sum of BASELINE_UNITS_BY_STYLE below.
export const MONTH_BASELINE: Record<string, { sales: number; units: number; cost: number }> = {
  tr: { sales: 10615, units: 67, cost: 4990 },
  bn: { sales: 7845, units: 49, cost: 3690 },
  ms: { sales: 4615, units: 29, cost: 2170 },
}
export const BASELINE_UNITS_BY_STYLE: Record<string, number> = {
  'ARW-1106': 26, 'ARW-1103': 21, 'ARW-1107': 19, 'ARW-1101': 16, 'ARW-1201': 14, 'ARW-1102': 11,
  'ARW-1301': 10, 'ARW-1105': 9, 'ARW-1501': 7, 'ARW-1104': 5, 'ARW-1302': 4, 'ARW-1401': 3,
}

// Supplier unit prices are chosen so that price + the shipment's per-unit overhead
// lands on the product's seeded cost (the receive flow recomputes landed cost).
export function seedPurchaseOrders(): PurchaseOrder[] {
  return [
    {
      id: 'PO-501', supplierId: 'SUP-1', branchId: 'tr', date: daysAgo(35), status: 'closed',
      items: [
        { productCode: 'ARW-1101', sizeBreakdown: { S: 20, M: 30, L: 20 }, qtyOrdered: 70, qtyReceived: 70, unitCostUsd: 92 },
        { productCode: 'ARW-1104', sizeBreakdown: { S: 10, M: 15, L: 10 }, qtyOrdered: 35, qtyReceived: 35, unitCostUsd: 158 },
      ],
      freightUsd: 620, customsUsd: 410, clearingUsd: 180, receivedDate: daysAgo(21),
    },
    {
      id: 'PO-502', supplierId: 'SUP-2', branchId: 'tr', date: daysAgo(12), status: 'partial',
      items: [
        { productCode: 'ARW-1103', sizeBreakdown: { S: 25, M: 30, L: 25 }, qtyOrdered: 80, qtyReceived: 50, unitCostUsd: 58 },
      ],
      freightUsd: 210, customsUsd: 140, clearingUsd: 60,
    },
    {
      id: 'PO-503', supplierId: 'SUP-3', branchId: 'ms', date: daysAgo(4), status: 'ordered',
      items: [
        { productCode: 'ARW-1106', sizeBreakdown: { S: 20, M: 25, L: 25, XL: 10 }, qtyOrdered: 80, qtyReceived: 0, unitCostUsd: 45 },
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
        { sku: 'ARW-1301-ONE-BLK', expectedQty: 5, countedQty: 4 },
        { sku: 'ARW-1302-ONE-WHT', expectedQty: 3, countedQty: 3 },
      ],
    },
  ]
}
