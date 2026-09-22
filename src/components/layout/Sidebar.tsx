import { useEffect, useRef, type KeyboardEvent } from 'react'
import { NavLink } from 'react-router-dom'
import { SignOut, WifiHigh, WifiSlash, X } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useBranchLabel } from '../../lib/branchLabel'
import { useStore } from '../../store/useStore'
import { allowedNavGroups } from '../../lib/navConfig'
import { BRANCHES } from '../../lib/mockData'
import { Button } from '../ui/Button'
import { Field, Select } from '../ui/Field'
import { Tag } from '../ui/Tag'

const FOCUSABLE =
  'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface Props {
  id: string
  open: boolean
  isDesktop: boolean
  onClose: () => void
}

export function Sidebar({ id, open, isDesktop, onClose }: Props) {
  const { t, lang, toggleLang, langBtnLabel } = useI18n()
  const nm = useNm()
  const branchName = useBranchLabel()
  const user = useStore((s) => s.user)
  const branch = useStore((s) => s.branch)
  const setBranch = useStore((s) => s.setBranch)
  const offline = useStore((s) => s.offline)
  const toggleOffline = useStore((s) => s.toggleOffline)
  const queue = useStore((s) => s.queue)
  const logout = useStore((s) => s.logout)
  const flash = useStore((s) => s.flash)
  const onToggleOffline = () => { const syncing = offline && queue.length > 0; toggleOffline(); if (syncing) flash(t.syncedMsg) }

  const asideRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const modal = open && !isDesktop

  useEffect(() => { if (modal) closeRef.current?.focus() }, [modal])

  // Siblings are `inert` (set in AppShell), which stops focus leaving into the
  // page; this cycles Tab inside the drawer so it doesn't escape to browser chrome.
  const trapTab = (e: KeyboardEvent<HTMLElement>) => {
    if (!modal || e.key !== 'Tab') return
    const nodes = asideRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
    if (!nodes || nodes.length === 0) return
    const first = nodes[0], last = nodes[nodes.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  if (!user) return null
  const isOwner = user.role === 'owner'
  const roleLabel = { owner: t.roleOwner, manager: t.roleManager, cashier: t.roleCashier }[user.role]

  return (
    <aside
      id={id}
      ref={asideRef}
      className="sidebar"
      data-open={open}
      // Kept mounted so the slide animates; inert when closed so it is not
      // tabbable or announced. On desktop it is a plain landmark, never inert.
      inert={!isDesktop && !open}
      role={modal ? 'dialog' : undefined}
      aria-modal={modal || undefined}
      aria-label={modal ? t.menu : undefined}
      onKeyDown={trapTab}
    >
      <div className="sidebar-head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 'var(--fs-lead)', fontWeight: 500 }}>{t.brand}</div>
          <div className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{branchName}</div>
        </div>
        {!isDesktop && (
          <Button ref={closeRef} variant="ghost" icon onClick={onClose} aria-label={t.close}>
            <X size={20} />
          </Button>
        )}
      </div>

      <nav className="sidebar-nav">
        {allowedNavGroups(user.role).map((g) => (
          <div key={g.labelKey} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div className="nav-group-label">{t[g.labelKey]}</div>
            {g.items.map((item) => (
              <NavLink key={item.key} to={item.path} className="nav-link">
                <item.icon size={20} />{t[item.labelKey]}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        {isOwner && (
          <Field label={t.branch}>
            <Select value={branch} onChange={(e) => setBranch(e.target.value as typeof branch)}>
              {BRANCHES.map((b) => <option key={b.id} value={b.id}>{nm(b.name)}</option>)}
            </Select>
          </Field>
        )}
        <button type="button" className="offline-toggle" data-offline={offline} onClick={onToggleOffline} aria-pressed={offline}>
          {offline ? <WifiSlash size={18} /> : <WifiHigh size={18} />}
          {offline ? (lang === 'ar' ? 'غير متصل' : 'Offline') : (lang === 'ar' ? 'متصل' : 'Online')}
          {queue.length > 0 && <Tag variant="accent" style={{ marginInlineStart: 'auto' }}>{queue.length} · {t.inQueue}</Tag>}
        </button>
        <Button variant="secondary" onClick={toggleLang}>{langBtnLabel}</Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
          <div style={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', background: 'var(--color-accent-800)', color: 'var(--color-accent-100)', display: 'grid', placeItems: 'center', fontSize: 'var(--fs-meta)' }}>
            {user.name[0]}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 'var(--fs-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div className="text-muted" style={{ fontSize: 'var(--fs-micro)' }}>{roleLabel}</div>
          </div>
          <Button variant="secondary" icon onClick={logout} title={t.logout} aria-label={t.logout}>
            <SignOut size={18} />
          </Button>
        </div>
      </div>
    </aside>
  )
}
