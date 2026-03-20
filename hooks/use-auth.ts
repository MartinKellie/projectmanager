'use client'

import { useEffect, useState } from 'react'
import { onAuthChange, getCurrentUser, type AuthUser } from '@/lib/storage/auth'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user)
      setLoading(false)
    })

    // Set initial user if already authenticated
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setLoading(false)
    }

    return unsubscribe
  }, [])

  return { user, loading }
}
