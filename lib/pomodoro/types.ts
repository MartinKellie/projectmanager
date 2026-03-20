/**
 * Pomodoro timer types.
 * Store-friendly shapes for config and stats (Firestore-ready later).
 */

export type Phase = 'idle' | 'focus' | 'relax' | 'longBreak'

export interface PomodoroConfig {
  focusMinutes: number
  relaxMinutes: number
  longBreakMinutes: number
  longBreakEverySessions: number
  soundEnabled: boolean
  notificationEnabled: boolean
}

/** Stats for a single day (keyed by ISO date string). */
export interface PomodoroDayStats {
  date: string
  sessions: number
  focusMinutes: number
  relaxMinutes: number
  longBreakMinutes: number
}

/** All-time cumulative stats. */
export interface PomodoroAllTimeStats {
  totalSessions: number
  totalFocusMinutes: number
  totalRelaxMinutes: number
  totalLongBreakMinutes: number
}

/** Store adapter interface — implement with localStorage now, Firestore later. */
export interface PomodoroStoreAdapter {
  getConfig(): PomodoroConfig
  setConfig(config: PomodoroConfig): void
  getTodayStats(): PomodoroDayStats
  appendTodayStats(partial: Partial<Omit<PomodoroDayStats, 'date'>>): void
  getAllTimeStats(): PomodoroAllTimeStats
  updateAllTimeStats(partial: Partial<PomodoroAllTimeStats>): void
}
