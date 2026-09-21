import { useMemo, useState, type CSSProperties } from 'react'
import { DownloadSimple, MapPin } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { useIsPhone } from '../../lib/useMediaQuery'
import { BRANCHES } from '../../lib/mockData'
import { movementLabel, reasonLabel } from '../../lib/analytics'
import { variantMeta, productName } from '../../lib/variantDisplay'
import { exportCsv } from '../../lib/csv'
import { Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Card, CardKicker } from '../../components/ui/Card'
import { Chip, Tag } from '../../components/ui/Tag'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { ProductImage } from '../../components/ui/ProductImage'
import type { BranchId, Variant } from '../../lib/types'

export function InventoryScreen() {
  const { t, lang } = useI18n()
  const nm = useNm()
  const isPhone = useIsPhone()
  const products = useStore((s) => s.products)
  const variants = useStore((s) => s.variants)
  const inventory = useStore((s) => s.inventory)
  const movements = useStore((s) => s.movements)
  const branch = useStore((s) => s.branch)
  const lowStockThreshold = useStore((s) => s.lowStockThreshold)

  const [query, setQuery] = useState('')
  const [invBranch, setInvBranch] = useState<BranchId | null>(null)
  const activeBranch = invBranch || branch

  const q = query.trim().toLowerCase()
  const allRows = useMemo(() => variants.filter((v) => {
    if (!q) return true
    const p = products.find((pp) => pp.code === v.productCode)!
    return v.sku.toLowerCase().includes(q) || p.name.ar.includes(query.trim()) || p.name.en.toLowerCase().includes(q)
  }), [variants, products, q, query])
  const rows = allRows.slice(0, 80)

  const columns: Column<Variant>[] = [
    { key: 'sku', header: 'SKU', role: 'meta', ltr: true, tdClassName: 'text-muted', tdStyle: { fontSize: 'var(--fs-meta)' }, cell: (v) => v.sku },
    { key: 'product', header: t.product, role: 'title', cell: (v) => {
      const p = products.find((pp) => pp.code === v.productCode)!
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <ProductImage src={p.image} size={40} radius="var(--radius-sm)" />
          <span style={{ minWidth: 0 }}>
            <div>{productName(lang, p)}</div>
            <div className="text-muted" style={{ fontSize: 'var(--fs-meta)', fontWeight: 400 }}>{variantMeta(lang, v)}</div>
          </span>
        </span>
      )
    } },
    { key: 'qty', header: t.qty, cell: (v) => {
      const qty = inventory[v.sku]?.[activeBranch] || 0
      return (
        <Tag style={{
          background: qty === 0 ? 'var(--color-neutral-900)' : qty <= lowStockThreshold ? 'var(--color-accent-800)' : 'var(--color-neutral-800)',
          color: qty === 0 ? 'var(--color-neutral-400)' : qty <= lowStockThreshold ? 'var(--color-accent-100)' : 'var(--color-neutral-100)',
        }}>{qty === 0 ? t.outStock : qty}</Tag>
      )
    } },
    { key: 'elsewhere', header: t.elsewhere, tdStyle: { fontSize: 'var(--fs-meta)', color: 'var(--color-accent-300)' }, cell: (v) => {
      const qty = inventory[v.sku]?.[activeBranch] || 0
      const other = BRANCHES.filter((b) => b.id !== activeBranch && (inventory[v.sku]?.[b.id] || 0) > 0)
      return qty === 0 && other.length > 0
        ? <span style={{ color: 'var(--color-accent-300)' }}><MapPin style={{ display: 'inline', verticalAlign: '-2px' }} /> {nm(other[0].name)} ({inventory[v.sku]?.[other[0].id] || 0})</span>
        : null
    } },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Inventory">
      <h3 style={{ margin: 0 }}>{t.inventory}</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input kind="search" style={{ flex: '1 1 200px', maxWidth: 300 }} placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button
          variant="secondary"
          onClick={() => exportCsv(`inventory-${activeBranch}.csv`, ['SKU', 'Product', 'Size', 'Colour', 'Qty'], allRows.map((v) => {
            const p = products.find((pp) => pp.code === v.productCode)!
            return [v.sku, p.name.en, v.size, v.color, inventory[v.sku]?.[activeBranch] || 0]
          }))}
        >
          <DownloadSimple />{t.export}
        </Button>
        <div className="chip-row" style={{ flex: '1 1 100%' }}>
          {BRANCHES.map((b) => (
            <Chip key={b.id} label={nm(b.name)} selected={activeBranch === b.id} onClick={() => setInvBranch(b.id)} />
          ))}
          <span className="text-muted" style={{ fontSize: 'var(--fs-meta)', marginInlineStart: 'auto', alignSelf: 'center', whiteSpace: 'nowrap' }}>{allRows.length} {lang === 'ar' ? 'صنف' : 'variants'}</span>
        </div>
      </div>
      <div className="grid-2" style={{ '--grid-2-cols': 'minmax(0,2fr) minmax(280px,1fr)' } as CSSProperties}>
        <Card style={{ padding: isPhone ? 0 : '6px 18px', background: isPhone ? 'transparent' : undefined }}>
          <DataTable rows={rows} columns={columns} rowKey={(v) => v.sku} pane={!isPhone} />
        </Card>
        <Card>
          <CardKicker>{t.lastMovs}</CardKicker>
          {movements.slice(0, 8).map((m) => (
            <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 'var(--fs-body)', padding: '4px 0', flexWrap: 'wrap' }}>
              <span className="text-muted" style={{ fontSize: 'var(--fs-micro)', flex: 'none' }}>{m.time}</span>
              <span style={{ color: m.qty > 0 ? 'var(--color-accent-300)' : 'var(--color-neutral-400)' }}>{movementLabel(lang, m.type)}</span>
              <span className="ltr-cell" style={{ marginInlineStart: 'auto' }}>{m.qty > 0 ? '+' : ''}{m.qty}</span>
              <span className="text-muted" style={{ flex: '1 1 100%', fontSize: 'var(--fs-meta)' }}>{m.sku} · {nm(BRANCHES.find((b) => b.id === m.branchId)!.name)} · {m.userName}{m.reason ? ` · ${reasonLabel(lang, m.reason)}` : ''}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
