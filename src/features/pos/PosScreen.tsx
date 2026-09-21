import { useEffect, useMemo, useRef, useState } from 'react'
import { Basket } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { useBreakpoint } from '../../lib/useMediaQuery'
import { useKeyboardOpen } from '../../lib/useKeyboardOpen'
import { BRANCHES } from '../../lib/mockData'
import { saleTotal } from '../../lib/calc'
import { productName } from '../../lib/variantDisplay'
import { Input } from '../../components/ui/Field'
import { Card } from '../../components/ui/Card'
import { Tag, Chip } from '../../components/ui/Tag'
import { ProductTile } from './ProductTile'
import { CartPanel } from './CartPanel'
import { CartSheet } from './CartSheet'
import { CartBar } from './CartBar'
import { PaymentDialog } from './PaymentDialog'
import { ReceiptDialog } from './ReceiptDialog'
import type { Sale } from '../../lib/types'

const BAR_H = 68

export function PosScreen() {
  const { t, lang } = useI18n()
  const products = useStore((s) => s.products)
  const variants = useStore((s) => s.variants)
  const inventory = useStore((s) => s.inventory)
  const branch = useStore((s) => s.branch)
  const cart = useStore((s) => s.cart)
  const orderDiscountPct = useStore((s) => s.orderDiscountPct)
  const lowStockThreshold = useStore((s) => s.lowStockThreshold)
  const addToCart = useStore((s) => s.addToCart)
  const flash = useStore((s) => s.flash)
  const fxRate = useStore((s) => s.fxRate)

  // Side-by-side returns at 900px: at iPad portrait, stacked gives 4 product
  // tiles where a split would give 2. Tiles become full-width rows below 640.
  const split = useBreakpoint('posSplit')
  const gridTiles = useBreakpoint('tablet')
  const keyboardOpen = useKeyboardOpen()

  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('')
  const [payOpen, setPayOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [receipt, setReceipt] = useState<Sale | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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

  const itemCount = cart.reduce((a, l) => a + l.qty, 0)
  const total = saleTotal({ lines: cart, orderDiscountPct })

  // Lift the Toast above the bottom bar on phone.
  useEffect(() => {
    document.documentElement.style.setProperty('--bottom-bar-h', split ? '0px' : `${BAR_H}px`)
    return () => { document.documentElement.style.removeProperty('--bottom-bar-h') }
  }, [split])
  // A completed sale empties the cart → drop back to the product grid.
  useEffect(() => { if (itemCount === 0) setSheetOpen(false) }, [itemCount])

  // Stock-refusal detection via before/after compare (addToCart refuses silently).
  const handleAdd = (sku: string) => {
    const before = useStore.getState().cart.find((l) => l.sku === sku)?.qty || 0
    addToCart(sku)
    const after = useStore.getState().cart.find((l) => l.sku === sku)?.qty || 0
    if (after === before) flash(t.noStock)
    else if (!split) {
      // On a phone the tile highlight is easy to miss; a toast is not.
      const p = products.find((pp) => sku.startsWith(pp.code + '-'))
      flash(`${t.added} · ${p ? productName(lang, p) : sku}`)
    }
  }

  return (
    <div
      data-screen-label="POS"
      style={split
        ? { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) clamp(300px, 30vw, 370px)', gap: 16, height: '100%', minHeight: 0 }
        : { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, flex: 1 }}>
        {/* flex:none header above the scroller, so the keyboard never covers it */}
        <Input
          ref={searchRef}
          kind="search"
          style={{ minHeight: 48, fontSize: 16.5, flex: 'none' }}
          placeholder={t.searchPos}
          value={query}
          autoCapitalize="characters"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Barcode scanners emit keystrokes + Enter. Focus is kept so
            // consecutive scans work.
            if (e.key === 'Enter') {
              const sku = query.trim().toUpperCase()
              if (variants.some((v) => v.sku === sku)) { handleAdd(sku); setQuery('') }
            }
          }}
        />
        <div className="chip-row" style={{ flex: 'none' }}>
          <Chip label={t.all} selected={!cat} onClick={() => setCat('')} />
          {categories.map((c) => {
            const label = lang === 'ar' ? products.find((p) => p.category.en === c)!.category.ar : c
            return <Chip key={c} label={label} selected={cat === c} onClick={() => setCat(c)} />
          })}
        </div>
        <div style={{
          flex: 1, minHeight: 0, overflow: 'auto', overscrollBehavior: 'contain', display: 'grid',
          gridTemplateColumns: gridTiles ? 'repeat(auto-fill,minmax(168px,1fr))' : '1fr',
          gap: gridTiles ? 10 : 8, alignContent: 'start',
          paddingBottom: split ? 8 : BAR_H + 12,
        }}>
          {results.length === 0 && (
            <div className="text-muted" style={{ gridColumn: '1/-1', padding: '36px 0', textAlign: 'center' }}>{t.noResults}</div>
          )}
          {results.map((v) => {
            const p = products.find((pp) => pp.code === v.productCode)!
            const qty = inventory[v.sku]?.[branch] || 0
            const other = BRANCHES.filter((b) => b.id !== branch && (inventory[v.sku]?.[b.id] || 0) > 0)
            return (
              <ProductTile
                key={v.sku} v={v} p={p} qty={qty} other={other}
                otherQty={other.length ? inventory[v.sku]?.[other[0].id] || 0 : 0}
                lowStockThreshold={lowStockThreshold}
                layout={gridTiles ? 'grid' : 'row'}
                onAdd={() => handleAdd(v.sku)}
              />
            )
          })}
        </div>
      </div>

      {split ? (
        <Card className="elev-sm" style={{ minHeight: 0, gap: 0, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--color-divider)' }}>
            <Basket style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontWeight: 500 }}>{t.cart}</span>
            <Tag variant="neutral" style={{ marginInlineStart: 'auto' }}>{itemCount}</Tag>
          </div>
          <CartPanel compact={false} onPay={() => setPayOpen(true)} />
        </Card>
      ) : (
        <>
          <CartBar count={itemCount} total={total} fxRate={fxRate} hidden={keyboardOpen}
            onOpen={() => setSheetOpen(true)} onPay={() => setPayOpen(true)} />
          {/* stays mounted while PaymentDialog (z 40) is open, so Cancel returns here */}
          <CartSheet open={sheetOpen} count={itemCount} onClose={() => setSheetOpen(false)}>
            <CartPanel compact onPay={() => setPayOpen(true)} />
          </CartSheet>
        </>
      )}

      {payOpen && (
        <PaymentDialog onClose={() => setPayOpen(false)} onComplete={(sale) => { setPayOpen(false); setReceipt(sale) }} />
      )}
      {receipt && <ReceiptDialog sale={receipt} onClose={() => { setReceipt(null); searchRef.current?.focus() }} />}
    </div>
  )
}
