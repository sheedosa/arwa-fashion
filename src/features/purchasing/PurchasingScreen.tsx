import { useState } from 'react'
import { Plus, X } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { BRANCHES } from '../../lib/mockData'
import { fmtUsd } from '../../lib/currency'
import { productName } from '../../lib/variantDisplay'
import { Field, Input, Select } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Tag } from '../../components/ui/Tag'
import { ReceivePoDialog } from './ReceivePoDialog'
import type { BranchId, POStatus } from '../../lib/types'

interface DraftItem { productCode: string; qty: string; unitCost: string }

const STATUS_VARIANT: Record<POStatus, 'neutral' | 'accent' | 'accent-2' | 'good'> = {
  draft: 'neutral', ordered: 'neutral', partial: 'accent', received: 'accent-2', closed: 'good',
}

export function PurchasingScreen() {
  const { t, lang } = useI18n()
  const nm = useNm()
  const products = useStore((s) => s.products)
  const suppliers = useStore((s) => s.suppliers)
  const purchaseOrders = useStore((s) => s.purchaseOrders)
  const branch = useStore((s) => s.branch)
  const createPurchaseOrder = useStore((s) => s.createPurchaseOrder)
  const closePurchaseOrder = useStore((s) => s.closePurchaseOrder)
  const flash = useStore((s) => s.flash)

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '')
  const [poBranch, setPoBranch] = useState<BranchId>(branch)
  const [items, setItems] = useState<DraftItem[]>([{ productCode: products[0]?.code || '', qty: '', unitCost: '' }])
  const [freight, setFreight] = useState('')
  const [customs, setCustoms] = useState('')
  const [clearing, setClearing] = useState('')
  const [receivingPo, setReceivingPo] = useState<string | null>(null)

  const statusLabel: Record<POStatus, string> = { draft: t.poDraft, ordered: t.poOrdered, partial: t.poPartial, received: t.poReceived, closed: t.poClosed }

  const addItem = () => setItems((cur) => [...cur, { productCode: products[0]?.code || '', qty: '', unitCost: '' }])
  const removeItem = (i: number) => setItems((cur) => cur.filter((_, idx) => idx !== i))
  const updateItem = (i: number, patch: Partial<DraftItem>) => setItems((cur) => cur.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))

  const validItems = items.filter((i) => i.productCode && parseInt(i.qty) > 0 && parseFloat(i.unitCost) >= 0)
  const canCreate = validItems.length > 0 && supplierId

  const create = () => {
    createPurchaseOrder({
      supplierId, branchId: poBranch,
      items: validItems.map((i) => ({ productCode: i.productCode, qtyOrdered: parseInt(i.qty), unitCostUsd: parseFloat(i.unitCost) })),
      freightUsd: parseFloat(freight) || 0, customsUsd: parseFloat(customs) || 0, clearingUsd: parseFloat(clearing) || 0,
    })
    flash(t.trDone)
    setItems([{ productCode: products[0]?.code || '', qty: '', unitCost: '' }])
    setFreight(''); setCustoms(''); setClearing('')
  }

  const receivingPoObj = receivingPo ? purchaseOrders.find((p) => p.id === receivingPo) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Purchasing">
      <h3 style={{ margin: 0 }}>{t.purchasing}</h3>
      <Card style={{ gap: 10 }}>
        <span className="card-kicker">{t.newPo}</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Field label={t.supplier}>
            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label={t.branch}>
            <Select value={poBranch} onChange={(e) => setPoBranch(e.target.value as BranchId)}>
              {BRANCHES.map((b) => <option key={b.id} value={b.id}>{nm(b.name)}</option>)}
            </Select>
          </Field>
          <Field label={t.freight}><Input style={{ direction: 'ltr', width: 100 }} value={freight} onChange={(e) => setFreight(e.target.value)} /></Field>
          <Field label={t.customs}><Input style={{ direction: 'ltr', width: 100 }} value={customs} onChange={(e) => setCustoms(e.target.value)} /></Field>
          <Field label={t.clearing}><Input style={{ direction: 'ltr', width: 100 }} value={clearing} onChange={(e) => setClearing(e.target.value)} /></Field>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
              <Field label={t.item} style={{ flex: 1, minWidth: 220 }}>
                <Select value={it.productCode} onChange={(e) => updateItem(i, { productCode: e.target.value })}>
                  {products.map((p) => <option key={p.code} value={p.code}>{productName(lang, p)} ({p.code})</option>)}
                </Select>
              </Field>
              <Field label={t.ordered}><Input style={{ direction: 'ltr', width: 90 }} value={it.qty} onChange={(e) => updateItem(i, { qty: e.target.value })} /></Field>
              <Field label={t.unitCost}><Input style={{ direction: 'ltr', width: 100 }} value={it.unitCost} onChange={(e) => updateItem(i, { unitCost: e.target.value })} /></Field>
              {items.length > 1 && <Button variant="ghost" icon onClick={() => removeItem(i)}><X /></Button>}
            </div>
          ))}
          <Button variant="secondary" onClick={addItem} style={{ alignSelf: 'flex-start' }}><Plus />{t.addItem}</Button>
        </div>
        <Button variant="primary" onClick={create} disabled={!canCreate} style={{ alignSelf: 'flex-start' }}>{t.createPo}</Button>
      </Card>

      <Card style={{ padding: '6px 14px' }}>
        <table className="table">
          <thead>
            <tr><th>{t.poId}</th><th>{t.dateL}</th><th>{t.supplier}</th><th>{t.branch}</th><th>{t.item}</th><th>{t.ordered}/{t.received}</th><th>{t.landedCost}</th><th>{t.poStatus}</th><th></th></tr>
          </thead>
          <tbody>
            {purchaseOrders.map((po) => {
              const supplier = suppliers.find((s) => s.id === po.supplierId)
              return (
                <tr key={po.id}>
                  <td className="ltr-cell text-muted">{po.id}</td>
                  <td className="text-muted" style={{ fontSize: 13.5 }}>{po.date}</td>
                  <td style={{ fontSize: 14 }}>{supplier?.name}</td>
                  <td className="text-muted" style={{ fontSize: 14 }}>{nm(BRANCHES.find((b) => b.id === po.branchId)!.name)}</td>
                  <td style={{ fontSize: 13.5 }}>
                    {po.items.map((i) => products.find((p) => p.code === i.productCode)?.code).join(', ')}
                  </td>
                  <td style={{ fontSize: 14 }}>{po.items.reduce((a, i) => a + i.qtyReceived, 0)} / {po.items.reduce((a, i) => a + i.qtyOrdered, 0)}</td>
                  <td className="text-muted" style={{ fontSize: 13.5 }}>
                    {po.items.map((i) => fmtUsd(products.find((p) => p.code === i.productCode)?.cost ?? 0)).join(', ')}
                  </td>
                  <td><Tag variant={STATUS_VARIANT[po.status]}>{statusLabel[po.status]}</Tag></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    {(po.status === 'ordered' || po.status === 'partial') && (
                      <Button variant="primary" style={{ fontSize: 13.5, padding: '4px 12px' }} onClick={() => setReceivingPo(po.id)}>{t.receivePo}</Button>
                    )}
                    {po.status === 'received' && (
                      <Button variant="secondary" style={{ fontSize: 13.5, padding: '4px 12px' }} onClick={() => closePurchaseOrder(po.id)}>{t.poClosed}</Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
      {receivingPoObj && <ReceivePoDialog po={receivingPoObj} onClose={() => setReceivingPo(null)} />}
    </div>
  )
}
