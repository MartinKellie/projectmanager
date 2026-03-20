'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { scanFolder } from './scan-folder'
import { parseFileMetadata, toTrack } from './parse-metadata'
import { DEFAULT_PLAY_MODE } from './constants'
import type { Track, PlayMode } from './types'

export type ScanStatus = 'idle' | 'scanning' | 'parsing' | 'ready'

function buildQueue(tracks: Track[], mode: PlayMode): number[] {
  const indices = tracks.map((_, i) => i)
  if (mode === 'random') {
    const shuffled = [...indices]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  const sorted = [...indices].sort((a, b) => {
    const ta = tracks[a]
    const tb = tracks[b]
    const artistCmp = (ta.artist || '').localeCompare(tb.artist || '')
    if (artistCmp !== 0) return artistCmp
    const albumCmp = (ta.album || '').localeCompare(tb.album || '')
    if (albumCmp !== 0) return albumCmp
    return (ta.trackNo || 0) - (tb.trackNo || 0)
  })
  return sorted
}

export interface UseMusicPlayerReturn {
  folderName: string | null
  tracks: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  mode: PlayMode
  scanStatus: ScanStatus
  scanProgress: number
  selectFolder: () => Promise<void>
  play: () => Promise<void>
  pause: () => void
  next: () => Promise<void>
  previous: () => Promise<void>
  setMode: (mode: PlayMode) => void
  rescan: () => Promise<void>
}

export function useMusicPlayer(): UseMusicPlayerReturn {
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [folderName, setFolderName] = useState<string | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [queue, setQueue] = useState<number[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [mode, setModeState] = useState<PlayMode>(DEFAULT_PLAY_MODE)
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle')
  const [scanProgress, setScanProgress] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentUrlRef = useRef<string | null>(null)

  if (typeof window !== 'undefined' && !audioRef.current) {
    audioRef.current = new Audio()
  }

  const revokeCurrentUrl = useCallback(() => {
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current)
      currentUrlRef.current = null
    }
  }, [])

  const getCurrentTrack = useCallback((): Track | null => {
    if (queue.length === 0 || queueIndex < 0 || queueIndex >= queue.length) return null
    const idx = queue[queueIndex]
    return tracks[idx] ?? null
  }, [tracks, queue, queueIndex])

  const loadAndPlay = useCallback(async (track: Track) => {
    revokeCurrentUrl()
    try {
      const file = await track.fileHandle.getFile()
      const url = URL.createObjectURL(file)
      currentUrlRef.current = url
      const audio = audioRef.current
      if (!audio) return
      audio.src = url
      await audio.play()
      setIsPlaying(true)
    } catch (err) {
      console.error('Play failed:', err)
      setIsPlaying(false)
    }
  }, [revokeCurrentUrl])

  const selectFolder = useCallback(async () => {
    try {
      const handle = await (window as unknown as { showDirectoryPicker(): Promise<FileSystemDirectoryHandle> }).showDirectoryPicker()
      setFolderHandle(handle)
      setFolderName(handle.name)
      setScanStatus('scanning')
      setScanProgress(0)
      const entries = await scanFolder(handle)
      setScanStatus('parsing')
      const parsed: Track[] = []
      for (let i = 0; i < entries.length; i++) {
        const meta = await parseFileMetadata(entries[i])
        parsed.push(toTrack(entries[i], meta))
        setScanProgress(Math.round((100 * (i + 1)) / entries.length))
      }
      setTracks(parsed)
      setQueue(buildQueue(parsed, mode))
      setQueueIndex(0)
      setScanStatus('ready')
      setScanProgress(100)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error('Select folder failed:', err)
      setScanStatus('idle')
      setScanProgress(0)
    }
  }, [mode])

  const rescan = useCallback(async () => {
    if (!folderHandle) return
    setFolderName(folderHandle.name)
    setScanStatus('scanning')
    setScanProgress(0)
    try {
      const entries = await scanFolder(folderHandle)
      setScanStatus('parsing')
      const parsed: Track[] = []
      for (let i = 0; i < entries.length; i++) {
        const meta = await parseFileMetadata(entries[i])
        parsed.push(toTrack(entries[i], meta))
        setScanProgress(Math.round((100 * (i + 1)) / entries.length))
      }
      setTracks(parsed)
      setQueue(buildQueue(parsed, mode))
      setQueueIndex(0)
      setScanStatus('ready')
      setScanProgress(100)
    } catch (err) {
      console.error('Rescan failed:', err)
      setScanStatus('ready')
    }
  }, [folderHandle, mode])

  const play = useCallback(async () => {
    const track = getCurrentTrack()
    if (track) await loadAndPlay(track)
    else if (tracks.length > 0) {
      setQueueIndex(0)
      const first = tracks[queue[0]]
      if (first) await loadAndPlay(first)
    }
  }, [getCurrentTrack, tracks, queue, loadAndPlay])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const next = useCallback(async () => {
    if (queue.length === 0) return
    revokeCurrentUrl()
    const nextIndex = queueIndex + 1 >= queue.length ? 0 : queueIndex + 1
    setQueueIndex(nextIndex)
    const track = tracks[queue[nextIndex]]
    if (track) await loadAndPlay(track)
    else setIsPlaying(false)
  }, [queue, queueIndex, tracks, loadAndPlay, revokeCurrentUrl])

  const previous = useCallback(async () => {
    if (queue.length === 0) return
    revokeCurrentUrl()
    const prevIndex = queueIndex <= 0 ? queue.length - 1 : queueIndex - 1
    setQueueIndex(prevIndex)
    const track = tracks[queue[prevIndex]]
    if (track) await loadAndPlay(track)
    else setIsPlaying(false)
  }, [queue, queueIndex, tracks, loadAndPlay, revokeCurrentUrl])

  const setMode = useCallback((newMode: PlayMode) => {
    setModeState(newMode)
    setQueue((_prev) => buildQueue(tracks, newMode))
    setQueueIndex(0)
  }, [tracks])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnded = () => next()
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('ended', onEnded)
      revokeCurrentUrl()
    }
  }, [next, revokeCurrentUrl])

  useEffect(() => {
    if (tracks.length > 0 && queue.length === 0) {
      setQueue(buildQueue(tracks, mode))
      setQueueIndex(0)
    }
    // Intentionally not depending on queue/tracks to avoid loops when we set queue here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.length, mode])

  const currentTrack = getCurrentTrack()

  return {
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
  }
}
