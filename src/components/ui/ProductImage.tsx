import type { CSSProperties } from 'react'
import { Dress } from '@phosphor-icons/react'

/** Square item photo, or a consistent placeholder when the item has none. The
 *  box never collapses (flex:none) so table rows and tiles keep their rhythm. */
export function ProductImage({ src, size, radius = 'var(--radius-md)', alt = '', style }: {
  src?: string
  size: number | string
  radius?: string
  alt?: string
  style?: CSSProperties
}) {
  const px = typeof size === 'number' ? size : undefined
  return (
    <span
      aria-hidden={alt ? undefined : true}
      style={{
        width: size, height: size, flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: radius, overflow: 'hidden', background: 'var(--color-neutral-800)',
        border: '1px solid var(--color-divider)', ...style,
      }}
    >
      {src
        ? <img src={src} alt={alt} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
        : <Dress size={px ? Math.round(px * 0.48) : 24} style={{ color: 'var(--color-neutral-500)' }} />}
    </span>
  )
}
