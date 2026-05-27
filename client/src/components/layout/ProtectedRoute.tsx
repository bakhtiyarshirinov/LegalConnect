import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '../../store/authStore'

interface ProtectedRouteProps {
  children: ReactNode
  roles?: Array<'Client' | 'Lawyer' | 'Admin'>
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    const redirect =
      user.role === 'Admin'
        ? '/admin/dashboard'
        : user.role === 'Lawyer'
        ? '/lawyer/dashboard'
        : '/dashboard'
    return <Navigate to={redirect} replace />
  }

  return <>{children}</>
}
