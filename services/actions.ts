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
  orderBy,
  dateToTimestamp,
} from '@/lib/storage/firestore'
import type { Action } from '@/types/database'
import type { ActionResponse } from '@/types/actions'

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
      orderBy('orderIndex', 'asc'),
    ])
    return { success: true, data: actions }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch actions',
    }
  }
}

export async function getTodayActions(userId: string): Promise<ActionResponse<Action[]>> {
  try {
    const actions = await getDocuments<Action>(actionsCollection, [
      where('userId', '==', userId),
      where('surfacedToday', '==', true),
      where('status', '==', 'active'),
      orderBy('orderIndex', 'asc'),
    ])
    return { success: true, data: actions }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch today actions',
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
      }
    )
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
