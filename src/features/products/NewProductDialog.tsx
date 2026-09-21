import { useState } from 'react'
import { Barcode } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { COLORS } from '../../lib/mockData'
import { Dialog, DialogActions } from '../../components/ui/Dialog'
import { Field, Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Tag'
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

  return (
    <Dialog title={t.newProduct} onClose={onClose} width={560}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 10 }}>
        <Field label={t.nameAr}><Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} /></Field>
        <Field label={t.nameEn}><Input dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></Field>
        <Field label={t.style}><Input dir="ltr" autoCapitalize="characters" autoCorrect="off" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} /></Field>
        <Field label={t.category}><Input value={category} onChange={(e) => setCategory(e.target.value)} /></Field>
        <Field label={t.priceL}><Input kind="money" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        {canSeeCost && <Field label={t.costL}><Input kind="money" value={cost} onChange={(e) => setCost(e.target.value)} /></Field>}
      </div>
      <Field label={t.sizesL}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_SIZES.map((s) => (
            <Chip key={s} label={s === 'ONE' ? (lang === 'ar' ? 'موحد' : 'One') : s} selected={sizes.includes(s)} onClick={() => toggleSize(s)} />
          ))}
        </div>
      </Field>
      <Field label={t.colorsL}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_COLORS.map((c) => (
            <Chip
              key={c}
              selected={colors.includes(c)}
              onClick={() => toggleColor(c)}
              label={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: COLORS[c].hex, border: '1px solid var(--color-divider)' }} />
                  {lang === 'ar' ? COLORS[c].name.ar : COLORS[c].name.en}
                </span>
              }
            />
          ))}
        </div>
      </Field>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-800)', fontSize: 'var(--fs-meta)' }}>
        <Barcode size={18} style={{ color: 'var(--color-accent)', flex: 'none' }} />
        <span>
          {lang === 'ar' ? `سيُنشأ ${variantCount} متغيرًا (SKU + باركود لكل مقاس × لون)` : `${variantCount} variants will be created (SKU + barcode per size × colour)`}
        </span>
      </div>
      <span className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{t.stockNote}</span>
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>{t.cancel}</Button>
        <Button variant="primary" onClick={save} disabled={cannotSave}>{t.save}</Button>
      </DialogActions>
    </Dialog>
  )
}
