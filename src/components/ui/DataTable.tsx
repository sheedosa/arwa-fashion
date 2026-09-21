import type { CSSProperties, ReactNode } from 'react'
import { useIsPhone } from '../../lib/useMediaQuery'

export interface Column<T> {
  /** React key + stable identity. */
  key: string
  /** <th> content. '' for an action column. Reused as the card field label. */
  header: ReactNode
  /** Arbitrary JSX — Tag, Button, Input, two-line cells. Return null when a
   *  cell is empty so the card can drop the whole field. */
  cell: (row: T) => ReactNode
  /** Mobile priority. Unset = a labelled field in the card body.
   *  'title'  → card headline, no label
   *  'meta'   → muted headline sidecar (id, date)
   *  'action' → full-width ≥44px strip pinned to the card footer */
  role?: 'title' | 'meta' | 'action'
  /** SKUs, phone numbers, ids: .ltr-cell in table mode, direction:ltr in card mode. */
  ltr?: boolean
  /** Conditional columns (canSeeCost, isOwner) — filtered before render. */
  hidden?: boolean
  /** TABLE MODE ONLY — carries the per-cell styling the design was approved with. */
  tdClassName?: string
  tdStyle?: CSSProperties
}

export interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  empty?: ReactNode
  /** 'cards' (default) stacks on phone. 'scroll' never stacks — for the
   *  dashboard/report comparison tables, where stacking would destroy the
   *  cross-row comparison that is their entire purpose. */
  mobile?: 'cards' | 'scroll'
  /** Override the breakpoint decision, e.g. stacked={!isDesktop} for 9-col tables. */
  stacked?: boolean
  /** Bound the height so the sticky thead has something to stick within. */
  pane?: boolean
}

export function DataTable<T>({ rows, columns, rowKey, empty, mobile = 'cards', stacked, pane }: DataTableProps<T>) {
  const isPhone = useIsPhone()
  const cols = columns.filter((c) => !c.hidden)
  const asCards = stacked ?? (mobile === 'cards' && isPhone)

  if (asCards) {
    if (rows.length === 0 && empty) return <>{empty}</>
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((row) => <RowCard key={rowKey(row)} row={row} cols={cols} />)}
      </div>
    )
  }

  return (
    <div className={pane ? 'table-pane' : 'table-scroll'}>
      <table className="table">
        <thead><tr>{cols.map((c) => <th key={c.key}>{c.header}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {cols.map((c) => {
                const cls = [c.ltr && 'ltr-cell', c.tdClassName].filter(Boolean).join(' ')
                return <td key={c.key} className={cls || undefined} style={c.tdStyle}>{c.cell(row)}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RowCard<T>({ row, cols }: { row: T; cols: Column<T>[] }) {
  const title = cols.find((c) => c.role === 'title')
  const metas = cols.filter((c) => c.role === 'meta')
  const fields = cols.filter((c) => !c.role)
  const actions = cols.filter((c) => c.role === 'action').map((c) => c.cell(row)).filter(Boolean)

  return (
    <div className="card elev-sm" style={{ gap: 0, padding: '12px 14px' }}>
      {(title || metas.length > 0) && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', paddingBottom: 9, borderBottom: '1px solid var(--color-divider)' }}>
          {title && <span style={{ fontSize: 'var(--fs-body)', fontWeight: 500, flex: 1, minWidth: 0 }}>{title.cell(row)}</span>}
          {metas.map((c) => (
            <span key={c.key} className="text-muted" style={{ fontSize: 'var(--fs-micro)', flex: 'none', ...(c.ltr && { direction: 'ltr' as const, unicodeBidi: 'isolate' as const }) }}>
              {c.cell(row)}
            </span>
          ))}
        </div>
      )}
      <dl style={{ margin: 0 }}>
        {fields.map((c) => {
          const val = c.cell(row)
          if (val == null || val === false || val === '') return null
          return (
            // Plain flex + space-between: under <html dir="rtl"> the label lands
            // on the right and the value on the left automatically.
            <div key={c.key} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, minHeight: 32, padding: '4px 0' }}>
              <dt className="text-muted" style={{ fontSize: 'var(--fs-micro)', flex: 'none' }}>{c.header}</dt>
              <dd style={{ margin: 0, fontSize: 'var(--fs-body)', textAlign: 'end', minWidth: 0, ...(c.ltr && { direction: 'ltr' as const, unicodeBidi: 'isolate' as const }) }}>
                {val}
              </dd>
            </div>
          )
        })}
      </dl>
      {actions.length > 0 && (
        <div className="dt-card-actions">
          {actions.map((node, i) => <div key={i} style={{ flex: 1, display: 'flex' }}>{node}</div>)}
        </div>
      )}
    </div>
  )
}
