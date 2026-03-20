/**
 * Daily Plan service layer
 */

import {
  getDocument,
  createDocument,
  updateDocument,
  dailyPlanCollection,
  dateToTimestamp,
} from '@/lib/storage/firestore'
import { getTodayDateString } from '@/lib/utils/date'
import type { DailyPlan, PlanBias } from '@/types/database'
import type { ActionResponse } from '@/types/actions'

export async function getTodayPlan(userId: string): Promise<ActionResponse<DailyPlan | null>> {
  try {
    const todayId = getTodayDateString()
    const plan = await getDocument<DailyPlan>(dailyPlanCollection, `${userId}_${todayId}`)
    return { success: true, data: plan }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch daily plan',
    }
  }
}

export async function createOrUpdateDailyPlan(
  userId: string,
  planData: {
    planBias: PlanBias
    anchorProjectId?: string | null
    proposedActionIds?: string[]
    finalActionIds?: string[]
  }
): Promise<ActionResponse<string>> {
  try {
    const todayId = getTodayDateString()
    const docId = `${userId}_${todayId}`
    const now = dateToTimestamp(new Date())
    
    const existing = await getDocument<DailyPlan>(dailyPlanCollection, docId)
    
    if (existing) {
      await updateDocument(dailyPlanCollection, docId, {
        ...planData,
        updatedAt: now,
      })
    } else {
      await createDocument<DailyPlan>(
        dailyPlanCollection,
        {
          userId,
          planBias: planData.planBias,
          anchorProjectId: planData.anchorProjectId || null,
          proposedActionIds: planData.proposedActionIds || [],
          finalActionIds: planData.finalActionIds || [],
          updatedAt: now,
        },
        docId
      )
    }
    
    return { success: true, data: docId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save daily plan',
    }
  }
}
