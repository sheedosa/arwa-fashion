import { useI18n, useNm } from './i18n'
import { useStore } from '../store/useStore'
import { BRANCHES } from './mockData'

/** Branch caption shown in both the sidebar head and the mobile top bar. Every screen
 *  works on the selected branch, so the caption names it — for the owner too, with a
 *  reminder that they can switch. */
export function useBranchLabel(): string {
  const { t } = useI18n()
  const nm = useNm()
  const user = useStore((s) => s.user)
  const branch = useStore((s) => s.branch)
  if (!user) return ''
  const b = BRANCHES.find((x) => x.id === branch)
  const name = b ? nm(b.name) : ''
  return user.role === 'owner' ? `${name} · ${t.allBranches}` : name
}
