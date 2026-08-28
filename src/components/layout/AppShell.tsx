import { Outlet } from 'react-router-dom'
import { WifiSlash } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { Sidebar } from './Sidebar'
import { Toast } from '../Toast'

export function AppShell() {
  const { t } = useI18n()
  const offline = useStore((s) => s.offline)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {offline && (
          <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 20px', fontSize: 13.5, background: 'var(--color-accent-800)', color: 'var(--color-accent-100)' }}>
            <WifiSlash style={{ animation: 'blink 1.6s infinite' }} />{t.offlineBanner}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
          <Outlet />
        </div>
        <Toast />
      </main>
    </div>
  )
}
