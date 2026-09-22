import { useMemo, useState } from 'react'
import { DownloadSimple, UserPlus, WhatsappLogo, X } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { useIsPhone } from '../../lib/useMediaQuery'
import { useScrollIntoView } from '../../lib/useScrollIntoView'
import { fmtUsd } from '../../lib/currency'
import { saleTotal } from '../../lib/calc'
import { productName } from '../../lib/variantDisplay'
import { exportCsv } from '../../lib/csv'
import { Field, Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Card, CardKicker } from '../../components/ui/Card'
import { DataTable, type Column } from '../../components/ui/DataTable'
import type { Customer } from '../../lib/types'

export function CustomersScreen() {
  const { t, lang } = useI18n()
  const isPhone = useIsPhone()
  const customers = useStore((s) => s.customers)
  const sales = useStore((s) => s.sales)
  const products = useStore((s) => s.products)
  const variants = useStore((s) => s.variants)
  const addCustomer = useStore((s) => s.addCustomer)
  const flash = useStore((s) => s.flash)

  const [phone, setPhone] = useState('+218 9')
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)

  const digits = phone.replace(/\D/g, '')
  const cannotAdd = digits.length < 11 || !name.trim()

  const cq = query.trim().toLowerCase()
  const rows = useMemo(() => customers.filter((c) => !cq || c.name.toLowerCase().includes(cq) || c.phone.replace(/\D/g, '').includes(cq.replace(/\D/g, '') || 'zz')), [customers, cq])

  const detail = openId != null ? customers.find((c) => c.id === openId) : null
  const history = detail ? sales.filter((s) => s.customerId === detail.id) : []

  const add = () => {
    if (!addCustomer(phone, name)) { flash(t.custExists); return }
    flash(t.custAdded); setPhone('+218 9'); setName('')
  }
  const detailRef = useScrollIntoView<HTMLDivElement>(openId)

  const columns: Column<Customer>[] = [
    { key: 'name', header: t.name, role: 'title', cell: (c) => c.name },
    { key: 'phone', header: t.phone, role: 'meta', ltr: true, tdClassName: 'text-muted', cell: (c) => c.phone },
    { key: 'points', header: t.points, cell: (c) => c.points },
    { key: 'last', header: t.lastBuy, tdClassName: 'text-muted', cell: (c) => c.lastPurchaseDate || '—' },
    { key: 'open', header: '', role: 'action', cell: (c) => <Button variant="ghost" onClick={() => setOpenId(c.id)}>{t.choose}</Button> },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Customers">
      <h3 style={{ margin: 0 }}>{t.customers}</h3>
      <Card style={{ gap: 10 }}>
        <span className="card-kicker">{t.custNew}</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
          <Field label={t.phone} style={{ flex: '1 1 190px' }}><Input kind="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label={t.name} style={{ flex: '2 1 180px' }}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Button variant="primary" onClick={add} disabled={cannotAdd}><UserPlus />{t.addCust}</Button>
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Input kind="search" style={{ flex: '1 1 200px', maxWidth: 300 }} placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button variant="secondary" onClick={() => exportCsv('customers.csv', ['Name', 'Phone', 'Points', 'Last purchase'], customers.map((c) => [c.name, c.phone, c.points, c.lastPurchaseDate || '—']))}>
          <DownloadSimple />{t.export}
        </Button>
      </div>
      <Card style={{ padding: isPhone ? 0 : '6px 14px', background: isPhone ? 'transparent' : undefined }}>
        <DataTable rows={rows} columns={columns} rowKey={(c) => String(c.id)} />
      </Card>
      {detail && (
        <div ref={detailRef} style={{ scrollMarginTop: 12 }}>
        <Card className="elev-md" style={{ gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 160px', minWidth: 0 }}>
              <div style={{ fontSize: 'var(--fs-lead)', fontWeight: 500 }}>{detail.name}</div>
              <div className="text-muted ltr-cell" style={{ fontSize: 'var(--fs-meta)' }}>{detail.phone}</div>
            </div>
            <a className="btn btn-secondary" href={`https://wa.me/${detail.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
              <WhatsappLogo />{t.whatsapp}
            </a>
            <Button variant="ghost" icon onClick={() => setOpenId(null)} aria-label={t.close}><X /></Button>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 'var(--fs-body)', flexWrap: 'wrap' }}>
            <span><span className="text-muted">{t.points}:</span> {detail.points}</span>
            <span><span className="text-muted">{t.sizesPref}:</span> {detail.sizePreferences}</span>
          </div>
          <CardKicker>{t.history}</CardKicker>
          {history.length === 0 && <div className="text-muted">—</div>}
          {history.map((s) => (
            <div key={s.no} style={{ display: 'flex', gap: 10, fontSize: 'var(--fs-body)', padding: '3px 0', flexWrap: 'wrap' }}>
              <span className="text-muted ltr-cell">{s.no}</span>
              <span className="text-muted">{s.date}</span>
              <span style={{ flex: '1 1 100%', order: 3 }}>{s.lines.map((l) => { const p = products.find((pp) => pp.code === variants.find((v) => v.sku === l.sku)?.productCode); return p ? productName(lang, p) : l.sku }).join('، ')}</span>
              <span style={{ marginInlineStart: 'auto' }}>{fmtUsd(saleTotal(s))}</span>
            </div>
          ))}
        </Card>
        </div>
      )}
    </div>
  )
}
