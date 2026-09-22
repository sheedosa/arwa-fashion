import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { fmtUsd, fmtLyd } from '../../lib/currency'
import { saleTotal, computeChange } from '../../lib/calc'
import { refuseKey } from '../../lib/refuse'
import { Dialog, DialogActions } from '../../components/ui/Dialog'
import { Field, Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Tag'
import type { PayMethod, Sale } from '../../lib/types'

/** Money fields accept digits and one decimal point only — no sign, so a negative
 *  tender can never balance a receipt. Arabic-Indic digits are folded to ASCII. */
const cleanMoney = (v: string) => v
  .replace(/[٠-٩۰-۹]/g, (d) => String.fromCharCode(48 + (d.charCodeAt(0) & 0xf)))
  .replace(/[^\d.]/g, '')
  .replace(/^(\d*\.\d*).*$/, '$1')

export function PaymentDialog({ onClose, onComplete }: { onClose: () => void; onComplete: (sale: Sale) => void }) {
  const { t, lang } = useI18n()
  const cart = useStore((s) => s.cart)
  const orderDiscountPct = useStore((s) => s.orderDiscountPct)
  const fxRate = useStore((s) => s.fxRate)
  const customers = useStore((s) => s.customers)
  const completeSale = useStore((s) => s.completeSale)
  const flash = useStore((s) => s.flash)

  const [payUsd, setPayUsd] = useState('')
  const [payLyd, setPayLyd] = useState('')
  const [method, setMethod] = useState<PayMethod>('cash')
  const [custPhone, setCustPhone] = useState('')

  const total = saleTotal({ lines: cart, orderDiscountPct })
  const pu = parseFloat(payUsd) || 0
  const pl = parseFloat(payLyd) || 0
  const paid = pu + pl / fxRate
  const remaining = Math.max(0, total - paid)
  // Same rule as the store, so what the cashier sees is what the receipt records.
  const change = computeChange(total, pu, pl, fxRate)
  const changeStr = change ? (change.currency === 'LYD' ? fmtLyd(change.amount, lang) : fmtUsd(change.amount)) : ''
  const cannotComplete = paid < total - 0.01 || cart.length === 0

  const digits = custPhone.replace(/\D/g, '')
  const custMatch = digits.length >= 11 ? customers.find((c) => c.phone.replace(/\D/g, '') === digits) : null
  const custHint = custMatch ? `✓ ${custMatch.name} · ${custMatch.points} ${t.points}` : digits.length >= 11 ? (lang === 'ar' ? 'سيُنشأ عميل جديد' : 'New customer will be created') : ''

  const methods: PayMethod[] = ['cash', 'card', 'bank']

  const complete = () => {
    const res = completeSale({ payUsd: pu, payLyd: pl, method, custPhone })
    if (res.ok) onComplete(res.sale)
    else flash(t[refuseKey(res.reason)])
  }

  return (
    <Dialog title={t.payTitle} onClose={onClose} width={480}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-accent-800)' }}>
        <span style={{ fontSize: 'var(--fs-body)' }}>{t.total}</span>
        <span style={{ textAlign: 'end' }}>
          <span style={{ fontSize: 24, color: 'var(--color-accent-100)' }}>{fmtUsd(total)}</span>{' '}
          <span className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>≈ {fmtLyd(total * fxRate, lang)}</span>
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
        <Field label={t.payUsdL}>
          <Input kind="money" style={{ fontSize: 'var(--fs-num)' }} value={payUsd} onChange={(e) => setPayUsd(cleanMoney(e.target.value))} />
          <Button variant="ghost" style={{ fontSize: 'var(--fs-meta)', marginTop: 3 }} onClick={() => setPayUsd((Math.round(Math.max(0, total - pl / fxRate) * 100) / 100).toFixed(2))}>{t.exact} $</Button>
        </Field>
        <Field label={t.payLydL}>
          <Input kind="money" style={{ fontSize: 'var(--fs-num)' }} value={payLyd} onChange={(e) => setPayLyd(cleanMoney(e.target.value))} />
          {/* Nearest dinar: rounding up would leave sub-dinar "change" on every discounted total. */}
          <Button variant="ghost" style={{ fontSize: 'var(--fs-meta)', marginTop: 3 }} onClick={() => setPayLyd(String(Math.round(Math.max(0, total - pu) * fxRate)))}>{t.exact} {t.lydShort}</Button>
        </Field>
      </div>
      <Field label={t.method}>
        <div role="radiogroup" aria-label={t.method} style={{ display: 'flex', gap: 6 }}>
          {methods.map((m) => (
            <div key={m} style={{ flex: 1, display: 'flex' }}>
              <Chip label={<span style={{ width: '100%' }}>{t[m]}</span>} selected={method === m} onClick={() => setMethod(m)} />
            </div>
          ))}
        </div>
      </Field>
      <Field label={t.custPhone}>
        <Input kind="tel" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="+218 9x xxx xxxx" />
        <span style={{ fontSize: 'var(--fs-meta)', color: 'var(--color-accent-300)' }}>{custHint}</span>
      </Field>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 'var(--fs-body)', paddingTop: 4, borderTop: '1px solid var(--color-divider)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">{t.paid}</span><span>{fmtUsd(paid)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="text-muted">{t.remaining}</span>
          <span style={{ color: remaining > 0.01 ? 'var(--color-accent)' : 'var(--color-neutral-400)' }}>{fmtUsd(remaining)}</span>
        </div>
        {change && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}><span>{t.change}</span><span style={{ color: 'var(--color-accent-300)' }}>{changeStr}</span></div>
        )}
      </div>
      {/* Inside DialogActions so it stays pinned above the keyboard on a phone. */}
      <DialogActions>
        <Button variant="primary" block style={{ minHeight: 48, fontSize: 16.5 }} onClick={complete} disabled={cannotComplete}>
          <Check />{t.complete}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
