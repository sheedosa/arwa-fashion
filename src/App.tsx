import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { I18nProvider, useI18n } from './lib/i18n'
import { useStore } from './store/useStore'
import { RequireAuth } from './components/RequireAuth'
import { AppShell } from './components/layout/AppShell'
import { LoginScreen } from './features/auth/LoginScreen'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { PosScreen } from './features/pos/PosScreen'
import { InventoryScreen } from './features/inventory/InventoryScreen'
import { ProductsScreen } from './features/products/ProductsScreen'
import { ReturnsScreen } from './features/returns/ReturnsScreen'
import { TransfersScreen } from './features/transfers/TransfersScreen'
import { CustomersScreen } from './features/customers/CustomersScreen'
import { ReconciliationScreen } from './features/reconciliation/ReconciliationScreen'
import { PurchasingScreen } from './features/purchasing/PurchasingScreen'
import { ExpensesScreen } from './features/expenses/ExpensesScreen'
import { StockCountsScreen } from './features/stockcounts/StockCountsScreen'
import { ReportsScreen } from './features/reports/ReportsScreen'
import { defaultPathFor } from './lib/navConfig'

function DirSync() {
  const { dir, lang } = useI18n()
  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = lang
  }, [dir, lang])
  return null
}

function RootRedirect() {
  const user = useStore((s) => s.user)
  return <Navigate to={user ? defaultPathFor(user.role) : '/login'} replace />
}

export default function App() {
  return (
    <I18nProvider>
      <DirSync />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route path="/dash" element={<RequireAuth roles={['owner']}><DashboardScreen /></RequireAuth>} />
            <Route path="/pos" element={<PosScreen />} />
            <Route path="/inv" element={<InventoryScreen />} />
            <Route path="/prod" element={<RequireAuth roles={['owner', 'manager']}><ProductsScreen /></RequireAuth>} />
            <Route path="/ret" element={<ReturnsScreen />} />
            <Route path="/tr" element={<RequireAuth roles={['owner', 'manager']}><TransfersScreen /></RequireAuth>} />
            <Route path="/cust" element={<CustomersScreen />} />
            <Route path="/rec" element={<RequireAuth roles={['owner', 'manager']}><ReconciliationScreen /></RequireAuth>} />
            <Route path="/purchasing" element={<RequireAuth roles={['owner', 'manager']}><PurchasingScreen /></RequireAuth>} />
            <Route path="/expenses" element={<RequireAuth roles={['owner', 'manager']}><ExpensesScreen /></RequireAuth>} />
            <Route path="/stock-counts" element={<RequireAuth roles={['owner', 'manager']}><StockCountsScreen /></RequireAuth>} />
            <Route path="/reports" element={<RequireAuth roles={['owner']}><ReportsScreen /></RequireAuth>} />
          </Route>
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
