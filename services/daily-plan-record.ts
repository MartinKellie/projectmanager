import {
  actionsCollection,
  createDocument,
  dailyPlanRecordCollection,
  dateToTimestamp,
  getDocument,
  getDocuments,
  updateDocument,
  where,
} from '@/lib/storage/firestore'
import { FOCUS_ACTIONS_MAX } from '@/lib/today-focus-partition'
import { getTodayDateString } from '@/lib/utils/date'
import type { Action, DailyPlanRecord } from '@/types/database'
import type { ActionResponse } from '@/types/actions'

function getTodayPlanRecordId(userId: string): string {
  return `${userId}_${getTodayDateString()}`
}

function normalizeTimestamp(value: Date | string | undefined): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.toISOString()
}

async function getOrSyncTodayPlanRecord(
  userId: string
): Promise<ActionResponse<DailyPlanRecord>> {
  const docId = getTodayPlanRecordId(userId)
  const existing = await getDocument<DailyPlanRecord>(dailyPlanRecordCollection, docId)
  if (existing) return { success: true, data: existing }
  return syncTodayPlanRecordFromActions(userId)
}

function splitActionIds(actions: Action[]): {
  focusActionIds: string[]
  queuedActionIds: string[]
} {
  const sorted = [...actions].sort((a, b) => a.orderIndex - b.orderIndex)
  return {
    focusActionIds: sorted.slice(0, FOCUS_ACTIONS_MAX).map((action) => action.id),
    queuedActionIds: sorted.slice(FOCUS_ACTIONS_MAX).map((action) => action.id),
  }
}

export async function getTodayPlanRecord(
  userId: string
): Promise<ActionResponse<DailyPlanRecord | null>> {
  try {
    const record = await getDocument<DailyPlanRecord>(
      dailyPlanRecordCollection,
      getTodayPlanRecordId(userId)
    )
    return { success: true, data: record }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch daily plan record',
    }
  }
}

export async function syncTodayPlanRecordFromActions(
  userId: string
): Promise<ActionResponse<DailyPlanRecord>> {
  try {
    const actions = await getDocuments<Action>(actionsCollection, [
      where('userId', '==', userId),
      where('surfacedToday', '==', true),
      where('status', '==', 'active'),
    ])

    const docId = getTodayPlanRecordId(userId)
    const now = dateToTimestamp(new Date())
    const existing = await getDocument<DailyPlanRecord>(dailyPlanRecordCollection, docId)
    const { focusActionIds, queuedActionIds } = splitActionIds(actions)

    if (existing) {
      const updates: Partial<DailyPlanRecord> = {
        focusActionIds,
        queuedActionIds,
        updatedAt: now,
      }
      await updateDocument(dailyPlanRecordCollection, docId, updates)
      return {
        success: true,
        data: {
          ...existing,
          ...updates,
        },
      }
    }

    const record: Omit<DailyPlanRecord, 'id'> = {
      userId,
      intent: null,
      plannerContext: null,
      focusActionIds,
      queuedActionIds,
      addedTodayActionIds: [],
      createdAt: now,
      updatedAt: now,
    }

    await createDocument<DailyPlanRecord>(dailyPlanRecordCollection, record, docId)
    return {
      success: true,
      data: {
        id: docId,
        ...record,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync daily plan record',
    }
  }
}

export async function promoteQueuedAfterCompletion(
  userId: string,
  completedActionId: string
): Promise<ActionResponse<void>> {
  try {
    const docId = getTodayPlanRecordId(userId)
    const existing = await getDocument<DailyPlanRecord>(dailyPlanRecordCollection, docId)
    if (!existing) {
      const syncResult = await syncTodayPlanRecordFromActions(userId)
      if (!syncResult.success) return { success: false, error: syncResult.error }
      return { success: true, data: undefined }
    }

    const nextFocus = existing.focusActionIds.filter((id) => id !== completedActionId)
    const nextQueue = existing.queuedActionIds.filter((id) => id !== completedActionId)

    while (nextFocus.length < FOCUS_ACTIONS_MAX && nextQueue.length > 0) {
      const promoted = nextQueue.shift()
      if (promoted) nextFocus.push(promoted)
    }

    await updateDocument(dailyPlanRecordCollection, docId, {
      focusActionIds: nextFocus,
      queuedActionIds: nextQueue,
      addedTodayActionIds: (existing.addedTodayActionIds || []).filter(
        (id) => id !== completedActionId
      ),
      updatedAt: dateToTimestamp(new Date()),
    })

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to promote queued action',
    }
  }
}

