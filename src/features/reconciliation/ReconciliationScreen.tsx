import type { CSSProperties } from 'react'
import { LockSimple } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { BRANCHES, todayStr } from '../../lib/mockData'
import { fmtUsd, fmtLyd } from '../../lib/currency'
import { Card } from '../../components/ui/Card'
import { Field, Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'

export function ReconciliationScreen() {
  const { t, lang } = useI18n()
  const nm = useNm()
  const branch = useStore((s) => s.branch)
  const sales = useStore((s) => s.sales)
  const queue = useStore((s) => s.queue)
  const cashCounted = useStore((s) => s.cashCounted)
  const closedDays = useStore((s) => s.closedDays)
  const setCashCounted = useStore((s) => s.setCashCounted)
  const closeDay = useStore((s) => s.closeDay)
  const flash = useStore((s) => s.flash)

  const branchInfo = BRANCHES.find((b) => b.id === branch)!
  const td = todayStr()
  const dayClosed = !!closedDays[branch + ':' + td]

  const todaysSales = [...sales, ...queue].filter((s) => s.date === td && s.branchId === branch)
  let cashUsd = 0, cashLyd = 0
  todaysSales.forEach((s) => {
    s.payments.forEach((p) => { if (p.method === 'cash') { if (p.currency === 'USD') cashUsd += p.amount; else cashLyd += p.amount } })
    if (s.change) { if (s.change.currency === 'USD') cashUsd -= s.change.amount; else cashLyd -= s.change.amount }
  })
  const expUsd = branchInfo.openingFloatUsd + cashUsd
  const expLyd = branchInfo.openingFloatLyd + cashLyd
  const cnt = cashCounted[branch] || { usd: '', lyd: '' }
  const cUsd = parseFloat(cnt.usd), cLyd = parseFloat(cnt.lyd)
  const varUsd = isNaN(cUsd) ? null : cUsd - expUsd
  const varLyd = isNaN(cLyd) ? null : cLyd - expLyd
  const varColor = (v: number | null) => (v == null || Math.abs(v) < 0.01 ? 'var(--color-neutral-400)' : 'var(--color-accent-300)')
  const varStr = (v: number | null, fmt: (n: number) => string) => (v == null ? '—' : (v > 0.01 ? '+' : '') + fmt(v))

  const close = () => { closeDay(branch); flash(t.closedT) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Reconciliation">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>{t.recon}</h3>
        <span className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{nm(branchInfo.name)} · {td}</span>
      </div>
      {dayClosed && (
        <Card className="elev-sm" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <LockSimple size={22} style={{ color: 'var(--color-accent)', flex: 'none' }} /><span>{t.dayClosedMsg}</span>
        </Card>
      )}
      {/* min(340px,100%) — the fixed 340px floor overflowed a 327px phone column */}
      <div className="grid-auto" style={{ '--grid-min': '340px' } as CSSProperties}>
        <Card style={{ gap: 8, padding: '18px 20px' }}>
          <span className="card-kicker">USD $</span>
          <Row label={t.openFloat} value={fmtUsd(branchInfo.openingFloatUsd)} />
          <Row label={t.cashSales} value={fmtUsd(cashUsd)} />
          <Row label={t.expected} value={fmtUsd(expUsd)} bold />
          <Field label={t.counted}>
            <Input kind="money" style={{ fontSize: 'var(--fs-num)' }} value={cnt.usd} onChange={(e) => setCashCounted(branch, 'usd', e.target.value)} disabled={dayClosed} />
          </Field>
          <Row label={t.variance} value={varStr(varUsd, fmtUsd)} color={varColor(varUsd)} />
        </Card>
        <Card style={{ gap: 8, padding: '18px 20px' }}>
          <span className="card-kicker">LYD د.ل</span>
          <Row label={t.openFloat} value={fmtLyd(branchInfo.openingFloatLyd, lang)} />
          <Row label={t.cashSales} value={fmtLyd(cashLyd, lang)} />
          <Row label={t.expected} value={fmtLyd(expLyd, lang)} bold />
          <Field label={t.counted}>
            <Input kind="money" style={{ fontSize: 'var(--fs-num)' }} value={cnt.lyd} onChange={(e) => setCashCounted(branch, 'lyd', e.target.value)} disabled={dayClosed} />
          </Field>
          <Row label={t.variance} value={varStr(varLyd, (n) => fmtLyd(n, lang))} color={varColor(varLyd)} />
        </Card>
      </div>
      <span className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>
        {(lang === 'ar' ? 'المتوقع = رصيد الافتتاح + المبيعات النقدية − الباقي المدفوع، لكل عملة على حدة · ' : 'Expected = opening float + cash sales − change given, per currency · ')}
        {todaysSales.length} {lang === 'ar' ? 'فاتورة اليوم بهذا الفرع' : 'receipts today at this branch'}
      </span>
      <Button variant="primary" style={{ alignSelf: 'flex-start', minHeight: 46 }} onClick={close} disabled={dayClosed}>
        <LockSimple />{t.closeDay}
      </Button>
    </div>
  )
}

function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 'var(--fs-body)', fontWeight: bold ? 500 : 400 }}>
      <span className={color ? undefined : 'text-muted'}>{label}</span>
      <span style={{ color }}>{value}</span>
    </div>
  )
}
