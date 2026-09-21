/**
 * Shrink a photo to a JPEG data URL whose longer side is ≤ maxPx. 640px at q0.82 turns a
 * 3–5 MB phone photo into ~40–80 KB of JPEG, which is what ends up in the in-memory store.
 * Throws on undecodable input; the picker shows a localised message.
 */
export async function fileToDataUrl(file: File, maxPx = 640): Promise<string> {
  const src = await decodeImage(file)
  try {
    const scale = Math.min(1, maxPx / Math.max(src.width, src.height))
    const w = Math.max(1, Math.round(src.width * scale))
    const h = Math.max(1, Math.round(src.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas 2d context unavailable')
    // JPEG has no alpha: paint white first so transparent PNG areas don't turn black.
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(src.source, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    src.release()
  }
}

interface Decoded {
  source: CanvasImageSource
  width: number
  height: number
  release: () => void
}

async function decodeImage(file: File): Promise<Decoded> {
  // createImageBitmap with imageOrientation:'from-image' applies the EXIF rotation tag —
  // phones store portrait shots as landscape sensor data plus a flag, so without this
  // every dress preview comes out sideways. Engines without it fall through to <img>,
  // which current browsers also orient by default.
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close() }
    } catch { /* fall through */ }
  }
  const url = URL.createObjectURL(file)
  const img = new Image()
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`could not decode ${file.type || 'image'}`))
      img.src = url
    })
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) }
  } catch (err) {
    URL.revokeObjectURL(url)
    throw err
  }
}
