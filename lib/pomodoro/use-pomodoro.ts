'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { pomodoroStore } from './pomodoro-store'
import { playPomodoroEndSound } from './play-sound'
import {
  getNotificationPermission,
  requestNotificationPermission,
  showPhaseEndNotification,
} from './notify'
import type { Phase, PomodoroConfig, PomodoroDayStats, PomodoroAllTimeStats } from './types'

const TICK_MS = 1000

export interface UsePomodoroReturn {
  phase: Phase
  remainingSeconds: number
  isPaused: boolean
  config: PomodoroConfig
  todayStats: PomodoroDayStats
  allTimeStats: PomodoroAllTimeStats
  start: () => void
  pause: () => void
  resume: () => void
  skip: () => void
  refreshStats: () => void
}

function getInitialConfig(): PomodoroConfig {
  return typeof window === 'undefined' ? pomodoroStore.getConfig() : pomodoroStore.getConfig()
}

function getInitialTodayStats(): PomodoroDayStats {
  return typeof window === 'undefined'
    ? { date: '', sessions: 0, focusMinutes: 0, relaxMinutes: 0, longBreakMinutes: 0 }
    : pomodoroStore.getTodayStats()
}

function getInitialAllTimeStats(): PomodoroAllTimeStats {
  return typeof window === 'undefined'
    ? { totalSessions: 0, totalFocusMinutes: 0, totalRelaxMinutes: 0, totalLongBreakMinutes: 0 }
    : pomodoroStore.getAllTimeStats()
}

export function usePomodoro(): UsePomodoroReturn {
  const [phase, setPhase] = useState<Phase>('idle')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionsThisCycle, setSessionsThisCycle] = useState(0)
  const [config, setConfig] = useState<PomodoroConfig>(getInitialConfig)
  const [todayStats, setTodayStats] = useState<PomodoroDayStats>(getInitialTodayStats)
  const [allTimeStats, setAllTimeStats] = useState<PomodoroAllTimeStats>(getInitialAllTimeStats)
  const advancePhaseCalledForRef = useRef<string | null>(null)

  const refreshStats = useCallback(() => {
    setTodayStats(pomodoroStore.getTodayStats())
    setAllTimeStats(pomodoroStore.getAllTimeStats())
  }, [])

  const advancePhase = useCallback(() => {
    const cfg = pomodoroStore.getConfig()
    setConfig(cfg)

    if (phase !== 'idle') {
      if (cfg.soundEnabled) playPomodoroEndSound()
      if (cfg.notificationEnabled) {
        const perm = getNotificationPermission()
        if (perm === 'granted') {
          showPhaseEndNotification(phase)
        } else if (perm === 'default') {
          requestNotificationPermission().then((p) => {
            if (p === 'granted') showPhaseEndNotification(phase)
          })
        }
      }
    }

    if (phase === 'focus') {
      pomodoroStore.appendTodayStats({ sessions: 1, focusMinutes: cfg.focusMinutes })
      pomodoroStore.updateAllTimeStats({
        totalSessions: 1,
        totalFocusMinutes: cfg.focusMinutes,
      })
      const nextCycle = sessionsThisCycle + 1
      setSessionsThisCycle(nextCycle)
      const useLongBreak = nextCycle >= cfg.longBreakEverySessions
      if (useLongBreak) {
        setSessionsThisCycle(0)
        setPhase('longBreak')
        setRemainingSeconds(cfg.longBreakMinutes * 60)
      } else {
        setPhase('relax')
        setRemainingSeconds(cfg.relaxMinutes * 60)
      }
      return
    }

    if (phase === 'relax') {
      pomodoroStore.appendTodayStats({ relaxMinutes: cfg.relaxMinutes })
      pomodoroStore.updateAllTimeStats({ totalRelaxMinutes: cfg.relaxMinutes })
      setPhase('focus')
      setRemainingSeconds(cfg.focusMinutes * 60)
      return
    }

    if (phase === 'longBreak') {
      pomodoroStore.appendTodayStats({ longBreakMinutes: cfg.longBreakMinutes })
      pomodoroStore.updateAllTimeStats({
        totalLongBreakMinutes: cfg.longBreakMinutes,
      })
      setPhase('focus')
      setRemainingSeconds(cfg.focusMinutes * 60)
      return
    }
  }, [phase, sessionsThisCycle])

  const start = useCallback(() => {
    const cfg = pomodoroStore.getConfig()
    setConfig(cfg)
    setPhase('focus')
    setRemainingSeconds(cfg.focusMinutes * 60)
    setIsPaused(false)
  }, [])

  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  const skip = useCallback(() => {
    const cfg = pomodoroStore.getConfig()
    if (phase === 'idle') return
    if (phase === 'focus') {
      pomodoroStore.appendTodayStats({ sessions: 1, focusMinutes: cfg.focusMinutes })
      pomodoroStore.updateAllTimeStats({
        totalSessions: 1,
        totalFocusMinutes: cfg.focusMinutes,
      })
      const nextCycle = sessionsThisCycle + 1
      setSessionsThisCycle(nextCycle)
      if (nextCycle >= cfg.longBreakEverySessions) {
        setSessionsThisCycle(0)
        setPhase('longBreak')
        setRemainingSeconds(cfg.longBreakMinutes * 60)
      } else {
        setPhase('relax')
        setRemainingSeconds(cfg.relaxMinutes * 60)
      }
      return
    }
    if (phase === 'relax') {
      pomodoroStore.appendTodayStats({ relaxMinutes: cfg.relaxMinutes })
      pomodoroStore.updateAllTimeStats({ totalRelaxMinutes: cfg.relaxMinutes })
      setPhase('focus')
      setRemainingSeconds(cfg.focusMinutes * 60)
      return
    }
    if (phase === 'longBreak') {
      pomodoroStore.appendTodayStats({ longBreakMinutes: cfg.longBreakMinutes })
      pomodoroStore.updateAllTimeStats({
        totalLongBreakMinutes: cfg.longBreakMinutes,
      })
      setPhase('focus')
      setRemainingSeconds(cfg.focusMinutes * 60)
      return
    }
  }, [phase, sessionsThisCycle])

  useEffect(() => {
    if (phase === 'idle' || isPaused) return
    const id = setInterval(() => {
      setRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [phase, isPaused])

  useEffect(() => {
    if (phase === 'idle' || remainingSeconds !== 0) {
      advancePhaseCalledForRef.current = null
      return
    }
    const key = `${phase}-0`
    if (advancePhaseCalledForRef.current === key) return
    advancePhaseCalledForRef.current = key
    advancePhase()
  }, [phase, remainingSeconds, advancePhase])

  useEffect(() => {
    refreshStats()
  }, [phase, remainingSeconds, refreshStats])

  return {
    phase,
    remainingSeconds,
    isPaused,
    config,
    todayStats,
    allTimeStats,
    start,
    pause,
    resume,
    skip,
    refreshStats,
  }
}
