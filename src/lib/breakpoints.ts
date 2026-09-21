/**
 * Responsive tiers for the whole app. The same values appear as literal rem
 * in src/styles/tokens.css (see the header comment there). Change both together.
 */
export const BP = {
  tablet: 640,
  posSplit: 900,
  laptop: 1024,
} as const

export const MQ = {
  /** ≥640px — anything wider than a phone */
  tablet: '(min-width: 40rem)',
  /** ≥900px — POS fits the cart pane beside the product grid */
  posSplit: '(min-width: 56.25rem)',
  /** ≥1024px — static sidebar instead of the drawer */
  laptop: '(min-width: 64rem)',
  /** finger-first device (tablet at a till, phone) */
  touch: '(pointer: coarse), (max-width: 63.99rem)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const

export type MqName = keyof typeof MQ
