'use client'

import { useCallback, useEffect, useState } from 'react'
import { getProjectBacklogActions } from '@/services/actions'
import { ProjectScopeBacklogList } from '@/components/detail/project-scope-backlog-list'
import { GlassPanel } from '@/components/layout/glass-panel'
import { APP_DATA_REFRESH_EVENT } from '@/lib/events/data-refresh'
import type { ScopeBacklogItem } from '@/lib/scope-task-grouping'

interface ProjectInlineBacklogProps {
  userId: string
  projectId: string
  projectName: string
}

export function ProjectInlineBacklog({
  userId,
  projectId,
  projectName,
}: ProjectInlineBacklogProps) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ScopeBacklogItem[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getProjectBacklogActions(userId, projectId)
    setLoading(false)
    if (result.success) {
      setItems(
        result.data.map((a) => ({
          id: a.id,
          text: a.text,
          status: a.status,
          scopeLifecycle: a.scopeLifecycle,
          orderIndex: a.orderIndex,
          scopeGroup: a.scopeGroup,
        }))
      )
    }
  }, [userId, projectId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    function handleRefresh() {
      void load()
    }
    window.addEventListener(APP_DATA_REFRESH_EVENT, handleRefresh)
    return () => window.removeEventListener(APP_DATA_REFRESH_EVENT, handleRefresh)
  }, [load])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <GlassPanel className="p-4">
        <ProjectScopeBacklogList
          loading={loading}
          items={items}
          sectionHeading={`${projectName} — tasks`}
          userId={userId}
          projectId={projectId}
          onBacklogChanged={() => void load()}
        />
      </GlassPanel>
    </div>
  )
}
