import type { Role } from './types'
import type { TKey } from './i18n'
import {
  ChartLineUp, Vault, Scan, ArrowUUpLeft, Users, Package, TShirt, ArrowsLeftRight,
  Truck, CurrencyDollar, ClipboardText, ChartBar, type Icon,
} from '@phosphor-icons/react'

export interface NavItem {
  key: string
  path: string
  icon: Icon
  labelKey: TKey
  roles: Role[] | null // null = everyone
}

export interface NavGroup {
  labelKey: TKey
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: 'navManage',
    items: [
      { key: 'dash', path: '/dash', icon: ChartLineUp, labelKey: 'dashboard', roles: ['owner'] },
      { key: 'reports', path: '/reports', icon: ChartBar, labelKey: 'reports', roles: ['owner'] },
      { key: 'expenses', path: '/expenses', icon: CurrencyDollar, labelKey: 'expenses', roles: ['owner', 'manager'] },
      { key: 'rec', path: '/rec', icon: Vault, labelKey: 'recon', roles: ['owner', 'manager'] },
    ],
  },
  {
    labelKey: 'navSell',
    items: [
      { key: 'pos', path: '/pos', icon: Scan, labelKey: 'pos', roles: null },
      { key: 'ret', path: '/ret', icon: ArrowUUpLeft, labelKey: 'returns', roles: null },
      { key: 'cust', path: '/cust', icon: Users, labelKey: 'customers', roles: null },
    ],
  },
  {
    labelKey: 'navStock',
    items: [
      { key: 'inv', path: '/inv', icon: Package, labelKey: 'inventory', roles: null },
      { key: 'prod', path: '/prod', icon: TShirt, labelKey: 'products', roles: ['owner', 'manager'] },
      { key: 'tr', path: '/tr', icon: ArrowsLeftRight, labelKey: 'transfers', roles: ['owner', 'manager'] },
      { key: 'po', path: '/purchasing', icon: Truck, labelKey: 'purchasing', roles: ['owner', 'manager'] },
      { key: 'sc', path: '/stock-counts', icon: ClipboardText, labelKey: 'stockCounts', roles: ['owner', 'manager'] },
    ],
  },
]

export function allowedNavGroups(role: Role): NavGroup[] {
  return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(role)) })).filter((g) => g.items.length)
}

export function defaultPathFor(role: Role): string {
  return role === 'owner' ? '/dash' : '/pos'
}
