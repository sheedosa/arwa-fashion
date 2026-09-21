import type { CSSProperties } from 'react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { fmtUsd } from '../../lib/currency'
import { sellThroughByStyle, sizeRunAnalysis, deadStockAging, marginByCategory, salesBySeller } from '../../lib/analytics'
import { productName } from '../../lib/variantDisplay'
import { Card, CardKicker } from '../../components/ui/Card'
import { Tag } from '../../components/ui/Tag'

export function ReportsScreen() {
  const { t, lang } = useI18n()
  const sales = useStore((s) => s.sales)
  const queue = useStore((s) => s.queue)
  const products = useStore((s) => s.products)
  const variants = useStore((s) => s.variants)
  const inventory = useStore((s) => s.inventory)

  const sellThrough = sellThroughByStyle(sales, queue, products, variants, inventory)
  const sizeRun = sizeRunAnalysis(sales, queue, variants, inventory)
  const deadStock = deadStockAging(sales, queue, variants, products, inventory).slice(0, 12)
  const margin = marginByCategory(sales, queue, products)
  const bySeller = salesBySeller(sales, queue)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} data-screen-label="Reports">
      <h3 style={{ margin: 0 }}>{t.reports}</h3>

      <div className="grid-2">
        <Card>
          <CardKicker>{t.sellThrough}</CardKicker>
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>{t.style}</th><th>{t.product}</th><th>{t.units}</th><th>{t.sellThroughPct}</th></tr></thead>
              <tbody>
                {sellThrough.map((r) => (
                  <tr key={r.code}>
                    <td className="ltr-cell text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{r.code}</td>
                    <td>{productName(lang, r.product)}</td>
                    <td>{r.units}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: '1 1 40px', maxWidth: 60, height: 6, borderRadius: 3, background: 'var(--color-neutral-800)', overflow: 'hidden' }}>
                          <div style={{ width: `${r.pct}%`, height: '100%', background: 'var(--color-accent)' }} />
                        </div>
                        <span style={{ fontSize: 'var(--fs-meta)' }}>{r.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardKicker>{t.sizeRun}</CardKicker>
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>{t.sizeLabel}</th><th>{t.units}</th><th>{t.qty}</th><th>{t.soldPct}</th></tr></thead>
              <tbody>
                {sizeRun.map((r) => (
                  <tr key={r.size}>
                    <td>{r.size === 'ONE' ? (lang === 'ar' ? 'موحد' : 'One') : r.size}</td>
                    <td>{r.sold}</td>
                    <td className="text-muted">{r.onHand}</td>
                    <td>{r.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid-2" style={{ '--grid-2-cols': '1.2fr 1fr' } as CSSProperties}>
        <Card>
          <CardKicker>{t.deadStock}</CardKicker>
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>SKU</th><th>{t.product}</th><th>{t.qty}</th><th>{t.daysInStock}</th><th></th></tr></thead>
              <tbody>
                {deadStock.map((r) => (
                  <tr key={r.sku}>
                    <td className="ltr-cell text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{r.sku}</td>
                    <td>{productName(lang, r.product)}</td>
                    <td>{r.onHand}</td>
                    <td>{r.days}</td>
                    <td>{!r.everMoved && <Tag variant="bad">{t.neverMoved}</Tag>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardKicker>{t.marginByCategory}</CardKicker>
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>{t.category}</th><th>{t.revenue}</th><th>{t.margin}</th><th>%</th></tr></thead>
              <tbody>
                {margin.map((r) => (
                  <tr key={r.categoryEn}>
                    <td>{lang === 'ar' ? r.categoryAr : r.categoryEn}</td>
                    <td>{fmtUsd(r.revenue)}</td>
                    <td>{fmtUsd(r.margin)}</td>
                    <td className="text-muted">{r.marginPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <CardKicker>{t.salesByPerson}</CardKicker>
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>{t.seller}</th><th>{t.revenue}</th><th>{t.units}</th><th>{lang === 'ar' ? 'فواتير' : 'Receipts'}</th></tr></thead>
            <tbody>
              {bySeller.map((r) => (
                <tr key={r.seller}>
                  <td>{r.seller}</td>
                  <td>{fmtUsd(r.revenue)}</td>
                  <td>{r.units}</td>
                  <td className="text-muted">{r.receipts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
