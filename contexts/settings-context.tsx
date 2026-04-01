'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

interface Settings {
  glimmerEnabled: boolean
  glimmerRandomColor: boolean
  toastsEnabled: boolean
  carryoverSuppressAfter: number
}

interface SettingsContextValue {
  settings: Settings
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

const DEFAULT_SETTINGS: Settings = {
  glimmerEnabled: true,
  glimmerRandomColor: false,
  toastsEnabled: true,
  carryoverSuppressAfter: 4,
}

const SETTINGS_STORAGE_KEY = 'app_settings'

function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  
  return DEFAULT_SETTINGS
}

function saveSettings(settings: Settings) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value }
        saveSettings(next)
        return next
      })
    },
    []
  )

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== SETTINGS_STORAGE_KEY) return
      setSettings(loadSettings())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
