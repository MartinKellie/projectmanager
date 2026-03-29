'use client'

import { useCallback, useState } from 'react'
import { ChevronDown, ChevronRight, Circle, Loader2 } from 'lucide-react'
import { AnimatedCard } from '@/components/ui/animated-card'
import {
  groupScopeTasks,
  type ScopeBacklogItem,
  type ScopeTaskGroup,
  type ScopeTaskGroupKey,
} from '@/lib/scope-task-grouping'
import { completeAction } from '@/services/actions'
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

export function ProjectScopeBacklogList({
  loading,
  items,
  sectionHeading = 'Project tasks',
  projectId,
  userId,
  onBacklogChanged,
}: ProjectScopeBacklogListProps) {
  const groupedItems = groupScopeTasks(items)
  const [expanded, setExpanded] = useState<Set<ScopeTaskGroupKey>>(() => new Set())
  const [completingKey, setCompletingKey] = useState<ScopeTaskGroupKey | null>(null)

  const canComplete = Boolean(userId && projectId && onBacklogChanged)

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
      if (!canComplete || group.items.length === 0) return
      setCompletingKey(group.key)
      try {
        for (const item of group.items) {
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
          <div className="space-y-2">
            {groupedItems.map((group) => (
              <GroupTaskCard
                key={group.key}
                group={group}
                expanded={expanded.has(group.key)}
                onToggleExpand={() => toggleExpanded(group.key)}
                onCompleteGroup={(e) => void handleCompleteGroup(e, group)}
                completing={completingKey === group.key}
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
  completing: boolean
  showComplete: boolean
}

function GroupTaskCard({
  group,
  expanded,
  onToggleExpand,
  onCompleteGroup,
  completing,
  showComplete,
}: GroupTaskCardProps) {
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
            disabled={completing}
            onClick={(e) => onCompleteGroup(e)}
            aria-label={`Mark ${group.label} complete`}
          >
            {completing ? (
              <Loader2 size={20} className="animate-spin text-white/50" />
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
          <span className="text-sm font-medium text-white/90">{title}</span>
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
              className="border-l border-white/15 pl-3 text-sm leading-snug text-white/80"
            >
              {t.text}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
