# Arwa Fashion — retail management system

Arabic-first (RTL) multi-branch retail management for a Tripoli fashion retailer:
point of sale, per-branch inventory, transfers, customers, cash reconciliation,
purchasing with landed-cost allocation, and owner reporting.

**▶ Live demo: https://sheedosa.github.io/arwa-fashion/**

> **This is a front-end prototype running on mock data.** There is no backend and no
> real authentication — pick any of the three role cards on the login screen to sign
> in, and anyone with the link can do the same. All data (customer names, phone
> numbers, sales) is synthetic and resets on refresh. See
> [Next: the Supabase build](#next-the-supabase-build) for what production would need.

## Try it

Sign in as any of three roles to see how the interface changes:

| Role | Sees |
|---|---|
| **المالكة** / Owner | Everything — all branches, dashboard, reports, cost prices and margin |
| **مدير فرع** / Branch manager | Own branch: stock, transfers, purchasing, expenses, branch reports |
| **كاشير** / Cashier | Sell, return, look up stock and customers. **No cost or margin anywhere**, including CSV exports |

Worth trying:
- **POS** — search or type a SKU and press Enter (barcode simulation), add line and
  order discounts, then pay with **USD and LYD together**; change is calculated in the
  paying currency and the receipt shows both.
- **Offline mode** — toggle it in the sidebar. Sales queue locally with a badge and
  sync when you switch back online, so a completed sale is never lost.
- **Inventory** — when a size is out at your branch, the card tells you which other
  branch has it.
- **Transfers** — the request → send → receive flow moves stock between branches.
- **العربية / English** — toggle in the sidebar; the whole layout mirrors.

## Running locally

```bash
npm install
npm run dev      # http://localhost:5173/arwa-fashion/
npm run build    # production build to dist/ (also emits 404.html)
npx tsc -b       # typecheck only
```

## What's implemented

**Phase 1**
- Auth and role-scoped navigation (owner / manager / cashier)
- Products and variants — one row per size × colour, SKU and barcode per variant
- Per-branch inventory — search, low-stock highlighting, cross-branch availability,
  movements ledger, CSV export
- POS — search/scan, category filters, cart with line and order discounts,
  multi-currency payment, change, printable / WhatsApp-shareable receipt, offline queue
- Returns and exchanges — restock correctly, linked to the original sale
- Inter-branch transfers — request → send → receive
- Customers — quick-create from a +218 phone number, purchase history, WhatsApp
- Daily cash reconciliation — per-currency expected vs counted, variance, close-of-day lock
- Owner dashboard — today and month to date, top sellers, by branch, all in USD

**Phase 2**
- Purchase orders and shipments — freight, customs and clearing allocated across
  received units to compute landed unit cost
- Expenses and a simple P&L, per branch and consolidated
- Stock counts — expected vs counted, posted as a single adjustment
- Reports — sell-through by style, size-run analysis, dead-stock aging, margin by
  category, salesperson performance

## Design rules the code holds to

- **Inventory is never mutated directly.** Every quantity change — sale, return,
  transfer, shipment receipt, count adjustment — flows through a stock movement, so
  stock is always reconstructable and explainable.
- **Every amount carries an explicit currency.** Prices are set and reported in USD;
  when a payment is taken in LYD, both the LYD taken and the USD equivalent are shown.
- **Cost and margin are invisible to cashiers** everywhere in the UI, including exports.

## Architecture

- `src/lib/types.ts` — the domain model, written to map directly onto the Postgres
  schema production would use
- `src/lib/mockData.ts` — seed data
- `src/store/useStore.ts` — all state and actions; **this is the mock "backend"** and
  the single file a real migration would replace
- `src/lib/i18n.tsx` — Arabic/English dictionary and RTL/LTR context
- `src/components/ui/` — the Nocturne design system as React components
- `src/features/*` — one folder per screen

Built with Vite, React 19, TypeScript, Tailwind 4 and Zustand.

## Next: the Supabase build

To take this from prototype to production:

1. Stand up the schema in `src/lib/types.ts` as Postgres tables — it already matches
   the required shape (`branches`, `products`, `variants`, `inventory`,
   `stock_movements`, `transfers`, `stock_counts`, `customers`, `sales`/`sale_items`,
   `payments`, `returns`, `suppliers`, `purchase_orders`/`po_items`, `expenses`,
   `fx_rates`, `audit_log`).
2. Write RLS policies so a manager or cashier only sees their own branch's rows and
   the owner sees all — enforced at the database, not just in the UI.
3. Replace the in-memory arrays in `src/store/useStore.ts` with Supabase queries. The
   UI components only call store actions, so they don't need to change.
4. Wire real Supabase Auth in place of the three demo logins.
5. Make the offline queue durable (IndexedDB) so a completed sale survives a dropped
   connection. The store already models the UX; only the sync transport is mocked.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes
to GitHub Pages. The base path comes from the Pages action rather than being
hardcoded, and `postbuild` copies `index.html` to `404.html` so client-side routes
survive a refresh.
