import type { Lang } from './types'

export function fmtUsd(n: number): string {
  return '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtLyd(n: number, lang: Lang): string {
  const v = Math.round(n).toLocaleString('en-US')
  return lang === 'ar' ? v + ' د.ل' : 'LYD ' + v
}

export function usdToLyd(usd: number, fxRate: number): number {
  return usd * fxRate
}

export function lydToUsd(lyd: number, fxRate: number): number {
  return lyd / fxRate
}
