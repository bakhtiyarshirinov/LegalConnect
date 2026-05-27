import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { AuthResult } from '../store/authStore'

export function useAuth() {
  const { user, token, setAuth, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleAuthSuccess = (result: AuthResult, redirectTo?: string) => {
    setAuth(result)
    if (redirectTo) {
      navigate(redirectTo)
      return
    }
    const role = result.role
    if (role === 'Client') navigate('/dashboard')
    else if (role === 'Lawyer') navigate('/lawyer/dashboard')
    else if (role === 'Admin') navigate('/admin/dashboard')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return { user, token, isAuthenticated: !!token, handleAuthSuccess, handleLogout }
}
