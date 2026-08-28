import { useLocation, useNavigate } from 'react-router-dom'
import { CrownSimple, Storefront, Scan } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { Button } from '../../components/ui/Button'
import { defaultPathFor } from '../../lib/navConfig'
import type { Role } from '../../lib/types'

const ROLES: { role: Role; icon: typeof CrownSimple; name: string }[] = [
  { role: 'owner', icon: CrownSimple, name: 'أروى الهوني' },
  { role: 'manager', icon: Storefront, name: 'خالد المقريف' },
  { role: 'cashier', icon: Scan, name: 'سارة بن موسى' },
]

export function LoginScreen() {
  const { t, lang, toggleLang, langBtnLabel } = useI18n()
  const login = useStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()

  const branchFor: Record<Role, string> = {
    owner: lang === 'ar' ? 'كل فروع طرابلس' : 'All Tripoli branches',
    manager: lang === 'ar' ? 'سوق الجمعة' : "Souq al-Jum'a",
    cashier: lang === 'ar' ? 'قرقارش' : 'Gargaresh',
  }
  const titleFor: Record<Role, string> = { owner: t.roleOwner, manager: t.roleManager, cashier: t.roleCashier }

  const go = (role: Role) => {
    login(role)
    const from = (location.state as { from?: Location })?.from
    navigate(from?.pathname || defaultPathFor(role), { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: 'min(760px,100%)', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <div style={{ fontSize: 12.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 8 }}>
            Arwa Fashion · نظام الإدارة
          </div>
          <h1 style={{ fontSize: 38, margin: '0 0 6px' }}>{t.brand}</h1>
          <p className="text-muted" style={{ margin: 0 }}>{t.tagline}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          {ROLES.map((r) => (
            <button
              key={r.role}
              onClick={() => go(r.role)}
              style={{
                textAlign: 'start', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8,
                padding: 18, background: 'var(--color-surface)', border: '1px solid var(--color-divider)',
                borderRadius: 'var(--radius-lg)', color: 'var(--color-text)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-divider)')}
            >
              <r.icon size={24} style={{ color: 'var(--color-accent)' }} />
              <div style={{ fontSize: 17.5, fontWeight: 500 }}>{titleFor[r.role]}</div>
              <div className="text-muted" style={{ fontSize: 13.5 }}>{r.name} · {branchFor[r.role]}</div>
              <span style={{ fontSize: 14.5, color: 'var(--color-accent)', marginTop: 4 }}>{t.loginAs} ←</span>
            </button>
          ))}
        </div>
        <Button variant="ghost" onClick={toggleLang} style={{ alignSelf: 'flex-start' }}>{langBtnLabel}</Button>
      </div>
    </div>
  )
}
