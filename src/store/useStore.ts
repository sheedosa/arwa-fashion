import { create } from 'zustand'
import type {
  User, Role, BranchId, InventoryMap, Sale, StockMovement, Customer, Transfer,
  Product, Variant, ColorCode, Size, Supplier, PurchaseOrder, Expense, StockCountSession,
  ReturnRecord, PayMethod, MovementType, ItemTypeId,
} from '../lib/types'
import {
  PRODUCTS, VARIANTS, seedInventory, seedSales, seedMovements, CUSTOMERS,
  TRANSFERS, SUPPLIERS, seedPurchaseOrders, seedExpenses, seedStockCounts, todayStr,
} from '../lib/mockData'
import { ITEM_TYPE_NAMES } from '../lib/itemTypes'
import { lineTotal, saleTotal, computeChange } from '../lib/calc'

const DEMO_USERS: Record<Role, User> = {
  owner: { id: 'u-owner', role: 'owner', name: 'أروى الهوني', branchId: 'tr' },
  manager: { id: 'u-mgr', role: 'manager', name: 'خالد المقريف', branchId: 'bn' },
  cashier: { id: 'u-cashier', role: 'cashier', name: 'سارة بن موسى', branchId: 'tr' },
}

let movSeq = 100
let poSeq = 504
let expSeq = 8
let scSeq = 13
let retSeq = 1
let supSeq = SUPPLIERS.length + 1

/** What the add-item form hands over. Quantities are keyed `${size}-${color}` (not
 *  SKU — the style code is still being typed while quantities are entered). */
export interface NewProductDraft {
  nameAr: string
  nameEn: string
  code: string
  typeId: ItemTypeId
  supplierId?: string
  price: number
  cost: number
  image?: string
  sizes: Size[]
  colors: ColorCode[]
  branchId: BranchId
  quantities: Record<string, number>
}

/** Why a write was refused — screens map it to a localised toast. */
export type RefuseReason = 'closed' | 'stock' | 'payment' | 'duplicate' | 'invalid'
export type ActionResult = { ok: true } | { ok: false; reason: RefuseReason }
export type SaleResult = { ok: true; sale: Sale } | { ok: false; reason: RefuseReason }

const dayClosed = (closedDays: Record<string, boolean>, branchId: BranchId) => !!closedDays[branchId + ':' + todayStr()]

/** Line indexes of a sale that have already gone back. */
export function returnedLineIndexes(returns: ReturnRecord[], sale: Sale): Set<number> {
  const out = new Set<number>()
  returns.filter((r) => r.saleNo === sale.no).forEach((r) => r.lineIndexes.forEach((i) => out.add(i)))
  return out
}

interface CartLine {
  sku: string
  qty: number
  price: number
  discountPct: number
}

interface AppState {
  // session
  user: User | null
  branch: BranchId
  offline: boolean
  toast: string

  // settings
  fxRate: number
  lowStockThreshold: number

  // catalog (mutable — new products can be added at runtime)
  products: Product[]
  variants: Variant[]

  // stock
  inventory: InventoryMap
  movements: StockMovement[]

  // sales
  sales: Sale[]
  queue: Sale[]
  saleSeq: number
  returns: ReturnRecord[]

  // people
  customers: Customer[]
  custSeq: number

  // transfers
  transfers: Transfer[]
  trSeq: number

  // cash reconciliation: cnt[branchId] = { usd, lyd }; closed[branchId+date] = true
  cashCounted: Record<string, { usd: string; lyd: string }>
  closedDays: Record<string, boolean>

  // POS cart (per-session, not per-branch)
  cart: CartLine[]
  orderDiscountPct: number

  // phase 2
  suppliers: Supplier[]
  purchaseOrders: PurchaseOrder[]
  expenses: Expense[]
  stockCounts: StockCountSession[]

  // actions — session
  login: (role: Role) => void
  logout: () => void
  setBranch: (b: BranchId) => void
  toggleOffline: () => void
  flash: (msg: string) => void

