'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { ensureSignedIn, syncAuthListeners } from '@/lib/storage/auth'
import type { AuthUser } from '@/lib/storage/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  // Auto-create default user if none exists
  useEffect(() => {
    if (!loading && !user && typeof window !== 'undefined') {
      ensureSignedIn()
        .then(() => syncAuthListeners())
        .catch(console.error)
    }
  }, [user, loading])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
