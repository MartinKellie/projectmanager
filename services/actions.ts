/**
 * Actions service layer
 */

import {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  actionsCollection,
  where,
  dateToTimestamp,
} from '@/lib/storage/firestore'
import { classifyScopeTask } from '@/lib/scope-task-grouping'
import { promoteQueuedAfterCompletion, syncTodayPlanRecordFromActions } from './daily-plan-record'
import { getTodayDateString, isToday } from '@/lib/utils/date'
import type { Action } from '@/types/database'
import type { ActionResponse } from '@/types/actions'

const DEFAULT_CARRYOVER_SUPPRESS_AFTER = 4

function normalizeScopeTaskText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

function buildScopeMatchKey(text: string): string {
  return normalizeScopeTaskText(text)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenSet(text: string): Set<string> {
  return new Set(
    buildScopeMatchKey(text)
      .split(' ')
      .map((t) => t.trim())
      .filter((t) => t.length > 2)
  )
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const token of a) {
    if (b.has(token)) intersection += 1
  }
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

function isActionCreatedToday(action: Action): boolean {
  if (!action.createdAt) return false
  return isToday(action.createdAt)
}

async function applyCarryoverPolicy(
  userId: string,
  carryoverSuppressAfter: number
): Promise<void> {
  const today = getTodayDateString()
  const actions = await getDocuments<Action>(actionsCollection, [
    where('userId', '==', userId),
    where('surfacedToday', '==', true),
    where('status', '==', 'active'),
  ])

  for (const action of actions) {
    if (action.lastCarryoverDate === today) continue
    if (isActionCreatedToday(action)) continue

    const nextCarryover = (action.carryoverCount || 0) + 1
    const updates: Partial<Action> = {
      carryoverCount: nextCarryover,
      lastCarryoverDate: today,
    }

    if (nextCarryover >= carryoverSuppressAfter) {
      updates.surfacedToday = false
      updates.suppressedAt = dateToTimestamp(new Date())
    }

    await updateDocument(actionsCollection, action.id, updates)
  }
}

export async function getAction(actionId: string): Promise<ActionResponse<Action>> {
  try {
    const action = await getDocument<Action>(actionsCollection, actionId)
    if (!action) {
      return { success: false, error: 'Action not found' }
    }
    return { success: true, data: action }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch action',
    }
  }
}

export async function getUserActions(userId: string): Promise<ActionResponse<Action[]>> {
  try {
    const actions = await getDocuments<Action>(actionsCollection, [
      where('userId', '==', userId),
      where('status', '==', 'active'),
    ])
    actions.sort((a, b) => a.orderIndex - b.orderIndex)
    return { success: true, data: actions }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch actions',
    }
  }
}

export async function getTodayActions(
  userId: string,
  options?: { carryoverSuppressAfter?: number }
): Promise<ActionResponse<Action[]>> {
  try {
    const carryoverSuppressAfter = options?.carryoverSuppressAfter
      ? Math.max(2, options.carryoverSuppressAfter)
      : DEFAULT_CARRYOVER_SUPPRESS_AFTER
    await applyCarryoverPolicy(userId, carryoverSuppressAfter)
    const actions = await getDocuments<Action>(actionsCollection, [
      where('userId', '==', userId),
      where('surfacedToday', '==', true),
      where('status', '==', 'active'),
    ])
    actions.sort((a, b) => a.orderIndex - b.orderIndex)
    return { success: true, data: actions }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch today actions',
    }
  }
}

export async function getSuppressedCarryoverActions(
  userId: string
): Promise<ActionResponse<Action[]>> {
  try {
    const actions = await getDocuments<Action>(actionsCollection, [
      where('userId', '==', userId),
      where('status', '==', 'active'),
    ])
    const suppressed = actions
      .filter((action) => !action.surfacedToday && Boolean(action.suppressedAt))
      .sort((a, b) => {
        const left = typeof a.suppressedAt === 'string' ? a.suppressedAt : ''
        const right = typeof b.suppressedAt === 'string' ? b.suppressedAt : ''
        return right.localeCompare(left)
      })
    return { success: true, data: suppressed }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch suppressed actions',
    }
  }
}

/**
 * Backlog actions for a project: not surfaced on "today", ordered per project.
 */
