import { useMemo, useState } from 'react'
import { DownloadSimple, MapPin } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { BRANCHES } from '../../lib/mockData'
import { movementLabel } from '../../lib/analytics'
import { variantMeta, productName } from '../../lib/variantDisplay'
import { exportCsv } from '../../lib/csv'
import { Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Card, CardKicker } from '../../components/ui/Card'
import { Chip, Tag } from '../../components/ui/Tag'
import type { BranchId } from '../../lib/types'

export function InventoryScreen() {
  const { t, lang } = useI18n()
  const nm = useNm()
  const products = useStore((s) => s.products)
  const variants = useStore((s) => s.variants)
  const inventory = useStore((s) => s.inventory)
  const movements = useStore((s) => s.movements)
  const branch = useStore((s) => s.branch)
  const lowStockThreshold = useStore((s) => s.lowStockThreshold)

  const [query, setQuery] = useState('')
  const [invBranch, setInvBranch] = useState<BranchId | null>(null)
  const activeBranch = invBranch || branch

  const q = query.trim().toLowerCase()
  const allRows = useMemo(() => variants.filter((v) => {
    if (!q) return true
    const p = products.find((pp) => pp.code === v.productCode)!
    return v.sku.toLowerCase().includes(q) || p.name.ar.includes(query.trim()) || p.name.en.toLowerCase().includes(q)
  }), [variants, products, q, query])

  const rows = allRows.slice(0, 80)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Inventory">
      <h3 style={{ margin: 0 }}>{t.inventory}</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input style={{ maxWidth: 300 }} placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button
          variant="secondary"
          onClick={() => exportCsv(`inventory-${activeBranch}.csv`, ['SKU', 'Product', 'Size', 'Colour', 'Qty'], allRows.map((v) => {
            const p = products.find((pp) => pp.code === v.productCode)!
            return [v.sku, p.name.en, v.size, v.color, inventory[v.sku]?.[activeBranch] || 0]
          }))}
        >
          <DownloadSimple />{t.export}
        </Button>
        {BRANCHES.map((b) => (
          <Chip key={b.id} label={nm(b.name)} selected={activeBranch === b.id} onClick={() => setInvBranch(b.id)} />
        ))}
        <span className="text-muted" style={{ fontSize: 13.5, marginInlineStart: 'auto' }}>{allRows.length} {lang === 'ar' ? 'صنف' : 'variants'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(280px,1fr)', gap: 14, alignItems: 'start' }}>
        <Card style={{ padding: '6px 18px' }}>
          <table className="table">
            <thead><tr><th>SKU</th><th>{t.product}</th><th>{t.qty}</th><th></th></tr></thead>
            <tbody>
              {rows.map((v) => {
                const p = products.find((pp) => pp.code === v.productCode)!
                const qty = inventory[v.sku]?.[activeBranch] || 0
                const other = BRANCHES.filter((b) => b.id !== activeBranch && (inventory[v.sku]?.[b.id] || 0) > 0)
                return (
                  <tr key={v.sku}>
                    <td className="ltr-cell text-muted" style={{ fontSize: 13.5 }}>{v.sku}</td>
                    <td>
                      <div>{productName(lang, p)}</div>
                      <div className="text-muted" style={{ fontSize: 12.5 }}>{variantMeta(lang, v)}</div>
                    </td>
                    <td>
                      <Tag style={{
                        background: qty === 0 ? 'var(--color-neutral-900)' : qty <= lowStockThreshold ? 'var(--color-accent-800)' : 'var(--color-neutral-800)',
                        color: qty === 0 ? 'var(--color-neutral-400)' : qty <= lowStockThreshold ? 'var(--color-accent-100)' : 'var(--color-neutral-100)',
                      }}>
                        {qty === 0 ? t.outStock : qty}
                      </Tag>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--color-accent-300)' }}>
                      {qty === 0 && other.length > 0 && <><MapPin /> {t.elsewhere} {nm(other[0].name)} ({inventory[v.sku]?.[other[0].id] || 0})</>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
        <Card style={{ position: 'sticky', top: 0 }}>
          <CardKicker>{t.lastMovs}</CardKicker>
          {movements.slice(0, 8).map((m) => (
            <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 14, padding: '4px 0' }}>
              <span className="text-muted" style={{ fontSize: 12.5, flex: 'none' }}>{m.time}</span>
              <span style={{ color: m.qty > 0 ? 'var(--color-accent-300)' : 'var(--color-neutral-400)' }}>{movementLabel(lang, m.type)}</span>
              <span className="text-muted" style={{ flex: 1 }}>{m.sku} · {nm(BRANCHES.find((b) => b.id === m.branchId)!.name)} · {m.userName}</span>
              <span style={{ direction: 'ltr' }}>{m.qty > 0 ? '+' : ''}{m.qty}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
