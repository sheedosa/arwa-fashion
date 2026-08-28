import { useState } from 'react'
import { Barcode } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { COLORS } from '../../lib/mockData'
import { Dialog, DialogActions } from '../../components/ui/Dialog'
import { Field, Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import type { ColorCode, Size } from '../../lib/types'

const ALL_SIZES: Size[] = ['S', 'M', 'L', 'XL', 'ONE']
const ALL_COLORS = Object.keys(COLORS) as ColorCode[]

export function NewProductDialog({ onClose, canSeeCost }: { onClose: () => void; canSeeCost: boolean }) {
  const { t, lang } = useI18n()
  const addProduct = useStore((s) => s.addProduct)
  const flash = useStore((s) => s.flash)

  const [nameAr, setNameAr] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [code, setCode] = useState('ARW-')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [sizes, setSizes] = useState<Size[]>(['S', 'M', 'L'])
  const [colors, setColors] = useState<ColorCode[]>(['BLK'])

  const variantCount = sizes.length * colors.length
  const cannotSave = !nameAr || !code || !(parseFloat(price) > 0) || variantCount === 0

  const toggleSize = (s: Size) => setSizes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))
  const toggleColor = (c: ColorCode) => setColors((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]))

  const save = () => {
    addProduct({ nameAr, nameEn, code, category, price: parseFloat(price), cost: parseFloat(cost) || 0, sizes, colors })
    flash(t.prodAdded)
    onClose()
  }

  const chipStyle = (selected: boolean) => ({
    cursor: 'pointer', minWidth: 44, padding: '7px 10px', fontSize: 14.5, borderRadius: 'var(--radius-md)',
    border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-divider)'}`,
    background: selected ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent',
    color: selected ? 'var(--color-accent-200)' : 'var(--color-text)',
  })

  return (
    <Dialog title={t.newProduct} onClose={onClose} width={560}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label={t.nameAr}><Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} /></Field>
        <Field label={t.nameEn}><Input style={{ direction: 'ltr' }} value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></Field>
        <Field label={t.style}><Input style={{ direction: 'ltr' }} value={code} onChange={(e) => setCode(e.target.value)} /></Field>
        <Field label={t.category}><Input value={category} onChange={(e) => setCategory(e.target.value)} /></Field>
        <Field label={t.priceL}><Input style={{ direction: 'ltr' }} value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        {canSeeCost && <Field label={t.costL}><Input style={{ direction: 'ltr' }} value={cost} onChange={(e) => setCost(e.target.value)} /></Field>}
      </div>
      <Field label={t.sizesL}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_SIZES.map((s) => (
            <button key={s} onClick={() => toggleSize(s)} style={chipStyle(sizes.includes(s))}>
              {s === 'ONE' ? (lang === 'ar' ? 'موحد' : 'One') : s}
            </button>
          ))}
        </div>
      </Field>
      <Field label={t.colorsL}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_COLORS.map((c) => {
            const selected = colors.includes(c)
            return (
              <button key={c} onClick={() => toggleColor(c)} style={{ ...chipStyle(selected), display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text)' }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: COLORS[c].hex, border: '1px solid var(--color-divider)' }} />
                {lang === 'ar' ? COLORS[c].name.ar : COLORS[c].name.en}
              </button>
            )
          })}
        </div>
      </Field>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-800)', fontSize: 13.5 }}>
        <Barcode style={{ fontSize: 17.5, color: 'var(--color-accent)' }} />
        <span>
          {lang === 'ar' ? `سيُنشأ ${variantCount} متغيرًا (SKU + باركود لكل مقاس × لون)` : `${variantCount} variants will be created (SKU + barcode per size × colour)`}
        </span>
      </div>
      <span className="text-muted" style={{ fontSize: 13 }}>{t.stockNote}</span>
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>{t.cancel}</Button>
        <Button variant="primary" onClick={save} disabled={cannotSave}>{t.save}</Button>
      </DialogActions>
    </Dialog>
  )
}
