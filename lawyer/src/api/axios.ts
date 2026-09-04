import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let revokedToastShown = false

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    // Verification revoked by an admin — portal is read-only.
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === 'lawyer_verification_revoked'
    ) {
      if (!revokedToastShown) {
        revokedToastShown = true
        toast.error('Verifikasiyanız ləğv edilib — bu əməliyyat mümkün deyil.')
        setTimeout(() => { revokedToastShown = false }, 4000)
      }
    }
    return Promise.reject(error)
  },
)

export default api
