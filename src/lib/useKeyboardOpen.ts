import { useEffect, useState } from 'react'

/** True while the on-screen keyboard covers a meaningful slice of the viewport.
 *  iOS shrinks visualViewport but not the layout viewport, so position:fixed
 *  bottom bars end up underneath the keyboard unless we hide them. */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => setOpen(window.innerHeight - vv.height > 140)
    vv.addEventListener('resize', onResize)
    onResize()
    return () => vv.removeEventListener('resize', onResize)
  }, [])
  return open
}
