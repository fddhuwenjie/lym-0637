import { create } from 'zustand'
import type { User, UserRole } from '../../shared/types'
import { authApi } from '../api'

interface AuthState {
  user: User | null
  role: UserRole | null
  isLoading: boolean
  error: string | null
  login: (name: string) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isLoading: false,
  error: null,

  login: async (name: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.login(name)
      if (response.success && response.data) {
        set({
          user: response.data.user,
          role: response.data.user.role,
          isLoading: false,
        })
        return true
      } else {
        set({ error: response.error || 'Login failed', isLoading: false })
        return false
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Login failed',
        isLoading: false,
      })
      return false
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await authApi.logout()
    } finally {
      set({ user: null, role: null, isLoading: false, error: null })
    }
  },

  clearError: () => set({ error: null }),
}))
