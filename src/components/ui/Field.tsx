import { Children, cloneElement, isValidElement, useId, type CSSProperties, type InputHTMLAttributes, type ReactElement, type ReactNode, type Ref, type SelectHTMLAttributes } from 'react'

/** Label + control. The first element child gets the label's `id` via `htmlFor`
 *  (unless it already has one), so tapping the label focuses the control and screen
 *  readers announce it. */
export function Field({ label, children, style, className }: { label: string; children: ReactNode; style?: CSSProperties; className?: string }) {
  const id = useId()
  const arr = Children.toArray(children)
  const isControl = (c: unknown): c is ReactElement<{ id?: string }> =>
    isValidElement(c) && (typeof c.type !== 'string' || ['input', 'select', 'textarea'].includes(c.type))
  const at = arr.findIndex(isControl)
  const target = at >= 0 ? (arr[at] as ReactElement<{ id?: string }>) : null
  const linkId = target ? target.props.id || id : undefined
  const kids = arr.map((c, i) => (i === at && target && !target.props.id ? cloneElement(target, { id }) : c))
  return (
    <div className={['field', className].filter(Boolean).join(' ')} style={style}>
      <label htmlFor={linkId}>{label}</label>
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
