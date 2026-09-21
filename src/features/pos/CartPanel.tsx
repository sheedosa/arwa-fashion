import { Money } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { fmtUsd, fmtLyd } from '../../lib/currency'
import { lineTotal, saleTotal } from '../../lib/calc'
import { Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { CartLineRow } from './CartLineRow'

/** Cart body + footer, shared by the desktop side card and the phone sheet. */
export function CartPanel({ compact, onPay }: { compact: boolean; onPay: () => void }) {
  const { t, lang } = useI18n()
  const cart = useStore((s) => s.cart)
  const products = useStore((s) => s.products)
  const variants = useStore((s) => s.variants)
  const orderDiscountPct = useStore((s) => s.orderDiscountPct)
  const setOrderDiscount = useStore((s) => s.setOrderDiscount)
  const fxRate = useStore((s) => s.fxRate)

  const subtotal = cart.reduce((a, l) => a + lineTotal(l), 0)
  const total = saleTotal({ lines: cart, orderDiscountPct })

  return (
    <>
      <div style={{ flex: 1, overflow: 'auto', overscrollBehavior: 'contain', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        {cart.length === 0 && (
          <div className="text-muted" style={{ fontSize: 'var(--fs-body)', padding: '24px 0', textAlign: 'center' }}>{t.emptyCart}</div>
        )}
        {cart.map((l) => {
          const p = products.find((pp) => l.sku.startsWith(pp.code + '-'))!
          const v = variants.find((vv) => vv.sku === l.sku)!
          return <CartLineRow key={l.sku} l={l} p={p} v={v} compact={compact} />
        })}
      </div>

      <div style={{
        flex: 'none', borderTop: '1px solid var(--color-divider)', display: 'flex', flexDirection: 'column', gap: 8,
        padding: compact ? '12px 14px calc(12px + var(--safe-bottom))' : '12px 14px',
        background: 'var(--color-surface)',
      }}>
        <div className="text-muted" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-meta)' }}>
          <span>{t.subtotal}</span><span>{fmtUsd(subtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-meta)' }}>
          <span className="text-muted">{t.orderDisc}</span>
          <Input kind="percent" tight={!compact} style={{ width: compact ? 84 : 64, textAlign: 'center' }} aria-label={t.orderDisc}
            value={orderDiscountPct || ''} onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 500 }}>{t.total}</span>
          <span style={{ textAlign: 'end' }}>
            <span style={{ fontSize: compact ? 26 : 22, fontWeight: 500, color: 'var(--color-accent-300)' }}>{fmtUsd(total)}</span><br />
            <span className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>≈ {fmtLyd(total * fxRate, lang)}</span>
          </span>
        </div>
        <Button variant="primary" block style={{ minHeight: compact ? 52 : 46, fontSize: 17.5 }} onClick={onPay} disabled={cart.length === 0}>
          <Money />{t.pay}
        </Button>
      </div>
    </>
  )
}
