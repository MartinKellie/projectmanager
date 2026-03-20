'use client'

import { Button } from '@/components/ui/button'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'

interface MusicControlsProps {
  hasTracks: boolean
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onPrevious: () => void
  onNext: () => void
}

export function MusicControls({
  hasTracks,
  isPlaying,
  onPlay,
  onPause,
  onPrevious,
  onNext,
}: MusicControlsProps) {
  if (!hasTracks) return null

  return (
    <div className="flex items-center justify-center gap-1">
      <Button size="sm" variant="ghost" onClick={onPrevious} className="h-9 w-9 p-0">
        <SkipBack size={18} />
      </Button>
      <Button
        size="sm"
        onClick={isPlaying ? onPause : onPlay}
        className="h-9 w-9 p-0"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </Button>
      <Button size="sm" variant="ghost" onClick={onNext} className="h-9 w-9 p-0">
        <SkipForward size={18} />
      </Button>
    </div>
  )
}
