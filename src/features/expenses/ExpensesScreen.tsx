import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { BRANCHES, todayStr } from '../../lib/mockData'
import { fmtUsd } from '../../lib/currency'
import { monthTotals } from '../../lib/analytics'
import { Field, Input, Select } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Card, CardKicker } from '../../components/ui/Card'
import type { BranchId, ExpenseCategory } from '../../lib/types'

const CATEGORIES: ExpenseCategory[] = ['rent', 'salaries', 'utilities', 'marketing', 'maintenance', 'other']
const CAT_KEY: Record<ExpenseCategory, 'catRent' | 'catSalaries' | 'catUtilities' | 'catMarketing' | 'catMaintenance' | 'catOther'> = {
  rent: 'catRent', salaries: 'catSalaries', utilities: 'catUtilities', marketing: 'catMarketing', maintenance: 'catMaintenance', other: 'catOther',
}

export function ExpensesScreen() {
  const { t } = useI18n()
  const nm = useNm()
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

  const canAdd = parseFloat(amount) > 0 && description.trim()
  const add = () => {
    addExpense({ branchId: expBranch, date: todayStr(), category, description: description.trim(), amountUsd: parseFloat(amount) })
    flash(t.added)
    setDescription(''); setAmount('')
  }

  const month = monthTotals(sales, queue, products)
  const expenseByBranch: Record<BranchId, number> = { tr: 0, bn: 0, ms: 0 }
  let totalExpenses = 0
  expenses.forEach((e) => { expenseByBranch[e.branchId] += e.amountUsd; totalExpenses += e.amountUsd })

  const rows = isOwner ? expenses : expenses.filter((e) => e.branchId === branch)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-screen-label="Expenses">
      <h3 style={{ margin: 0 }}>{t.expenses}</h3>
      <Card style={{ gap: 10 }}>
        <span className="card-kicker">{t.newExpense}</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
          {isOwner && (
            <Field label={t.branch}>
              <Select value={expBranch} onChange={(e) => setExpBranch(e.target.value as BranchId)}>
                {BRANCHES.map((b) => <option key={b.id} value={b.id}>{nm(b.name)}</option>)}
              </Select>
            </Field>
          )}
          <Field label={t.category}>
            <Select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t[CAT_KEY[c]]}</option>)}
            </Select>
          </Field>
          <Field label={t.description} style={{ flex: 1, minWidth: 200 }}><Input value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <Field label={t.amount}><Input style={{ direction: 'ltr', width: 110 }} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Button variant="primary" onClick={add} disabled={!canAdd}><Plus />{t.addExpense}</Button>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
            const net = br.revenue - br.cost - expenseByBranch[b.id]
            return <PnlRow key={b.id} label={nm(b.name)} value={fmtUsd(net)} />
          })}
        </Card>
      </div>

      <Card style={{ padding: '6px 14px' }}>
        <table className="table">
          <thead><tr>{isOwner && <th>{t.branch}</th>}<th>{t.dateL}</th><th>{t.category}</th><th>{t.description}</th><th>{t.amount}</th></tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                {isOwner && <td className="text-muted" style={{ fontSize: 14 }}>{nm(BRANCHES.find((b) => b.id === e.branchId)!.name)}</td>}
                <td className="text-muted" style={{ fontSize: 13.5 }}>{e.date}</td>
                <td>{t[CAT_KEY[e.category]]}</td>
                <td className="text-muted" style={{ fontSize: 14 }}>{e.description}</td>
                <td>{fmtUsd(e.amountUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function PnlRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: bold ? 16 : 14.5, fontWeight: bold ? 500 : 400 }}>
      <span className={accent ? undefined : 'text-muted'}>{label}</span>
      <span style={{ color: accent ? 'var(--color-accent-300)' : undefined }}>{value}</span>
    </div>
  )
}
