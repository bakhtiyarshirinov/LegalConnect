import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthUser {
  userId: string
  email: string
  fullName: string
  role: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  lawyerId: string | null
  setAuth: (user: AuthUser, token: string) => void
  setLawyerId: (id: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      lawyerId: null,
      setAuth: (user, token) => set({ user, token }),
      setLawyerId: (lawyerId) => set({ lawyerId }),
      logout: () => set({ user: null, token: null, lawyerId: null }),
    }),
    {
      name: 'lawyer-auth',
    },
  ),
)
