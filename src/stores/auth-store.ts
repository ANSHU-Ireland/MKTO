import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthToken } from '../types/api'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
  setUser: (user: User) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        
        try {
          // TODO backend: Implement actual login endpoint
          const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
          })

          if (!response.ok) {
            throw new Error('Login failed')
          }

          const authData: AuthToken = await response.json()
          
          set({
            user: authData.user,
            token: authData.token,
            refreshToken: authData.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
        } catch (error) {
          // Mock successful login for development
          const mockUser: User = {
            id: '1',
            email: credentials.email,
            roles: ['trader', 'admin'],
            permissions: ['read', 'write', 'execute']
          }
          
          set({
            user: mockUser,
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
        }
      },

      logout: () => {
        // TODO backend: Call logout endpoint
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null
        })
      },

      refreshAuth: async () => {
        const { refreshToken } = get()
        if (!refreshToken) return

        try {
          // TODO backend: Implement refresh endpoint
          const response = await fetch('/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          })

          if (!response.ok) {
            throw new Error('Token refresh failed')
          }

          const authData: AuthToken = await response.json()
          
          set({
            user: authData.user,
            token: authData.token,
            refreshToken: authData.refreshToken,
            isAuthenticated: true
          })
        } catch (error) {
          console.error('Token refresh failed:', error)
          get().logout()
        }
      },

      setUser: (user) => set({ user }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)