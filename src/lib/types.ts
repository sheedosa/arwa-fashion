// Domain model for Arwa Fashion. This is the shape a real Postgres schema
// would take (see README for the Supabase hand-off notes); the app currently
// runs entirely on the in-memory mock store in lib/mockData.ts + store/useStore.ts.

export type Lang = 'ar' | 'en'
export type Role = 'owner' | 'manager' | 'cashier'
export type BranchId = 'tr' | 'bn' | 'ms'
export type ColorCode = 'BLK' | 'WHT' | 'BEG' | 'NVY' | 'MRN' | 'OLV' | 'PNK'
export type Size = 'S' | 'M' | 'L' | 'XL' | 'ONE'
export type Currency = 'USD' | 'LYD'
export type PayMethod = 'cash' | 'card' | 'bank'

export interface LocalizedText {
  ar: string
  en: string
}

export interface Branch {
  id: BranchId
  name: LocalizedText
  address: string
  phone: string
  active: boolean
  openingFloatUsd: number
  openingFloatLyd: number
}

export interface ColorDef {
  code: ColorCode
  name: LocalizedText
  hex: string
}

export interface User {
  id: string
  role: Role
  name: string
  branchId: BranchId
}

export interface Product {
  code: string // style code
  name: LocalizedText
  category: LocalizedText
  season: string
  brand: string
  description?: string
  price: number // USD, set/reported in USD
  cost: number // USD landed cost
  sizes: Size[]
  colors: ColorCode[]
  createdAt: string
  active: boolean
}

export interface Variant {
  sku: string
  productCode: string
  size: Size
  color: ColorCode
  barcode: string
}

/** inventory[sku][branchId] = qty on hand. Never mutate directly — only via movements. */
export type InventoryMap = Record<string, Partial<Record<BranchId, number>>>

export type MovementType = 'sale' | 'return' | 'transferOut' | 'transferIn' | 'receipt' | 'countAdjustment' | 'writeOff'

export interface StockMovement {
  id: string
  time: string
  date: string
  type: MovementType
  sku: string
  qty: number // signed
  branchId: BranchId
  userName: string
  reason?: string
}

export interface Payment {
  currency: Currency
  amount: number
  method: PayMethod
  fxRate?: number // rate applied, for LYD payments
}

export interface SaleLine {
  sku: string
  qty: number
  price: number // USD unit price actually charged
  discountPct: number
}

export interface Sale {
  no: string
  date: string
  time: string
  branchId: BranchId
  customerId: number | null
  sellerName: string
  lines: SaleLine[]
  orderDiscountPct: number
  payments: Payment[]
  change: { currency: Currency; amount: number } | null
  queued?: boolean
}

export type ReturnReason = 'wrongSize' | 'defect' | 'changedMind'

export interface ReturnRecord {
  id: string
  saleNo: string
  date: string
  branchId: BranchId
  lines: SaleLine[]
  reason: ReturnReason
  refundUsd: number
  userName: string
}

export type TransferStatus = 'requested' | 'sent' | 'received'

export interface Transfer {
  id: string
  date: string
  from: BranchId
  to: BranchId
  sku: string
  qty: number
  status: TransferStatus
}

export interface Customer {
  id: number
  name: string
  phone: string
  notes?: string
  points: number
  sizePreferences: string
  lastPurchaseDate: string | null
}

export interface Supplier {
  id: string
  name: string
  country: string
  phone: string
  notes?: string
}

export type POStatus = 'draft' | 'ordered' | 'partial' | 'received' | 'closed'

export interface POItem {
  productCode: string
  sizeBreakdown: Partial<Record<Size, number>> // per-colour handled at receive time via variant qty
  qtyOrdered: number
  qtyReceived: number
  unitCostUsd: number // supplier unit price before landed-cost allocation
}

export interface PurchaseOrder {
  id: string
  supplierId: string
  branchId: BranchId
  date: string
  status: POStatus
  items: POItem[]
  freightUsd: number
  customsUsd: number
  clearingUsd: number
  receivedDate?: string
}

export type ExpenseCategory = 'rent' | 'salaries' | 'utilities' | 'marketing' | 'maintenance' | 'other'

export interface Expense {
  id: string
  branchId: BranchId
  date: string
  category: ExpenseCategory
  description: string
  amountUsd: number
}

export type StockCountStatus = 'open' | 'posted'

export interface StockCountLine {
  sku: string
  expectedQty: number
  countedQty: number | null
}

export interface StockCountSession {
  id: string
  branchId: BranchId
  date: string
  status: StockCountStatus
  lines: StockCountLine[]
  userName: string
  postedAt?: string
}

export interface AuditLogEntry {
  id: string
  time: string
  userName: string
  role: Role
  action: string
  entity: string
  before?: unknown
  after?: unknown
}

export interface FxRateEntry {
  date: string
  rate: number // LYD per USD
  setBy: string
}
