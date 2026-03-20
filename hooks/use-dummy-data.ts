'use client'

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/contexts/auth-context'
import { initializeDummyData } from '@/lib/data/dummy-data'

export function useDummyData() {
  const { user, loading } = useAuthContext()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!loading && user && !initialized) {
      // Initialize dummy data if it doesn't exist
      initializeDummyData(user.uid).then(() => {
        setInitialized(true)
      }).catch((error) => {
        console.error('Failed to initialize dummy data:', error)
        setInitialized(true) // Set to true anyway to prevent retries
      })
    }
  }, [user, loading, initialized])

  return { initialized }
}
