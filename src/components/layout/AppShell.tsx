import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { List, WifiSlash } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useBranchLabel } from '../../lib/branchLabel'
import { useBreakpoint } from '../../lib/useMediaQuery'
import { useStore } from '../../store/useStore'
import { Sidebar } from './Sidebar'
import { Toast } from '../Toast'

export function AppShell() {
  const { t } = useI18n()
  const offline = useStore((s) => s.offline)
  const branchLabel = useBranchLabel()

  // The only thing JS reads from the breakpoints here: layout is CSS's job,
  // but `inert`, role/aria-modal and the scroll lock are not expressible in CSS.
  const isDesktop = useBreakpoint('laptop')
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  const closeNav = useCallback((restoreFocus = true) => {
    setNavOpen(false)
    if (restoreFocus) menuBtnRef.current?.focus()
  }, [])

  // Close on route change — covers NavLink taps and programmatic navigation.
  useEffect(() => { setNavOpen(false) }, [location.pathname])
  // Growing into the static-sidebar layout must clear the modal state, or the
  // scroll lock and inert flags leak onto a desktop with no drawer.
  useEffect(() => { if (isDesktop) setNavOpen(false) }, [isDesktop])

  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeNav() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navOpen, closeNav])

  // iOS still rubber-bands the document behind a fixed overlay without this.
  useEffect(() => {
    if (!navOpen || isDesktop) return
    // The page scroller is .app-scroll (the shell itself is overflow:hidden), so that is
    // what has to freeze while the drawer is open.
    const scroller = document.querySelector<HTMLElement>('.app-scroll')
    const prev = scroller?.style.overflow ?? ''
    if (scroller) scroller.style.overflow = 'hidden'
    return () => { if (scroller) scroller.style.overflow = prev }
  }, [navOpen, isDesktop])

  const modal = navOpen && !isDesktop

  return (
    <div className="app-shell">
      <header className="topbar" inert={modal}>
        <button
          ref={menuBtnRef}
          type="button"
          className="btn btn-secondary btn-icon"
          onClick={() => setNavOpen(true)}
          aria-label={t.menu}
          aria-expanded={navOpen}
          aria-controls="app-nav"
        >
          <List size={22} />
        </button>
        <div className="topbar-titles">
          <span className="topbar-brand">{t.brand}</span>
          <span className="topbar-branch text-muted">{branchLabel}</span>
        </div>
      </header>

      <div className="app-body">
        <Sidebar id="app-nav" open={navOpen} isDesktop={isDesktop} onClose={() => closeNav()} />
        {!isDesktop && (
          <div className="drawer-backdrop" data-open={navOpen} onClick={() => closeNav()} aria-hidden="true" />
        )}
        <main className="app-main" inert={modal}>
          {offline && (
            <div className="offline-banner">
              <WifiSlash style={{ animation: 'blink 1.6s infinite', flex: 'none' }} />
              {t.offlineBanner}
            </div>
          )}
          <div className="app-scroll">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Outside <main> so it is not inert'd behind the drawer. */}
      <Toast />
    </div>
  )
}
