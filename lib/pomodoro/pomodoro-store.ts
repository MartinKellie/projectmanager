/**
 * Pomodoro store: interface + localStorage adapter.
 * Swap adapter for Firestore later without changing UI or hook.
 */

import { getTodayDateString } from '@/lib/utils/date'
import { DEFAULT_POMODORO_CONFIG } from './constants'
import type {
  PomodoroConfig,
  PomodoroDayStats,
  PomodoroAllTimeStats,
  PomodoroStoreAdapter,
} from './types'

const CONFIG_KEY = 'pomodoro_config'
const ALL_TIME_KEY = 'pomodoro_all_time'

function todayDateKey(): string {
  return getTodayDateString()
}

function statsKeyForDate(date: string): string {
  return `pomodoro_stats_${date}`
}

function loadConfig(): PomodoroConfig {
  if (typeof window === 'undefined') return DEFAULT_POMODORO_CONFIG
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PomodoroConfig>
      return { ...DEFAULT_POMODORO_CONFIG, ...parsed }
    }
  } catch {
    // ignore
  }
  return DEFAULT_POMODORO_CONFIG
}

function saveConfig(config: PomodoroConfig): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  } catch {
    // ignore
  }
}

function emptyDayStats(date: string): PomodoroDayStats {
  return {
    date,
    sessions: 0,
    focusMinutes: 0,
    relaxMinutes: 0,
    longBreakMinutes: 0,
  }
}

function loadDayStats(date: string): PomodoroDayStats {
  if (typeof window === 'undefined') return emptyDayStats(date)
  try {
    const raw = localStorage.getItem(statsKeyForDate(date))
    if (raw) {
      const parsed = JSON.parse(raw) as PomodoroDayStats
      return { ...emptyDayStats(date), ...parsed, date }
    }
  } catch {
    // ignore
  }
  return emptyDayStats(date)
}

function saveDayStats(stats: PomodoroDayStats): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(statsKeyForDate(stats.date), JSON.stringify(stats))
  } catch {
    // ignore
  }
}

function emptyAllTimeStats(): PomodoroAllTimeStats {
  return {
    totalSessions: 0,
    totalFocusMinutes: 0,
    totalRelaxMinutes: 0,
    totalLongBreakMinutes: 0,
  }
}

function loadAllTimeStats(): PomodoroAllTimeStats {
  if (typeof window === 'undefined') return emptyAllTimeStats()
  try {
    const raw = localStorage.getItem(ALL_TIME_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PomodoroAllTimeStats
      return { ...emptyAllTimeStats(), ...parsed }
    }
  } catch {
    // ignore
  }
  return emptyAllTimeStats()
}

function saveAllTimeStats(stats: PomodoroAllTimeStats): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ALL_TIME_KEY, JSON.stringify(stats))
  } catch {
    // ignore
  }
}

/** Local storage adapter. Use this instance; swap for Firestore adapter when ready. */
export const pomodoroStore: PomodoroStoreAdapter = {
  getConfig: loadConfig,
  setConfig(config) {
    saveConfig(config)
  },
  getTodayStats() {
    return loadDayStats(todayDateKey())
  },
  appendTodayStats(partial) {
    const date = todayDateKey()
    const current = loadDayStats(date)
    const next: PomodoroDayStats = {
      date,
      sessions: current.sessions + (partial.sessions ?? 0),
      focusMinutes: current.focusMinutes + (partial.focusMinutes ?? 0),
      relaxMinutes: current.relaxMinutes + (partial.relaxMinutes ?? 0),
      longBreakMinutes:
        current.longBreakMinutes + (partial.longBreakMinutes ?? 0),
    }
    saveDayStats(next)
  },
  getAllTimeStats: loadAllTimeStats,
  updateAllTimeStats(partial) {
    const current = loadAllTimeStats()
    const next: PomodoroAllTimeStats = {
      totalSessions: current.totalSessions + (partial.totalSessions ?? 0),
      totalFocusMinutes:
        current.totalFocusMinutes + (partial.totalFocusMinutes ?? 0),
      totalRelaxMinutes:
        current.totalRelaxMinutes + (partial.totalRelaxMinutes ?? 0),
      totalLongBreakMinutes:
        current.totalLongBreakMinutes +
        (partial.totalLongBreakMinutes ?? 0),
    }
    saveAllTimeStats(next)
  },
}
