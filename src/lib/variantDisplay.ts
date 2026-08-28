import type { Lang, Product, Variant } from './types'
import { COLORS } from './mockData'

export function variantMeta(lang: Lang, v: Variant): string {
  const sizeLabel = v.size === 'ONE' ? (lang === 'ar' ? 'موحد' : 'One size') : v.size
  const color = COLORS[v.color]
  return sizeLabel + ' · ' + (lang === 'ar' ? color.name.ar : color.name.en)
}

export function productName(lang: Lang, p: Product): string {
  return lang === 'ar' ? p.name.ar : p.name.en
}

export function findProduct(products: Product[], code: string): Product | undefined {
  return products.find((p) => p.code === code)
}
