import type { TKey } from './i18n'
import type { RefuseReason } from '../store/useStore'

/** Store refusals are reasons, not sentences — the screen picks the localised line. */
export function refuseKey(reason: RefuseReason): TKey {
  switch (reason) {
    case 'closed': return 'dayClosedRefused'
    case 'stock': return 'stockRefused'
    case 'payment': return 'badPayment'
    case 'duplicate': return 'codeTaken'
    default: return 'noResults'
  }
}
