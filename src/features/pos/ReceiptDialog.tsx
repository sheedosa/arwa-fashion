import { CloudSlash, Printer, WhatsappLogo } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { BRANCHES } from '../../lib/mockData'
import { fmtUsd, fmtLyd } from '../../lib/currency'
import { lineTotal, saleTotal, saleSubtotal } from '../../lib/calc'
import { variantMeta, productName } from '../../lib/variantDisplay'
import { Button } from '../../components/ui/Button'
import { Dialog, DialogActions } from '../../components/ui/Dialog'
import { Tag } from '../../components/ui/Tag'
import type { Sale } from '../../lib/types'

export function ReceiptDialog({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const { t, lang } = useI18n()
  const products = useStore((s) => s.products)
  const variants = useStore((s) => s.variants)
  const customers = useStore((s) => s.customers)
  const fxRate = useStore((s) => s.fxRate)

  const branch = BRANCHES.find((b) => b.id === sale.branchId)!
  const subtotal = saleSubtotal(sale.lines)
  const total = saleTotal(sale)
  const customer = sale.customerId != null ? customers.find((c) => c.id === sale.customerId) : null
  const waText = encodeURIComponent((lang === 'ar' ? 'إيصال أروى فاشن ' : 'Arwa Fashion receipt ') + sale.no + ' — ' + fmtUsd(total))

  return (
    // The shared Dialog gives Escape, backdrop dismiss, focus handling and a close button;
    // `print-root` is what the print stylesheet keeps when everything else is hidden.
    <Dialog title={t.receipt} onClose={onClose} width={400} className="print-root" panelStyle={{ gap: 0 }}>
        <div style={{ textAlign: 'center', paddingBottom: 12, borderBottom: '1px dashed var(--color-divider)' }}>
          <div style={{ fontSize: 18.5, fontWeight: 500 }}>{t.brand}</div>
          <div className="text-muted" style={{ fontSize: 13 }}>{lang === 'ar' ? branch.name.ar : branch.name.en} · {sale.date} {sale.time}</div>
          <div className="text-muted" style={{ fontSize: 13, direction: 'ltr' }}>{sale.no}</div>
          {sale.queued && <Tag variant="accent" style={{ marginTop: 6 }}><CloudSlash style={{ marginInlineEnd: 4 }} />{t.queuedNote}</Tag>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0', borderBottom: '1px dashed var(--color-divider)' }}>
          {sale.lines.map((l, i) => {
            const v = variants.find((vv) => vv.sku === l.sku)
            const p = v && products.find((pp) => pp.code === v.productCode)
            return (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 14 }}>
                <span style={{ flex: 1 }}>{p ? productName(lang, p) : l.sku} <span className="text-muted">{v ? variantMeta(lang, v) : ''} ×{l.qty}</span></span>
                <span>{fmtUsd(lineTotal(l))}</span>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 0', fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">{t.subtotal}</span><span>{fmtUsd(subtotal)}</span></div>
          {sale.orderDiscountPct > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">{t.orderDisc}</span><span>−{fmtUsd(subtotal - total)} ({sale.orderDiscountPct}%)</span></div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16.5, fontWeight: 500, padding: '4px 0' }}>
            <span>{t.total}</span><span>{fmtUsd(total)} <span className="text-muted" style={{ fontSize: 12.5 }}>≈ {fmtLyd(total * fxRate, lang)}</span></span>
          </div>
          {sale.payments.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">{(p.method === 'cash' ? t.cash : p.method === 'card' ? t.card : t.bank)} — {p.currency}</span>
              <span style={{ direction: 'ltr' }}>{p.currency === 'USD' ? fmtUsd(p.amount) : `${fmtLyd(p.amount, lang)} (@${(p.fxRate ?? fxRate).toFixed(2)})`}</span>
            </div>
          ))}
          {sale.change && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">{t.change}</span>
              <span style={{ direction: 'ltr' }}>{sale.change.currency === 'USD' ? fmtUsd(sale.change.amount) : fmtLyd(sale.change.amount, lang)}</span>
            </div>
          )}
          {customer && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">{t.name}</span><span>{customer.name}</span></div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">{t.seller}</span><span>{sale.sellerName}</span></div>
        </div>
        <div className="text-muted" style={{ textAlign: 'center', fontSize: 12.5, paddingBottom: 10 }}>{t.thanks}</div>
        <DialogActions>
          <Button variant="secondary" onClick={() => window.print()}><Printer />{t.print}</Button>
          <a className="btn btn-secondary" href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer"><WhatsappLogo />{t.whatsapp}</a>
          <Button variant="primary" onClick={onClose}>{t.newSale}</Button>
        </DialogActions>
    </Dialog>
  )
}