  // actions — cart / POS
  addToCart: (sku: string) => void
  /** false when the requested quantity exceeds stock at the current branch. */
  bumpCartLine: (sku: string, delta: number) => boolean
  setCartLineDiscount: (sku: string, pct: number) => void
  removeCartLine: (sku: string) => void
  setOrderDiscount: (pct: number) => void
  completeSale: (args: { payUsd: number; payLyd: number; method: PayMethod; custPhone: string }) => SaleResult

  // actions — returns
  /** false when the day is closed or every picked line was already returned. */
  processReturn: (saleNo: string, lineIndexes: number[], reason: ReturnRecord['reason']) => boolean

  // actions — transfers
  /** false when the source branch does not hold that many units. */
  requestTransfer: (from: BranchId, to: BranchId, sku: string, qty: number) => boolean
  /** Refused when the source can no longer cover the quantity or the day is closed. */
  advanceTransfer: (id: string) => ActionResult

  // actions — customers
  /** false when the phone number already belongs to a customer. */
  addCustomer: (phone: string, name: string) => boolean

  // actions — products
  /** Returns false (and changes nothing) when the style code already exists. */
  addProduct: (draft: NewProductDraft) => boolean
  /** Returns the id — an existing supplier's when the name already matches. */
  addSupplier: (name: string) => string
  /** Owner-only edit of the descriptive fields; code, sizes and colours are fixed. */
  updateProduct: (code: string, patch: Partial<Pick<Product, 'name' | 'typeId' | 'supplierId' | 'image' | 'price' | 'cost'>>) => void

  // actions — reconciliation
  setCashCounted: (branchId: BranchId, field: 'usd' | 'lyd', value: string) => void
  closeDay: (branchId: BranchId) => void

  // actions — phase 2 purchasing
  createPurchaseOrder: (po: { supplierId: string; branchId: BranchId; items: { productCode: string; qtyOrdered: number; unitCostUsd: number }[]; freightUsd: number; customsUsd: number; clearingUsd: number }) => void
  receivePurchaseOrder: (poId: string, receipts: { productCode: string; qty: number }[]) => ActionResult
  closePurchaseOrder: (poId: string) => void

  // actions — phase 2 expenses
  addExpense: (e: { branchId: BranchId; date: string; category: Expense['category']; description: string; amountUsd: number }) => boolean

  // actions — phase 2 stock counts
  /** Returns the session id — the already-open one when a count is in progress at that branch. */
  startStockCount: (branchId: BranchId) => string
  setStockCountLine: (sessionId: string, sku: string, countedQty: number | null) => void
  postStockCount: (sessionId: string) => ActionResult

  // settings
  setFxRate: (rate: number) => void
  setLowStockThreshold: (n: number) => void
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

function applyMoves(
  inventory: InventoryMap,
  movements: StockMovement[],
  moves: { type: MovementType; sku: string; qty: number; branchId: BranchId; userName: string; reason?: string }[],
): { inventory: InventoryMap; movements: StockMovement[] } {
  const inv: InventoryMap = { ...inventory }
  const now = new Date()
  const time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
  const newMoves: StockMovement[] = moves.map((m) => {
    inv[m.sku] = { ...inv[m.sku], [m.branchId]: Math.max(0, (inv[m.sku]?.[m.branchId] || 0) + m.qty) }
    return { ...m, id: 'M-' + movSeq++, time, date: todayStr() }
  })
  return { inventory: inv, movements: [...newMoves.reverse(), ...movements].slice(0, 200) }
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  branch: 'tr',
  offline: false,
  toast: '',

  fxRate: 7.3,
  lowStockThreshold: 3,

  products: PRODUCTS,
  variants: VARIANTS,

  inventory: seedInventory(),
  movements: seedMovements(),

  sales: seedSales(),
  queue: [],
  saleSeq: 2113,
  returns: [],

  customers: CUSTOMERS,
  custSeq: 5,

  transfers: TRANSFERS,
  trSeq: 89,

  cashCounted: {},
  closedDays: {},

  cart: [],
  orderDiscountPct: 0,

  suppliers: SUPPLIERS,
  purchaseOrders: seedPurchaseOrders(),
  expenses: seedExpenses(),
  stockCounts: seedStockCounts(),

  login: (role) => {
    const u = DEMO_USERS[role]
    set({ user: u, branch: u.branchId })
  },
  // A session ends cleanly: the next person must not inherit a cart, a queue or a
  // half-typed cash count.
  logout: () => set({ user: null, cart: [], orderDiscountPct: 0, offline: false, queue: [], cashCounted: {} }),
  // The cart was priced and stock-checked against the old branch.
  setBranch: (b) => set((st) => (st.branch === b ? {} : { branch: b, cart: [], orderDiscountPct: 0 })),
  toggleOffline: () => {
    const st = get()
    if (st.offline && st.queue.length) {
      set({ offline: false, sales: [...st.queue.map((s) => ({ ...s, queued: false })), ...st.sales], queue: [] })
    } else {
      set({ offline: !st.offline })
    }
  },
  flash: (msg) => {
    set({ toast: msg })
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => set({ toast: '' }), 2600)
  },

