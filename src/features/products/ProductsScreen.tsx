import { useState } from 'react'
import { DownloadSimple, Plus } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { useIsPhone } from '../../lib/useMediaQuery'
import { fmtUsd } from '../../lib/currency'
import { productName } from '../../lib/variantDisplay'
import { exportCsv } from '../../lib/csv'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { NewProductDialog } from './NewProductDialog'
import type { Product } from '../../lib/types'

export function ProductsScreen() {
  const { t, lang } = useI18n()
  const isPhone = useIsPhone()
  const products = useStore((s) => s.products)
  const user = useStore((s) => s.user)
  const [npOpen, setNpOpen] = useState(false)
  const canSeeCost = user?.role === 'owner'

  const columns: Column<Product>[] = [
    { key: 'code', header: t.style, role: 'meta', ltr: true, tdClassName: 'text-muted', tdStyle: { fontSize: 'var(--fs-meta)' }, cell: (p) => p.code },
    { key: 'name', header: t.product, role: 'title', cell: (p) => productName(lang, p) },
    { key: 'cat', header: t.category, tdClassName: 'text-muted', cell: (p) => lang === 'ar' ? p.category.ar : p.category.en },
    { key: 'price', header: t.priceL, cell: (p) => fmtUsd(p.price) },
    { key: 'cost', header: t.costL, hidden: !canSeeCost, tdClassName: 'text-muted', cell: (p) => fmtUsd(p.cost) },
    { key: 'variants', header: t.variantsL, tdClassName: 'text-muted', cell: (p) => `${p.sizes.length} × ${p.colors.length} = ${p.sizes.length * p.colors.length}` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Products">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
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
      <Card style={{ padding: isPhone ? 0 : '6px 14px', background: isPhone ? 'transparent' : undefined }}>
        <DataTable rows={products} columns={columns} rowKey={(p) => p.code} pane={products.length > 12} />
      </Card>
      {npOpen && <NewProductDialog onClose={() => setNpOpen(false)} canSeeCost={!!canSeeCost} />}
    </div>
  )
}
