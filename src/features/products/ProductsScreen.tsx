import { useState } from 'react'
import { DownloadSimple, Plus } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { useBreakpoint } from '../../lib/useMediaQuery'
import { BRANCHES } from '../../lib/mockData'
import { itemTypeName } from '../../lib/itemTypes'
import { fmtUsd } from '../../lib/currency'
import { productName } from '../../lib/variantDisplay'
import { productQtyAtBranch } from '../../lib/stock'
import { exportCsv } from '../../lib/csv'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Tag } from '../../components/ui/Tag'
import { ProductImage } from '../../components/ui/ProductImage'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { NewProductDialog } from './NewProductDialog'
import { ProductDetail } from './ProductDetail'
import type { Product } from '../../lib/types'

export function ProductsScreen() {
  const { t, lang } = useI18n()
  const nm = useNm()
  // Ten columns: cards below the laptop tier, like the purchase-order list.
  const isDesktop = useBreakpoint('laptop')
  const products = useStore((s) => s.products)
  const variants = useStore((s) => s.variants)
  const inventory = useStore((s) => s.inventory)
  const suppliers = useStore((s) => s.suppliers)
  const branch = useStore((s) => s.branch)
  const user = useStore((s) => s.user)
  const [npOpen, setNpOpen] = useState(false)
  const [openCode, setOpenCode] = useState<string | null>(null)
  const canSeeCost = user?.role === 'owner'

  const branchName = nm(BRANCHES.find((b) => b.id === branch)!.name)
  const qtyAt = (p: Product) => productQtyAtBranch(p, variants, inventory, branch)
  const supplierName = (p: Product) => suppliers.find((s) => s.id === p.supplierId)?.name || '—'
  const detail = openCode ? products.find((p) => p.code === openCode) : null

  const columns: Column<Product>[] = [
    // The card headline is baseline-aligned, so the thumbnail gets its own centred row.
    { key: 'name', header: t.product, role: 'title', cell: (p) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <ProductImage src={p.image} size={44} radius="var(--radius-sm)" />
        <span style={{ minWidth: 0 }}>{productName(lang, p)}</span>
      </span>
    ) },
    { key: 'code', header: t.itemCode, role: 'meta', ltr: true, tdClassName: 'text-muted', tdStyle: { fontSize: 'var(--fs-meta)', whiteSpace: 'nowrap' }, cell: (p) => p.code },
    { key: 'type', header: t.itemType, tdClassName: 'text-muted', cell: (p) => itemTypeName(lang, p.typeId) },
    { key: 'qty', header: isDesktop ? t.itemQty : `${t.itemQty} · ${branchName}`, cell: (p) => qtyAt(p) },
    { key: 'price', header: t.salePrice, cell: (p) => fmtUsd(p.price) },
    { key: 'cost', header: t.costPrice, hidden: !canSeeCost, tdClassName: 'text-muted', cell: (p) => fmtUsd(p.cost) },
    { key: 'supplier', header: t.supplierName, tdClassName: 'text-muted', cell: (p) => supplierName(p) },
    { key: 'status', header: t.stockStatus, cell: (p) => (qtyAt(p) > 0 ? <Tag variant="good">{t.inStock}</Tag> : <Tag variant="bad">{t.outOfStock}</Tag>) },
    { key: 'open', header: '', role: 'action', cell: (p) => <Button variant="ghost" onClick={() => setOpenCode(p.code)} aria-expanded={openCode === p.code}>{t.details}</Button> },
  ]

  const csv = () => {
    const head = ['Code', 'Name AR', 'Name EN', 'Type', 'Supplier', `Qty @ ${branch}`, 'Status', 'Price USD']
    if (canSeeCost) head.push('Cost USD')
    exportCsv('products.csv', head, products.map((p) => {
      const q = qtyAt(p)
      const row: (string | number)[] = [p.code, p.name.ar, p.name.en, p.category.en, supplierName(p), q, q > 0 ? 'in stock' : 'out of stock', p.price]
      if (canSeeCost) row.push(p.cost)
      return row
    }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Products">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, flex: 1 }}>{t.products}</h3>
        <Button variant="secondary" onClick={csv}><DownloadSimple />{t.export}</Button>
        <Button variant="primary" onClick={() => setNpOpen(true)}><Plus />{t.newProduct}</Button>
      </div>
      <span className="text-muted" style={{ fontSize: 'var(--fs-meta)', marginTop: -6 }}>{t.stockAtBranch}: {branchName}</span>
      <Card style={{ padding: isDesktop ? '6px 14px' : 0, background: isDesktop ? undefined : 'transparent' }}>
        <DataTable rows={products} columns={columns} rowKey={(p) => p.code} stacked={!isDesktop} pane={isDesktop && products.length > 12} />
      </Card>
      {detail && <ProductDetail p={detail} canSeeCost={!!canSeeCost} onClose={() => setOpenCode(null)} />}
      {npOpen && <NewProductDialog onClose={() => setNpOpen(false)} canSeeCost={!!canSeeCost} />}
    </div>
  )
}