  addToCart: (sku) => {
    const st = get()
    const q = st.inventory[sku]?.[st.branch] || 0
    const existing = st.cart.find((l) => l.sku === sku)
    if ((existing ? existing.qty : 0) + 1 > q) return
    const product = productForSku(st.products, sku, st.variants)
    if (!product) return
    const cart = existing
      ? st.cart.map((l) => (l.sku === sku ? { ...l, qty: l.qty + 1 } : l))
      : [...st.cart, { sku, qty: 1, price: product?.price ?? 0, discountPct: 0 }]
    set({ cart })
  },
  bumpCartLine: (sku, d) => {
    const st = get()
    const cart = st.cart.map((l) => (l.sku === sku ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0)
    const l = cart.find((x) => x.sku === sku)
    if (l && l.qty > (st.inventory[sku]?.[st.branch] || 0)) return false
    set({ cart })
    return true
  },
  setCartLineDiscount: (sku, pct) => {
    const clamped = Math.min(90, Math.max(0, pct || 0))
    set((st) => ({ cart: st.cart.map((l) => (l.sku === sku ? { ...l, discountPct: clamped } : l)) }))
  },
  removeCartLine: (sku) => set((st) => ({ cart: st.cart.filter((l) => l.sku !== sku) })),
  setOrderDiscount: (pct) => set({ orderDiscountPct: Math.min(100, Math.max(0, pct || 0)) }),

  completeSale: ({ payUsd, payLyd, method, custPhone }) => {
    const st = get()
    if (!st.cart.length || !st.user) return { ok: false, reason: 'invalid' }
    if (dayClosed(st.closedDays, st.branch)) return { ok: false, reason: 'closed' }
    if (!(payUsd >= 0) || !(payLyd >= 0) || !Number.isFinite(payUsd + payLyd)) return { ok: false, reason: 'payment' }
    // The cart was checked line by line as it grew; check the whole basket once more
    // against live stock — a transfer or another till may have moved units since.
    if (st.cart.some((l) => l.qty > (st.inventory[l.sku]?.[st.branch] || 0))) return { ok: false, reason: 'stock' }
    const total = saleTotal({ lines: st.cart, orderDiscountPct: st.orderDiscountPct })
    const paid = payUsd + payLyd / st.fxRate
    if (paid < total - 0.01) return { ok: false, reason: 'payment' }
    const change = computeChange(total, payUsd, payLyd, st.fxRate)

    let customers = st.customers
    let custSeq = st.custSeq
    let custId: number | null = null
    const digits = custPhone.replace(/\D/g, '')
    if (digits.length >= 11) {
      const m = customers.find((c) => c.phone.replace(/\D/g, '') === digits)
      if (m) {
        custId = m.id
        customers = customers.map((c) => (c.id === m.id ? { ...c, points: c.points + Math.floor(total), lastPurchaseDate: todayStr() } : c))
      } else {
        custId = custSeq
        customers = [...customers, { id: custSeq++, name: 'عميل ' + custPhone, phone: custPhone, points: Math.floor(total), sizePreferences: '—', lastPurchaseDate: todayStr() }]
      }
    }
    const payments = []
    if (payUsd > 0) payments.push({ currency: 'USD' as const, amount: payUsd, method })
    if (payLyd > 0) payments.push({ currency: 'LYD' as const, amount: payLyd, method, fxRate: st.fxRate })

    const sale: Sale = {
      no: 'S-' + st.saleSeq, date: todayStr(), time: new Date().toTimeString().slice(0, 5),
      branchId: st.branch, customerId: custId, sellerName: st.user.name.split(' ')[0],
      lines: st.cart, orderDiscountPct: st.orderDiscountPct, payments, change, queued: st.offline,
    }
    const { inventory, movements } = applyMoves(st.inventory, st.movements, st.cart.map((l) => ({ type: 'sale' as const, sku: l.sku, qty: -l.qty, branchId: st.branch, userName: sale.sellerName })))
    set({
      inventory, movements, customers, custSeq, saleSeq: st.saleSeq + 1,
      sales: st.offline ? st.sales : [sale, ...st.sales],
      queue: st.offline ? [sale, ...st.queue] : st.queue,
      cart: [], orderDiscountPct: 0,
    })
    return { ok: true, sale }
  },

  processReturn: (saleNo, lineIndexes, reason) => {
    const st = get()
    const sale = st.sales.find((s) => s.no === saleNo)
    if (!sale || !lineIndexes.length || !st.user) return false
    if (dayClosed(st.closedDays, sale.branchId)) return false
    // A line goes back once. Returns are keyed to the sale by line index.
    const already = returnedLineIndexes(st.returns, sale)
    const idx = lineIndexes.filter((i) => !already.has(i))
    if (!idx.length) return false
    const picked = sale.lines.filter((_, i) => idx.includes(i))
    const { inventory, movements } = applyMoves(st.inventory, st.movements, picked.map((l) => ({ type: 'return' as const, sku: l.sku, qty: l.qty, branchId: sale.branchId, userName: st.user!.name.split(' ')[0] })))
    const refundUsd = picked.reduce((a, l) => a + lineTotal(l), 0) * (1 - (sale.orderDiscountPct || 0) / 100)
    const rec: ReturnRecord = { id: 'RET-' + retSeq++, saleNo, date: todayStr(), branchId: sale.branchId, lines: picked, lineIndexes: idx, reason, refundUsd, userName: st.user.name.split(' ')[0] }
    set({ inventory, movements, returns: [rec, ...st.returns] })
    return true
  },

  requestTransfer: (from, to, sku, qty) => {
    const st = get()
    if (from === to || !(qty > 0) || !st.variants.some((v) => v.sku === sku)) return false
    if (qty > (st.inventory[sku]?.[from] || 0)) return false
    set({ transfers: [{ id: 'T-' + st.trSeq, date: todayStr(), from, to, sku, qty, status: 'requested' }, ...st.transfers], trSeq: st.trSeq + 1 })
    return true
  },
  advanceTransfer: (id) => {
    const st = get()
    if (!st.user) return { ok: false, reason: 'invalid' }
    const t = st.transfers.find((x) => x.id === id)
    if (!t) return { ok: false, reason: 'invalid' }
    const userName = st.user.name.split(' ')[0]
    if (t.status === 'requested') {
      if (dayClosed(st.closedDays, t.from)) return { ok: false, reason: 'closed' }
      // Stock may have been sold since the request — never let the ledger go negative.
      if (t.qty > (st.inventory[t.sku]?.[t.from] || 0)) return { ok: false, reason: 'stock' }
      const { inventory, movements } = applyMoves(st.inventory, st.movements, [{ type: 'transferOut', sku: t.sku, qty: -t.qty, branchId: t.from, userName }])
      set({ inventory, movements, transfers: st.transfers.map((x) => (x.id === id ? { ...x, status: 'sent' } : x)) })
      return { ok: true }
    }
    if (t.status === 'sent') {
      if (dayClosed(st.closedDays, t.to)) return { ok: false, reason: 'closed' }
      const { inventory, movements } = applyMoves(st.inventory, st.movements, [{ type: 'transferIn', sku: t.sku, qty: t.qty, branchId: t.to, userName }])
      set({ inventory, movements, transfers: st.transfers.map((x) => (x.id === id ? { ...x, status: 'received' } : x)) })
      return { ok: true }
    }
    return { ok: false, reason: 'invalid' }
  },

  addCustomer: (phone, name) => {
    const st = get()
    const digits = phone.replace(/\D/g, '')
    if (st.customers.some((c) => c.phone.replace(/\D/g, '') === digits)) return false
    set({ customers: [...st.customers, { id: st.custSeq, name: name.trim(), phone, points: 0, sizePreferences: '—', lastPurchaseDate: null }], custSeq: st.custSeq + 1 })
    return true
  },

  addSupplier: (name) => {
    const st = get()
    const clean = name.trim()
    const found = st.suppliers.find((x) => x.name.trim().toLowerCase() === clean.toLowerCase())
    if (found) return found.id
    const sup: Supplier = { id: 'SUP-' + supSeq++, name: clean, country: '—', phone: '—' }
    set({ suppliers: [...st.suppliers, sup] })
    return sup.id
  },

  addProduct: (draft) => {
    const st = get()
    if (!st.user) return false
    const code = draft.code.trim().toUpperCase()
    if (!code || st.products.some((p) => p.code.toUpperCase() === code)) return false
    // Only the owner chooses the destination branch; everyone else stocks their own.
    const branchId: BranchId = st.user.role === 'owner' ? draft.branchId : st.user.branchId
    const userName = st.user.name.split(' ')[0]
    const product: Product = {
      code, name: { ar: draft.nameAr.trim(), en: draft.nameEn.trim() || draft.nameAr.trim() },
      typeId: draft.typeId,
      // Derived from the type, never free text: category.en stays the grouping key
      // for POS chips, the margin report and the CSV export.
      category: { ...ITEM_TYPE_NAMES[draft.typeId] },
      supplierId: draft.supplierId, image: draft.image,
      season: '—', brand: 'Arwa',
      price: draft.price, cost: draft.cost || 0, sizes: draft.sizes, colors: draft.colors,
      createdAt: todayStr(), active: true,
    }
    const newVariants: Variant[] = []
    const invPatch: InventoryMap = {}
    const receipts: { type: MovementType; sku: string; qty: number; branchId: BranchId; userName: string; reason?: string }[] = []
    draft.sizes.forEach((s, si) => draft.colors.forEach((c, ci) => {
      const sku = `${code}-${s}-${c}`
      const barcode = '622' + String(st.products.length).padStart(3, '0') + String(si).padStart(2, '0') + String(ci).padStart(2, '0') + '9'
      newVariants.push({ sku, productCode: code, size: s, color: c, barcode })
      invPatch[sku] = { tr: 0, bn: 0, ms: 0 }
      const qty = Math.floor(draft.quantities[`${s}-${c}`] || 0)
      if (qty > 0) receipts.push({ type: 'receipt', sku, qty, branchId, userName, reason: 'opening stock' })
    }))
    // Opening stock is posted as receipt movements on top of the zero rows — the
    // ledger stays the only thing that ever changes on-hand quantities.
    const seeded: InventoryMap = { ...st.inventory, ...invPatch }
    const { inventory, movements } = receipts.length ? applyMoves(seeded, st.movements, receipts) : { inventory: seeded, movements: st.movements }
    set({ products: [...st.products, product], variants: [...st.variants, ...newVariants], inventory, movements })
    return true
  },

  updateProduct: (code, patch) => set((st) => ({ products: st.products.map((p) => (p.code === code ? { ...p, ...patch } : p)) })),

  setCashCounted: (branchId, field, value) => set((st) => ({ cashCounted: { ...st.cashCounted, [branchId]: { ...st.cashCounted[branchId], [field]: value } } })),
  closeDay: (branchId) => set((st) => ({ closedDays: { ...st.closedDays, [branchId + ':' + todayStr()]: true } })),

  createPurchaseOrder: ({ supplierId, branchId, items, freightUsd, customsUsd, clearingUsd }) => {
    const st = get()
    const po: PurchaseOrder = {
      id: 'PO-' + poSeq++, supplierId, branchId, date: todayStr(), status: 'ordered',
      // Two rows for the same style become one line, so receiving can key by code.
      items: Object.values(items.reduce<Record<string, PurchaseOrder['items'][number]>>((acc, i) => {
        const cur = acc[i.productCode]
        acc[i.productCode] = cur
          ? { ...cur, qtyOrdered: cur.qtyOrdered + i.qtyOrdered, unitCostUsd: (cur.unitCostUsd * cur.qtyOrdered + i.unitCostUsd * i.qtyOrdered) / (cur.qtyOrdered + i.qtyOrdered) }
          : { productCode: i.productCode, sizeBreakdown: {}, qtyOrdered: i.qtyOrdered, qtyReceived: 0, unitCostUsd: i.unitCostUsd }
        return acc
      }, {})),
      freightUsd, customsUsd, clearingUsd,
    }
    set({ purchaseOrders: [po, ...st.purchaseOrders] })
  },

  receivePurchaseOrder: (poId, rawReceipts) => {
    const st = get()
    const po = st.purchaseOrders.find((p) => p.id === poId)
    if (!po || !st.user) return { ok: false, reason: 'invalid' }
    if (dayClosed(st.closedDays, po.branchId)) return { ok: false, reason: 'closed' }
    // Merge by code and cap at what is still outstanding on the order.
    const receipts = Object.values(rawReceipts.reduce<Record<string, { productCode: string; qty: number }>>((acc, r) => {
      const item = po.items.find((i) => i.productCode === r.productCode)
      if (!item) return acc
      const outstanding = item.qtyOrdered - item.qtyReceived - (acc[r.productCode]?.qty || 0)
      const qty = Math.min(Math.max(0, Math.floor(r.qty)), Math.max(0, outstanding))
      if (qty > 0) acc[r.productCode] = { productCode: r.productCode, qty: (acc[r.productCode]?.qty || 0) + qty }
      return acc
    }, {}))
    if (!receipts.length) return { ok: false, reason: 'invalid' }
    // Freight, customs and clearing are spread over the units ORDERED, so partial
    // receipts each carry their share and never re-charge the whole shipment.
    const orderedUnits = po.items.reduce((a, i) => a + i.qtyOrdered, 0)
    const overheadPerUnit = orderedUnits > 0 ? (po.freightUsd + po.customsUsd + po.clearingUsd) / orderedUnits : 0

    let products = st.products
    const moves: { type: MovementType; sku: string; qty: number; branchId: BranchId; userName: string }[] = []
    const userName = st.user.name.split(' ')[0]

    receipts.forEach((r) => {
      const product = products.find((p) => p.code === r.productCode)
      const poItem = po.items.find((i) => i.productCode === r.productCode)
      if (!product || !poItem) return
      const landedUnitCost = poItem.unitCostUsd + overheadPerUnit
      // Weighted average with what is already on the shelves, so one shipment never
      // rewrites the cost of stock bought earlier at another price.
      const variants = st.variants.filter((v) => v.productCode === r.productCode)
      const onHand = variants.reduce((a, v) => a + (st.inventory[v.sku]?.tr || 0) + (st.inventory[v.sku]?.bn || 0) + (st.inventory[v.sku]?.ms || 0), 0)
      const newCost = Math.round(((onHand * product.cost + r.qty * landedUnitCost) / (onHand + r.qty)) * 100) / 100
      products = products.map((p) => (p.code === r.productCode ? { ...p, cost: newCost } : p))
      if (!variants.length) return
      // Distribute: by the order's size breakdown when it has one (spread over that
      // size's colours), otherwise round-robin one unit at a time — never rounding to zero.
      const perSku: Record<string, number> = {}
      let remaining = r.qty
      const sizesWanted = Object.entries(poItem.sizeBreakdown).filter(([, n]) => (n || 0) > 0)
      if (sizesWanted.length) {
        const totalWanted = sizesWanted.reduce((a, [, n]) => a + (n || 0), 0)
        sizesWanted.forEach(([size, n], si) => {
          const pool = variants.filter((v) => v.size === size)
          if (!pool.length) return
          const share = si === sizesWanted.length - 1 ? remaining : Math.min(remaining, Math.round((r.qty * (n || 0)) / totalWanted))
          for (let k = 0; k < share; k++) perSku[pool[k % pool.length].sku] = (perSku[pool[k % pool.length].sku] || 0) + 1
          remaining -= share
        })
      }
      for (let k = 0; remaining > 0; k++, remaining--) perSku[variants[k % variants.length].sku] = (perSku[variants[k % variants.length].sku] || 0) + 1
      Object.entries(perSku).forEach(([sku, qty]) => moves.push({ type: 'receipt', sku, qty, branchId: po.branchId, userName }))
    })
    const { inventory, movements } = applyMoves(st.inventory, st.movements, moves)

    const items = po.items.map((it) => {
      const r = receipts.find((x) => x.productCode === it.productCode)
      return r ? { ...it, qtyReceived: Math.min(it.qtyOrdered, it.qtyReceived + r.qty) } : it
    })
    const allDone = items.every((it) => it.qtyReceived >= it.qtyOrdered)
    const anyDone = items.some((it) => it.qtyReceived > 0)
    const status: PurchaseOrder['status'] = allDone ? 'received' : anyDone ? 'partial' : po.status

    set({
      inventory, movements, products,
      purchaseOrders: st.purchaseOrders.map((p) => (p.id === poId ? { ...p, items, status, receivedDate: p.receivedDate || todayStr() } : p)),
    })
    return { ok: true }
  },

  closePurchaseOrder: (poId) => set((st) => ({ purchaseOrders: st.purchaseOrders.map((p) => (p.id === poId ? { ...p, status: 'closed' } : p)) })),

  addExpense: (e) => {
    if (!Number.isFinite(e.amountUsd) || e.amountUsd <= 0 || !e.description.trim()) return false
    set((st) => ({ expenses: [{ id: 'EXP-' + expSeq++, ...e }, ...st.expenses] }))
    return true
  },

  startStockCount: (branchId) => {
    const st = get()
    // One open session per branch: a second tap resumes the count instead of duplicating it.
    const open = st.stockCounts.find((s) => s.branchId === branchId && s.status === 'open')
    if (open) return open.id
    const lines = st.variants.map((v) => ({ sku: v.sku, expectedQty: st.inventory[v.sku]?.[branchId] || 0, countedQty: null as number | null }))
    const session: StockCountSession = { id: 'SC-' + scSeq++, branchId, date: todayStr(), status: 'open', userName: st.user?.name.split(' ')[0] || '—', lines }
    set({ stockCounts: [session, ...st.stockCounts] })
    return session.id
  },
  setStockCountLine: (sessionId, sku, countedQty) => set((st) => ({
    stockCounts: st.stockCounts.map((s) => (s.id === sessionId ? { ...s, lines: s.lines.map((l) => (l.sku === sku ? { ...l, countedQty } : l)) } : s)),
  })),
  postStockCount: (sessionId) => {
    const st = get()
    const session = st.stockCounts.find((s) => s.id === sessionId)
    if (!session || !st.user || session.status === 'posted') return { ok: false, reason: 'invalid' }
    if (dayClosed(st.closedDays, session.branchId)) return { ok: false, reason: 'closed' }
    const userName = st.user.name.split(' ')[0]
    // The shelf count is the truth: adjust from LIVE on-hand (not the figure shown when
    // the session opened), so a sale made mid-count doesn't corrupt the result.
    const moves = session.lines
      .filter((l) => l.countedQty != null)
      .map((l) => ({ type: 'countAdjustment' as const, sku: l.sku, qty: (l.countedQty as number) - (st.inventory[l.sku]?.[session.branchId] || 0), branchId: session.branchId, userName, reason: 'stock count' }))
      .filter((m) => m.qty !== 0)
    const { inventory, movements } = applyMoves(st.inventory, st.movements, moves)
    set({
      inventory, movements,
      stockCounts: st.stockCounts.map((s) => (s.id === sessionId ? { ...s, status: 'posted', postedAt: todayStr() } : s)),
    })
    return { ok: true }
  },

  setFxRate: (rate) => set({ fxRate: rate }),
  setLowStockThreshold: (n) => set({ lowStockThreshold: n }),
}))

/** Exact lookup through the variant index — a prefix match would confuse `ARW-1101`
 *  with a later `ARW-1101-A`. Falls back to the longest matching code for SKUs that
 *  predate the variant list (none today). */
export function productForSku(products: Product[], sku: string, variants?: Variant[]): Product | undefined {
  const v = variants?.find((x) => x.sku === sku)
  if (v) return products.find((p) => p.code === v.productCode)
  let best: Product | undefined
  for (const p of products) if (sku.startsWith(p.code + '-') && (!best || p.code.length > best.code.length)) best = p
  return best
}
