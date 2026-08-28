import type { CSSProperties, ReactNode } from 'react'

export function Tag({ children, variant = 'neutral', style }: { children: ReactNode; variant?: 'accent' | 'accent-2' | 'neutral' | 'outline' | 'good' | 'bad'; style?: CSSProperties }) {
  return <span className={`tag tag-${variant}`} style={style}>{children}</span>
}

/** Chip button used for filters/category selectors — background/border/color set inline so
 * selection state can vary per-item, matching the prototype's chipStyle() helper. */
export function Chip({ label, selected, onClick }: { label: ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        cursor: 'pointer', padding: '7px 14px', fontSize: 13.5, borderRadius: 'var(--radius-md)',
        border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-divider)'}`,
        background: selected ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent',
        color: selected ? 'var(--color-accent-200)' : 'var(--color-text)',
      }}
    >
      {label}
    </button>
  )
}
