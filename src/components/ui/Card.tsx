import type { CSSProperties, ReactNode } from 'react'

export function Card({ children, style, className = '' }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return <div className={`card ${className}`} style={style}>{children}</div>
}

export function CardKicker({ children }: { children: ReactNode }) {
  return <span className="card-kicker">{children}</span>
}
