import { useState } from 'react'
import { Minus, Plus, Trash, DotsThree } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { fmtUsd } from '../../lib/currency'
import { lineTotal } from '../../lib/calc'
import { variantMeta, productName } from '../../lib/variantDisplay'
import { Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Tag'
import { ProductImage } from '../../components/ui/ProductImage'
import type { Product, Variant } from '../../lib/types'

interface CartLine { sku: string; qty: number; price: number; discountPct: number }

/** compact = phone/sheet: 44px targets, discount behind a disclosure.
 *  !compact = desktop side panel: the inline layout the design was approved with. */
export function CartLineRow({ l, p, v, compact }: { l: CartLine; p: Product; v: Variant; compact: boolean }) {
  const { t, lang } = useI18n()
  const bumpCartLine = useStore((s) => s.bumpCartLine)
  const setCartLineDiscount = useStore((s) => s.setCartLineDiscount)
  const removeCartLine = useStore((s) => s.removeCartLine)
  const [showMore, setShowMore] = useState(false)

  const S = compact ? 44 : 34
  // bumpCartLine already drops the line at qty 0, so "−" at qty 1 is a delete.
  const last = l.qty <= 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 10, borderBottom: '1px solid var(--color-divider)' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <ProductImage src={p.image} size={36} radius="var(--radius-sm)" />
        <span style={{ fontSize: compact ? 'var(--fs-body)' : 14.5, fontWeight: 500, flex: 1, minWidth: 0 }}>{productName(lang, p)}</span>
        <span style={{ fontSize: compact ? 'var(--fs-body)' : 14.5 }}>{fmtUsd(lineTotal(l))}</span>
      </div>
      {/* variant meta is what the cashier reads to confirm size/colour — never the smallest text */}
      <div className="text-muted" style={{ fontSize: compact ? 'var(--fs-meta)' : 12.5 }}>
        {variantMeta(lang, v)} · {fmtUsd(l.price)}
        {l.discountPct > 0 && <> · <span style={{ color: 'var(--color-accent-300)' }}>−{l.discountPct}%</span></>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 'none' }}>
          <Button variant="secondary" icon danger={last} style={{ width: S, height: S, minWidth: S, minHeight: S }}
            aria-label={last ? t.removeLine : '−'} onClick={() => bumpCartLine(l.sku, -1)}>
            {last ? <Trash /> : <Minus />}
          </Button>
          <span style={{ minWidth: compact ? 34 : 24, textAlign: 'center', fontSize: compact ? 17 : 15.5 }}>{l.qty}</span>
          <Button variant="secondary" icon style={{ width: S, height: S, minWidth: S, minHeight: S }} aria-label="+" onClick={() => bumpCartLine(l.sku, 1)}>
            <Plus />
          </Button>
        </div>

        {compact ? (
          <Button variant="ghost" icon style={{ marginInlineStart: 'auto' }} aria-expanded={showMore} aria-label={t.details}
            onClick={() => setShowMore((s) => !s)}>
            <DotsThree weight="bold" />
          </Button>
        ) : (
          <>
            <span className="text-muted" style={{ fontSize: 12.5, marginInlineStart: 8 }}>{t.lineDisc}</span>
            <Input kind="percent" tight style={{ width: 56 }} value={l.discountPct || ''} aria-label={t.lineDisc}
              onChange={(e) => setCartLineDiscount(l.sku, parseFloat(e.target.value) || 0)} />
            <Button variant="ghost" icon style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, marginInlineStart: 'auto' }}
              aria-label={t.removeLine} onClick={() => removeCartLine(l.sku)}>
              <Trash style={{ fontSize: 14.5 }} />
            </Button>
          </>
        )}
      </div>

      {compact && showMore && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0 2px' }}>
          <span className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{t.lineDisc}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {[0, 5, 10, 20].map((d) => (
              <Chip key={d} label={`${d}%`} selected={(l.discountPct || 0) === d} onClick={() => setCartLineDiscount(l.sku, d)} />
            ))}
            <Input kind="percent" style={{ width: 84, textAlign: 'center' }} value={l.discountPct || ''} aria-label={t.lineDisc}
              onChange={(e) => setCartLineDiscount(l.sku, parseFloat(e.target.value) || 0)} />
          </div>
          <Button variant="ghost" block danger style={{ justifyContent: 'center' }} onClick={() => removeCartLine(l.sku)}>
            <Trash />{t.removeLine}
          </Button>
        </div>
      )}
    </div>
  )
}
