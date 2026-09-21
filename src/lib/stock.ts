import type { BranchId, InventoryMap, Product, Variant } from './types'
import { BRANCHES } from './mockData'

/** Units of a product (all its size × colour variants) on hand at one branch. */
export function productQtyAtBranch(p: Product, variants: Variant[], inventory: InventoryMap, branchId: BranchId): number {
  return variants.reduce((sum, v) => (v.productCode === p.code ? sum + (inventory[v.sku]?.[branchId] || 0) : sum), 0)
}

export function productQtyByBranch(p: Product, variants: Variant[], inventory: InventoryMap): Record<BranchId, number> {
  const out = { tr: 0, bn: 0, ms: 0 } as Record<BranchId, number>
  BRANCHES.forEach((b) => { out[b.id] = productQtyAtBranch(p, variants, inventory, b.id) })
  return out
}

/** Arabic-Indic digits (٠١٢…) are legal input on Libyan keyboards; parseInt is not. */
export function parseQty(v: string | undefined): number {
  if (!v) return 0
  const latin = v.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
  const n = parseInt(latin, 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}
