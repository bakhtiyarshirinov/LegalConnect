import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { extractApiErrorMessage } from './apiError'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    // Prefer concrete field-level validation messages over the generic
    // "Validation failed"; fall back to message/title, then the axios error.
    const msg = extractApiErrorMessage(
      error.response?.data,
      error.message || 'Something went wrong',
    )
    return Promise.reject(new Error(msg))
  }
)

export default api
