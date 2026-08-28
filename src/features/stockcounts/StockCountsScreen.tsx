import { useState } from 'react'
import { ClipboardText } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { BRANCHES } from '../../lib/mockData'
import { variantMeta, productName } from '../../lib/variantDisplay'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Field'
import { Tag } from '../../components/ui/Tag'

export function StockCountsScreen() {
  const { t, lang } = useI18n()
  const nm = useNm()
  const user = useStore((s) => s.user)
  const branch = useStore((s) => s.branch)
  const stockCounts = useStore((s) => s.stockCounts)
  const products = useStore((s) => s.products)
  const variants = useStore((s) => s.variants)
  const startStockCount = useStore((s) => s.startStockCount)
  const setStockCountLine = useStore((s) => s.setStockCountLine)
  const postStockCount = useStore((s) => s.postStockCount)
  const flash = useStore((s) => s.flash)
  const isOwner = user?.role === 'owner'

  const [openSessionId, setOpenSessionId] = useState<string | null>(null)

  const sessions = isOwner ? stockCounts : stockCounts.filter((s) => s.branchId === branch)
  const openSession = openSessionId ? stockCounts.find((s) => s.id === openSessionId) : null

  const start = () => {
    startStockCount(branch)
    flash(t.startCount)
  }
  const post = (id: string) => {
    postStockCount(id)
    flash(t.postedNote)
    setOpenSessionId(null)
  }

  if (openSession) {
    const enteredCount = openSession.lines.filter((l) => l.countedQty != null).length
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Stock counts">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0, flex: 1 }}>{t.countSession} — {openSession.id}</h3>
          <span className="text-muted" style={{ fontSize: 13.5 }}>{nm(BRANCHES.find((b) => b.id === openSession.branchId)!.name)} · {openSession.date}</span>
          <Button variant="secondary" onClick={() => setOpenSessionId(null)}>{t.backList}</Button>
        </div>
        <Card style={{ padding: '6px 14px' }}>
          <table className="table">
            <thead><tr><th>SKU</th><th>{t.product}</th><th>{t.expectedQty}</th><th>{t.countedQty}</th><th>{t.varianceQty}</th></tr></thead>
            <tbody>
              {openSession.lines.map((l) => {
                const v = variants.find((vv) => vv.sku === l.sku)
                const p = v ? products.find((pp) => pp.code === v.productCode) : undefined
                const variance = l.countedQty != null ? l.countedQty - l.expectedQty : null
                return (
                  <tr key={l.sku}>
                    <td className="ltr-cell text-muted" style={{ fontSize: 13.5 }}>{l.sku}</td>
                    <td>{p && v ? <>{productName(lang, p)} <span className="text-muted" style={{ fontSize: 12.5 }}>{variantMeta(lang, v)}</span></> : l.sku}</td>
                    <td>{l.expectedQty}</td>
                    <td>
                      <Input
                        style={{ width: 80, minHeight: 30, padding: '2px 8px', textAlign: 'center' }}
                        value={l.countedQty ?? ''}
                        disabled={openSession.status === 'posted'}
                        onChange={(e) => setStockCountLine(openSession.id, l.sku, e.target.value === '' ? null : parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td style={{ color: variance == null ? undefined : Math.abs(variance) === 0 ? 'var(--color-neutral-400)' : 'var(--color-accent-300)' }}>
                      {variance == null ? '—' : (variance > 0 ? '+' : '') + variance}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="text-muted" style={{ fontSize: 13.5 }}>{enteredCount} / {openSession.lines.length} {t.countedOfExpected}</span>
          {openSession.status === 'open'
            ? <Button variant="primary" onClick={() => post(openSession.id)} disabled={enteredCount === 0}>{t.postAdjustment}</Button>
            : <Tag variant="good">{t.sessionPosted}</Tag>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Stock counts">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h3 style={{ margin: 0, flex: 1 }}>{t.stockCounts}</h3>
        <Button variant="primary" onClick={start}><ClipboardText />{t.newCount}</Button>
      </div>
      <Card style={{ padding: '6px 14px' }}>
        <table className="table">
          <thead><tr><th>#</th><th>{t.branch}</th><th>{t.dateL}</th><th>{t.status}</th><th></th></tr></thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td className="ltr-cell text-muted">{s.id}</td>
                <td>{nm(BRANCHES.find((b) => b.id === s.branchId)!.name)}</td>
                <td className="text-muted" style={{ fontSize: 13.5 }}>{s.date}</td>
                <td><Tag variant={s.status === 'posted' ? 'good' : 'neutral'}>{s.status === 'posted' ? t.sessionPosted : t.sessionOpen}</Tag></td>
                <td><Button variant="ghost" style={{ fontSize: 14 }} onClick={() => setOpenSessionId(s.id)}>{t.choose}</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <span className="text-muted" style={{ fontSize: 13 }}>{t.stockNote}</span>
    </div>
  )
}
