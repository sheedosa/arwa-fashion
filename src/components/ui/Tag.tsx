import type { CSSProperties, ReactNode } from 'react'

export function Tag({ children, variant = 'neutral', style }: { children: ReactNode; variant?: 'accent' | 'accent-2' | 'neutral' | 'outline' | 'good' | 'bad'; style?: CSSProperties }) {
  return <span className={`tag tag-${variant}`} style={style}>{children}</span>
}

/** Chip button used for filters/category selectors. Sizing lives in .chip so
 * the touch tier can grow it — an inline style can't be reached by a media query. */
export function Chip({ label, selected, onClick }: { label: ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className="chip" data-selected={selected} aria-pressed={selected} onClick={onClick}>
      {label}
    </button>
  )
}
