import type { Lang } from './types'

export function fmtUsd(n: number): string {
  const v = Math.round(n * 100) / 100
  // Sign before the symbol: "−$12.00", never "$-12.00".
  return (v < 0 ? '−' : '') + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtLyd(n: number, lang: Lang): string {
  const r = Math.round(n)
  const v = (r < 0 ? '−' : '') + Math.abs(r).toLocaleString('en-US')
  return lang === 'ar' ? v + ' د.ل' : 'LYD ' + v
}

export function usdToLyd(usd: number, fxRate: number): number {
  return usd * fxRate
}

export function lydToUsd(lyd: number, fxRate: number): number {
  return lyd / fxRate
}
