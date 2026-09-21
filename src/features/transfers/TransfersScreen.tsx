import { useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { useBreakpoint } from '../../lib/useMediaQuery'
import { BRANCHES } from '../../lib/mockData'
import { variantMeta, productName } from '../../lib/variantDisplay'
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
  const transfers = useStore((s) => s.transfers)
  const variants = useStore((s) => s.variants)
  const products = useStore((s) => s.products)
  const requestTransfer = useStore((s) => s.requestTransfer)
  const advanceTransfer = useStore((s) => s.advanceTransfer)
  const flash = useStore((s) => s.flash)

  const [from, setFrom] = useState<BranchId>('tr')
  const [to, setTo] = useState<BranchId>('bn')
  const [sku, setSku] = useState(variants[0]?.sku || '')
  const [qty, setQty] = useState('1')

  const cannotRequest = from === to || !(parseInt(qty) > 0)
  const statusLabel: Record<TransferStatus, string> = { requested: t.statusReq, sent: t.statusSent, received: t.statusRec }
  const arrow = lang === 'ar' ? '←' : '→'
  const branchName = (id: BranchId) => nm(BRANCHES.find((b) => b.id === id)!.name)

  const submit = () => { requestTransfer(from, to, sku, parseInt(qty)); flash(t.trDone) }
  const act = (id: string) => { advanceTransfer(id); flash(t.trDone) }

  const columns: Column<Transfer>[] = [
    { key: 'id', header: '#', role: 'meta', ltr: true, tdClassName: 'text-muted', cell: (r) => r.id },
    { key: 'date', header: t.dateL, role: 'meta', tdClassName: 'text-muted', tdStyle: { fontSize: 'var(--fs-meta)' }, cell: (r) => r.date },
    { key: 'item', header: t.item, role: 'title', cell: (r) => {
      const v = variants.find((vv) => vv.sku === r.sku)!
      const p = products.find((pp) => pp.code === v.productCode)!
      return `${productName(lang, p)} · ${variantMeta(lang, v)}`
    } },
    { key: 'route', header: `${t.from} ${arrow} ${t.to}`, cell: (r) => `${branchName(r.from)} ${arrow} ${branchName(r.to)}` },
    { key: 'qty', header: t.qty, cell: (r) => r.qty },
    { key: 'status', header: t.status, cell: (r) => <Tag variant={STATUS_STYLE[r.status]}>{statusLabel[r.status]}</Tag> },
    { key: 'act', header: '', role: 'action', cell: (r) => r.status !== 'received'
      ? <Button variant="primary" style={{ fontSize: 'var(--fs-meta)' }} onClick={() => act(r.id)}>{r.status === 'requested' ? t.send : t.receive}</Button>
      : null },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Transfers">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, flex: 1 }}>{t.transfers}</h3>
        <Button variant="secondary" onClick={() => exportCsv('transfers.csv', ['ID', 'Date', 'From', 'To', 'SKU', 'Qty', 'Status'], transfers.map((x) => [x.id, x.date, x.from, x.to, x.sku, x.qty, x.status]))}>
          <DownloadSimple />{t.export}
        </Button>
      </div>
      <Card style={{ gap: 10 }}>
        <span className="card-kicker">{t.newTransfer}</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
          <Field label={t.from} style={{ flex: '1 1 130px' }}>
            <Select value={from} onChange={(e) => setFrom(e.target.value as BranchId)}>
              {BRANCHES.map((b) => <option key={b.id} value={b.id}>{nm(b.name)}</option>)}
            </Select>
          </Field>
          <Field label={t.to} style={{ flex: '1 1 130px' }}>
            <Select value={to} onChange={(e) => setTo(e.target.value as BranchId)}>
              {BRANCHES.map((b) => <option key={b.id} value={b.id}>{nm(b.name)}</option>)}
            </Select>
          </Field>
          <Field label={t.item} style={{ flex: '2 1 220px', minWidth: 0 }}>
            <Select value={sku} onChange={(e) => setSku(e.target.value)}>
              {variants.map((v) => {
                const p = products.find((pp) => pp.code === v.productCode)!
                return <option key={v.sku} value={v.sku}>{productName(lang, p)} — {variantMeta(lang, v)}</option>
              })}
            </Select>
          </Field>
          <Field label={t.qty} style={{ flex: '0 1 90px' }}><Input kind="qty" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
          <Button variant="primary" onClick={submit} disabled={cannotRequest}>{t.request}</Button>
        </div>
      </Card>
      <Card style={{ padding: isDesktop ? '6px 14px' : 0, background: isDesktop ? undefined : 'transparent' }}>
        <DataTable rows={transfers} columns={columns} rowKey={(r) => r.id} stacked={!isDesktop} />
      </Card>
    </div>
  )
}
