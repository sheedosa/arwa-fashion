import { useMemo, useState } from 'react'
import { ArrowUUpLeft, CheckSquare, Square } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { useIsPhone } from '../../lib/useMediaQuery'
import { BRANCHES } from '../../lib/mockData'
import { fmtUsd, fmtLyd } from '../../lib/currency'
import { lineTotal, saleTotal } from '../../lib/calc'
import { variantMeta, productName } from '../../lib/variantDisplay'
import { Input, Select } from '../../components/ui/Field'
import { Card, CardKicker } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { DataTable, type Column } from '../../components/ui/DataTable'
import type { ReturnReason, Sale } from '../../lib/types'

export function ReturnsScreen() {
  const { t, lang } = useI18n()
  const nm = useNm()
  const isPhone = useIsPhone()
  const sales = useStore((s) => s.sales)
  const products = useStore((s) => s.products)
  const variants = useStore((s) => s.variants)
  const fxRate = useStore((s) => s.fxRate)
  const processReturn = useStore((s) => s.processReturn)
  const flash = useStore((s) => s.flash)

  const [query, setQuery] = useState('')
  const [retNo, setRetNo] = useState<string | null>(null)
  const [picked, setPicked] = useState<Record<number, boolean>>({})
  const [reason, setReason] = useState<ReturnReason>('wrongSize')

  const rq = query.trim().toLowerCase()
  const results = useMemo(() => sales.filter((s) => {
    if (!rq) return true
    const digits = rq.replace(/\D/g, '')
    return s.no.toLowerCase().includes(rq) || (digits && s.no.replace(/\D/g, '').includes(digits))
  }).slice(0, 6), [sales, rq])

  const sale = retNo ? sales.find((s) => s.no === retNo) : null
  const reasonOptions: ReturnReason[] = ['wrongSize', 'defect', 'changedMind']

  const refund = sale
    ? sale.lines.reduce((a, l, i) => a + (picked[i] ? lineTotal(l) : 0), 0) * (1 - (sale.orderDiscountPct || 0) / 100)
    : 0
  const anyPicked = Object.values(picked).some(Boolean)

  const process = () => {
    if (!sale) return
    processReturn(sale.no, sale.lines.map((_, i) => i).filter((i) => picked[i]), reason)
    flash(t.retDone)
    setRetNo(null); setPicked({}); setQuery('')
  }

  const columns: Column<Sale>[] = [
    { key: 'no', header: t.receipt, role: 'title', ltr: true, cell: (r) => r.no },
    { key: 'date', header: t.dateL, role: 'meta', tdClassName: 'text-muted', cell: (r) => r.date },
    { key: 'branch', header: t.branch, tdClassName: 'text-muted', cell: (r) => nm(BRANCHES.find((b) => b.id === r.branchId)!.name) },
    { key: 'total', header: t.total, cell: (r) => fmtUsd(saleTotal(r)) },
    { key: 'pick', header: '', role: 'action', cell: (r) => <Button variant="ghost" onClick={() => { setRetNo(r.no); setPicked({}) }}>{t.choose}</Button> },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Returns">
      <h3 style={{ margin: 0 }}>{t.returns}</h3>

      {!sale && (
        <>
          <Input kind="search" style={{ maxWidth: 380 }} placeholder={t.findSale} value={query} onChange={(e) => setQuery(e.target.value)} />
          <Card style={{ padding: isPhone ? 0 : '6px 14px', background: isPhone ? 'transparent' : undefined }}>
            <DataTable rows={results} columns={columns} rowKey={(r) => r.no} />
          </Card>
        </>
      )}

      {sale && (
        <Card className="elev-sm" style={{ gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CardKicker>{t.receipt} <span className="ltr-cell" style={{ display: 'inline-block' }}>{sale.no}</span></CardKicker>
            <Button variant="ghost" style={{ marginInlineStart: 'auto' }} onClick={() => { setRetNo(null); setPicked({}) }}>{t.backList}</Button>
          </div>
          {sale.lines.map((l, i) => {
            const p = products.find((pp) => l.sku.startsWith(pp.code + '-'))!
            const v = variants.find((vv) => vv.sku === l.sku)!
            const sel = !!picked[i]
            return (
              <button
                key={i}
                type="button"
                role="checkbox"
                aria-checked={sel}
                onClick={() => setPicked((cur) => ({ ...cur, [i]: !sel }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'start', cursor: 'pointer',
                  minHeight: 56, padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${sel ? 'var(--color-accent)' : 'var(--color-divider)'}`,
                  background: sel ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : 'transparent',
                  color: 'var(--color-text)',
                }}
              >
                {sel ? <CheckSquare weight="fill" size={20} style={{ color: 'var(--color-accent)', flex: 'none' }} /> : <Square size={20} style={{ color: 'var(--color-accent)', flex: 'none' }} />}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 'var(--fs-body)', fontWeight: 500 }}>{productName(lang, p)}</span><br />
                  <span className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{variantMeta(lang, v)} · ×{l.qty}</span>
                </span>
                <span>{fmtUsd(lineTotal(l))}</span>
              </button>
            )
          })}
          <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: '1 1 180px' }}>
              <label>{t.reason}</label>
              <Select value={reason} onChange={(e) => setReason(e.target.value as ReturnReason)}>
                {reasonOptions.map((r) => <option key={r} value={r}>{t[r]}</option>)}
              </Select>
            </div>
            <div style={{ textAlign: 'end', marginInlineStart: 'auto' }}>
              <div className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{t.refund}</div>
              <div style={{ fontSize: 'var(--fs-num)', color: 'var(--color-accent-300)' }}>{fmtUsd(refund)}</div>
              <div className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>≈ {fmtLyd(refund * fxRate, lang)}</div>
            </div>
          </div>
          <Button variant="primary" style={{ minHeight: 46 }} onClick={process} disabled={!anyPicked}>
            <ArrowUUpLeft />{t.processRet}
          </Button>
        </Card>
      )}
    </div>
  )
}
