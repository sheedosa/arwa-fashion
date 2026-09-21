import { MapPin } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { COLORS } from '../../lib/mockData'
import { fmtUsd } from '../../lib/currency'
import { variantMeta, productName } from '../../lib/variantDisplay'
import { ProductImage } from '../../components/ui/ProductImage'
import type { Branch, Product, Variant } from '../../lib/types'

interface Props {
  v: Variant
  p: Product
  qty: number
  other: Branch[]
  otherQty: number
  lowStockThreshold: number
  /** 'row' = full-width row on phone: more room for Arabic names and the
   *  "available at another branch" hint, and a bigger tap target than a tile. */
  layout: 'grid' | 'row'
  onAdd: () => void
}

export function ProductTile({ v, p, qty, other, otherQty, lowStockThreshold, layout, onAdd }: Props) {
  const { t, lang } = useI18n()
  const nm = useNm()
  const row = layout === 'row'
  const qtyColor = qty === 0 ? 'var(--color-neutral-500)'
    : qty <= lowStockThreshold ? 'var(--color-accent-300)'
    : 'color-mix(in srgb, var(--color-text) 55%, transparent)'
  const swatch = (size: number) => (
    <span style={{ width: size, height: size, borderRadius: '50%', flex: 'none', border: '1px solid var(--color-divider)', backgroundColor: COLORS[v.color].hex }} />
  )

  return (
    <button
      type="button"
      onClick={onAdd}
      style={{
        textAlign: 'start', cursor: 'pointer', display: 'flex',
        flexDirection: row ? 'row' : 'column',
        alignItems: row ? 'center' : undefined,
        gap: row ? 10 : 8,
        minHeight: row ? 64 : undefined,
        padding: row ? '10px 14px' : '10px 12px',
        background: 'var(--color-surface)', border: '1px solid var(--color-divider)',
        borderRadius: 'var(--radius-md)', color: 'var(--color-text)',
        opacity: qty === 0 ? 0.55 : 1,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-divider)')}
    >
      {/* The photo leads in both layouts (48px in a row, 56px in a tile); a compact
          thumbnail rather than a banner keeps the POS grid dense enough to scan. */}
      {row && <ProductImage src={p.image} size={48} radius="var(--radius-sm)" />}
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, flex: row ? 1 : undefined, minWidth: 0, width: row ? undefined : '100%' }}>
        {!row && <ProductImage src={p.image} size={56} radius="var(--radius-sm)" />}
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: row ? 'var(--fs-body)' : 14.5, fontWeight: 500, lineHeight: 1.3 }}>{productName(lang, p)}</span>
          <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: row ? 'var(--fs-meta)' : 12.5 }}>
            {swatch(10)}
            {variantMeta(lang, v)}
          </span>
          {qty === 0 && other.length > 0 && (
            <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--color-accent-300)' }}>
              <MapPin style={{ display: 'inline', verticalAlign: '-2px' }} /> {t.elsewhere} {nm(other[0].name)} ({otherQty})
            </span>
          )}
        </span>
      </span>
      <span style={{
        display: 'flex', flex: 'none',
        flexDirection: row ? 'column' : 'row',
        alignItems: row ? 'flex-end' : 'center',
        justifyContent: row ? undefined : 'space-between',
        gap: row ? 2 : undefined,
        width: row ? undefined : '100%',
        marginTop: row ? 0 : 2,
      }}>
        <span style={{ color: 'var(--color-accent)', fontSize: row ? 'var(--fs-lead)' : 15.5 }}>{fmtUsd(p.price)}</span>
        <span style={{ fontSize: row ? 'var(--fs-micro)' : 12.5, color: qtyColor }}>{qty > 0 ? `${t.qty} ${qty}` : t.outStock}</span>
      </span>
    </button>
  )
}
