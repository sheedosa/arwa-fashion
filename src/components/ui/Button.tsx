import type { ButtonHTMLAttributes, Ref } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: boolean
  block?: boolean
  danger?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Button({ variant = 'secondary', icon, block, danger, className = '', type = 'button', ...rest }: Props) {
  const cls = ['btn', `btn-${variant}`, icon && 'btn-icon', block && 'btn-block', danger && 'btn-danger', className]
    .filter(Boolean)
    .join(' ')
  // React 19: `ref` flows through ...rest as a plain prop.
  return <button type={type} className={cls} {...rest} />
}
