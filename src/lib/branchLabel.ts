import { useI18n, useNm } from './i18n'
import { useStore } from '../store/useStore'
import { BRANCHES } from './mockData'

/** Branch caption shown in both the sidebar head and the mobile top bar. */
export function useBranchLabel(): string {
  const { lang } = useI18n()
  const nm = useNm()
  const user = useStore((s) => s.user)
  const branch = useStore((s) => s.branch)
  if (!user) return ''
  if (user.role === 'owner') return lang === 'ar' ? 'كل الفروع' : 'All branches'
  const b = BRANCHES.find((x) => x.id === branch)
  return b ? nm(b.name) : ''
}
