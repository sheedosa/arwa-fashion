import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { X } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { Button } from './Button'

export function Dialog({ title, onClose, width, children }: { title: string; onClose: () => void; width?: number; children: ReactNode }) {
  const { t } = useI18n()
  const style: CSSProperties = width ? { width: `min(${width}px, 100%)` } : {}
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<Element | null>(null)
  // Dismiss only when pointerdown AND click both landed on the backdrop —
  // a scroll fling released over the ~11px gutter must not close a half-typed payment.
  const downOnBackdrop = useRef(false)

  useEffect(() => {
    openerRef.current = document.activeElement
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      ;(openerRef.current as HTMLElement | null)?.focus?.()
    }
  }, [onClose])

  return (
    <div
      className="dialog-backdrop"
      onPointerDown={(e) => { downOnBackdrop.current = e.target === e.currentTarget }}
      onClick={(e) => { if (downOnBackdrop.current && e.target === e.currentTarget) onClose() }}
    >
      <div ref={panelRef} className="dialog" style={style} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span id={titleId} className="dialog-title" style={{ flex: 1, minWidth: 0 }}>{title}</span>
          <Button variant="ghost" icon onClick={onClose} aria-label={t.close} style={{ flex: 'none' }}><X /></Button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="dialog-actions" style={{ margin: 0 }}>{children}</div>
}
