import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  userId: string
  email: string
  fullName: string
  role: 'Client' | 'Lawyer' | 'Admin'
}

export interface AuthResult {
  userId: string
  email: string
  fullName: string
  role: string
  token: string
  expiresAt: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  setAuth: (result: AuthResult) => void
  updateUser: (patch: Partial<Pick<AuthUser, 'fullName'>>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (result) =>
        set({
          token: result.token,
          user: {
            userId: result.userId,
            email: result.email,
            fullName: result.fullName,
            role: result.role as AuthUser['role'],
          },
        }),
      updateUser: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : null })),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth-store' }
  )
)
