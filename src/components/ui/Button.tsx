import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: boolean
  block?: boolean
  children?: ReactNode
}

export function Button({ variant = 'secondary', icon, block, className = '', ...rest }: Props) {
  const cls = ['btn', `btn-${variant}`, icon && 'btn-icon', block && 'btn-block', className].filter(Boolean).join(' ')
  return <button className={cls} {...rest} />
}
