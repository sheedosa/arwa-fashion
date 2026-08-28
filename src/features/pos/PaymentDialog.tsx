import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { fmtUsd, fmtLyd } from '../../lib/currency'
import { saleTotal } from '../../lib/calc'
import { Dialog } from '../../components/ui/Dialog'
import { Field, Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Tag'
import type { PayMethod, Sale } from '../../lib/types'

export function PaymentDialog({ onClose, onComplete }: { onClose: () => void; onComplete: (sale: Sale) => void }) {
  const { t, lang } = useI18n()
  const cart = useStore((s) => s.cart)
  const orderDiscountPct = useStore((s) => s.orderDiscountPct)
  const fxRate = useStore((s) => s.fxRate)
  const customers = useStore((s) => s.customers)
  const completeSale = useStore((s) => s.completeSale)

  const [payUsd, setPayUsd] = useState('')
  const [payLyd, setPayLyd] = useState('')
  const [method, setMethod] = useState<PayMethod>('cash')
  const [custPhone, setCustPhone] = useState('')

  const total = saleTotal({ lines: cart, orderDiscountPct })
  const pu = parseFloat(payUsd) || 0
  const pl = parseFloat(payLyd) || 0
  const paid = pu + pl / fxRate
  const remaining = Math.max(0, total - paid)
  const over = paid - total
  const hasChange = over > 0.01
  const changeStr = hasChange ? (pl > 0 ? fmtLyd(over * fxRate, lang) : fmtUsd(over)) : ''
  const cannotComplete = paid < total - 0.01 || cart.length === 0

  const digits = custPhone.replace(/\D/g, '')
  const custMatch = digits.length >= 11 ? customers.find((c) => c.phone.replace(/\D/g, '') === digits) : null
  const custHint = custMatch ? `✓ ${custMatch.name} · ${custMatch.points} ${t.points}` : digits.length >= 11 ? (lang === 'ar' ? 'سيُنشأ عميل جديد' : 'New customer will be created') : ''

  const methods: PayMethod[] = ['cash', 'card', 'bank']

  const complete = () => {
    const sale = completeSale({ payUsd: pu, payLyd: pl, method, custPhone })
    if (sale) onComplete(sale)
  }

  return (
    <Dialog title={t.payTitle} onClose={onClose} width={480}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-accent-800)' }}>
        <span style={{ fontSize: 14.5 }}>{t.total}</span>
        <span style={{ textAlign: 'end' }}>
          <span style={{ fontSize: 24, color: 'var(--color-accent-100)' }}>{fmtUsd(total)}</span>{' '}
          <span className="text-muted" style={{ fontSize: 13.5 }}>≈ {fmtLyd(total * fxRate, lang)}</span>
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label={t.payUsdL}>
          <Input style={{ direction: 'ltr', fontSize: 17.5 }} value={payUsd} onChange={(e) => setPayUsd(e.target.value)} />
          <Button variant="ghost" style={{ fontSize: 13, marginTop: 3 }} onClick={() => setPayUsd((Math.round(Math.max(0, total - pl / fxRate) * 100) / 100).toFixed(2))}>{t.exact} $</Button>
        </Field>
        <Field label={t.payLydL}>
          <Input style={{ direction: 'ltr', fontSize: 17.5 }} value={payLyd} onChange={(e) => setPayLyd(e.target.value)} />
          <Button variant="ghost" style={{ fontSize: 13, marginTop: 3 }} onClick={() => setPayLyd(String(Math.ceil(Math.max(0, total - pu) * fxRate)))}>{t.exact} د.ل</Button>
        </Field>
      </div>
      <Field label={t.method}>
        <div style={{ display: 'flex', gap: 6 }}>
          {methods.map((m) => <Chip key={m} label={t[m]} selected={method === m} onClick={() => setMethod(m)} />)}
        </div>
      </Field>
      <Field label={t.custPhone}>
        <Input style={{ direction: 'ltr' }} value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="+218 9x xxx xxxx" />
        <span style={{ fontSize: 13, color: 'var(--color-accent-300)' }}>{custHint}</span>
      </Field>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 14.5, paddingTop: 4, borderTop: '1px solid var(--color-divider)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">{t.paid}</span><span>{fmtUsd(paid)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="text-muted">{t.remaining}</span>
          <span style={{ color: remaining > 0.01 ? 'var(--color-accent)' : 'var(--color-neutral-400)' }}>{fmtUsd(remaining)}</span>
        </div>
        {hasChange && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}><span>{t.change}</span><span style={{ color: 'var(--color-accent-300)' }}>{changeStr}</span></div>
        )}
      </div>
      <Button variant="primary" block style={{ minHeight: 46, fontSize: 16.5 }} onClick={complete} disabled={cannotComplete}>
        <Check />{t.complete}
      </Button>
    </Dialog>
  )
}
