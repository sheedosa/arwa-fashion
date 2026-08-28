import { useMemo, useState } from 'react'
import { ArrowUUpLeft, CheckSquare, Square } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { BRANCHES } from '../../lib/mockData'
import { fmtUsd, fmtLyd } from '../../lib/currency'
import { lineTotal, saleTotal } from '../../lib/calc'
import { variantMeta, productName } from '../../lib/variantDisplay'
import { Input } from '../../components/ui/Field'
import { Card, CardKicker } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import type { ReturnReason } from '../../lib/types'

export function ReturnsScreen() {
  const { t, lang } = useI18n()
  const nm = useNm()
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
    const idx = sale.lines.map((_, i) => i).filter((i) => picked[i])
    processReturn(sale.no, idx, reason)
    flash(t.retDone)
    setRetNo(null); setPicked({}); setQuery('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Returns">
      <h3 style={{ margin: 0 }}>{t.returns}</h3>

      {!sale && (
        <>
          <Input style={{ maxWidth: 380 }} placeholder={t.findSale} value={query} onChange={(e) => setQuery(e.target.value)} />
          <Card style={{ padding: '6px 14px' }}>
            <table className="table">
              <thead><tr><th>{t.receipt}</th><th>{t.dateL}</th><th>{t.branch}</th><th>{t.total}</th><th></th></tr></thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.no}>
                    <td className="ltr-cell">{r.no}</td>
                    <td className="text-muted" style={{ fontSize: 14 }}>{r.date}</td>
                    <td className="text-muted" style={{ fontSize: 14 }}>{nm(BRANCHES.find((b) => b.id === r.branchId)!.name)}</td>
                    <td>{fmtUsd(saleTotal(r))}</td>
                    <td><Button variant="ghost" style={{ fontSize: 14 }} onClick={() => { setRetNo(r.no); setPicked({}) }}>{t.choose}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {sale && (
        <Card className="elev-sm" style={{ gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CardKicker>{t.receipt} <span style={{ direction: 'ltr', display: 'inline-block' }}>{sale.no}</span></CardKicker>
            <Button variant="ghost" style={{ marginInlineStart: 'auto', fontSize: 13.5 }} onClick={() => { setRetNo(null); setPicked({}) }}>{t.backList}</Button>
          </div>
          {sale.lines.map((l, i) => {
            const p = products.find((pp) => l.sku.startsWith(pp.code + '-'))!
            const v = variants.find((vv) => vv.sku === l.sku)!
            const sel = !!picked[i]
            return (
              <button
                key={i}
                onClick={() => setPicked((cur) => ({ ...cur, [i]: !sel }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'start', cursor: 'pointer',
                  padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${sel ? 'var(--color-accent)' : 'var(--color-divider)'}`,
                  background: sel ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : 'transparent',
                  color: 'var(--color-text)',
                }}
              >
                {sel ? <CheckSquare weight="fill" style={{ fontSize: 18.5, color: 'var(--color-accent)' }} /> : <Square style={{ fontSize: 18.5, color: 'var(--color-accent)' }} />}
                <span style={{ flex: 1 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 500 }}>{productName(lang, p)}</span><br />
                  <span className="text-muted" style={{ fontSize: 12.5 }}>{variantMeta(lang, v)} · ×{l.qty}</span>
                </span>
                <span>{fmtUsd(lineTotal(l))}</span>
              </button>
            )
          })}
          <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: 1, minWidth: 180 }}>
              <label>{t.reason}</label>
              <select className="input" value={reason} onChange={(e) => setReason(e.target.value as ReturnReason)}>
                {reasonOptions.map((r) => <option key={r} value={r}>{t[r]}</option>)}
              </select>
            </div>
            <div style={{ textAlign: 'end', marginInlineStart: 'auto' }}>
              <div className="text-muted" style={{ fontSize: 13 }}>{t.refund}</div>
              <div style={{ fontSize: 21, color: 'var(--color-accent-300)' }}>{fmtUsd(refund)}</div>
              <div className="text-muted" style={{ fontSize: 12.5 }}>≈ {fmtLyd(refund * fxRate, lang)}</div>
            </div>
          </div>
          <Button variant="primary" style={{ minHeight: 42 }} onClick={process} disabled={!anyPicked}>
            <ArrowUUpLeft />{t.processRet}
          </Button>
        </Card>
      )}
    </div>
  )
}
