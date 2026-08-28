import { useState } from 'react'
import { DownloadSimple, Plus } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { fmtUsd } from '../../lib/currency'
import { productName } from '../../lib/variantDisplay'
import { exportCsv } from '../../lib/csv'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { NewProductDialog } from './NewProductDialog'

export function ProductsScreen() {
  const { t, lang } = useI18n()
  const products = useStore((s) => s.products)
  const user = useStore((s) => s.user)
  const [npOpen, setNpOpen] = useState(false)
  const canSeeCost = user?.role === 'owner'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Products">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h3 style={{ margin: 0, flex: 1 }}>{t.products}</h3>
        <Button
          variant="secondary"
          onClick={() => exportCsv(
            'products.csv',
            canSeeCost ? ['Code', 'Name AR', 'Name EN', 'Category', 'Price USD', 'Cost USD'] : ['Code', 'Name AR', 'Name EN', 'Category', 'Price USD'],
            products.map((p) => canSeeCost ? [p.code, p.name.ar, p.name.en, p.category.en, p.price, p.cost] : [p.code, p.name.ar, p.name.en, p.category.en, p.price]),
          )}
        >
          <DownloadSimple />{t.export}
        </Button>
        <Button variant="primary" onClick={() => setNpOpen(true)}><Plus />{t.newProduct}</Button>
      </div>
      <Card style={{ padding: '6px 14px' }}>
        <table className="table">
          <thead>
            <tr>
              <th>{t.style}</th><th>{t.product}</th><th>{t.category}</th><th>{t.priceL}</th>
              {canSeeCost && <th>{t.costL}</th>}
              <th>{t.variantsL}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.code}>
                <td className="ltr-cell text-muted" style={{ fontSize: 13.5 }}>{p.code}</td>
                <td>{productName(lang, p)}</td>
                <td className="text-muted" style={{ fontSize: 14 }}>{lang === 'ar' ? p.category.ar : p.category.en}</td>
                <td>{fmtUsd(p.price)}</td>
                {canSeeCost && <td className="text-muted">{fmtUsd(p.cost)}</td>}
                <td className="text-muted" style={{ fontSize: 14 }}>{p.sizes.length} × {p.colors.length} = {p.sizes.length * p.colors.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {npOpen && <NewProductDialog onClose={() => setNpOpen(false)} canSeeCost={!!canSeeCost} />}
    </div>
  )
}
