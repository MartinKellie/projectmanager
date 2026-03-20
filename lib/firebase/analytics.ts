import type { Analytics } from 'firebase/analytics'

import { getFirebaseApp } from './config'

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null

  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) return null

  const { isSupported, getAnalytics } = await import('firebase/analytics')
  const isAnalyticsSupported = await isSupported()
  if (!isAnalyticsSupported) return null

  return getAnalytics(firebaseApp)
}

