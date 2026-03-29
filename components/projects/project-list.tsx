'use client'

import { useEffect, useState, useCallback } from 'react'
import { getUserProjects } from '@/services/projects'
import { promptAndDeleteProject } from '@/components/projects/project-prompt-actions'
import { getUserBusinesses } from '@/services/businesses'
import { AnimatedCard } from '@/components/ui/animated-card'
import { ProjectDetailModal } from '@/components/detail/project-detail-modal'
import { EditProjectModal } from '@/components/edit-forms/edit-project-modal'
import { useSettings } from '@/contexts/settings-context'
import { APP_DATA_REFRESH_EVENT } from '@/lib/events/data-refresh'
import type { Business, Project } from '@/types/database'
import { FolderKanban, Building2 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/date'
import { handleCardOpenKeyDown } from '@/lib/utils/card-open-keyboard'
import { triggerAppToast } from '@/lib/events/toast'
import { isSampleProject } from '@/lib/data/is-sample-data'

interface ProjectListProps {
  userId: string
  /** When set, radar opens project in parent (dashboard overlay) instead of local detail modal. */
  onProjectOpen?: (
    project: Project,
    linkedBusinessName: string | null
  ) => void
}

export function ProjectList({ userId, onProjectOpen }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [detailProject, setDetailProject] = useState<Project | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { settings } = useSettings()

  const loadProjects = useCallback(async () => {
    try {
      setError(null)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out while loading projects')), 12000)
      })
      const [projectsSettled, businessesSettled] = await Promise.allSettled([
        Promise.race([getUserProjects(userId), timeoutPromise]),
        getUserBusinesses(userId),
      ])

      if (businessesSettled.status === 'fulfilled' && businessesSettled.value.success) {
        setBusinesses(businessesSettled.value.data)
      }

      if (projectsSettled.status === 'rejected') {
        const err = projectsSettled.reason
        setError(err instanceof Error ? err.message : 'Failed to load projects')
        return
      }

      const result = projectsSettled.value
      if (result.success) {
        setProjects(result.data)
        return
      }
      setError(result.error || 'Failed to load projects')
    } catch (error) {
      console.error('Failed to load projects:', error)
      setError(error instanceof Error ? error.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [userId])

  function getLinkedBusinessName(project: Project) {
    if (!project.businessId) return null
    return businesses.find((b) => b.id === project.businessId)?.name ?? null
  }

  async function handleDeleteProject(project: Project) {
    const ok = await promptAndDeleteProject(project)
    if (!ok) return

    triggerAppToast({ message: 'Project deleted' })
    loadProjects()
    setDetailProject(null)
  }

  function openProjectCard(project: Project) {
    if (onProjectOpen) {
      onProjectOpen(project, getLinkedBusinessName(project))
      return
    }
    setDetailProject(project)
  }

  useEffect(() => {
    if (userId) loadProjects()
  }, [userId, loadProjects])

  useEffect(() => {
    setDetailProject((prev) => {
      if (!prev) return null
      const next = projects.find((p) => p.id === prev.id)
      return next ?? prev
    })
  }, [projects])

  useEffect(() => {
    function handleRefresh() {
      if (!userId) return
      setLoading(true)
      loadProjects()
    }
    window.addEventListener(APP_DATA_REFRESH_EVENT, handleRefresh)
    return () => window.removeEventListener(APP_DATA_REFRESH_EVENT, handleRefresh)
  }, [userId, loadProjects])

  if (loading) {
    return (
      <div className="text-white/60 text-sm">Loading projects...</div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-300">Could not load projects.</p>
        <p className="text-xs text-white/50">{error}</p>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <FolderKanban size={48} className="mx-auto mb-4 text-white/40" />
        <p className="text-white/60">No projects yet</p>
        <p className="text-xs text-white/40 mt-2">Use &quot;Add New&quot; to create your first project</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {projects.map((project, index) => (
          <AnimatedCard
            key={project.id}
            className="p-4"
            variant="default"
            tone={isSampleProject(project) ? 'sample' : 'default'}
            index={index}
            glimmer={settings.glimmerEnabled}
          >
            <div
              className="flex items-start gap-3 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/25 -m-1 p-1"
              role="button"
              tabIndex={0}
              onClick={() => openProjectCard(project)}
              onKeyDown={(e) =>
                handleCardOpenKeyDown(e, () => openProjectCard(project))
              }
            >
              <div className="p-2 rounded-lg bg-white/10 flex-shrink-0 icon-bounce pointer-events-none">
                <FolderKanban size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1 truncate">{project.name}</h3>
                <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                  <Building2 size={12} />
                  <span className="truncate">{project.clientName}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/50">
                  {project.fixedFee && (
                    <span>£{project.fixedFee.toLocaleString()}</span>
                  )}
                  <span>Confidence: {project.confidenceScore}%</span>
                  <span>{formatRelativeTime(project.lastTouchedAt)}</span>
                </div>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>
      {!onProjectOpen ? (
        <ProjectDetailModal
          userId={userId}
          project={detailProject}
          linkedBusinessName={
            detailProject ? getLinkedBusinessName(detailProject) : null
          }
          isOpen={detailProject !== null}
          onClose={() => setDetailProject(null)}
          onEdit={() => {
            if (!detailProject) return
            setEditingProject(detailProject)
            setDetailProject(null)
          }}
          onDelete={() => {
            if (!detailProject) return
            void handleDeleteProject(detailProject)
          }}
          onProjectUpdated={() => void loadProjects()}
        />
      ) : null}
      {!onProjectOpen ? (
        <EditProjectModal
          userId={userId}
          project={editingProject}
          isOpen={editingProject !== null}
          onClose={() => setEditingProject(null)}
          onSaved={() => {
            triggerAppToast({ message: 'Project updated' })
            loadProjects()
          }}
        />
      ) : null}
    </>
  )
}
