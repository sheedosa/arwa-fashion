import { useMemo, useState } from 'react'
import { Basket, Minus, Plus, X, MapPin, Money } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { BRANCHES, COLORS } from '../../lib/mockData'
import { fmtUsd, fmtLyd } from '../../lib/currency'
import { lineTotal, saleTotal } from '../../lib/calc'
import { variantMeta, productName } from '../../lib/variantDisplay'
import { Input } from '../../components/ui/Field'
import { Card } from '../../components/ui/Card'
import { Tag } from '../../components/ui/Tag'
import { Chip } from '../../components/ui/Tag'
import { Button } from '../../components/ui/Button'
import { PaymentDialog } from './PaymentDialog'
import { ReceiptDialog } from './ReceiptDialog'
import type { Sale } from '../../lib/types'

export function PosScreen() {
  const { t, lang } = useI18n()
  const nm = useNm()
  const products = useStore((s) => s.products)
  const variants = useStore((s) => s.variants)
  const inventory = useStore((s) => s.inventory)
  const branch = useStore((s) => s.branch)
  const cart = useStore((s) => s.cart)
  const orderDiscountPct = useStore((s) => s.orderDiscountPct)
  const lowStockThreshold = useStore((s) => s.lowStockThreshold)
  const addToCart = useStore((s) => s.addToCart)
  const bumpCartLine = useStore((s) => s.bumpCartLine)
  const setCartLineDiscount = useStore((s) => s.setCartLineDiscount)
  const removeCartLine = useStore((s) => s.removeCartLine)
  const setOrderDiscount = useStore((s) => s.setOrderDiscount)
  const flash = useStore((s) => s.flash)

  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('')
  const [payOpen, setPayOpen] = useState(false)
  const [receipt, setReceipt] = useState<Sale | null>(null)

  const categories = useMemo(() => [...new Set(products.map((p) => p.category.en))], [products])

  const q = query.trim().toLowerCase()
  const results = useMemo(() => {
    return variants.filter((v) => {
      const p = products.find((pp) => pp.code === v.productCode)
      if (!p) return false
      if (cat && p.category.en !== cat) return false
      if (!q) return true
      return v.sku.toLowerCase().includes(q) || p.name.ar.includes(query.trim()) || p.name.en.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    }).slice(0, 24)
  }, [variants, products, cat, q, query])

  const subtotal = cart.reduce((a, l) => a + lineTotal(l), 0)
  const total = saleTotal({ lines: cart, orderDiscountPct })
  const fxRate = useStore((s) => s.fxRate)

  const handleAdd = (sku: string) => {
    const before = useStore.getState().cart.find((l) => l.sku === sku)?.qty || 0
    addToCart(sku)
    const after = useStore.getState().cart.find((l) => l.sku === sku)?.qty || 0
    if (after === before) flash(t.noStock)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 370px', gap: 16, height: '100%', minHeight: 0 }} data-screen-label="POS">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        <Input
          style={{ minHeight: 44, fontSize: 16.5 }}
          placeholder={t.searchPos}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const sku = query.trim().toUpperCase()
              if (variants.some((v) => v.sku === sku)) { handleAdd(sku); setQuery('') }
            }
          }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Chip label={t.all} selected={!cat} onClick={() => setCat('')} />
          {categories.map((c) => {
            const label = lang === 'ar' ? products.find((p) => p.category.en === c)!.category.ar : c
            return <Chip key={c} label={label} selected={cat === c} onClick={() => setCat(c)} />
          })}
        </div>
        <div style={{ overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(168px,1fr))', gap: 10, alignContent: 'start', paddingBottom: 8 }}>
          {results.length === 0 && (
            <div className="text-muted" style={{ gridColumn: '1/-1', padding: '36px 0', textAlign: 'center' }}>{t.noResults}</div>
          )}
          {results.map((v) => {
            const p = products.find((pp) => pp.code === v.productCode)!
            const qty = inventory[v.sku]?.[branch] || 0
            const other = BRANCHES.filter((b) => b.id !== branch && (inventory[v.sku]?.[b.id] || 0) > 0)
            return (
              <button
                key={v.sku}
                onClick={() => handleAdd(v.sku)}
                style={{
                  textAlign: 'start', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5,
                  padding: '10px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-divider)',
                  borderRadius: 'var(--radius-md)', color: 'var(--color-text)', opacity: qty === 0 ? 0.55 : 1,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-divider)')}
              >
                <div style={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.3 }}>{productName(lang, p)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }} className="text-muted">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', flex: 'none', border: '1px solid var(--color-divider)', backgroundColor: COLORS[v.color].hex }} />
                  {variantMeta(lang, v)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <span style={{ color: 'var(--color-accent)', fontSize: 15.5 }}>{fmtUsd(p.price)}</span>
                  <span style={{ fontSize: 12.5, color: qty === 0 ? 'var(--color-neutral-500)' : qty <= lowStockThreshold ? 'var(--color-accent-300)' : 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>
                    {qty > 0 ? `${t.qty} ${qty}` : t.outStock}
                  </span>
                </div>
                {qty === 0 && other.length > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--color-accent-300)' }}>
                    <MapPin style={{ display: 'inline', verticalAlign: '-2px' }} /> {t.elsewhere} {nm(other[0].name)} ({inventory[v.sku]?.[other[0].id] || 0})
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <Card className="elev-sm" style={{ minHeight: 0, gap: 0, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--color-divider)' }}>
          <Basket style={{ color: 'var(--color-accent)' }} /><span style={{ fontWeight: 500 }}>{t.cart}</span>
          <Tag variant="neutral" style={{ marginInlineStart: 'auto' }}>{cart.reduce((a, l) => a + l.qty, 0)}</Tag>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cart.length === 0 && <div className="text-muted" style={{ fontSize: 14, padding: '24px 0', textAlign: 'center' }}>{t.emptyCart}</div>}
          {cart.map((l) => {
            const p = products.find((pp) => l.sku.startsWith(pp.code + '-'))!
            const v = variants.find((vv) => vv.sku === l.sku)!
            return (
              <div key={l.sku} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 10, borderBottom: '1px solid var(--color-divider)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 500, flex: 1 }}>{productName(lang, p)}</span>
                  <span style={{ fontSize: 14.5 }}>{fmtUsd(lineTotal(l))}</span>
                </div>
                <div className="text-muted" style={{ fontSize: 12.5 }}>{variantMeta(lang, v)} · {fmtUsd(l.price)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Button variant="secondary" icon style={{ width: 34, height: 34 }} onClick={() => bumpCartLine(l.sku, -1)}><Minus /></Button>
                  <span style={{ minWidth: 24, textAlign: 'center', fontSize: 15.5 }}>{l.qty}</span>
                  <Button variant="secondary" icon style={{ width: 34, height: 34 }} onClick={() => bumpCartLine(l.sku, 1)}><Plus /></Button>
                  <span className="text-muted" style={{ fontSize: 12.5, marginInlineStart: 8 }}>{t.lineDisc}</span>
                  <Input style={{ width: 52, minHeight: 30, padding: '2px 8px', fontSize: 13.5, textAlign: 'center' }} value={l.discountPct || ''} onChange={(e) => setCartLineDiscount(l.sku, parseFloat(e.target.value) || 0)} />
                  <Button variant="ghost" icon style={{ width: 30, height: 30, marginInlineStart: 'auto' }} onClick={() => removeCartLine(l.sku)}><X style={{ fontSize: 14.5 }} /></Button>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--color-divider)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }} className="text-muted"><span>{t.subtotal}</span><span>{fmtUsd(subtotal)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
            <span className="text-muted">{t.orderDisc}</span>
            <Input style={{ width: 60, minHeight: 30, padding: '2px 8px', fontSize: 13.5, textAlign: 'center' }} value={orderDiscountPct || ''} onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 500 }}>{t.total}</span>
            <span style={{ textAlign: 'end' }}>
              <span style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-accent-300)' }}>{fmtUsd(total)}</span><br />
              <span className="text-muted" style={{ fontSize: 13 }}>≈ {fmtLyd(total * fxRate, lang)}</span>
            </span>
          </div>
          <Button variant="primary" block style={{ minHeight: 46, fontSize: 17.5 }} onClick={() => setPayOpen(true)} disabled={cart.length === 0}>
            <Money />{t.pay}
          </Button>
        </div>
      </Card>

      {payOpen && (
        <PaymentDialog
          onClose={() => setPayOpen(false)}
          onComplete={(sale) => { setPayOpen(false); setReceipt(sale) }}
        />
      )}
      {receipt && <ReceiptDialog sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  )
}
