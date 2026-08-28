import { NavLink } from 'react-router-dom'
import { SignOut, WifiHigh, WifiSlash } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { allowedNavGroups } from '../../lib/navConfig'
import { BRANCHES } from '../../lib/mockData'
import { Button } from '../ui/Button'
import { Field, Select } from '../ui/Field'
import { Tag } from '../ui/Tag'

export function Sidebar() {
  const { t, lang, toggleLang, langBtnLabel } = useI18n()
  const nm = useNm()
  const user = useStore((s) => s.user)
  const branch = useStore((s) => s.branch)
  const setBranch = useStore((s) => s.setBranch)
  const offline = useStore((s) => s.offline)
  const toggleOffline = useStore((s) => s.toggleOffline)
  const queue = useStore((s) => s.queue)
  const logout = useStore((s) => s.logout)

  if (!user) return null
  const isOwner = user.role === 'owner'
  const branchName = isOwner ? (lang === 'ar' ? 'كل الفروع' : 'All branches') : nm(BRANCHES.find((b) => b.id === branch)!.name)
  const roleLabel = { owner: t.roleOwner, manager: t.roleManager, cashier: t.roleCashier }[user.role]

  return (
    <aside style={{ width: 212, flex: 'none', display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 12px', borderInlineEnd: '1px solid var(--color-divider)' }}>
      <div style={{ padding: '4px 10px 14px' }}>
        <div style={{ fontSize: 17.5, fontWeight: 500 }}>{t.brand}</div>
        <div className="text-muted" style={{ fontSize: 12.5 }}>{branchName}</div>
      </div>

      {allowedNavGroups(user.role).map((g) => (
        <div key={g.labelKey} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="text-muted" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 10px 4px' }}>{t[g.labelKey]}</div>
          {g.items.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', border: 0,
                borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 15, textAlign: 'start',
                textDecoration: 'none',
                background: isActive ? 'var(--color-accent-800)' : 'transparent',
                color: isActive ? 'var(--color-accent-100)' : 'var(--color-text)',
              })}
            >
              <item.icon size={18.5} />{t[item.labelKey]}
            </NavLink>
          ))}
        </div>
      ))}

      <div style={{ flex: 1 }} />

      {isOwner && (
        <Field label={t.branch} style={{ padding: '0 4px 6px' }}>
          <Select style={{ minHeight: 32, fontSize: 14 }} value={branch} onChange={(e) => setBranch(e.target.value as typeof branch)}>
            {BRANCHES.map((b) => <option key={b.id} value={b.id}>{nm(b.name)}</option>)}
          </Select>
        </Field>
      )}

      <button
        onClick={toggleOffline}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--color-divider)',
          borderRadius: 'var(--radius-md)', background: 'transparent', color: offline ? 'var(--color-accent-300)' : 'var(--color-text)',
          cursor: 'pointer', fontSize: 13.5,
        }}
      >
        {offline ? <WifiSlash size={16.5} /> : <WifiHigh size={16.5} />}
        {offline ? (lang === 'ar' ? 'غير متصل' : 'Offline') : (lang === 'ar' ? 'متصل' : 'Online')}
        {queue.length > 0 && <Tag variant="accent" style={{ marginInlineStart: 'auto' }}>{queue.length}</Tag>}
      </button>
      <Button variant="secondary" onClick={toggleLang} style={{ fontSize: 13.5 }}>{langBtnLabel}</Button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 4px 2px' }}>
        <div style={{ width: 30, height: 30, flex: 'none', borderRadius: '50%', background: 'var(--color-accent-800)', color: 'var(--color-accent-100)', display: 'grid', placeItems: 'center', fontSize: 13.5 }}>
          {user.name[0]}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>{roleLabel}</div>
        </div>
        <Button variant="secondary" icon onClick={logout} title={t.logout} style={{ width: 28, height: 28 }}>
          <SignOut size={15.5} />
        </Button>
      </div>
    </aside>
  )
}