export async function moveActionWithinTodayPlan(
  userId: string,
  actionId: string,
  list: 'focus' | 'queue',
  direction: 'up' | 'down',
  expectedUpdatedAt?: Date | string
): Promise<ActionResponse<void>> {
  try {
    const recordResult = await getOrSyncTodayPlanRecord(userId)
    if (!recordResult.success) return { success: false, error: recordResult.error }
    const record = recordResult.data
    if (
      expectedUpdatedAt &&
      normalizeTimestamp(record.updatedAt) !== normalizeTimestamp(expectedUpdatedAt)
    ) {
      return { success: false, error: 'stale_write_conflict' }
    }
    const nextFocus = [...record.focusActionIds]
    const nextQueue = [...record.queuedActionIds]
    const target = list === 'focus' ? nextFocus : nextQueue
    const index = target.findIndex((id) => id === actionId)
    if (index < 0) return { success: true, data: undefined }

    const swapWith = direction === 'up' ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= target.length) return { success: true, data: undefined }

    const current = target[index]
    target[index] = target[swapWith]
    target[swapWith] = current

    await updateDocument(dailyPlanRecordCollection, getTodayPlanRecordId(userId), {
      focusActionIds: nextFocus,
      queuedActionIds: nextQueue,
      updatedAt: dateToTimestamp(new Date()),
    })

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move action',
    }
  }
}

export async function reorderActionWithinTodayPlan(
  userId: string,
  list: 'focus' | 'queue',
  sourceActionId: string,
  targetActionId: string,
  expectedUpdatedAt?: Date | string
): Promise<ActionResponse<void>> {
  try {
    const recordResult = await getOrSyncTodayPlanRecord(userId)
    if (!recordResult.success) return { success: false, error: recordResult.error }
    const record = recordResult.data
    if (
      expectedUpdatedAt &&
      normalizeTimestamp(record.updatedAt) !== normalizeTimestamp(expectedUpdatedAt)
    ) {
      return { success: false, error: 'stale_write_conflict' }
    }

    const nextFocus = [...record.focusActionIds]
    const nextQueue = [...record.queuedActionIds]
    const targetList = list === 'focus' ? nextFocus : nextQueue

    const fromIndex = targetList.indexOf(sourceActionId)
    const toIndex = targetList.indexOf(targetActionId)
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return { success: true, data: undefined }
    }

    const [moved] = targetList.splice(fromIndex, 1)
    targetList.splice(toIndex, 0, moved)

    await updateDocument(dailyPlanRecordCollection, getTodayPlanRecordId(userId), {
      focusActionIds: nextFocus,
      queuedActionIds: nextQueue,
      updatedAt: dateToTimestamp(new Date()),
    })

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder action',
    }
  }
}

export async function moveActionAcrossTodayPlanLists(
  userId: string,
  actionId: string,
  from: 'focus' | 'queue',
  expectedUpdatedAt?: Date | string
): Promise<ActionResponse<void>> {
  try {
    const recordResult = await getOrSyncTodayPlanRecord(userId)
    if (!recordResult.success) return { success: false, error: recordResult.error }
    const record = recordResult.data
    if (
      expectedUpdatedAt &&
      normalizeTimestamp(record.updatedAt) !== normalizeTimestamp(expectedUpdatedAt)
    ) {
      return { success: false, error: 'stale_write_conflict' }
    }
    const nextFocus = [...record.focusActionIds]
    const nextQueue = [...record.queuedActionIds]

    if (from === 'focus') {
      const index = nextFocus.findIndex((id) => id === actionId)
      if (index < 0) return { success: true, data: undefined }
      nextFocus.splice(index, 1)
      nextQueue.unshift(actionId)
      if (nextQueue.length > 0 && nextFocus.length < FOCUS_ACTIONS_MAX) {
        const promoted = nextQueue.shift()
        if (promoted) nextFocus.push(promoted)
      }
    } else {
      const index = nextQueue.findIndex((id) => id === actionId)
      if (index < 0) return { success: true, data: undefined }
      nextQueue.splice(index, 1)
      nextFocus.push(actionId)
      while (nextFocus.length > FOCUS_ACTIONS_MAX) {
        const overflow = nextFocus.pop()
        if (overflow) nextQueue.unshift(overflow)
      }
    }

    await updateDocument(dailyPlanRecordCollection, getTodayPlanRecordId(userId), {
      focusActionIds: nextFocus,
      queuedActionIds: nextQueue,
      updatedAt: dateToTimestamp(new Date()),
    })

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move action between lists',
    }
  }
}

export async function setTodayPlanRecordContext(
  userId: string,
  context: {
    intent?: string | null
    plannerContext?: string | null
    addedTodayActionIds?: string[]
  },
  expectedUpdatedAt?: Date | string
): Promise<ActionResponse<void>> {
  try {
    const recordResult = await getOrSyncTodayPlanRecord(userId)
    if (!recordResult.success) return { success: false, error: recordResult.error }

    if (
      expectedUpdatedAt &&
      normalizeTimestamp(recordResult.data.updatedAt) !== normalizeTimestamp(expectedUpdatedAt)
    ) {
      return { success: false, error: 'stale_write_conflict' }
    }

    await updateDocument(dailyPlanRecordCollection, getTodayPlanRecordId(userId), {
      intent: context.intent ?? null,
      plannerContext: context.plannerContext ?? null,
      ...(context.addedTodayActionIds
        ? { addedTodayActionIds: context.addedTodayActionIds }
        : {}),
      updatedAt: dateToTimestamp(new Date()),
    })

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update plan record context',
    }
  }
}
