import { useMemo, useState } from 'react'
import { DownloadSimple, UserPlus, WhatsappLogo, X } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { fmtUsd } from '../../lib/currency'
import { saleTotal } from '../../lib/calc'
import { productName } from '../../lib/variantDisplay'
import { exportCsv } from '../../lib/csv'
import { Field, Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Card, CardKicker } from '../../components/ui/Card'

export function CustomersScreen() {
  const { t, lang } = useI18n()
  const customers = useStore((s) => s.customers)
  const sales = useStore((s) => s.sales)
  const products = useStore((s) => s.products)
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
    addCustomer(phone, name)
    flash(t.custAdded)
    setPhone('+218 9'); setName('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Customers">
      <h3 style={{ margin: 0 }}>{t.customers}</h3>
      <Card style={{ gap: 10 }}>
        <span className="card-kicker">{t.custNew}</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
          <Field label={t.phone} style={{ width: 190 }}><Input style={{ direction: 'ltr' }} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label={t.name} style={{ flex: 1, minWidth: 180 }}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Button variant="primary" onClick={add} disabled={cannotAdd}><UserPlus />{t.addCust}</Button>
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Input style={{ maxWidth: 300 }} placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button variant="secondary" onClick={() => exportCsv('customers.csv', ['Name', 'Phone', 'Points', 'Last purchase'], customers.map((c) => [c.name, c.phone, c.points, c.lastPurchaseDate || '—']))}>
          <DownloadSimple />{t.export}
        </Button>
      </div>
      <Card style={{ padding: '6px 14px' }}>
        <table className="table">
          <thead><tr><th>{t.name}</th><th>{t.phone}</th><th>{t.points}</th><th>{t.lastBuy}</th><th></th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className="ltr-cell text-muted" style={{ fontSize: 14.5 }}>{c.phone}</td>
                <td>{c.points}</td>
                <td className="text-muted" style={{ fontSize: 14 }}>{c.lastPurchaseDate || '—'}</td>
                <td><Button variant="ghost" style={{ fontSize: 14 }} onClick={() => setOpenId(c.id)}>{t.choose}</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {detail && (
        <Card className="elev-md" style={{ gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ fontSize: 18.5, fontWeight: 500 }}>{detail.name}</div>
              <div className="text-muted" style={{ fontSize: 13.5, direction: 'ltr', textAlign: 'end' }}>{detail.phone}</div>
            </div>
            <a className="btn btn-secondary" style={{ marginInlineStart: 'auto', fontSize: 14 }} href={`https://wa.me/${detail.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
              <WhatsappLogo />{t.whatsapp}
            </a>
            <Button variant="ghost" icon onClick={() => setOpenId(null)}><X /></Button>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 14 }}>
            <span><span className="text-muted">{t.points}:</span> {detail.points}</span>
            <span><span className="text-muted">{t.sizesPref}:</span> {detail.sizePreferences}</span>
          </div>
          <CardKicker>{t.history}</CardKicker>
          {history.length === 0 && <div className="text-muted" style={{ fontSize: 14 }}>—</div>}
          {history.map((s) => (
            <div key={s.no} style={{ display: 'flex', gap: 10, fontSize: 14, padding: '3px 0' }}>
              <span style={{ direction: 'ltr' }} className="text-muted">{s.no}</span>
              <span className="text-muted">{s.date}</span>
              <span style={{ flex: 1 }}>{s.lines.map((l) => productName(lang, products.find((p) => l.sku.startsWith(p.code + '-'))!)).join('، ')}</span>
              <span>{fmtUsd(saleTotal(s))}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
