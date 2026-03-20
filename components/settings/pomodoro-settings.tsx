'use client'

import { useState, useEffect } from 'react'
import { pomodoroStore } from '@/lib/pomodoro/pomodoro-store'
import type { PomodoroConfig } from '@/lib/pomodoro/types'

interface NumberFieldProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function NumberField({ label, value, min, max, onChange }: NumberFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-1">
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          if (!Number.isNaN(n)) onChange(n)
        }}
        className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
      />
    </div>
  )
}

export function PomodoroSettings() {
  const [config, setConfig] = useState<PomodoroConfig>(() =>
    typeof window === 'undefined' ? pomodoroStore.getConfig() : pomodoroStore.getConfig()
  )

  useEffect(() => {
    setConfig(pomodoroStore.getConfig())
  }, [])

  const update = (partial: Partial<PomodoroConfig>) => {
    const next = { ...config, ...partial }
    setConfig(next)
    pomodoroStore.setConfig(next)
  }

  return (
    <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-medium">Pomodoro</h3>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Focus (min)"
          value={config.focusMinutes}
          min={1}
          max={120}
          onChange={(v) => update({ focusMinutes: v })}
        />
        <NumberField
          label="Short break (min)"
          value={config.relaxMinutes}
          min={1}
          max={60}
          onChange={(v) => update({ relaxMinutes: v })}
        />
        <NumberField
          label="Long break (min)"
          value={config.longBreakMinutes}
          min={1}
          max={60}
          onChange={(v) => update({ longBreakMinutes: v })}
        />
        <NumberField
          label="Long break every (sessions)"
          value={config.longBreakEverySessions}
          min={2}
          max={10}
          onChange={(v) => update({ longBreakEverySessions: v })}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-white/80">Sound when period ends</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.soundEnabled}
            onChange={(e) => update({ soundEnabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
        </label>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white/80">Browser notification when period ends</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.notificationEnabled}
            onChange={(e) => update({ notificationEnabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
        </label>
      </div>
    </div>
  )
}