export async function getProjectBacklogActions(
  userId: string,
  projectId: string
): Promise<ActionResponse<Action[]>> {
  try {
    const actions = await getDocuments<Action>(actionsCollection, [
      where('userId', '==', userId),
      where('projectId', '==', projectId),
    ])
    const backlog = actions.filter((a) => a.surfacedToday === false)
    backlog.sort((a, b) => a.orderIndex - b.orderIndex)
    return { success: true, data: backlog }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project backlog',
    }
  }
}

export async function createProjectBacklogAction(
  userId: string,
  projectId: string,
  text: string,
  orderIndex: number,
  scopeGroup?: Action['scopeGroup']
): Promise<ActionResponse<string>> {
  try {
    const payload: Omit<Action, 'id' | 'createdAt'> = {
      text: text.trim(),
      projectId,
      userId,
      status: 'active',
      scopeLifecycle: 'active',
      scopeMatchKey: buildScopeMatchKey(text),
      surfacedToday: false,
      orderIndex,
      completedAt: null,
    }
    if (scopeGroup != null) payload.scopeGroup = scopeGroup

    const actionId = await createDocument<Action>(actionsCollection, payload)
    return { success: true, data: actionId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create backlog action',
    }
  }
}

/**
 * Merge generated scope tasks into existing backlog instead of replacing:
 * - Keep matched actions (preserve status/history), update order/group
 * - Create new actions for unseen generated tasks
 * - Mark unmatched existing scope tasks as detached (do not delete silently)
 */
export async function mergeProjectBacklogActions(
  userId: string,
  projectId: string,
  taskTexts: string[]
): Promise<ActionResponse<void>> {
  try {
    const existingResult = await getProjectBacklogActions(userId, projectId)
    if (!existingResult.success) {
      return { success: false, error: existingResult.error || 'Failed to load backlog' }
    }

    const existing = existingResult.data
    const availableByKey = new Map<string, Action[]>()
    for (const action of existing) {
      const key = action.scopeMatchKey || buildScopeMatchKey(action.text)
      const list = availableByKey.get(key) || []
      list.push(action)
      availableByKey.set(key, list)
    }

    const matchedIds = new Set<string>()
    const generated = taskTexts.map((t) => t.trim()).filter(Boolean)

    for (let i = 0; i < generated.length; i++) {
      const text = generated[i]
      const matchKey = buildScopeMatchKey(text)
      const matchList = availableByKey.get(matchKey) || []
      let matched = matchList.find((action) => !matchedIds.has(action.id))
      if (!matched) {
        const tokens = tokenSet(text)
        let best: Action | null = null
        let bestScore = 0
        for (const candidate of existing) {
          if (matchedIds.has(candidate.id)) continue
          const score = jaccardSimilarity(tokens, tokenSet(candidate.text))
          if (score > bestScore) {
            best = candidate
            bestScore = score
          }
        }
        if (best && bestScore >= 0.72) matched = best
      }
      const scopeGroup = classifyScopeTask(text)

      if (matched) {
        matchedIds.add(matched.id)
        await updateDocument(actionsCollection, matched.id, {
          orderIndex: i,
          scopeGroup,
          scopeLifecycle: 'active',
          scopeMatchKey: matchKey,
          detachedAt: null,
        })
        continue
      }

      const created = await createProjectBacklogAction(
        userId,
        projectId,
        text,
        i,
        scopeGroup
      )
      if (!created.success) {
        return { success: false, error: created.error || 'Failed to create task' }
      }
      matchedIds.add(created.data)
    }

    const detachedAt = dateToTimestamp(new Date())
    for (const action of existing) {
      if (matchedIds.has(action.id)) continue
      await updateDocument(actionsCollection, action.id, {
        scopeLifecycle: 'detached',
        detachedAt,
      })
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to merge backlog actions',
    }
  }
}

/** Deletes all active backlog actions for a project (not surfaced today). */
export async function deleteProjectBacklogActions(
  userId: string,
  projectId: string
): Promise<ActionResponse<void>> {
  const result = await getProjectBacklogActions(userId, projectId)
  if (!result.success) {
    return { success: false, error: result.error || 'Failed to load backlog' }
  }
  try {
    for (const action of result.data) {
      if (action.status !== 'active') continue
      await deleteDocument(actionsCollection, action.id)
    }
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete backlog actions',
    }
  }
}

