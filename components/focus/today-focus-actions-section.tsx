'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnimatedCard } from '@/components/ui/animated-card'
import type { Action } from '@/types/database'
import { FOCUS_ACTIONS_MAX } from '@/lib/today-focus-partition'
import { TodayFocusActionRows } from '@/components/focus/today-focus-action-rows'
import { cn } from '@/lib/utils/cn'

interface TodayFocusActionsSectionProps {
  focusActions: Action[]
  queuedActions: Action[]
  hasAnyToday: boolean
  onComplete: (actionId: string, projectId: string | null) => void
}

export function TodayFocusActionsSection({
  focusActions,
  queuedActions,
  hasAnyToday,
  onComplete,
}: TodayFocusActionsSectionProps) {
  const [queueOpen, setQueueOpen] = useState(false)

  return (
    <AnimatedCard index={3}>
      <h3 className="font-semibold mb-1">
        Today&apos;s Actions ({focusActions.length}/{FOCUS_ACTIONS_MAX})
      </h3>
      <p className="text-xs text-white/45 mb-3">
        Up to {FOCUS_ACTIONS_MAX} at a time. Completing one pulls the next from your queue.
      </p>
      {!hasAnyToday ? (
        <p className="text-sm text-white/60">
          No actions yet. Click &quot;Plan My Day&quot; to get started.
        </p>
      ) : (
        <>
          <TodayFocusActionRows
            actions={focusActions}
            onComplete={onComplete}
            variant="focus"
          />
          {queuedActions.length > 0 ? (
            <div className="mt-4 border-t border-white/10 pt-3">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 text-left"
                onClick={() => setQueueOpen((o) => !o)}
                aria-expanded={queueOpen}
              >
                <span className="text-xs font-medium uppercase tracking-wide text-white/55">
                  Queued for today ({queuedActions.length})
                </span>
                <ChevronDown
                  size={18}
                  className={cn(
                    'shrink-0 text-white/45 transition-transform',
                    queueOpen && 'rotate-180'
                  )}
                />
              </button>
              {queueOpen ? (
                <>
                  <p className="text-xs text-white/40 mb-2 mt-2">
                    Complete focus items above or tick these off — the list stays at five until
                    you&apos;re done for the day.
                  </p>
                  <TodayFocusActionRows
                    actions={queuedActions}
                    onComplete={onComplete}
                    variant="queued"
                  />
                </>
              ) : (
                <p className="text-xs text-white/35 mt-1">
                  Expand to see or complete — new slots open as you finish the focus list.
                </p>
              )}
            </div>
          ) : null}
        </>
      )}
    </AnimatedCard>
  )
}
