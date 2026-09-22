import { Children, cloneElement, isValidElement, useId, type CSSProperties, type InputHTMLAttributes, type ReactElement, type ReactNode, type Ref, type SelectHTMLAttributes } from 'react'

/** Label + control. The first element child gets the label's `id` via `htmlFor`
 *  (unless it already has one), so tapping the label focuses the control and screen
 *  readers announce it. */
export function Field({ label, children, style, className }: { label: string; children: ReactNode; style?: CSSProperties; className?: string }) {
  const id = useId()
  let linked = false
  const kids = Children.map(children, (child) => {
    if (linked || !isValidElement(child)) return child
    const el = child as ReactElement<{ id?: string }>
    if (typeof el.type === 'string' && !['input', 'select', 'textarea'].includes(el.type)) return child
    linked = true
    return el.props.id ? child : cloneElement(el, { id })
  })
  return (
    <div className={['field', className].filter(Boolean).join(' ')} style={style}>
      <label htmlFor={linked ? id : undefined}>{label}</label>
      {kids}
    </div>
  )
}

/**
 * What kind of value this field holds. Drives the on-screen keyboard.
 *
 * Deliberately NOT type="number": it discards non-numeric keystrokes (so
 * e.target.value becomes '' mid-entry, breaking every `parseFloat(v) || 0`
 * handler), renders spinners, and rejects Arabic-Indic digits (٠١٢…) that
 * Libyan users may type. `inputMode` gives the keypad without any of that.
 */
export type FieldKind = 'text' | 'money' | 'qty' | 'percent' | 'tel' | 'search'

const KIND: Record<FieldKind, InputHTMLAttributes<HTMLInputElement>> = {
  text: {},
  money: { inputMode: 'decimal', enterKeyHint: 'done', autoComplete: 'off' },
  qty: { inputMode: 'numeric', enterKeyHint: 'done', autoComplete: 'off' },
  percent: { inputMode: 'decimal', enterKeyHint: 'done', autoComplete: 'off' },
  tel: { type: 'tel', inputMode: 'tel', enterKeyHint: 'done', autoComplete: 'tel' },
  search: { type: 'search', inputMode: 'search', enterKeyHint: 'search', autoComplete: 'off' },
}
const LTR_KINDS: FieldKind[] = ['money', 'qty', 'percent', 'tel']

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  kind?: FieldKind
  /** compact in-row field, e.g. the POS per-line discount */
  tight?: boolean
  ref?: Ref<HTMLInputElement>
}

export function Input({ kind = 'text', tight, className = '', ...rest }: InputProps) {
  const ltr = LTR_KINDS.includes(kind)
  const cls = ['input', ltr && 'input-num', tight && 'input-tight', className].filter(Boolean).join(' ')
  return (
    <input
      {...KIND[kind]}
      className={cls}
      // The dir *attribute* rather than CSS direction: also fixes caret
      // placement and selection order.
      dir={ltr ? 'ltr' : undefined}
      autoCapitalize={kind === 'text' ? undefined : 'off'}
      autoCorrect={kind === 'text' ? undefined : 'off'}
      spellCheck={kind === 'text' ? undefined : false}
      {...rest}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', ...rest } = props
  return <select className={`input ${className}`} {...rest} />
}
