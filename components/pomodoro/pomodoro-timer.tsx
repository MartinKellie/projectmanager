'use client'

import type { Phase } from '@/lib/pomodoro/types'

interface PomodoroTimerProps {
  phase: Phase
  remainingSeconds: number
}

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const PHASE_LABELS: Record<Phase, string> = {
  idle: 'Idle',
  focus: 'Focus',
  relax: 'Break',
  longBreak: 'Long break',
}

export function PomodoroTimer({ phase, remainingSeconds }: PomodoroTimerProps) {
  const label = PHASE_LABELS[phase]
  const display = phase === 'idle' ? '—:——' : formatMMSS(remainingSeconds)

  return (
    <div className="text-center">
      <p className="text-xs font-medium uppercase tracking-wider text-white/60 mb-1">
        {label}
      </p>
      <p
        className="text-3xl font-mono font-semibold tabular-nums text-white"
        aria-live="polite"
      >
        {display}
      </p>
    </div>
  )
}
