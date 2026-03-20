'use client'

import { Button } from '@/components/ui/button'
import { Play, Pause, SkipForward } from 'lucide-react'

interface PomodoroControlsProps {
  phase: 'idle' | 'focus' | 'relax' | 'longBreak'
  isPaused: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onSkip: () => void
}

export function PomodoroControls({
  phase,
  isPaused,
  onStart,
  onPause,
  onResume,
  onSkip,
}: PomodoroControlsProps) {
  const isRunning = phase !== 'idle'

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {phase === 'idle' && (
        <Button size="sm" onClick={onStart} className="gap-1.5">
          <Play size={14} />
          Start
        </Button>
      )}
      {isRunning && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={isPaused ? onResume : onPause}
            className="gap-1.5"
          >
            {isPaused ? (
              <>
                <Play size={14} />
                Resume
              </>
            ) : (
              <>
                <Pause size={14} />
                Pause
              </>
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={onSkip} className="gap-1.5">
            <SkipForward size={14} />
            Skip
          </Button>
        </>
      )}
    </div>
  )
}
