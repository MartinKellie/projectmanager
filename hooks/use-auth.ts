'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { onAuthChange, type AuthUser } from '@/lib/storage/auth'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Run before paint so the UI does not flash auth loading; onAuthChange calls back synchronously.
  useLayoutEffect(() => {
    const unsubscribe = onAuthChange((next) => {
      setUser(next)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // Last resort if the auth bridge never settles (blocked script, unexpected hang).
  useEffect(() => {
    const t = window.setTimeout(() => {
      setLoading((still) => {
        if (still) console.warn('Auth: forcing loading false after timeout')
        return false
      })
    }, 12000)
    return () => window.clearTimeout(t)
  }, [])

  return { user, loading }
}
