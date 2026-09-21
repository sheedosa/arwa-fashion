import type { ColorCode, Lang, Size } from '../../lib/types'

/** `${size}-${color}` → digits string ('' = 0). Strings, so the parse-on-read idiom
 *  from Field.tsx keeps working. Keyed by size/colour, NOT sku: the style code is
 *  still being typed while quantities are entered. */
export type QtyMap = Record<string, string>
export const qtyKey = (s: Size, c: ColorCode) => `${s}-${c}`

export function sizeLabel(s: Size, lang: Lang): string {
  return s === 'ONE' ? (lang === 'ar' ? 'موحد' : 'One size') : s
}

/** Digits only: folds Arabic-Indic (٠-٩) and Extended (۰-۹) digits — both blocks are
 *  16-aligned, so `& 0xf` is the digit value — strips everything else, caps at 4. */
export function normaliseQty(raw: string): string {
  return raw
    .replace(/[٠-٩۰-۹]/g, (d) => String.fromCharCode(48 + (d.charCodeAt(0) & 0xf)))
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '')
    .slice(0, 4)
}

export const qtyOf = (qtys: QtyMap, s: Size, c: ColorCode): number => parseInt(qtys[qtyKey(s, c)] || '0', 10) || 0

export function sumQtys(sizes: Size[], colors: ColorCode[], qtys: QtyMap): number {
  let n = 0
  for (const s of sizes) for (const c of colors) n += qtyOf(qtys, s, c)
  return n
}
