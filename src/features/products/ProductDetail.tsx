import type { ReactNode } from 'react'
import { X } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { useIsPhone } from '../../lib/useMediaQuery'
import { BRANCHES, COLORS } from '../../lib/mockData'
import { itemTypeName } from '../../lib/itemTypes'
import { fmtUsd } from '../../lib/currency'
import { productName } from '../../lib/variantDisplay'
import { productQtyByBranch } from '../../lib/stock'
import { Button } from '../../components/ui/Button'
import { Card, CardKicker } from '../../components/ui/Card'
import { Tag } from '../../components/ui/Tag'
import { ProductImage } from '../../components/ui/ProductImage'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { sizeLabel } from './qty'
import type { Product, Variant } from '../../lib/types'

/** Every field from the client's item-details list, then stock per branch and per variant. */
export function ProductDetail({ p, canSeeCost, onClose }: { p: Product; canSeeCost: boolean; onClose: () => void }) {
  const { t, lang } = useI18n()
  const nm = useNm()
  const isPhone = useIsPhone()
  const variants = useStore((s) => s.variants)
  const inventory = useStore((s) => s.inventory)
  const suppliers = useStore((s) => s.suppliers)
  const branch = useStore((s) => s.branch)

  const byBranch = productQtyByBranch(p, variants, inventory)
  const qtyHere = byBranch[branch]
  const supplier = suppliers.find((s) => s.id === p.supplierId)
  const rows = variants.filter((v) => v.productCode === p.code)

  const swatch = (code: Variant['color']) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 11, height: 11, borderRadius: '50%', flex: 'none', background: COLORS[code].hex, border: '1px solid var(--color-divider)' }} />
      {lang === 'ar' ? COLORS[code].name.ar : COLORS[code].name.en}
    </span>
  )

  const facts: { label: string; value: ReactNode; hidden?: boolean }[] = [
    { label: t.itemCode, value: <span className="ltr-cell">{p.code}</span> },
    { label: t.itemType, value: itemTypeName(lang, p.typeId) },
    { label: t.supplierName, value: supplier?.name || '—' },
    { label: `${t.itemQty} · ${nm(BRANCHES.find((b) => b.id === branch)!.name)}`, value: qtyHere },
    { label: t.salePrice, value: fmtUsd(p.price) },
    { label: t.costPrice, value: fmtUsd(p.cost), hidden: !canSeeCost },
    { label: t.sizesL, value: p.sizes.map((s) => sizeLabel(s, lang)).join(' · ') },
    { label: t.colorsL, value: <span style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>{p.colors.map((c) => <span key={c}>{swatch(c)}</span>)}</span> },
    { label: t.stockStatus, value: qtyHere > 0 ? <Tag variant="good">{t.inStock}</Tag> : <Tag variant="bad">{t.outOfStock}</Tag> },
  ]

  const variantCols: Column<Variant>[] = [
    { key: 'sku', header: 'SKU', ltr: true, tdClassName: 'text-muted', tdStyle: { fontSize: 'var(--fs-meta)' }, cell: (v) => v.sku },
    { key: 'size', header: t.sizeLabel, cell: (v) => sizeLabel(v.size, lang) },
    { key: 'color', header: t.colorsL, cell: (v) => swatch(v.color) },
    ...BRANCHES.map<Column<Variant>>((b) => ({
      key: b.id, header: nm(b.name),
      tdStyle: b.id === branch ? { fontWeight: 500 } : undefined,
      cell: (v) => {
        const q = inventory[v.sku]?.[b.id] || 0
        return <span style={{ color: q === 0 ? 'var(--color-neutral-400)' : undefined }}>{q}</span>
      },
    })),
  ]

  return (
    <Card className="elev-md" style={{ gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <CardKicker>{t.itemDetails}</CardKicker>
          <div style={{ fontSize: 'var(--fs-lead)', fontWeight: 500 }}>{productName(lang, p)}</div>
        </div>
        <Button variant="ghost" icon onClick={onClose} aria-label={t.close}><X /></Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'minmax(200px, 260px) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
        <ProductImage src={p.image} size={isPhone ? 'min(260px, 100%)' : '100%'} radius="var(--radius-lg)" alt={p.image ? productName(lang, p) : ''}
          style={{ aspectRatio: '1 / 1', height: 'auto', justifySelf: 'center' }} />
        <dl style={{ margin: 0 }}>
          {facts.filter((f) => !f.hidden).map((f) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, minHeight: 34, padding: '5px 0', borderBottom: '1px solid var(--color-divider)' }}>
              <dt className="text-muted" style={{ fontSize: 'var(--fs-meta)', flex: 'none' }}>{f.label}</dt>
              <dd style={{ margin: 0, fontSize: 'var(--fs-body)', textAlign: 'end', minWidth: 0 }}>{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <CardKicker>{t.perBranch}</CardKicker>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {BRANCHES.map((b) => (
          <div key={b.id} style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-900)', border: `1px solid ${b.id === branch ? 'var(--color-accent)' : 'var(--color-divider)'}` }}>
            <div className="text-muted" style={{ fontSize: 'var(--fs-micro)' }}>{nm(b.name)}</div>
            <div style={{ fontSize: 'var(--fs-lead)', fontWeight: 500, color: byBranch[b.id] === 0 ? 'var(--color-neutral-400)' : undefined }}>{byBranch[b.id]}</div>
          </div>
        ))}
      </div>

      <CardKicker>{t.perVariant}</CardKicker>
      <DataTable rows={rows} columns={variantCols} rowKey={(v) => v.sku} mobile="scroll" />
    </Card>
  )
}
