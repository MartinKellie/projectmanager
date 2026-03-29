'use client'

import { useCallback, useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { GlassPanel } from '@/components/layout/glass-panel'
import { DummyDataInitializer } from '@/components/onboarding/dummy-data-initializer'
import { ProjectList } from '@/components/projects/project-list'
import { TodayFocus } from '@/components/focus/today-focus'
import { useAuthContext } from '@/contexts/auth-context'
import { useSettings } from '@/contexts/settings-context'
import { PomodoroPanel } from '@/components/pomodoro/pomodoro-panel'
import { MusicPanel } from '@/components/music-player/music-panel'
import { AbacusMiniBrowser } from '@/components/embedded-chat/abacus-mini-browser'
import { APP_TOAST_EVENT, type AppToastDetail, triggerAppToast } from '@/lib/events/toast'
import { triggerAppDataRefresh } from '@/lib/events/data-refresh'
import { ProjectFocusOverlay } from '@/components/project/project-focus-overlay'
import { ProjectInlineBacklog } from '@/components/project/project-inline-backlog'
import { EditProjectModal } from '@/components/edit-forms/edit-project-modal'
import { promptAndDeleteProject } from '@/components/projects/project-prompt-actions'
import { getProject } from '@/services/projects'
import type { Project } from '@/types/database'

export default function HomePage() {
  const { user, loading, error } = useAuthContext()
  const { settings } = useSettings()
  const [toastMessage, setToastMessage] = useState('')
  const [focusProject, setFocusProject] = useState<Project | null>(null)
  const [focusMode, setFocusMode] = useState<'none' | 'modal' | 'inline'>('none')
  const [focusLinkedBusiness, setFocusLinkedBusiness] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const handleFocusProjectUpdated = useCallback(async () => {
    triggerAppDataRefresh()
    if (focusProject) {
      const r = await getProject(focusProject.id)
      if (r.success) setFocusProject(r.data)
    }
  }, [focusProject])

  useEffect(() => {
    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<AppToastDetail>
      if (!customEvent.detail?.message) return
      if (!settings.toastsEnabled) return
      setToastMessage(customEvent.detail.message)
      setTimeout(() => setToastMessage(''), 2400)
    }

    window.addEventListener(APP_TOAST_EVENT, handleToast)
    return () => window.removeEventListener(APP_TOAST_EVENT, handleToast)
  }, [settings.toastsEnabled])

  return (
    <>
      <DummyDataInitializer />
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-white/20 bg-black/70 px-4 py-2 text-sm text-white shadow-depth">
          {toastMessage}
        </div>
      )}
      <AppLayout
        leftColumn={
          <div className="p-4 h-full flex flex-col">
            <div className="space-y-4">
              <PomodoroPanel />
              <MusicPanel />
            </div>
            <div className="mt-auto pt-4 text-[11px] text-white/40">
              v{process.env.NEXT_PUBLIC_APP_VERSION || 'dev'}
            </div>
          </div>
        }
        middleColumn={
          <div className="flex h-full min-h-0 flex-col">
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              {focusMode === 'inline' && focusProject ? (
                <>
                  <TodayFocus
                    collapsed
                    onRestoreCollapsed={() => {
                      setFocusMode('none')
                      setFocusProject(null)
                    }}
                    collapsedSubtitle={`Viewing ${focusProject.name} — backlog below`}
                  />
                  <ProjectInlineBacklog
                    key={focusProject.id}
                    userId={user?.uid ?? ''}
                    projectId={focusProject.id}
                    projectName={focusProject.name}
                  />
                </>
              ) : (
                <>
                  <div className="relative min-h-0 flex-1 overflow-y-auto">
                    <TodayFocus />
                  </div>
                  {user && focusMode === 'modal' && focusProject ? (
                    <ProjectFocusOverlay
                      userId={user.uid}
                      project={focusProject}
                      linkedBusinessName={focusLinkedBusiness}
                      onClose={() => {
                        setFocusMode('none')
                        setFocusProject(null)
                      }}
                      onOpenInline={() => setFocusMode('inline')}
                      onEdit={() => setEditingProject(focusProject)}
                      onDelete={async () => {
                        const ok = await promptAndDeleteProject(focusProject)
                        if (ok) {
                          triggerAppToast({ message: 'Project deleted' })
                          setFocusMode('none')
                          setFocusProject(null)
                          triggerAppDataRefresh()
                        }
                      }}
                      onProjectUpdated={handleFocusProjectUpdated}
                    />
                  ) : null}
                </>
              )}
            </div>
            <AbacusMiniBrowser />
          </div>
        }
        rightColumn={
          <div className="p-4">
            <GlassPanel>
              <h2 className="text-lg font-semibold mb-4">Project Radar</h2>
              {user ? (
                <ProjectList
                  userId={user.uid}
                  onProjectOpen={(project, linkedName) => {
                    setFocusProject(project)
                    setFocusLinkedBusiness(linkedName)
                    setFocusMode('modal')
                  }}
                />
              ) : loading ? (
                <p className="text-sm text-white/60">Loading...</p>
              ) : error ? (
                <div className="space-y-1">
                  <p className="text-sm text-red-300">Sign-in failed</p>
                  <p className="text-xs text-white/50">{error}</p>
                </div>
              ) : (
                <p className="text-sm text-white/60">Signing you in…</p>
              )}
            </GlassPanel>
          </div>
        }
      />
      {user ? (
        <EditProjectModal
          userId={user.uid}
          project={editingProject}
          isOpen={editingProject !== null}
          onClose={() => setEditingProject(null)}
          onSaved={() => {
            triggerAppToast({ message: 'Project updated' })
            setEditingProject(null)
            triggerAppDataRefresh()
            if (focusProject) {
              void getProject(focusProject.id).then((r) => {
                if (r.success) setFocusProject(r.data)
              })
            }
          }}
        />
      ) : null}
    </>
  )
}
