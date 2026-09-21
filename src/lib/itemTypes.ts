import type { ItemTypeId, Lang, LocalizedText } from './types'

/** The boutique's own item types, in the order the client listed them. Arabic is
 *  authoritative; the English labels are for the language toggle. Adding a type is
 *  one entry here plus the id in `ItemTypeId`. */
export const ITEM_TYPE_NAMES: Record<ItemTypeId, LocalizedText> = {
  'cloche-dress': { ar: 'فستان كلوش', en: 'Cloche dress' },
  'straight-dress': { ar: 'فستان ستريت', en: 'Straight dress' },
  'short-dress': { ar: 'فستان قصير', en: 'Short dress' },
  'straight-dress-train': { ar: 'فستان ستريت مع ديل', en: 'Straight dress with train' },
  'hayer-dress': { ar: 'فستان حاير', en: 'Hayer dress' },
  'simple-dress': { ar: 'فستان بسيط', en: 'Simple dress' },
  'kids-dress': { ar: 'فستان أطفال', en: "Children's dress" },
  'evening-trousers': { ar: 'سروال سهرة', en: 'Evening trousers' },
  'fur-cape-small': { ar: 'كاب فرو صغير', en: 'Small fur cape' },
  'fur-cape-large': { ar: 'كاب فرو كبير', en: 'Large fur cape' },
  staqouna: { ar: 'ستاقونة', en: 'Staqouna' },
  'evening-suit': { ar: 'بدلة سهرة', en: 'Evening suit' },
}

export const ITEM_TYPES = (Object.keys(ITEM_TYPE_NAMES) as ItemTypeId[]).map((id) => ({ id, name: ITEM_TYPE_NAMES[id] }))

export function itemTypeName(lang: Lang, id: ItemTypeId): string {
  const n = ITEM_TYPE_NAMES[id]
  return lang === 'ar' ? n.ar : n.en
}
