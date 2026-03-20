'use client'

import { useState } from 'react'
import { GlassPanel } from '@/components/layout/glass-panel'
import { Button } from '@/components/ui/button'
import { useMusicPlayer } from '@/lib/music-player/use-music-player'
import { MusicCover } from './music-cover'
import { MusicControls } from './music-controls'
import { MusicModeSelector } from './music-mode-selector'
import { Music, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function MusicPanel() {
  const [expanded, setExpanded] = useState(true)
  const {
    folderName,
    tracks,
    currentTrack,
    isPlaying,
    mode,
    scanStatus,
    scanProgress,
    selectFolder,
    play,
    pause,
    next,
    previous,
    setMode,
    rescan,
  } = useMusicPlayer()

  const summary =
    scanStatus === 'scanning' || scanStatus === 'parsing'
      ? `Scanning… ${scanProgress}%`
      : currentTrack
        ? `${currentTrack.artist} – ${currentTrack.title}`
        : folderName
          ? `${tracks.length} tracks`
          : 'No folder'

  return (
    <GlassPanel>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 mb-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
      >
        <Music size={18} className="text-white/60 flex-shrink-0" />
        <h3 className="text-sm font-semibold flex-1">Music</h3>
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
          {scanStatus === 'idle' && !folderName && (
            <div className="space-y-2">
              <p className="text-xs text-white/60">
                Select a folder (e.g. your Google Drive music folder).
              </p>
              <Button
                size="sm"
                onClick={selectFolder}
                className="w-full gap-2"
              >
                <FolderOpen size={14} />
                Select folder
              </Button>
            </div>
          )}

          {(scanStatus === 'scanning' || scanStatus === 'parsing') && (
            <div className="space-y-1">
              <p className="text-xs text-white/60">
                {scanStatus === 'scanning' ? 'Finding files…' : 'Reading tags…'}
              </p>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-white/30 transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {scanStatus === 'ready' && (
            <>
              <div className="flex gap-3">
                <MusicCover
                  picture={currentTrack?.picture}
                  alt={currentTrack?.album}
                  className="h-14 w-14 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {currentTrack?.title ?? '—'}
                  </p>
                  <p className="text-xs text-white/60 truncate">
                    {currentTrack?.artist ?? '—'}
                  </p>
                  <p className="text-xs text-white/40 truncate">
                    {currentTrack?.album ?? '—'}
                  </p>
                </div>
              </div>
              <MusicControls
                hasTracks={tracks.length > 0}
                isPlaying={isPlaying}
                onPlay={play}
                onPause={pause}
                onPrevious={previous}
                onNext={next}
              />
              <div className="pt-1 border-t border-white/10">
                <p className="text-xs text-white/50 mb-1">Play order</p>
                <MusicModeSelector
                  mode={mode}
                  onChange={setMode}
                  disabled={tracks.length === 0}
                />
              </div>
              {folderName && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={rescan}
                  className="w-full text-xs"
                >
                  Rescan folder
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </GlassPanel>
  )
}
