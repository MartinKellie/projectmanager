'use client'

import { MODE_LABELS } from '@/lib/music-player/constants'
import type { PlayMode } from '@/lib/music-player/types'
import { cn } from '@/lib/utils/cn'

interface MusicModeSelectorProps {
  mode: PlayMode
  onChange: (mode: PlayMode) => void
  disabled?: boolean
}

const MODES: PlayMode[] = ['random', 'byArtist', 'byAlbum', 'cdOrder']

export function MusicModeSelector({
  mode,
  onChange,
  disabled = false,
}: MusicModeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          disabled={disabled}
          onClick={() => onChange(m)}
          className={cn(
            'rounded px-2 py-1 text-xs font-medium transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
            m === mode
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white/90',
            disabled && 'opacity-50 pointer-events-none'
          )}
        >
          {MODE_LABELS[m]}
        </button>
      ))}
    </div>
  )
}
