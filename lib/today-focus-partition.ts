import type { Action } from '@/types/database'

/** Max actions shown in the primary “today” focus ring; the rest stay queued. */
export const FOCUS_ACTIONS_MAX = 5

export function partitionTodayFocusActions(actions: Action[]): {
  focus: Action[]
  queued: Action[]
} {
  const sorted = [...actions].sort((a, b) => a.orderIndex - b.orderIndex)
  return {
    focus: sorted.slice(0, FOCUS_ACTIONS_MAX),
    queued: sorted.slice(FOCUS_ACTIONS_MAX),
  }
}
