import { useState, type CSSProperties } from 'react'
import { Plus } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { useIsPhone } from '../../lib/useMediaQuery'
import { BRANCHES, todayStr } from '../../lib/mockData'
import { fmtUsd } from '../../lib/currency'
import { monthTotals } from '../../lib/analytics'
import { Field, Input, Select } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Card, CardKicker } from '../../components/ui/Card'
import { DataTable, type Column } from '../../components/ui/DataTable'
import type { BranchId, Expense, ExpenseCategory } from '../../lib/types'

const CATEGORIES: ExpenseCategory[] = ['rent', 'salaries', 'utilities', 'marketing', 'maintenance', 'other']
const CAT_KEY: Record<ExpenseCategory, 'catRent' | 'catSalaries' | 'catUtilities' | 'catMarketing' | 'catMaintenance' | 'catOther'> = {
  rent: 'catRent', salaries: 'catSalaries', utilities: 'catUtilities', marketing: 'catMarketing', maintenance: 'catMaintenance', other: 'catOther',
}

export function ExpensesScreen() {
  const { t } = useI18n()
  const nm = useNm()
  const isPhone = useIsPhone()
  const user = useStore((s) => s.user)
  const branch = useStore((s) => s.branch)
  const expenses = useStore((s) => s.expenses)
  const sales = useStore((s) => s.sales)
  const queue = useStore((s) => s.queue)
  const products = useStore((s) => s.products)
  const addExpense = useStore((s) => s.addExpense)
  const flash = useStore((s) => s.flash)
  const isOwner = user?.role === 'owner'

  const [expBranch, setExpBranch] = useState<BranchId>(branch)
  const [category, setCategory] = useState<ExpenseCategory>('rent')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  const canAdd = Number.isFinite(parseFloat(amount)) && parseFloat(amount) > 0 && description.trim()
  const add = () => {
    const ok = addExpense({ branchId: isOwner ? expBranch : branch, date: todayStr(), category, description: description.trim(), amountUsd: parseFloat(amount) })
    if (!ok) return
    flash(t.expenseAdded)
    setDescription(''); setAmount('')
  }

  const month = monthTotals(sales, queue, products)
  const expenseByBranch: Record<BranchId, number> = { tr: 0, bn: 0, ms: 0 }
  let totalExpenses = 0
  // Same calendar-month window as the revenue side of the P&L.
  const ym = todayStr().slice(0, 7)
  expenses.filter((e) => e.date.startsWith(ym)).forEach((e) => { expenseByBranch[e.branchId] += e.amountUsd; totalExpenses += e.amountUsd })

  const rows = isOwner ? expenses : expenses.filter((e) => e.branchId === branch)

  const columns: Column<Expense>[] = [
    { key: 'branch', header: t.branch, hidden: !isOwner, role: 'meta', tdClassName: 'text-muted', cell: (e) => nm(BRANCHES.find((b) => b.id === e.branchId)!.name) },
    { key: 'date', header: t.dateL, role: 'meta', tdClassName: 'text-muted', tdStyle: { fontSize: 'var(--fs-meta)' }, cell: (e) => e.date },
    { key: 'cat', header: t.category, cell: (e) => t[CAT_KEY[e.category]] },
    { key: 'desc', header: t.description, role: 'title', tdClassName: 'text-muted', cell: (e) => e.description },
    { key: 'amount', header: t.amount, cell: (e) => fmtUsd(e.amountUsd) },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Expenses">
      <h3 style={{ margin: 0 }}>{t.expenses}</h3>
      <Card style={{ gap: 10 }}>
        <span className="card-kicker">{t.newExpense}</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
          {isOwner && (
            <Field label={t.branch} style={{ flex: '1 1 140px' }}>
              <Select value={expBranch} onChange={(e) => setExpBranch(e.target.value as BranchId)}>
                {BRANCHES.map((b) => <option key={b.id} value={b.id}>{nm(b.name)}</option>)}
              </Select>
            </Field>
          )}
          <Field label={t.category} style={{ flex: '1 1 140px' }}>
            <Select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t[CAT_KEY[c]]}</option>)}
            </Select>
          </Field>
          <Field label={t.description} style={{ flex: '2 1 200px' }}><Input value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <Field label={t.amount} style={{ flex: '1 1 110px' }}><Input kind="money" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Button variant="primary" onClick={add} disabled={!canAdd}><Plus />{t.addExpense}</Button>
        </div>
      </Card>

      {/* Revenue, COGS and margin are the owner's figures; a manager sees only their own
          branch's expense total. */}
      {!isOwner && (
        <Card style={{ padding: '16px 18px', gap: 8 }}>
          <CardKicker>{t.expensesOnly} · {nm(BRANCHES.find((b) => b.id === branch)!.name)}</CardKicker>
          <PnlRow label={t.expenses} value={fmtUsd(expenseByBranch[branch])} bold />
        </Card>
      )}
      {isOwner && <div className="grid-2" style={{ '--grid-2-cols': '1fr 1fr' } as CSSProperties}>
        <Card style={{ padding: '16px 18px', gap: 8 }}>
          <CardKicker>{t.pnl} · {t.consolidated} · {t.thisMonth}</CardKicker>
          <PnlRow label={t.revenue} value={fmtUsd(month.totalSales)} />
          <PnlRow label={t.cogs} value={fmtUsd(month.totalCost)} />
          <PnlRow label={t.grossProfit} value={fmtUsd(month.totalSales - month.totalCost)} bold />
          <PnlRow label={t.expenses} value={fmtUsd(totalExpenses)} />
          <PnlRow label={t.netProfit} value={fmtUsd(month.totalSales - month.totalCost - totalExpenses)} bold accent />
        </Card>
        <Card style={{ padding: '16px 18px', gap: 8 }}>
          <CardKicker>{t.perBranch} · {t.netProfit}</CardKicker>
          {BRANCHES.map((b) => {
            const br = month.byBranch[b.id]
            return <PnlRow key={b.id} label={nm(b.name)} value={fmtUsd(br.revenue - br.cost - expenseByBranch[b.id])} />
          })}
        </Card>
      </div>}

      <Card style={{ padding: isPhone ? 0 : '6px 14px', background: isPhone ? 'transparent' : undefined }}>
        <DataTable rows={rows} columns={columns} rowKey={(e) => e.id} />
      </Card>
    </div>
  )
}

function PnlRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: bold ? 'var(--fs-lead)' : 'var(--fs-body)', fontWeight: bold ? 500 : 400 }}>
      <span className={accent ? undefined : 'text-muted'}>{label}</span>
      <span style={{ color: accent ? 'var(--color-accent-300)' : undefined }}>{value}</span>
    </div>
  )
}
