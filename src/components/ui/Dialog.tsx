import type { CSSProperties, ReactNode } from 'react'
import { X } from '@phosphor-icons/react'
import { Button } from './Button'

export function Dialog({ title, onClose, width, children }: { title: string; onClose: () => void; width?: number; children: ReactNode }) {
  const style: CSSProperties = width ? { width: `min(${width}px, 100%)` } : {}
  return (
    <div className="dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dialog" style={style}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="dialog-title">{title}</span>
          <Button variant="ghost" icon onClick={onClose} style={{ marginInlineStart: 'auto' }}><X /></Button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="dialog-actions" style={{ margin: 0 }}>{children}</div>
}
