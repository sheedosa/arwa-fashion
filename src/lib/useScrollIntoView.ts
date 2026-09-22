import { useEffect, useRef } from 'react'

/** Bring a panel that renders below the fold (a detail card after a long list) into
 *  view when it appears. Desktop has room; phones don't, so the scroll is unconditional. */
export function useScrollIntoView<T extends HTMLElement>(key: string | number | null) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (key == null) return
    const id = requestAnimationFrame(() => ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
    return () => cancelAnimationFrame(id)
  }, [key])
  return ref
}
