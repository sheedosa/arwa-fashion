import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { BRANCHES } from '../../lib/mockData'
import { fmtUsd } from '../../lib/currency'
import { todayKpis, monthTotals, topSellers } from '../../lib/analytics'
import { productName } from '../../lib/variantDisplay'
import { Card, CardKicker } from '../../components/ui/Card'

export function DashboardScreen() {
  const { t, lang } = useI18n()
  const nm = useNm()
  const sales = useStore((s) => s.sales)
  const queue = useStore((s) => s.queue)
  const products = useStore((s) => s.products)
  const fxRate = useStore((s) => s.fxRate)

  const today = todayKpis(sales, queue)
  const month = monthTotals(sales, queue, products)
  const top = topSellers(sales, queue, products, 5)

  const kpis = [
    { label: t.todaySales, value: fmtUsd(today.totalSales), sub: `${today.receipts} ${lang === 'ar' ? 'فاتورة' : 'receipts'}` },
    { label: t.todayUnits, value: String(today.totalUnits), sub: lang === 'ar' ? 'كل الفروع' : 'all branches' },
    { label: t.monthSales, value: fmtUsd(month.totalSales), sub: `${month.totalUnits} ${lang === 'ar' ? 'قطعة' : 'units'}` },
    { label: t.monthMargin, value: fmtUsd(month.totalSales - month.totalCost), sub: `${Math.round(((month.totalSales - month.totalCost) / month.totalSales) * 100)}%` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} data-screen-label="Dashboard">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h3 style={{ margin: 0 }}>{t.dashboard}</h3>
        <span className="text-muted" style={{ fontSize: 13.5 }}>{t.allUsd} · {lang === 'ar' ? 'سعر الصرف اليوم: 1$ = ' : "Today's rate: $1 = "}{fxRate.toFixed(2)}{lang === 'ar' ? ' د.ل' : ' LYD'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
        {kpis.map((k) => (
          <Card key={k.label} style={{ padding: '18px 20px', gap: 8 }}>
            <CardKicker>{k.label}</CardKicker>
            <div style={{ fontSize: 34, fontWeight: 500 }}>{k.value}</div>
            <span className="card-meta">{k.sub}</span>
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, alignItems: 'stretch' }}>
        <Card>
          <CardKicker>{t.topSellers}</CardKicker>
          <table className="table">
            <thead><tr><th>{t.style}</th><th>{t.product}</th><th>{t.units}</th><th>{t.revenue}</th></tr></thead>
            <tbody>
              {top.map((r) => (
                <tr key={r.code}>
                  <td className="ltr-cell text-muted" style={{ fontSize: 13.5 }}>{r.code}</td>
                  <td>{productName(lang, r.product)}</td>
                  <td>{r.units}</td>
                  <td>{fmtUsd(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <CardKicker>{t.byBranch}</CardKicker>
          <table className="table">
            <thead><tr><th>{t.branch}</th><th>{t.revenue}</th><th>{t.units}</th><th>{t.margin}</th></tr></thead>
            <tbody>
              {BRANCHES.map((b) => {
                const row = month.byBranch[b.id]
                return (
                  <tr key={b.id}>
                    <td>{nm(b.name)}</td>
                    <td>{fmtUsd(row.revenue)}</td>
                    <td>{row.units}</td>
                    <td>{fmtUsd(row.revenue - row.cost)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
