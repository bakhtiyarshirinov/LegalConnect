import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login } from '../api/auth'
import { getMyLawyerProfile } from '../api/profile'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth, setLawyerId } = useAuthStore()

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    try {
      const data = await login(email, password)

      if (data.role !== 'Lawyer') {
        toast.error('Access denied. Lawyer account required.')
        return
      }

      setAuth(
        {
          userId: data.userId,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
        },
        data.token,
      )

      // Fetch lawyer profile to get lawyerId
      try {
        const profile = await getMyLawyerProfile()
        setLawyerId(profile.id)
      } catch {
        // profile will load later in dashboard
      }

      navigate('/dashboard')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Check your credentials.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return { handleLogin, loading }
}
