'use client'

import { useState } from 'react'
import { GlassPanel } from '@/components/layout/glass-panel'
import { usePomodoro } from '@/lib/pomodoro/use-pomodoro'
import { PomodoroTimer } from './pomodoro-timer'
import { PomodoroControls } from './pomodoro-controls'
import { PomodoroStats } from './pomodoro-stats'
import { Timer, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const PHASE_SHORT: Record<string, string> = {
  idle: 'Idle',
  focus: 'Focus',
  relax: 'Break',
  longBreak: 'Long break',
}

export function PomodoroPanel() {
  const [expanded, setExpanded] = useState(true)
  const {
    phase,
    remainingSeconds,
    isPaused,
    todayStats,
    allTimeStats,
    start,
    pause,
    resume,
    skip,
  } = usePomodoro()

  const summary =
    phase === 'idle'
      ? 'Idle'
      : `${PHASE_SHORT[phase]} · ${formatMMSS(remainingSeconds)}${isPaused ? ' (paused)' : ''}`

  return (
    <GlassPanel>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 mb-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
      >
        <Timer size={18} className="text-white/60 flex-shrink-0" />
        <h3 className="text-sm font-semibold flex-1">Pomodoro</h3>
        <span className="text-xs text-white/50 truncate max-w-[120px]">
          {summary}
        </span>
        {expanded ? (
          <ChevronDown size={16} className="text-white/50 flex-shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-white/50 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className={cn('space-y-3')}>
          <PomodoroTimer phase={phase} remainingSeconds={remainingSeconds} />
          <PomodoroControls
            phase={phase}
            isPaused={isPaused}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onSkip={skip}
          />
          <PomodoroStats todayStats={todayStats} allTimeStats={allTimeStats} />
        </div>
      )}
    </GlassPanel>
  )
}
