import { create } from 'zustand'
import type {
  User, Role, BranchId, InventoryMap, Sale, StockMovement, Customer, Transfer,
  Product, Variant, ColorCode, Size, Supplier, PurchaseOrder, Expense, StockCountSession,
  ReturnRecord, PayMethod, MovementType,
} from '../lib/types'
import {
  PRODUCTS, VARIANTS, seedInventory, seedSales, seedMovements, CUSTOMERS,
  TRANSFERS, SUPPLIERS, seedPurchaseOrders, seedExpenses, seedStockCounts, todayStr,
} from '../lib/mockData'
import { lineTotal, saleTotal } from '../lib/calc'

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
  bumpCartLine: (sku: string, delta: number) => void
  setCartLineDiscount: (sku: string, pct: number) => void
  removeCartLine: (sku: string) => void
  setOrderDiscount: (pct: number) => void
  completeSale: (args: { payUsd: number; payLyd: number; method: PayMethod; custPhone: string }) => Sale | null

  // actions — returns
  processReturn: (saleNo: string, lineIndexes: number[], reason: ReturnRecord['reason']) => void

  // actions — transfers
  requestTransfer: (from: BranchId, to: BranchId, sku: string, qty: number) => void
  advanceTransfer: (id: string) => void

  // actions — customers
  addCustomer: (phone: string, name: string) => void

  // actions — products
  addProduct: (draft: { nameAr: string; nameEn: string; code: string; category: string; price: number; cost: number; sizes: Size[]; colors: ColorCode[] }) => void

  // actions — reconciliation
  setCashCounted: (branchId: BranchId, field: 'usd' | 'lyd', value: string) => void
  closeDay: (branchId: BranchId) => void

  // actions — phase 2 purchasing
  createPurchaseOrder: (po: { supplierId: string; branchId: BranchId; items: { productCode: string; qtyOrdered: number; unitCostUsd: number }[]; freightUsd: number; customsUsd: number; clearingUsd: number }) => void
  receivePurchaseOrder: (poId: string, receipts: { productCode: string; qty: number }[]) => void
  closePurchaseOrder: (poId: string) => void

  // actions — phase 2 expenses
  addExpense: (e: { branchId: BranchId; date: string; category: Expense['category']; description: string; amountUsd: number }) => void

  // actions — phase 2 stock counts
  startStockCount: (branchId: BranchId) => void
  setStockCountLine: (sessionId: string, sku: string, countedQty: number | null) => void
  postStockCount: (sessionId: string) => void

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
  logout: () => set({ user: null, cart: [], orderDiscountPct: 0 }),
  setBranch: (b) => set({ branch: b }),
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
    const product = st.products.find((p) => sku.startsWith(p.code + '-'))
    const cart = existing
      ? st.cart.map((l) => (l.sku === sku ? { ...l, qty: l.qty + 1 } : l))
      : [...st.cart, { sku, qty: 1, price: product?.price ?? 0, discountPct: 0 }]
    set({ cart })
  },
  bumpCartLine: (sku, d) => {
    const st = get()
    const cart = st.cart.map((l) => (l.sku === sku ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0)
    const l = cart.find((x) => x.sku === sku)
    if (l && l.qty > (st.inventory[sku]?.[st.branch] || 0)) return
    set({ cart })
  },
  setCartLineDiscount: (sku, pct) => {
    const clamped = Math.min(90, Math.max(0, pct || 0))
    set((st) => ({ cart: st.cart.map((l) => (l.sku === sku ? { ...l, discountPct: clamped } : l)) }))
  },
  removeCartLine: (sku) => set((st) => ({ cart: st.cart.filter((l) => l.sku !== sku) })),
  setOrderDiscount: (pct) => set({ orderDiscountPct: Math.min(100, Math.max(0, pct || 0)) }),

  completeSale: ({ payUsd, payLyd, method, custPhone }) => {
    const st = get()
    if (!st.cart.length || !st.user) return null
    const total = saleTotal({ lines: st.cart, orderDiscountPct: st.orderDiscountPct })
    const paid = payUsd + payLyd / st.fxRate
    if (paid < total - 0.01) return null
    const over = paid - total
    const change = over > 0.01 ? (payLyd > 0 ? { currency: 'LYD' as const, amount: over * st.fxRate } : { currency: 'USD' as const, amount: over }) : null

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
    return sale
  },

  processReturn: (saleNo, lineIndexes, reason) => {
    const st = get()
    const sale = st.sales.find((s) => s.no === saleNo)
    if (!sale || !lineIndexes.length || !st.user) return
    const picked = sale.lines.filter((_, i) => lineIndexes.includes(i))
    const { inventory, movements } = applyMoves(st.inventory, st.movements, picked.map((l) => ({ type: 'return' as const, sku: l.sku, qty: l.qty, branchId: sale.branchId, userName: st.user!.name.split(' ')[0] })))
    const refundUsd = picked.reduce((a, l) => a + lineTotal(l), 0) * (1 - (sale.orderDiscountPct || 0) / 100)
    const rec: ReturnRecord = { id: 'RET-' + retSeq++, saleNo, date: todayStr(), branchId: sale.branchId, lines: picked, reason, refundUsd, userName: st.user.name.split(' ')[0] }
    set({ inventory, movements, returns: [rec, ...st.returns] })
  },

  requestTransfer: (from, to, sku, qty) => {
    const st = get()
    if (from === to || qty <= 0) return
    set({ transfers: [{ id: 'T-' + st.trSeq, date: todayStr(), from, to, sku, qty, status: 'requested' }, ...st.transfers], trSeq: st.trSeq + 1 })
  },
  advanceTransfer: (id) => {
    const st = get()
    if (!st.user) return
    const t = st.transfers.find((x) => x.id === id)
    if (!t) return
    const userName = st.user.name.split(' ')[0]
    if (t.status === 'requested') {
      const { inventory, movements } = applyMoves(st.inventory, st.movements, [{ type: 'transferOut', sku: t.sku, qty: -t.qty, branchId: t.from, userName }])
      set({ inventory, movements, transfers: st.transfers.map((x) => (x.id === id ? { ...x, status: 'sent' } : x)) })
    } else if (t.status === 'sent') {
      const { inventory, movements } = applyMoves(st.inventory, st.movements, [{ type: 'transferIn', sku: t.sku, qty: t.qty, branchId: t.to, userName }])
      set({ inventory, movements, transfers: st.transfers.map((x) => (x.id === id ? { ...x, status: 'received' } : x)) })
    }
  },

  addCustomer: (phone, name) => {
    const st = get()
    set({ customers: [...st.customers, { id: st.custSeq, name: name.trim(), phone, points: 0, sizePreferences: '—', lastPurchaseDate: null }], custSeq: st.custSeq + 1 })
  },

  addProduct: (draft) => {
    const st = get()
    const product: Product = {
      code: draft.code, name: { ar: draft.nameAr, en: draft.nameEn || draft.nameAr },
      category: { ar: draft.category || '—', en: draft.category || '—' }, season: '—', brand: 'Arwa',
      price: draft.price, cost: draft.cost || 0, sizes: draft.sizes, colors: draft.colors,
      createdAt: todayStr(), active: true,
    }
    const newVariants: Variant[] = []
    const invPatch: InventoryMap = {}
    draft.sizes.forEach((s, si) => draft.colors.forEach((c, ci) => {
      const sku = `${draft.code}-${s}-${c}`
      const barcode = '622' + String(st.products.length).padStart(3, '0') + String(si).padStart(2, '0') + String(ci).padStart(2, '0') + '9'
      newVariants.push({ sku, productCode: draft.code, size: s, color: c, barcode })
      invPatch[sku] = { tr: 0, bn: 0, ms: 0 }
    }))
    set({
      products: [...st.products, product], variants: [...st.variants, ...newVariants],
      inventory: { ...st.inventory, ...invPatch },
    })
  },

  setCashCounted: (branchId, field, value) => set((st) => ({ cashCounted: { ...st.cashCounted, [branchId]: { ...st.cashCounted[branchId], [field]: value } } })),
  closeDay: (branchId) => set((st) => ({ closedDays: { ...st.closedDays, [branchId + ':' + todayStr()]: true } })),

  createPurchaseOrder: ({ supplierId, branchId, items, freightUsd, customsUsd, clearingUsd }) => {
    const st = get()
    const po: PurchaseOrder = {
      id: 'PO-' + poSeq++, supplierId, branchId, date: todayStr(), status: 'ordered',
      items: items.map((i) => ({ productCode: i.productCode, sizeBreakdown: {}, qtyOrdered: i.qtyOrdered, qtyReceived: 0, unitCostUsd: i.unitCostUsd })),
      freightUsd, customsUsd, clearingUsd,
    }
    set({ purchaseOrders: [po, ...st.purchaseOrders] })
  },

  receivePurchaseOrder: (poId, receipts) => {
    const st = get()
    const po = st.purchaseOrders.find((p) => p.id === poId)
    if (!po || !st.user) return
    const totalUnits = receipts.reduce((a, r) => a + r.qty, 0)
    if (totalUnits <= 0) return
    const overheadPerUnit = (po.freightUsd + po.customsUsd + po.clearingUsd) / totalUnits

    let inventory = st.inventory
    let movements = st.movements
    let products = st.products
    const moves: { type: MovementType; sku: string; qty: number; branchId: BranchId; userName: string }[] = []
    const userName = st.user.name.split(' ')[0]

    receipts.forEach((r) => {
      const product = products.find((p) => p.code === r.productCode)
      if (!product) return
      const poItem = po.items.find((i) => i.productCode === r.productCode)
      // Landed unit cost = supplier price + this line's share of freight/customs/clearing,
      // allocated evenly per unit across the whole shipment.
      const landedUnitCost = Math.round(((poItem?.unitCostUsd ?? product.cost) + overheadPerUnit) * 100) / 100
      products = products.map((p) => (p.code === r.productCode ? { ...p, cost: landedUnitCost } : p))
      // distribute received units evenly across this product's colour variants for the receiving branch
      const skus = st.variants.filter((v) => v.productCode === r.productCode).map((v) => v.sku)
      if (!skus.length) return
      let remaining = r.qty
      skus.forEach((sku, i) => {
        const share = Math.round(r.qty / skus.length)
        const qty = i === skus.length - 1 ? remaining : Math.min(share, remaining)
        remaining -= qty
        if (qty > 0) moves.push({ type: 'receipt', sku, qty, branchId: po.branchId, userName })
      })
    })
    const applied = applyMoves(inventory, movements, moves)
    inventory = applied.inventory
    movements = applied.movements

    const items = po.items.map((it) => {
      const r = receipts.find((x) => x.productCode === it.productCode)
      return r ? { ...it, qtyReceived: Math.min(it.qtyOrdered, it.qtyReceived + r.qty) } : it
    })
    const allDone = items.every((it) => it.qtyReceived >= it.qtyOrdered)
    const anyDone = items.some((it) => it.qtyReceived > 0)
    const status: PurchaseOrder['status'] = allDone ? 'received' : anyDone ? 'partial' : po.status

    set({
      inventory, movements, products,
      purchaseOrders: st.purchaseOrders.map((p) => (p.id === poId ? { ...p, items, status, receivedDate: todayStr() } : p)),
    })
  },

  closePurchaseOrder: (poId) => set((st) => ({ purchaseOrders: st.purchaseOrders.map((p) => (p.id === poId ? { ...p, status: 'closed' } : p)) })),

  addExpense: (e) => set((st) => ({ expenses: [{ id: 'EXP-' + expSeq++, ...e }, ...st.expenses] })),

  startStockCount: (branchId) => {
    const st = get()
    const lines = st.variants.map((v) => ({ sku: v.sku, expectedQty: st.inventory[v.sku]?.[branchId] || 0, countedQty: null as number | null }))
    const session: StockCountSession = { id: 'SC-' + scSeq++, branchId, date: todayStr(), status: 'open', userName: st.user?.name.split(' ')[0] || '—', lines }
    set({ stockCounts: [session, ...st.stockCounts] })
  },
  setStockCountLine: (sessionId, sku, countedQty) => set((st) => ({
    stockCounts: st.stockCounts.map((s) => (s.id === sessionId ? { ...s, lines: s.lines.map((l) => (l.sku === sku ? { ...l, countedQty } : l)) } : s)),
  })),
  postStockCount: (sessionId) => {
    const st = get()
    const session = st.stockCounts.find((s) => s.id === sessionId)
    if (!session || !st.user || session.status === 'posted') return
    const userName = st.user.name.split(' ')[0]
    const moves = session.lines
      .filter((l) => l.countedQty != null && l.countedQty !== l.expectedQty)
      .map((l) => ({ type: 'countAdjustment' as const, sku: l.sku, qty: (l.countedQty as number) - l.expectedQty, branchId: session.branchId, userName, reason: 'stock count' }))
    const { inventory, movements } = applyMoves(st.inventory, st.movements, moves)
    set({
      inventory, movements,
      stockCounts: st.stockCounts.map((s) => (s.id === sessionId ? { ...s, status: 'posted', postedAt: todayStr() } : s)),
    })
  },

  setFxRate: (rate) => set({ fxRate: rate }),
  setLowStockThreshold: (n) => set({ lowStockThreshold: n }),
}))

export function productForSku(products: Product[], sku: string): Product | undefined {
  return products.find((p) => sku.startsWith(p.code + '-'))
}
