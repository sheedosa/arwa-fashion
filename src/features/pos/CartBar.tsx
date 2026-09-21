import { Basket, CaretUp, Money } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { fmtUsd, fmtLyd } from '../../lib/currency'
import { Button } from '../../components/ui/Button'

/** Persistent bottom bar on phones: running total in the thumb zone + Pay.
 *  The fast path (scan, scan, scan, Pay) never needs the cart sheet at all. */
export function CartBar({ count, total, fxRate, hidden, onOpen, onPay }: {
  count: number; total: number; fxRate: number; hidden: boolean; onOpen: () => void; onPay: () => void
}) {
  const { t, lang } = useI18n()
  return (
    <div className="pos-bar" data-hidden={hidden}>
      <button
        type="button"
        onClick={onOpen}
        disabled={count === 0}
        aria-label={t.cart}
        style={{
          flex: 1, minWidth: 0, minHeight: 44, display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 8px', background: 'transparent', border: 0, borderRadius: 'var(--radius-md)',
          color: 'var(--color-text)', textAlign: 'start', cursor: count ? 'pointer' : 'default',
          opacity: count === 0 ? 0.55 : 1,
        }}
      >
        <Basket size={22} style={{ color: 'var(--color-accent)', flex: 'none' }} />
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
          <span style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-accent-300)' }}>{fmtUsd(total)}</span>
          <span className="text-muted" style={{ fontSize: 'var(--fs-micro)' }}>{count} · ≈ {fmtLyd(total * fxRate, lang)}</span>
        </span>
        {count > 0 && <CaretUp size={16} className="text-muted" style={{ flex: 'none', marginInlineStart: 'auto' }} />}
      </button>
      <Button variant="primary" style={{ flex: 'none', minHeight: 48, minWidth: 116, fontSize: 17 }} onClick={onPay} disabled={count === 0}>
        <Money />{t.pay}
      </Button>
    </div>
  )
}
