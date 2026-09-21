import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { Basket, X } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { Button } from '../../components/ui/Button'
import { Tag } from '../../components/ui/Tag'

/** Bottom sheet holding the cart on phones. Drag-to-dismiss lives on the
 *  handle/header ONLY — on the whole sheet it would fight the line list's scroll. */
export function CartSheet({ open, count, onClose, children }: { open: boolean; count: number; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n()
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<number | null>(null)

  const onDown = (e: PointerEvent) => { start.current = e.clientY; setDragging(true); (e.target as Element).setPointerCapture?.(e.pointerId) }
  const onMove = (e: PointerEvent) => { if (start.current != null) setDragY(Math.max(0, e.clientY - start.current)) }
  const onUp = () => { if (dragY > 90) onClose(); start.current = null; setDragging(false); setDragY(0) }

  return (
    <>
      <div className="pos-sheet-backdrop" data-open={open} onClick={onClose} aria-hidden="true" />
      <div
        className="pos-sheet"
        data-open={open}
        role="dialog"
        aria-modal={open || undefined}
        aria-label={t.cart}
        inert={!open}
        style={{
          transform: open ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? 'none' : undefined,
        }}
      >
        <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
             style={{ flex: 'none', touchAction: 'none', cursor: 'grab', paddingTop: 8 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-neutral-700)', margin: '0 auto' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--color-divider)' }}>
            <Basket style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontWeight: 500 }}>{t.cart}</span>
            <Tag variant="neutral">{count}</Tag>
            <Button variant="ghost" icon style={{ marginInlineStart: 'auto' }} onClick={onClose} aria-label={t.close}><X /></Button>
          </div>
        </div>
        {children}
      </div>
    </>
  )
}
