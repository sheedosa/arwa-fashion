import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import type { Role } from '../lib/types'
import { defaultPathFor } from '../lib/navConfig'

export function RequireAuth({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const user = useStore((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={defaultPathFor(user.role)} replace />
  return <>{children}</>
}
