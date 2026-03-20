/**
 * Default Pomodoro configuration.
 */

import type { PomodoroConfig } from './types'

export const DEFAULT_POMODORO_CONFIG: PomodoroConfig = {
  focusMinutes: 25,
  relaxMinutes: 5,
  longBreakMinutes: 15,
  longBreakEverySessions: 4,
  soundEnabled: true,
  notificationEnabled: false,
}
