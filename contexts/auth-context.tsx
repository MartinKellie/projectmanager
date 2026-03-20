'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { ensureSignedIn, syncAuthListeners } from '@/lib/storage/auth'
import type { AuthUser } from '@/lib/storage/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  // Auto-create default user if none exists
  useEffect(() => {
    if (!loading && !user && typeof window !== 'undefined') {
      ensureSignedIn()
        .then(() => {
          setError(null)
          syncAuthListeners()
        })
        .catch((err) => {
          console.error(err)
          setError(err instanceof Error ? err.message : 'Failed to sign in')
        })
      return
    }
    if (user) setError(null)
  }, [user, loading])

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
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
