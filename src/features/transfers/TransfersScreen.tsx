import { useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { BRANCHES } from '../../lib/mockData'
import { variantMeta, productName } from '../../lib/variantDisplay'
import { exportCsv } from '../../lib/csv'
import { Field, Input, Select } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Tag } from '../../components/ui/Tag'
import type { BranchId, TransferStatus } from '../../lib/types'

const STATUS_STYLE: Record<TransferStatus, { variant: 'neutral' | 'accent' | 'accent-2' }> = {
  requested: { variant: 'neutral' },
  sent: { variant: 'accent' },
  received: { variant: 'accent-2' },
}

export function TransfersScreen() {
  const { t, lang } = useI18n()
  const nm = useNm()
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

  const submit = () => {
    requestTransfer(from, to, sku, parseInt(qty))
    flash(t.trDone)
  }

  const act = (id: string) => { advanceTransfer(id); flash(t.trDone) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Transfers">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h3 style={{ margin: 0, flex: 1 }}>{t.transfers}</h3>
        <Button
          variant="secondary"
          onClick={() => exportCsv('transfers.csv', ['ID', 'Date', 'From', 'To', 'SKU', 'Qty', 'Status'], transfers.map((x) => [x.id, x.date, x.from, x.to, x.sku, x.qty, x.status]))}
        >
          <DownloadSimple />{t.export}
        </Button>
      </div>
      <Card style={{ gap: 10 }}>
        <span className="card-kicker">{t.newTransfer}</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
          <Field label={t.from}>
            <Select value={from} onChange={(e) => setFrom(e.target.value as BranchId)}>
              {BRANCHES.map((b) => <option key={b.id} value={b.id}>{nm(b.name)}</option>)}
            </Select>
          </Field>
          <Field label={t.to}>
            <Select value={to} onChange={(e) => setTo(e.target.value as BranchId)}>
              {BRANCHES.map((b) => <option key={b.id} value={b.id}>{nm(b.name)}</option>)}
            </Select>
          </Field>
          <Field label={t.item}>
            <Select style={{ minWidth: 220 }} value={sku} onChange={(e) => setSku(e.target.value)}>
              {variants.map((v) => {
                const p = products.find((pp) => pp.code === v.productCode)!
                return <option key={v.sku} value={v.sku}>{productName(lang, p)} — {variantMeta(lang, v)}</option>
              })}
            </Select>
          </Field>
          <Field label={t.qty}><Input style={{ width: 80 }} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
          <Button variant="primary" onClick={submit} disabled={cannotRequest}>{t.request}</Button>
        </div>
      </Card>
      <Card style={{ padding: '6px 14px' }}>
        <table className="table">
          <thead>
            <tr><th>#</th><th>{t.dateL}</th><th>{t.from} {arrow} {t.to}</th><th>{t.item}</th><th>{t.qty}</th><th>{t.status}</th><th></th></tr>
          </thead>
          <tbody>
            {transfers.map((r) => {
              const v = variants.find((vv) => vv.sku === r.sku)!
              const p = products.find((pp) => pp.code === v.productCode)!
              return (
                <tr key={r.id}>
                  <td className="ltr-cell text-muted">{r.id}</td>
                  <td className="text-muted" style={{ fontSize: 13.5 }}>{r.date}</td>
                  <td style={{ fontSize: 14.5 }}>{nm(BRANCHES.find((b) => b.id === r.from)!.name)} {arrow} {nm(BRANCHES.find((b) => b.id === r.to)!.name)}</td>
                  <td style={{ fontSize: 14.5 }}>{productName(lang, p)} · {variantMeta(lang, v)}</td>
                  <td>{r.qty}</td>
                  <td><Tag variant={STATUS_STYLE[r.status].variant}>{statusLabel[r.status]}</Tag></td>
                  <td>
                    {r.status !== 'received' && (
                      <Button variant="primary" style={{ fontSize: 13.5, padding: '4px 12px' }} onClick={() => act(r.id)}>
                        {r.status === 'requested' ? t.send : t.receive}
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
