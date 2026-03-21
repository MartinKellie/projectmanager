'use client'

import { useEffect, useState, useCallback } from 'react'
import { getUserProjects } from '@/services/projects'
import { promptAndDeleteProject } from '@/components/projects/project-prompt-actions'
import { getUserBusinesses } from '@/services/businesses'
import { AnimatedCard } from '@/components/ui/animated-card'
import { ProjectDetailModal } from '@/components/detail/project-detail-modal'
import { EditProjectModal } from '@/components/edit-forms/edit-project-modal'
import type { Business, Project } from '@/types/database'
import { FolderKanban, Building2, Calendar, TrendingUp } from 'lucide-react'
import { handleCardOpenKeyDown } from '@/lib/utils/card-open-keyboard'
import { formatRelativeTime, formatDate } from '@/lib/utils/date'
import { APP_DATA_REFRESH_EVENT } from '@/lib/events/data-refresh'
import { triggerAppToast } from '@/lib/events/toast'
import { isSampleProject } from '@/lib/data/is-sample-data'

interface ProjectsViewProps {
  userId: string
}

export function ProjectsView({ userId }: ProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [detailProject, setDetailProject] = useState<Project | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const loadProjects = useCallback(async () => {
    try {
      const [projectsResult, businessesResult] = await Promise.all([
        getUserProjects(userId),
        getUserBusinesses(userId),
      ])
      if (projectsResult.success) setProjects(projectsResult.data)
      if (businessesResult.success) setBusinesses(businessesResult.data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  function getLinkedBusinessName(project: Project) {
    if (!project.businessId) return null
    return businesses.find((b) => b.id === project.businessId)?.name ?? null
  }

  useEffect(() => {
    if (userId) loadProjects()
  }, [userId, loadProjects])

  useEffect(() => {
    function handleRefresh() {
      if (!userId) return
      setLoading(true)
      loadProjects()
    }
    window.addEventListener(APP_DATA_REFRESH_EVENT, handleRefresh)
    return () => window.removeEventListener(APP_DATA_REFRESH_EVENT, handleRefresh)
  }, [userId, loadProjects])

  async function handleDeleteProject(project: Project) {
    const ok = await promptAndDeleteProject(project)
    if (!ok) return

    triggerAppToast({ message: 'Project deleted' })
    loadProjects()
    setDetailProject(null)
  }

  if (loading) {
    return (
      <div className="text-white/60 text-sm">Loading projects...</div>
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
          >
            <div
              className="flex items-start gap-3 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/25 -m-1 p-1"
              role="button"
              tabIndex={0}
              onClick={() => setDetailProject(project)}
              onKeyDown={(e) =>
                handleCardOpenKeyDown(e, () => setDetailProject(project))
              }
            >
              <div className="p-2 rounded-lg bg-white/10 flex-shrink-0 icon-bounce pointer-events-none">
                <FolderKanban size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-2 truncate">{project.name}</h3>
                <div
                  className="mb-2 flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="text-xs text-white/60 hover:text-white"
                    onClick={() => setEditingProject(project)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-300 hover:text-red-200"
                    onClick={() => handleDeleteProject(project)}
                  >
                    Delete
                  </button>
                </div>
                <div className="space-y-1.5 text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <Building2 size={12} />
                    <span className="truncate">{project.clientName}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    {project.fixedFee && (
                      <span className="text-white/70">£{project.fixedFee.toLocaleString()}</span>
                    )}
                    <div className="flex items-center gap-1">
                      <TrendingUp size={12} />
                      <span>Confidence: {project.confidenceScore}%</span>
                    </div>
                    {project.deadline && (
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDate(project.deadline)}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-white/50 mt-2">
                    Last touched: {formatRelativeTime(project.lastTouchedAt)}
                  </div>
                </div>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>
      <ProjectDetailModal
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
      />
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
    </>
  )
}
