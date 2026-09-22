import { useState } from 'react'
import { Plus, X } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { useBreakpoint } from '../../lib/useMediaQuery'
import { BRANCHES } from '../../lib/mockData'
import { fmtUsd } from '../../lib/currency'
import { productName } from '../../lib/variantDisplay'
import { Field, Input, Select } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Tag } from '../../components/ui/Tag'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { ReceivePoDialog } from './ReceivePoDialog'
import type { BranchId, POStatus, PurchaseOrder } from '../../lib/types'

interface DraftItem { productCode: string; qty: string; unitCost: string }

const STATUS_VARIANT: Record<POStatus, 'neutral' | 'accent' | 'accent-2' | 'good'> = {
  draft: 'neutral', ordered: 'neutral', partial: 'accent', received: 'accent-2', closed: 'good',
}

export function PurchasingScreen() {
  const { t, lang } = useI18n()
  const nm = useNm()
  const isDesktop = useBreakpoint('laptop')
  const user = useStore((s) => s.user)
  const products = useStore((s) => s.products)
  const suppliers = useStore((s) => s.suppliers)
  const purchaseOrders = useStore((s) => s.purchaseOrders)
  const branch = useStore((s) => s.branch)
  const createPurchaseOrder = useStore((s) => s.createPurchaseOrder)
  const closePurchaseOrder = useStore((s) => s.closePurchaseOrder)
  const flash = useStore((s) => s.flash)
  // Managers order for their own branch and never see landed cost or the overhead
  // lines — those are the owner's margin inputs. The supplier unit price stays: an
  // order can't be raised without it.
  const isOwner = user?.role === 'owner'

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '')
  const [poBranchPick, setPoBranchPick] = useState<BranchId>(branch)
  const poBranch: BranchId = isOwner ? poBranchPick : branch
  const [items, setItems] = useState<DraftItem[]>([{ productCode: products[0]?.code || '', qty: '', unitCost: '' }])
  const [freight, setFreight] = useState('')
  const [customs, setCustoms] = useState('')
  const [clearing, setClearing] = useState('')
  const [receivingPo, setReceivingPo] = useState<string | null>(null)

  const statusLabel: Record<POStatus, string> = { draft: t.poDraft, ordered: t.poOrdered, partial: t.poPartial, received: t.poReceived, closed: t.poClosed }

  // The next row starts on a style not yet on the order, so lines don't collide.
  const addItem = () => setItems((cur) => {
    const used = new Set(cur.map((i) => i.productCode))
    const next = products.find((p) => !used.has(p.code)) || products[0]
    return [...cur, { productCode: next?.code || '', qty: '', unitCost: '' }]
  })
  const removeItem = (i: number) => setItems((cur) => cur.filter((_, idx) => idx !== i))
  const updateItem = (i: number, patch: Partial<DraftItem>) => setItems((cur) => cur.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))

  const isValid = (i: DraftItem) => !!i.productCode && parseInt(i.qty) > 0 && parseFloat(i.unitCost) >= 0
  const validItems = items.filter(isValid)
  const incomplete = items.some((i) => !isValid(i))
  const canCreate = validItems.length > 0 && !incomplete && !!supplierId

  const create = () => {
    createPurchaseOrder({
      supplierId, branchId: poBranch,
      items: validItems.map((i) => ({ productCode: i.productCode, qtyOrdered: parseInt(i.qty), unitCostUsd: parseFloat(i.unitCost) })),
      freightUsd: parseFloat(freight) || 0, customsUsd: parseFloat(customs) || 0, clearingUsd: parseFloat(clearing) || 0,
    })
    flash(t.poCreated)
    setItems([{ productCode: products[0]?.code || '', qty: '', unitCost: '' }])
    setFreight(''); setCustoms(''); setClearing('')
  }

  const rows = isOwner ? purchaseOrders : purchaseOrders.filter((po) => po.branchId === branch)
  const receivingPoObj = receivingPo ? purchaseOrders.find((p) => p.id === receivingPo) : null

  const columns: Column<PurchaseOrder>[] = [
    { key: 'id', header: t.poId, role: 'meta', ltr: true, tdClassName: 'text-muted', cell: (po) => po.id },
    { key: 'date', header: t.dateL, role: 'meta', tdClassName: 'text-muted', tdStyle: { fontSize: 'var(--fs-meta)' }, cell: (po) => po.date },
    { key: 'supplier', header: t.supplier, role: 'title', cell: (po) => suppliers.find((s) => s.id === po.supplierId)?.name },
    { key: 'branch', header: t.branch, hidden: !isOwner, tdClassName: 'text-muted', cell: (po) => nm(BRANCHES.find((b) => b.id === po.branchId)!.name) },
    { key: 'items', header: t.item, tdStyle: { fontSize: 'var(--fs-meta)' }, cell: (po) => po.items.map((i) => i.productCode).join(', ') },
    { key: 'qty', header: `${t.received}/${t.ordered}`, cell: (po) => `${po.items.reduce((a, i) => a + i.qtyReceived, 0)} / ${po.items.reduce((a, i) => a + i.qtyOrdered, 0)}` },
    // The order's own landed unit cost (supplier price + its share of overheads), not the product's current cost.
    { key: 'cost', header: t.landedCost, hidden: !isOwner, tdClassName: 'text-muted', tdStyle: { fontSize: 'var(--fs-meta)' }, cell: (po) => {
      const units = po.items.reduce((a, i) => a + i.qtyOrdered, 0)
      const over = units > 0 ? (po.freightUsd + po.customsUsd + po.clearingUsd) / units : 0
      return po.items.map((i) => fmtUsd(i.unitCostUsd + over)).join(', ')
    } },
    { key: 'status', header: t.poStatus, cell: (po) => <Tag variant={STATUS_VARIANT[po.status]}>{statusLabel[po.status]}</Tag> },
    // Returns null when neither branch applies so the card drops the action strip.
    { key: 'act', header: '', role: 'action', cell: (po) =>
      po.status === 'ordered' || po.status === 'partial'
        ? <Button variant="primary" style={{ fontSize: 'var(--fs-meta)' }} onClick={() => setReceivingPo(po.id)}>{t.receivePo}</Button>
        : po.status === 'received'
          ? <Button variant="secondary" style={{ fontSize: 'var(--fs-meta)' }} onClick={() => { closePurchaseOrder(po.id); flash(t.poClosed) }}>{t.closePo}</Button>
          : null },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Purchasing">
      <h3 style={{ margin: 0 }}>{t.purchasing}</h3>
      <Card style={{ gap: 10 }}>
        <span className="card-kicker">{t.newPo}</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Field label={t.supplier} style={{ flex: 1, minWidth: 180 }}>
            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label={t.branch} style={{ flex: 1, minWidth: 140 }}>
            <Select value={poBranch} disabled={!isOwner} onChange={(e) => setPoBranchPick(e.target.value as BranchId)}>
              {BRANCHES.map((b) => <option key={b.id} value={b.id}>{nm(b.name)}</option>)}
            </Select>
          </Field>
          {isOwner && (
            <>
              <Field label={t.freight} style={{ flex: 1, minWidth: 100 }}><Input kind="money" value={freight} onChange={(e) => setFreight(e.target.value)} /></Field>
              <Field label={t.customs} style={{ flex: 1, minWidth: 100 }}><Input kind="money" value={customs} onChange={(e) => setCustoms(e.target.value)} /></Field>
              <Field label={t.clearing} style={{ flex: 1, minWidth: 100 }}><Input kind="money" value={clearing} onChange={(e) => setClearing(e.target.value)} /></Field>
            </>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
              <Field label={t.item} style={{ flex: '1 1 220px', minWidth: 0 }}>
                <Select value={it.productCode} onChange={(e) => updateItem(i, { productCode: e.target.value })}>
                  {products.map((p) => <option key={p.code} value={p.code}>{productName(lang, p)} ({p.code})</option>)}
                </Select>
              </Field>
              <Field label={t.ordered} style={{ flex: '1 1 90px' }}><Input kind="qty" value={it.qty} onChange={(e) => updateItem(i, { qty: e.target.value })} /></Field>
              <Field label={t.unitCost} style={{ flex: '1 1 100px' }}><Input kind="money" value={it.unitCost} onChange={(e) => updateItem(i, { unitCost: e.target.value })} /></Field>
              {items.length > 1 && <Button variant="ghost" icon aria-label={t.removeLine} onClick={() => removeItem(i)}><X /></Button>}
            </div>
          ))}
          <Button variant="secondary" onClick={addItem} style={{ alignSelf: 'flex-start' }}><Plus />{t.addItem}</Button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={create} disabled={!canCreate}>{t.createPo}</Button>
          {incomplete && <span className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{t.poLineHint}</span>}
        </div>
      </Card>

      <Card style={{ padding: isDesktop ? '6px 14px' : 0, background: isDesktop ? undefined : 'transparent' }}>
        {/* 9 columns don't fit an iPad portrait either */}
        <DataTable rows={rows} columns={columns} rowKey={(po) => po.id} stacked={!isDesktop} />
      </Card>
      {receivingPoObj && <ReceivePoDialog po={receivingPoObj} onClose={() => setReceivingPo(null)} />}
    </div>
  )
}
