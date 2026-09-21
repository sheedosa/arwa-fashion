import { useCallback, useSyncExternalStore } from 'react'
import { MQ, type MqName } from './breakpoints'

/** One MediaQueryList per query string, shared by every subscriber. */
const cache = new Map<string, MediaQueryList>()

function mql(query: string): MediaQueryList {
  let m = cache.get(query)
  if (!m) {
    m = window.matchMedia(query)
    cache.set(query, m)
  }
  return m
}

/**
 * Subscribe to a media query.
 *
 * useSyncExternalStore rather than useState+useEffect on purpose: the snapshot
 * is read synchronously during render, so the very first paint is already
 * correct. The useState pattern would render the desktop shell first and then
 * flip — a visible flash of the sidebar on every phone page load.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const m = mql(query)
      m.addEventListener('change', onChange)
      return () => m.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => mql(query).matches,
    // Pure CSR SPA — never called; present so a future prerender degrades to
    // the mobile layout rather than throwing.
    () => false,
  )
}

/** Named tier, e.g. useBreakpoint('laptop'). Prefer this over raw strings. */
export function useBreakpoint(name: MqName): boolean {
  return useMediaQuery(MQ[name])
}

export const useIsPhone = () => !useMediaQuery(MQ.tablet)
export const useIsTouch = () => useMediaQuery(MQ.touch)
