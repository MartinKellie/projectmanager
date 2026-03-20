'use client'

import { useEffect, useState, useCallback } from 'react'
import { deleteProject, getUserProjects, updateProject } from '@/services/projects'
import { AnimatedCard } from '@/components/ui/animated-card'
import type { Project } from '@/types/database'
import { FolderKanban, Building2, Calendar, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRelativeTime, formatDate } from '@/lib/utils/date'
import { APP_DATA_REFRESH_EVENT } from '@/lib/events/data-refresh'
import { triggerAppToast } from '@/lib/events/toast'

interface ProjectsViewProps {
  userId: string
}

export function ProjectsView({ userId }: ProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const loadProjects = useCallback(async () => {
    try {
      const result = await getUserProjects(userId)
      if (result.success) setProjects(result.data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

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

  async function handleEditProject(project: Project) {
    const nextName = window.prompt('Project name', project.name)
    if (nextName === null) return

    const nextClientName = window.prompt('Client name', project.clientName || '')
    if (nextClientName === null) return

    const result = await updateProject(project.id, {
      name: nextName.trim() || project.name,
      clientName: nextClientName.trim() || project.clientName,
    })
    if (!result.success) return window.alert(result.error || 'Failed to update project')

    triggerAppToast({ message: 'Project updated' })
    loadProjects()
  }

  async function handleDeleteProject(project: Project) {
    const confirmed = window.confirm(`Delete project "${project.name}"?`)
    if (!confirmed) return

    const result = await deleteProject(project.id)
    if (!result.success) return window.alert(result.error || 'Failed to delete project')

    triggerAppToast({ message: 'Project deleted' })
    loadProjects()
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
    <div className="space-y-3">
      {projects.map((project, index) => (
        <AnimatedCard
          key={project.id}
          className="p-4 cursor-pointer"
          variant="default"
          index={index}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white/10 flex-shrink-0 icon-bounce">
              <FolderKanban size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold mb-2 truncate">{project.name}</h3>
              <div className="mb-2 flex items-center gap-2">
                <button className="text-xs text-white/60 hover:text-white" onClick={() => handleEditProject(project)}>Edit</button>
                <button className="text-xs text-red-300 hover:text-red-200" onClick={() => handleDeleteProject(project)}>Delete</button>
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
  )
}
