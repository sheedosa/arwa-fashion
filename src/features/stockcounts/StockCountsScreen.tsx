import { useState } from 'react'
import { ClipboardText } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { useIsPhone } from '../../lib/useMediaQuery'
import { BRANCHES } from '../../lib/mockData'
import { variantMeta, productName } from '../../lib/variantDisplay'
import { refuseKey } from '../../lib/refuse'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Field'
import { Tag } from '../../components/ui/Tag'
import { DataTable, type Column } from '../../components/ui/DataTable'
import type { StockCountLine, StockCountSession } from '../../lib/types'

export function StockCountsScreen() {
  const { t, lang } = useI18n()
  const nm = useNm()
  const isPhone = useIsPhone()
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
  const cardShell = { padding: isPhone ? 0 : '6px 14px', background: isPhone ? 'transparent' : undefined }

  // Starting opens the session straight away; a second tap resumes the open one.
  const start = () => {
    const hadOpen = stockCounts.some((s) => s.branchId === branch && s.status === 'open')
    const id = startStockCount(branch)
    if (hadOpen) flash(t.countResumed)
    setOpenSessionId(id)
  }
  const post = (id: string) => {
    const res = postStockCount(id)
    flash(res.ok ? t.postedNote : t[refuseKey(res.reason)])
    if (res.ok) setOpenSessionId(null)
  }

  if (openSession) {
    const enteredCount = openSession.lines.filter((l) => l.countedQty != null).length
    const posted = openSession.status === 'posted'
    const lineColumns: Column<StockCountLine>[] = [
      { key: 'sku', header: 'SKU', role: 'meta', ltr: true, tdClassName: 'text-muted', tdStyle: { fontSize: 'var(--fs-meta)' }, cell: (l) => l.sku },
      { key: 'product', header: t.product, role: 'title', cell: (l) => {
        const v = variants.find((vv) => vv.sku === l.sku)
        const p = v ? products.find((pp) => pp.code === v.productCode) : undefined
        return p && v ? <>{productName(lang, p)} <span className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{variantMeta(lang, v)}</span></> : l.sku
      } },
      { key: 'expected', header: t.expectedQty, cell: (l) => l.expectedQty },
      // Someone counts stock walking the shop floor with a phone: this input is
      // the most-typed field in the module and gets a numeric keypad + 44px box.
      { key: 'counted', header: t.countedQty, cell: (l) => (
        <Input kind="qty" style={{ width: isPhone ? 110 : 84, textAlign: 'center' }} value={l.countedQty ?? ''} disabled={posted} aria-label={t.countedQty}
          onChange={(e) => setStockCountLine(openSession.id, l.sku, e.target.value === '' ? null : parseInt(e.target.value) || 0)} />
      ) },
      { key: 'variance', header: t.varianceQty, cell: (l) => {
        const variance = l.countedQty != null ? l.countedQty - l.expectedQty : null
        return <span style={{ color: variance == null ? undefined : variance === 0 ? 'var(--color-neutral-400)' : 'var(--color-accent-300)' }}>{variance == null ? '—' : (variance > 0 ? '+' : '') + variance}</span>
      } },
    ]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Stock counts">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, flex: '1 1 auto' }}>{t.countSession} — <span className="ltr-cell" style={{ display: 'inline-block' }}>{openSession.id}</span></h3>
          <span className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{nm(BRANCHES.find((b) => b.id === openSession.branchId)!.name)} · {openSession.date}</span>
          <Button variant="secondary" onClick={() => setOpenSessionId(null)}>{t.backList}</Button>
        </div>
        <Card style={cardShell}>
          <DataTable rows={openSession.lines} columns={lineColumns} rowKey={(l) => l.sku} pane={!isPhone} />
        </Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', position: 'sticky', bottom: 0, background: 'var(--color-bg)', padding: '8px 0' }}>
          <span className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{enteredCount} / {openSession.lines.length} {t.countedOfExpected}</span>
          {!posted
            ? <Button variant="primary" style={{ marginInlineStart: 'auto' }} onClick={() => post(openSession.id)} disabled={enteredCount === 0}>{t.postAdjustment}</Button>
            : <Tag variant="good">{t.sessionPosted}</Tag>}
        </div>
      </div>
    )
  }

  const sessionColumns: Column<StockCountSession>[] = [
    { key: 'id', header: '#', role: 'title', ltr: true, tdClassName: 'text-muted', cell: (s) => s.id },
    { key: 'branch', header: t.branch, cell: (s) => nm(BRANCHES.find((b) => b.id === s.branchId)!.name) },
    { key: 'date', header: t.dateL, role: 'meta', tdClassName: 'text-muted', tdStyle: { fontSize: 'var(--fs-meta)' }, cell: (s) => s.date },
    { key: 'status', header: t.status, cell: (s) => <Tag variant={s.status === 'posted' ? 'good' : 'neutral'}>{s.status === 'posted' ? t.sessionPosted : t.sessionOpen}</Tag> },
    { key: 'open', header: '', role: 'action', cell: (s) => <Button variant="ghost" onClick={() => setOpenSessionId(s.id)}>{t.choose}</Button> },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Stock counts">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, flex: 1 }}>{t.stockCounts}</h3>
        <Button variant="primary" onClick={start}><ClipboardText />{t.newCount}</Button>
      </div>
      <Card style={cardShell}>
        <DataTable rows={sessions} columns={sessionColumns} rowKey={(s) => s.id} />
      </Card>
      <span className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{t.stockCountNote}</span>
    </div>
  )
}
