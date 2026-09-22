import { useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { useBreakpoint } from '../../lib/useMediaQuery'
import { BRANCHES } from '../../lib/mockData'
import { variantMeta, productName } from '../../lib/variantDisplay'
import { refuseKey } from '../../lib/refuse'
import { exportCsv } from '../../lib/csv'
import { Field, Input, Select } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Tag } from '../../components/ui/Tag'
import { DataTable, type Column } from '../../components/ui/DataTable'
import type { BranchId, Transfer, TransferStatus } from '../../lib/types'

const STATUS_STYLE: Record<TransferStatus, 'neutral' | 'accent' | 'accent-2'> = { requested: 'neutral', sent: 'accent', received: 'accent-2' }

export function TransfersScreen() {
  const { t, lang } = useI18n()
  const nm = useNm()
  const isDesktop = useBreakpoint('laptop')
  const user = useStore((s) => s.user)
  const branch = useStore((s) => s.branch)
  const transfers = useStore((s) => s.transfers)
  const variants = useStore((s) => s.variants)
  const products = useStore((s) => s.products)
  const inventory = useStore((s) => s.inventory)
  const requestTransfer = useStore((s) => s.requestTransfer)
  const advanceTransfer = useStore((s) => s.advanceTransfer)
  const flash = useStore((s) => s.flash)
  const isOwner = user?.role === 'owner'

  // A manager moves stock out of their own branch only; the owner picks any pair.
  const [fromPick, setFromPick] = useState<BranchId>(branch)
  const from: BranchId = isOwner ? fromPick : branch
  const [to, setTo] = useState<BranchId>(BRANCHES.find((b) => b.id !== branch)?.id || 'bn')
  const [sku, setSku] = useState(variants[0]?.sku || '')
  const [qty, setQty] = useState('1')

  const onHand = inventory[sku]?.[from] || 0
  const qtyN = parseInt(qty) || 0
  const cannotRequest = from === to || qtyN <= 0 || qtyN > onHand
  const statusLabel: Record<TransferStatus, string> = { requested: t.statusReq, sent: t.statusSent, received: t.statusRec }
  const arrow = lang === 'ar' ? '←' : '→'
  const branchName = (id: BranchId) => nm(BRANCHES.find((b) => b.id === id)!.name)
  const itemLabel = (r: Transfer) => {
    const v = variants.find((vv) => vv.sku === r.sku)
    const p = v && products.find((pp) => pp.code === v.productCode)
    return p && v ? `${productName(lang, p)} · ${variantMeta(lang, v)}` : r.sku
  }

  const rows = isOwner ? transfers : transfers.filter((x) => x.from === branch || x.to === branch)

  const submit = () => { flash(requestTransfer(from, to, sku, qtyN) ? t.transferRequested : t.stockRefused) }
  const act = (r: Transfer) => {
    const res = advanceTransfer(r.id)
    flash(res.ok ? (r.status === 'requested' ? t.transferSent : t.transferReceived) : t[refuseKey(res.reason)])
  }

  const columns: Column<Transfer>[] = [
    { key: 'id', header: '#', role: 'meta', ltr: true, tdClassName: 'text-muted', cell: (r) => r.id },
    { key: 'date', header: t.dateL, role: 'meta', tdClassName: 'text-muted', tdStyle: { fontSize: 'var(--fs-meta)' }, cell: (r) => r.date },
    { key: 'item', header: t.item, role: 'title', cell: itemLabel },
    { key: 'route', header: `${t.from} ${arrow} ${t.to}`, cell: (r) => `${branchName(r.from)} ${arrow} ${branchName(r.to)}` },
    { key: 'qty', header: t.qty, cell: (r) => r.qty },
    { key: 'status', header: t.status, cell: (r) => <Tag variant={STATUS_STYLE[r.status]}>{statusLabel[r.status]}</Tag> },
    // Sending is the source branch's job, receiving the destination's; the owner does both.
    { key: 'act', header: '', role: 'action', cell: (r) => {
      if (r.status === 'received') return null
      const mine = isOwner || (r.status === 'requested' ? r.from === branch : r.to === branch)
      if (!mine) return null
      return <Button variant="primary" style={{ fontSize: 'var(--fs-meta)' }} onClick={() => act(r)}>{r.status === 'requested' ? t.send : t.receive}</Button>
    } },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Transfers">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, flex: 1 }}>{t.transfers}</h3>
        <Button variant="secondary" onClick={() => exportCsv('transfers.csv', ['ID', 'Date', 'From', 'To', 'SKU', 'Qty', 'Status'], rows.map((x) => [x.id, x.date, x.from, x.to, x.sku, x.qty, x.status]))}>
          <DownloadSimple />{t.export}
        </Button>
      </div>
      <Card style={{ gap: 10 }}>
        <span className="card-kicker">{t.newTransfer}</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
          <Field label={t.from} style={{ flex: '1 1 130px' }}>
            <Select value={from} disabled={!isOwner} onChange={(e) => setFromPick(e.target.value as BranchId)}>
              {BRANCHES.map((b) => <option key={b.id} value={b.id}>{nm(b.name)}</option>)}
            </Select>
          </Field>
          <Field label={t.to} style={{ flex: '1 1 130px' }}>
            <Select value={to} onChange={(e) => setTo(e.target.value as BranchId)}>
              {BRANCHES.filter((b) => b.id !== from).map((b) => <option key={b.id} value={b.id}>{nm(b.name)}</option>)}
            </Select>
          </Field>
          <Field label={t.item} style={{ flex: '2 1 220px', minWidth: 0 }}>
            <Select value={sku} onChange={(e) => setSku(e.target.value)}>
              {variants.map((v) => {
                const p = products.find((pp) => pp.code === v.productCode)
                const q = inventory[v.sku]?.[from] || 0
                return <option key={v.sku} value={v.sku}>{p ? productName(lang, p) : v.sku} — {variantMeta(lang, v)} ({q})</option>
              })}
            </Select>
          </Field>
          <Field label={`${t.qty} · ${t.onHandAt} ${branchName(from)}: ${onHand}`} style={{ flex: '0 1 200px' }}>
            <Input kind="qty" value={qty} aria-invalid={qtyN > onHand || undefined} onChange={(e) => setQty(e.target.value)} />
          </Field>
          <Button variant="primary" onClick={submit} disabled={cannotRequest}>{t.request}</Button>
        </div>
        {qtyN > onHand && <span style={{ fontSize: 'var(--fs-meta)', color: 'var(--color-bad)' }}>{t.stockRefused}</span>}
      </Card>
      <Card style={{ padding: isDesktop ? '6px 14px' : 0, background: isDesktop ? undefined : 'transparent' }}>
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} stacked={!isDesktop} />
      </Card>
    </div>
  )
}
