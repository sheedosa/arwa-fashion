import { CheckCircle } from '@phosphor-icons/react'
import { useStore } from '../store/useStore'

export function Toast() {
  const toast = useStore((s) => s.toast)
  if (!toast) return null
  return (
    <div
      role="status"
      style={{
        position: 'fixed', left: '50%', transform: 'translateX(-50%)', zIndex: 60,
        // lifts above the POS bottom bar on phone and the home indicator
        bottom: 'calc(22px + var(--bottom-bar-h, 0px) + var(--safe-bottom, 0px))',
        maxWidth: 'calc(100vw - 32px)',
        padding: '10px 18px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-md)', fontSize: 'var(--fs-meta)', display: 'flex', gap: 8, alignItems: 'center',
      }}
    >
      <CheckCircle style={{ color: 'var(--color-accent)', flex: 'none' }} />
      <span style={{ minWidth: 0 }}>{toast}</span>
    </div>
  )
}
