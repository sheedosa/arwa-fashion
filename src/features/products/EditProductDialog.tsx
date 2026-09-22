import { useState } from 'react'
import { useI18n, useNm } from '../../lib/i18n'
import { useStore } from '../../store/useStore'
import { ITEM_TYPES } from '../../lib/itemTypes'
import { Dialog, DialogActions } from '../../components/ui/Dialog'
import { Field, Input, Select } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { ImagePicker } from '../../components/ui/ImagePicker'
import type { ItemTypeId, Product } from '../../lib/types'

const NEW_SUPPLIER = '__new__'

/** Owner-only edit of an item's descriptive fields. The code and the size × colour
 *  grid stay fixed — they are baked into every SKU, barcode and ledger row. */
export function EditProductDialog({ p, onClose }: { p: Product; onClose: () => void }) {
  const { t, lang } = useI18n()
  const nm = useNm()
  const suppliers = useStore((s) => s.suppliers)
  const updateProduct = useStore((s) => s.updateProduct)
  const addSupplier = useStore((s) => s.addSupplier)
  const flash = useStore((s) => s.flash)

  const [image, setImage] = useState<string | undefined>(p.image)
  const [nameAr, setNameAr] = useState(p.name.ar)
  const [nameEn, setNameEn] = useState(p.name.en)
  const [typeId, setTypeId] = useState<ItemTypeId>(p.typeId)
  const [supplierId, setSupplierId] = useState(p.supplierId || '')
  const [newSupplierName, setNewSupplierName] = useState('')
  const [price, setPrice] = useState(String(p.price))
  const [cost, setCost] = useState(p.cost ? String(p.cost) : '')

  const supplierOk = supplierId === NEW_SUPPLIER ? newSupplierName.trim().length > 0 : supplierId !== ''
  const cannotSave = !nameAr.trim() || !(parseFloat(price) > 0) || !supplierOk

  const save = () => {
    const sid = supplierId === NEW_SUPPLIER ? addSupplier(newSupplierName) : supplierId
    const type = ITEM_TYPES.find((it) => it.id === typeId)!
    updateProduct(p.code, {
      name: { ar: nameAr.trim(), en: nameEn.trim() || nameAr.trim() }, typeId, category: { ...type.name }, supplierId: sid, image,
      price: parseFloat(price), cost: parseFloat(cost) || 0,
    } as Partial<Product>)
    flash(t.prodUpdated)
    onClose()
  }

  return (
    <Dialog title={`${t.editProduct} — ${p.code}`} onClose={onClose} width={560}>
      <Field label={t.image}><ImagePicker value={image} onChange={setImage} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 10 }}>
        <Field label={`${t.itemName} (${lang === 'ar' ? 'عربي' : 'Arabic'})`}><Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} /></Field>
        <Field label={t.nameEn}><Input dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></Field>
        <Field label={t.typeOfItem}>
          <Select value={typeId} onChange={(e) => setTypeId(e.target.value as ItemTypeId)}>
            {ITEM_TYPES.map((it) => <option key={it.id} value={it.id}>{nm(it.name)}</option>)}
          </Select>
        </Field>
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
        <Field label={t.salePrice}><Input kind="money" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label={t.costPrice}><Input kind="money" value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
      </div>
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>{t.cancel}</Button>
        <Button variant="primary" onClick={save} disabled={cannotSave}>{t.saveChanges}</Button>
      </DialogActions>
    </Dialog>
  )
}
