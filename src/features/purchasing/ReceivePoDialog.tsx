import { useState } from 'react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { productName } from '../../lib/variantDisplay'
import { Dialog, DialogActions } from '../../components/ui/Dialog'
import { Field, Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import type { PurchaseOrder } from '../../lib/types'

export function ReceivePoDialog({ po, onClose }: { po: PurchaseOrder; onClose: () => void }) {
  const { t, lang } = useI18n()
  const products = useStore((s) => s.products)
  const receivePurchaseOrder = useStore((s) => s.receivePurchaseOrder)
  const flash = useStore((s) => s.flash)

  const remainingByCode = Object.fromEntries(po.items.map((i) => [i.productCode, i.qtyOrdered - i.qtyReceived]))
  const [qtys, setQtys] = useState<Record<string, string>>(Object.fromEntries(po.items.map((i) => [i.productCode, String(remainingByCode[i.productCode])])))

  const receipts = po.items
    .map((i) => ({ productCode: i.productCode, qty: Math.min(remainingByCode[i.productCode], Math.max(0, parseInt(qtys[i.productCode]) || 0)) }))
    .filter((r) => r.qty > 0)
  const canSubmit = receipts.length > 0

  const submit = () => { receivePurchaseOrder(po.id, receipts); flash(t.trDone); onClose() }

  return (
    <Dialog title={`${t.receivePo} — ${po.id}`} onClose={onClose} width={480}>
      <span className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{t.allocNote}</span>
      {po.items.map((i) => {
        const p = products.find((pp) => pp.code === i.productCode)!
        const remaining = remainingByCode[i.productCode]
        return (
          <Field key={i.productCode} label={`${productName(lang, p)} — ${t.ordered} ${i.qtyOrdered} / ${t.received} ${i.qtyReceived}`}>
            <Input kind="qty" style={{ maxWidth: 160 }} value={qtys[i.productCode]} disabled={remaining <= 0}
              onChange={(e) => setQtys((cur) => ({ ...cur, [i.productCode]: e.target.value }))} />
          </Field>
        )
      })}
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>{t.cancel}</Button>
        <Button variant="primary" onClick={submit} disabled={!canSubmit}>{t.receivePo}</Button>
      </DialogActions>
    </Dialog>
  )
}
