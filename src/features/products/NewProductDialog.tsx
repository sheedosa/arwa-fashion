import { useMemo, useState } from 'react'
import { Barcode } from '@phosphor-icons/react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { BRANCHES, COLORS } from '../../lib/mockData'
import { ITEM_TYPES } from '../../lib/itemTypes'
import { Dialog, DialogActions } from '../../components/ui/Dialog'
import { Field, Input, Select } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Tag'
import { ImagePicker } from '../../components/ui/ImagePicker'
import { QuantityGrid } from './QuantityGrid'
import { qtyOf, sizeLabel, sumQtys, type QtyMap } from './qty'
import type { BranchId, ColorCode, ItemTypeId, Size } from '../../lib/types'

const ALL_SIZES: Size[] = ['S', 'M', 'L', 'XL', 'ONE']
const ALL_COLORS = Object.keys(COLORS) as ColorCode[]
const NEW_SUPPLIER = '__new__'
const CODE_PREFIX = 'ARW-'

/** Add-item form, fields in the order the client listed them: image, name, supplier,
 *  code, type, prices, sizes, colours, quantity per combination, destination branch. */
export function NewProductDialog({ onClose, canSeeCost }: { onClose: () => void; canSeeCost: boolean }) {
  const { t, lang } = useI18n()
  const nm = useNm()
  const addProduct = useStore((s) => s.addProduct)
  const addSupplier = useStore((s) => s.addSupplier)
  const flash = useStore((s) => s.flash)
  const products = useStore((s) => s.products)
  const suppliers = useStore((s) => s.suppliers)
  const user = useStore((s) => s.user)
  const currentBranch = useStore((s) => s.branch)
  const isOwner = user?.role === 'owner'

  const [image, setImage] = useState<string | undefined>()
  const [nameAr, setNameAr] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [supplierId, setSupplierId] = useState('') // '' = not chosen, NEW_SUPPLIER = typing a new one
  const [newSupplierName, setNewSupplierName] = useState('')
  const [code, setCode] = useState(CODE_PREFIX)
  const [typeId, setTypeId] = useState<ItemTypeId | ''>('')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [sizes, setSizes] = useState<Size[]>(['S', 'M', 'L'])
  const [colors, setColors] = useState<ColorCode[]>(['BLK'])
  const [qtys, setQtys] = useState<QtyMap>({}) // survives chip toggles; only selected combos are read
  const [pickedBranch, setPickedBranch] = useState<BranchId>(currentBranch)
  // Managers stock their own branch — the store enforces the same rule on write.
  const branchId: BranchId = isOwner ? pickedBranch : (user?.branchId ?? currentBranch)

  const cleanCode = code.trim().toUpperCase()
  const codeTaken = useMemo(() => products.some((p) => p.code.toUpperCase() === cleanCode), [products, cleanCode])
  const supplierOk = supplierId === NEW_SUPPLIER ? newSupplierName.trim().length > 0 : supplierId !== ''
  const variantCount = sizes.length * colors.length
  const total = sumQtys(sizes, colors, qtys)

  // `total` is deliberately not required: an item may be created empty and receive
  // its stock later through a purchase order.
  const cannotSave = !nameAr.trim() || !cleanCode || cleanCode === CODE_PREFIX || codeTaken || !typeId || !supplierOk
    || !(parseFloat(price) > 0) || variantCount === 0

  const toggleSize = (s: Size) => setSizes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))
  const toggleColor = (c: ColorCode) => setColors((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]))
  const setQty = (key: string, value: string) => setQtys((cur) => ({ ...cur, [key]: value }))

  const save = () => {
    if (cannotSave || !typeId) return
    const quantities: Record<string, number> = {}
    sizes.forEach((s) => colors.forEach((c) => { const n = qtyOf(qtys, s, c); if (n > 0) quantities[`${s}-${c}`] = n }))
    const sid = supplierId === NEW_SUPPLIER ? addSupplier(newSupplierName) : supplierId
    const ok = addProduct({
      nameAr, nameEn, code: cleanCode, typeId, supplierId: sid,
      price: parseFloat(price), cost: canSeeCost ? parseFloat(cost) || 0 : 0,
      image, sizes, colors, branchId, quantities,
    })
    if (!ok) { flash(t.codeTaken); return }
    flash(t.prodAdded)
    onClose()
  }

  const colorName = (c: ColorCode) => (lang === 'ar' ? COLORS[c].name.ar : COLORS[c].name.en)

  return (
    <Dialog title={t.newProduct} onClose={onClose} width={600}>
      <Field label={t.image}><ImagePicker value={image} onChange={setImage} /></Field>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 10 }}>
        <Field label={`${t.itemName} (${lang === 'ar' ? 'عربي' : 'Arabic'})`}><Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} /></Field>
        <Field label={t.nameEn}><Input dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></Field>
        <Field label={t.supplierName}>
          <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">{t.pickSupplier}…</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value={NEW_SUPPLIER}>+ {t.newSupplier}</option>
          </Select>
        </Field>
        {supplierId === NEW_SUPPLIER && (
          <Field label={t.newSupplierName}><Input autoFocus value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} /></Field>
        )}
        <Field label={t.itemCode}>
          <Input dir="ltr" autoCapitalize="characters" autoCorrect="off" spellCheck={false} aria-invalid={codeTaken || undefined}
            value={code} onChange={(e) => setCode(e.target.value)} />
          {codeTaken && <span style={{ display: 'block', marginTop: 4, fontSize: 'var(--fs-meta)', color: 'var(--color-bad)' }}>{t.codeTaken}</span>}
        </Field>
        <Field label={t.typeOfItem}>
          <Select value={typeId} onChange={(e) => setTypeId(e.target.value as ItemTypeId | '')}>
            <option value="">{t.pickType}…</option>
            {ITEM_TYPES.map((it) => <option key={it.id} value={it.id}>{nm(it.name)}</option>)}
          </Select>
        </Field>
        <Field label={t.salePrice}><Input kind="money" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        {canSeeCost && <Field label={t.costPrice}><Input kind="money" value={cost} onChange={(e) => setCost(e.target.value)} /></Field>}
      </div>

      <Field label={t.sizesL}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_SIZES.map((s) => <Chip key={s} label={sizeLabel(s, lang)} selected={sizes.includes(s)} onClick={() => toggleSize(s)} />)}
        </div>
      </Field>
      <Field label={t.colorsL}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_COLORS.map((c) => (
            <Chip
              key={c} selected={colors.includes(c)} onClick={() => toggleColor(c)}
              label={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: COLORS[c].hex, border: '1px solid var(--color-divider)' }} />
                  {colorName(c)}
                </span>
              }
            />
          ))}
        </div>
      </Field>

      <QuantityGrid sizes={sizes} colors={colors} qtys={qtys} onChange={setQty} />
      {variantCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', fontSize: 'var(--fs-meta)' }}>
          <span className="text-muted">{t.totalQty}</span>
          <strong dir="ltr" style={{ fontSize: 'var(--fs-lead)', fontVariantNumeric: 'tabular-nums' }}>{total}</strong>
          {total === 0 && <span className="text-muted">— {t.noQtyHint}</span>}
        </div>
      )}

      <Field label={t.branchPlaced}>
        {isOwner ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {BRANCHES.filter((b) => b.active).map((b) => (
              <Chip key={b.id} label={nm(b.name)} selected={pickedBranch === b.id} onClick={() => setPickedBranch(b.id)} />
            ))}
          </div>
        ) : (
          <div className="input" style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text)', opacity: 0.8 }}>
            {nm(BRANCHES.find((b) => b.id === branchId)!.name)}
          </div>
        )}
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
