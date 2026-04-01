'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, Circle, Loader2, RotateCcw } from 'lucide-react'
import { AnimatedCard } from '@/components/ui/animated-card'
import {
  groupScopeTasks,
  type ScopeBacklogItem,
  type ScopeTaskGroup,
  type ScopeTaskGroupKey,
} from '@/lib/scope-task-grouping'
import { completeAction, updateAction } from '@/services/actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface ProjectScopeBacklogListProps {
  loading: boolean
  items: ScopeBacklogItem[]
  /** Shown inside the card (default matches Today’s Actions style). */
  sectionHeading?: string
  projectId?: string
  userId?: string
  onBacklogChanged?: () => void
}

const SHOW_DETACHED_STORAGE_KEY = 'project_scope_show_detached'

export function ProjectScopeBacklogList({
  loading,
  items,
  sectionHeading = 'Project tasks',
  projectId,
  userId,
  onBacklogChanged,
}: ProjectScopeBacklogListProps) {
  const [showDetached, setShowDetached] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(SHOW_DETACHED_STORAGE_KEY)
      if (stored != null) setShowDetached(stored === 'true')
    } catch (error) {
      console.error('Failed to load detached filter preference:', error)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    if (!ready || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(SHOW_DETACHED_STORAGE_KEY, String(showDetached))
    } catch (error) {
      console.error('Failed to save detached filter preference:', error)
    }
  }, [showDetached, ready])

  const detachedByGroup = useMemo(() => {
    const map = new Map<ScopeTaskGroupKey, number>()
    for (const group of groupScopeTasks(items)) {
      const count = group.items.filter((item) => item.scopeLifecycle === 'detached').length
      map.set(group.key, count)
    }
    return map
  }, [items])

  const visibleItems = showDetached
    ? items
    : items.filter((item) => item.scopeLifecycle !== 'detached')
  const groupedItems = groupScopeTasks(visibleItems)
  const [expanded, setExpanded] = useState<Set<ScopeTaskGroupKey>>(() => new Set())
  const [completingKey, setCompletingKey] = useState<ScopeTaskGroupKey | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const canComplete = Boolean(userId && projectId && onBacklogChanged)
  const detachedCount = items.filter((item) => item.scopeLifecycle === 'detached').length

  const toggleExpanded = useCallback((key: ScopeTaskGroupKey) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const handleCompleteGroup = useCallback(
    async (e: React.MouseEvent, group: ScopeTaskGroup) => {
      e.stopPropagation()
      const activeItems = group.items.filter(
        (item) => item.status !== 'completed' && item.scopeLifecycle !== 'detached'
      )
      if (!canComplete || activeItems.length === 0) return
      setCompletingKey(group.key)
      try {
        for (const item of activeItems) {
          const r = await completeAction(item.id, projectId)
          if (!r.success) {
            console.error(r.error)
            break
          }
        }
        onBacklogChanged?.()
      } finally {
        setCompletingKey(null)
      }
    },
    [canComplete, projectId, onBacklogChanged]
  )

  const handleRestoreItem = useCallback(
    async (e: React.MouseEvent, itemId: string, groupKey: ScopeTaskGroupKey) => {
      e.stopPropagation()
      if (!onBacklogChanged) return
      setRestoringId(itemId)
      try {
        const result = await updateAction(itemId, {
          scopeLifecycle: 'active',
          detachedAt: null,
        })
        if (!result.success) {
          console.error(result.error)
          return
        }
        setExpanded((prev) => {
          const next = new Set(prev)
          next.add(groupKey)
          return next
        })
        onBacklogChanged()
      } finally {
        setRestoringId(null)
      }
    },
    [onBacklogChanged]
  )

  return (
    <div>
      {loading ? (
        <p className="text-sm text-white/45">Loading tasks…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-white/45">No backlog tasks yet.</p>
      ) : (
        <AnimatedCard index={0}>
          <h3 className="mb-3 font-semibold">
            {sectionHeading} ({items.length})
          </h3>
          {detachedCount > 0 ? (
            <div className="mb-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDetached((value) => !value)}
              >
                {showDetached ? 'Hide detached' : `Show detached (${detachedCount})`}
              </Button>
            </div>
          ) : null}
          <div className="space-y-2">
            {groupedItems.map((group) => (
              <GroupTaskCard
                key={group.key}
                group={group}
                expanded={expanded.has(group.key)}
                onToggleExpand={() => toggleExpanded(group.key)}
                onCompleteGroup={(e) => void handleCompleteGroup(e, group)}
                onRestoreItem={(e, itemId) => void handleRestoreItem(e, itemId, group.key)}
                detachedCount={detachedByGroup.get(group.key) || 0}
                completing={completingKey === group.key}
                restoringId={restoringId}
                showComplete={canComplete}
              />
            ))}
          </div>
        </AnimatedCard>
      )}
    </div>
  )
}