/** Replace backlog with new ordered tasks (v1: full replace). */
export async function replaceProjectBacklogActions(
  userId: string,
  projectId: string,
  taskTexts: string[]
): Promise<ActionResponse<void>> {
  const del = await deleteProjectBacklogActions(userId, projectId)
  if (!del.success) return del

  const trimmed = taskTexts.map((t) => t.trim()).filter(Boolean)
  for (let i = 0; i < trimmed.length; i++) {
    const text = trimmed[i]
    const scopeGroup = classifyScopeTask(text)
    const created = await createProjectBacklogAction(
      userId,
      projectId,
      text,
      i,
      scopeGroup
    )
    if (!created.success) {
      return { success: false, error: created.error || 'Failed to create task' }
    }
  }
  return { success: true, data: undefined }
}

/** Explicit full reset: remove all non-today project tasks and regenerate backlog from scope. */
export async function fullResetProjectBacklogActions(
  userId: string,
  projectId: string,
  taskTexts: string[]
): Promise<ActionResponse<void>> {
  try {
    const actions = await getDocuments<Action>(actionsCollection, [
      where('userId', '==', userId),
      where('projectId', '==', projectId),
    ])

    for (const action of actions) {
      if (action.surfacedToday) continue
      await deleteDocument(actionsCollection, action.id)
    }

    const trimmed = taskTexts.map((t) => t.trim()).filter(Boolean)
    for (let i = 0; i < trimmed.length; i++) {
      const text = trimmed[i]
      const scopeGroup = classifyScopeTask(text)
      const created = await createProjectBacklogAction(
        userId,
        projectId,
        text,
        i,
        scopeGroup
      )
      if (!created.success) {
        return { success: false, error: created.error || 'Failed to create task' }
      }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fully reset backlog actions',
    }
  }
}

export async function createAction(
  userId: string,
  actionData: Omit<Action, 'id' | 'userId' | 'createdAt' | 'status' | 'completedAt' | 'surfacedToday' | 'orderIndex'>
): Promise<ActionResponse<string>> {
  try {
    // Get current max orderIndex for today's actions
    const todayActions = await getTodayActions(userId)
    const maxOrderIndex = todayActions.success && todayActions.data.length > 0
      ? Math.max(...todayActions.data.map((a) => a.orderIndex))
      : -1

    const actionId = await createDocument<Action>(
      actionsCollection,
      {
        ...actionData,
        userId,
        status: 'active',
        surfacedToday: true,
        orderIndex: maxOrderIndex + 1,
        completedAt: null,
        carryoverCount: 0,
        lastCarryoverDate: getTodayDateString(),
        suppressedAt: null,
      }
    )

    // Keep today's persisted focus/queue record aligned with surfaced actions.
    const syncResult = await syncTodayPlanRecordFromActions(userId)
    if (!syncResult.success) {
      console.warn('Failed to sync daily plan record after action create:', syncResult.error)
    }

    return { success: true, data: actionId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create action',
    }
  }
}

export async function completeAction(actionId: string, projectId?: string | null): Promise<ActionResponse<void>> {
  try {
    const action = await getDocument<Action>(actionsCollection, actionId)
    if (!action) {
      return { success: false, error: 'Action not found' }
    }

    const now = dateToTimestamp(new Date())
    await updateDocument(actionsCollection, actionId, {
      status: 'completed',
      completedAt: now,
      surfacedToday: false,
    })

    // Update project lastTouchedAt if project-bound
    if (projectId) {
      const { updateProject } = await import('./projects')
      const updateResult = await updateProject(projectId, {
        lastTouchedAt: now,
      })
      if (!updateResult.success) {
        console.warn('Failed to update project lastTouchedAt:', updateResult.error)
      }
    }

    const promoteResult = await promoteQueuedAfterCompletion(action.userId, actionId)
    if (!promoteResult.success) {
      console.warn('Failed to update daily plan queue after completion:', promoteResult.error)
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete action',
    }
  }
}

export async function updateAction(
  actionId: string,
  updates: Partial<Action>
): Promise<ActionResponse<void>> {
  try {
    await updateDocument(actionsCollection, actionId, updates)
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update action',
    }
  }
}

export async function deleteAction(actionId: string): Promise<ActionResponse<void>> {
  try {
    await deleteDocument(actionsCollection, actionId)
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete action',
    }
  }
}
