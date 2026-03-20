'use client'

import { useDummyData } from '@/hooks/use-dummy-data'

/**
 * Silent component that initializes dummy data on first load
 */
export function DummyDataInitializer() {
  useDummyData()
  return null
}
