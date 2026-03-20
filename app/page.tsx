'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { GlassPanel } from '@/components/layout/glass-panel'
import { DummyDataInitializer } from '@/components/onboarding/dummy-data-initializer'
import { ProjectList } from '@/components/projects/project-list'
import { TodayFocus } from '@/components/focus/today-focus'
import { useAuthContext } from '@/contexts/auth-context'
import { PomodoroPanel } from '@/components/pomodoro/pomodoro-panel'
import { MusicPanel } from '@/components/music-player/music-panel'
import { AbacusMiniBrowser } from '@/components/embedded-chat/abacus-mini-browser'

export default function HomePage() {
  const { user, loading } = useAuthContext()

  return (
    <>
      <DummyDataInitializer />
      <AppLayout
        leftColumn={
          <div className="p-4 space-y-4">
            <PomodoroPanel />
            
            <MusicPanel />
          </div>
        }
        middleColumn={
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <TodayFocus />
            </div>
            <AbacusMiniBrowser />
          </div>
        }
        rightColumn={
          <div className="p-4">
            <GlassPanel>
              <h2 className="text-lg font-semibold mb-4">Project Radar</h2>
              {user ? (
                <ProjectList userId={user.uid} />
              ) : loading ? (
                <p className="text-sm text-white/60">Loading...</p>
              ) : (
                <p className="text-sm text-white/60">Signing you in…</p>
              )}
            </GlassPanel>
          </div>
        }
      />
    </>
  )
}