interface GroupTaskCardProps {
  group: ScopeTaskGroup
  expanded: boolean
  onToggleExpand: () => void
  onCompleteGroup: (e: React.MouseEvent) => void
  onRestoreItem: (e: React.MouseEvent, itemId: string) => void
  detachedCount: number
  completing: boolean
  restoringId: string | null
  showComplete: boolean
}

function GroupTaskCard({
  group,
  expanded,
  onToggleExpand,
  onCompleteGroup,
  onRestoreItem,
  detachedCount,
  completing,
  restoringId,
  showComplete,
}: GroupTaskCardProps) {
  const completedCount = group.items.filter((item) => item.status === 'completed').length
  const isCompleted = completedCount === group.items.length
  const title = `${group.label} (${group.items.length})`

  return (
    <div className="overflow-hidden rounded-lg">
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg glass transition-all',
          expanded && 'glass-strong'
        )}
      >
        {showComplete ? (
          <button
            type="button"
            className="mt-0.5 shrink-0 disabled:opacity-50"
            disabled={completing || isCompleted}
            onClick={(e) => onCompleteGroup(e)}
            aria-label={
              isCompleted ? `${group.label} already complete` : `Mark ${group.label} complete`
            }
          >
            {completing ? (
              <Loader2 size={20} className="animate-spin text-white/50" />
            ) : isCompleted ? (
              <CheckCircle2 size={20} className="text-emerald-400" />
            ) : (
              <Circle size={20} className="text-white/40 hover:text-white/60" />
            )}
          </button>
        ) : null}

        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onToggleExpand}
          aria-expanded={expanded}
        >
          <span className={cn('text-sm font-medium', isCompleted ? 'text-white/70' : 'text-white/90')}>
            {title}
          </span>
          <span className="block text-xs text-white/45">
            {completedCount}/{group.items.length} complete
          </span>
          {detachedCount > 0 ? (
            <span className="block text-xs text-amber-200/85">
              {detachedCount} detached
            </span>
          ) : null}
        </button>

        <button
          type="button"
          className="mt-0.5 shrink-0 text-white/45 hover:text-white/70"
          onClick={onToggleExpand}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? (
            <ChevronDown size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </button>
      </div>

      {expanded && group.items.length > 0 ? (
        <div className="mt-2 space-y-2 border-t border-white/10 pt-2 pl-2 sm:pl-10">
          {group.items.map((t) => (
            <div
              key={t.id}
              className={cn(
                'border-l pl-3 text-sm leading-snug',
                t.status === 'completed'
                  ? 'border-emerald-400/30 text-white/45 line-through'
                  : 'border-white/15 text-white/80'
              )}
            >
              {t.text}
              {t.scopeLifecycle === 'detached' ? (
                <span className="ml-2 inline-flex items-center gap-1">
                  <span className="rounded border border-amber-300/25 bg-amber-300/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-100/85">
                    Detached
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center rounded border border-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/70 hover:bg-white/10 disabled:opacity-50"
                    onClick={(e) => onRestoreItem(e, t.id)}
                    disabled={restoringId === t.id}
                    title="Restore detached task"
                  >
                    <RotateCcw size={10} className="mr-1" />
                    Restore
                  </button>
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
