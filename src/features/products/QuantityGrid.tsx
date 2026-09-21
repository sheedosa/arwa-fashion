import { Fragment } from 'react'
import { qtyKey, normaliseQty, sizeLabel, type QtyMap } from './qty'
import { useI18n } from '../../lib/i18n'
import { COLORS } from '../../lib/mockData'
import { Field, Input } from '../../components/ui/Field'
import type { ColorCode, Lang, Size } from '../../lib/types'

function ColorLabel({ code, lang }: { code: ColorCode; lang: Lang }) {
  const def = COLORS[code]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, maxWidth: 96, fontSize: 'var(--fs-meta)' }}>
      <span aria-hidden style={{ width: 11, height: 11, borderRadius: '50%', flex: 'none', background: def.hex, border: '1px solid var(--color-divider)' }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang === 'ar' ? def.name.ar : def.name.en}</span>
    </span>
  )
}

interface Props {
  sizes: Size[]
  colors: ColorCode[]
  qtys: QtyMap
  onChange: (key: string, value: string) => void
}

/**
 * Per-combination opening quantities. 1×1 is a single field; N×1 / 1×M a two-column
 * list; N×M a matrix with sizes ACROSS (bounded, ≤5) and colours DOWN (the axis that
 * grows), so it never needs to scroll sideways inside the phone sheet. Header and
 * body share one grid template, so columns align in both RTL and LTR.
 */
export function QuantityGrid({ sizes, colors, qtys, onChange }: Props) {
  const { t, lang } = useI18n()
  if (!sizes.length || !colors.length) return null

  const cell = (s: Size, c: ColorCode, mode: 'field' | 'row' | 'cell') => {
    const key = qtyKey(s, c)
    return (
      <Input
        key={key}
        kind="qty"
        tight={mode !== 'field'}
        value={qtys[key] ?? ''}
        placeholder="0"
        aria-label={`${sizeLabel(s, lang)} · ${lang === 'ar' ? COLORS[c].name.ar : COLORS[c].name.en}`}
        onChange={(e) => onChange(key, normaliseQty(e.target.value))}
        onFocus={(e) => e.currentTarget.select()}
        // minWidth:0 — an <input>'s intrinsic width would otherwise force the
        // minmax(0,1fr) tracks wider than the sheet.
        style={{ minWidth: 0, width: mode === 'row' ? 112 : mode === 'field' ? 160 : '100%', textAlign: 'center' }}
      />
    )
  }

  if (sizes.length === 1 && colors.length === 1) {
    return <Field label={`${t.itemQty} — ${sizeLabel(sizes[0], lang)} · ${lang === 'ar' ? COLORS[colors[0]].name.ar : COLORS[colors[0]].name.en}`}>{cell(sizes[0], colors[0], 'field')}</Field>
  }

  if (sizes.length === 1 || colors.length === 1) {
    const rows = colors.length === 1
      ? sizes.map((s) => ({ s, c: colors[0], label: <span style={{ fontSize: 'var(--fs-meta)' }}>{sizeLabel(s, lang)}</span> }))
      : colors.map((c) => ({ s: sizes[0], c, label: <ColorLabel code={c} lang={lang} /> }))
    return (
      <Field label={t.qtyPerVariant}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 10px', alignItems: 'center' }}>
          {rows.map(({ s, c, label }) => <Fragment key={qtyKey(s, c)}>{label}{cell(s, c, 'row')}</Fragment>)}
        </div>
      </Field>
    )
  }

  return (
    <Field label={t.qtyPerVariant}>
      <div style={{ display: 'grid', gridTemplateColumns: `auto repeat(${sizes.length}, minmax(0, 1fr))`, gap: 6, alignItems: 'center' }}>
        <span aria-hidden />
        {sizes.map((s) => (
          <span key={s} className="text-muted" style={{ textAlign: 'center', fontSize: 'var(--fs-micro)', fontWeight: 600 }}>{sizeLabel(s, lang)}</span>
        ))}
        {colors.map((c) => (
          <Fragment key={c}>
            <ColorLabel code={c} lang={lang} />
            {sizes.map((s) => cell(s, c, 'cell'))}
          </Fragment>
        ))}
      </div>
    </Field>
  )
}
