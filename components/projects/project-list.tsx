'use client'

import { useEffect, useState, useCallback } from 'react'
import { getUserProjects } from '@/services/projects'
import { AnimatedCard } from '@/components/ui/animated-card'
import { useSettings } from '@/contexts/settings-context'
import { APP_DATA_REFRESH_EVENT } from '@/lib/events/data-refresh'
import type { Project } from '@/types/database'
import { FolderKanban, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRelativeTime } from '@/lib/utils/date'

interface ProjectListProps {
  userId: string
}

export function ProjectList({ userId }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugStatus, setDebugStatus] = useState('idle')
  const { settings } = useSettings()

  const loadProjects = useCallback(async () => {
    try {
      setError(null)
      setDebugStatus('loading')
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out while loading projects')), 12000)
      })
      const result = await Promise.race([getUserProjects(userId), timeoutPromise])
      if (result.success) {
        setProjects(result.data)
        setDebugStatus(`ok:${result.data.length}`)
        return
      }
      setError(result.error || 'Failed to load projects')
      setDebugStatus('error')
    } catch (error) {
      console.error('Failed to load projects:', error)
      setError(error instanceof Error ? error.message : 'Failed to load projects')
      setDebugStatus('error')
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
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-white/40">Debug: status={debugStatus}</p>
        )}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-white/40 mb-3">Debug: status={debugStatus}</p>
        )}
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
          glimmer={settings.glimmerEnabled}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white/10 flex-shrink-0 icon-bounce">
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
  )
}
