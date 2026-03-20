'use client'

import type { PomodoroDayStats, PomodoroAllTimeStats } from '@/lib/pomodoro/types'

interface PomodoroStatsProps {
  todayStats: PomodoroDayStats
  allTimeStats: PomodoroAllTimeStats
}

function formatMinutes(min: number): string {
  if (min === 0) return '0 min'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export function PomodoroStats({ todayStats, allTimeStats }: PomodoroStatsProps) {
  return (
    <div className="space-y-2 text-xs text-white/70 border-t border-white/10 pt-3 mt-3">
      <div>
        <span className="font-medium text-white/80">Today:</span>{' '}
        {todayStats.sessions} session{todayStats.sessions !== 1 ? 's' : ''},{' '}
        {formatMinutes(todayStats.focusMinutes)} focus,{' '}
        {formatMinutes(todayStats.relaxMinutes + todayStats.longBreakMinutes)}{' '}
        break
      </div>
      <div>
        <span className="font-medium text-white/80">All time:</span>{' '}
        {allTimeStats.totalSessions} session
        {allTimeStats.totalSessions !== 1 ? 's' : ''},{' '}
        {formatMinutes(allTimeStats.totalFocusMinutes)} focus,{' '}
        {formatMinutes(
          allTimeStats.totalRelaxMinutes + allTimeStats.totalLongBreakMinutes
        )}{' '}
        break
      </div>
    </div>
  )
}
