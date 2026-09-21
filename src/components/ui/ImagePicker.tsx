import { useRef, useState, type ChangeEvent } from 'react'
import { Camera, Trash, Warning } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'
import { fileToDataUrl } from '../../lib/image'
import { Button } from './Button'
import { ProductImage } from './ProductImage'

const PREVIEW = 112

/**
 * One photo per item, from the phone's camera or gallery, downscaled client-side to a
 * small JPEG data URL. The store is not persisted, so the image lives for the session
 * like every other demo record; with a backend this becomes toBlob + upload.
 */
export function ImagePicker({ value, onChange }: { value?: string; onChange: (dataUrl: string | undefined) => void }) {
  const { t } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  const open = () => fileRef.current?.click()

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // picking the same photo again must still fire onChange
    if (!file) return
    setBusy(true); setError(false)
    try { onChange(await fileToDataUrl(file)) }
    catch { setError(true) }
    finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button
        type="button" onClick={open} disabled={busy}
        aria-label={value ? t.changeImage : t.addImage}
        style={{
          width: PREVIEW, height: PREVIEW, flex: 'none', padding: 0, overflow: 'hidden', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          color: 'var(--color-accent)', background: value ? 'transparent' : 'var(--color-surface)',
          border: value ? 'none' : '1px dashed var(--color-accent)', borderRadius: 'var(--radius-md)', fontSize: 'var(--fs-meta)',
        }}
      >
        {value
          ? <ProductImage src={value} size={PREVIEW} alt={t.image} />
          : <><Camera size={28} /><span>{busy ? '…' : t.addImage}</span></>}
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 160px', minWidth: 0 }}>
        {value ? (
          <>
            <Button variant="secondary" onClick={open} disabled={busy} style={{ alignSelf: 'flex-start' }}><Camera size={18} />{t.changeImage}</Button>
            <Button variant="ghost" danger onClick={() => { setError(false); onChange(undefined) }} disabled={busy} style={{ alignSelf: 'flex-start' }}><Trash size={18} />{t.removeImage}</Button>
          </>
        ) : (
          <span className="text-muted" style={{ fontSize: 'var(--fs-meta)' }}>{t.imageHint}</span>
        )}
        {error && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-meta)', color: 'var(--color-bad)' }}>
            <Warning size={14} /> {t.imageError}
          </span>
        )}
      </div>
      {/* No `capture` attribute on purpose: with it, phones jump straight to the camera
          and hide the gallery; without it the OS sheet offers camera / gallery / files. */}
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
    </div>
  )
}
