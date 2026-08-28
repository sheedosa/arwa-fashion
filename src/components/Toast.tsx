import { CheckCircle } from '@phosphor-icons/react'
import { useStore } from '../store/useStore'

export function Toast() {
  const toast = useStore((s) => s.toast)
  if (!toast) return null
  return (
    <div
      style={{
        position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
        padding: '10px 18px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-md)', fontSize: 14.5, display: 'flex', gap: 8, alignItems: 'center',
      }}
    >
      <CheckCircle style={{ color: 'var(--color-accent)' }} />
      {toast}
    </div>
  )
}
