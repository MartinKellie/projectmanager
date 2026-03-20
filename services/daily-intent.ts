/**
 * Daily Intent service layer
 */

import {
  getDocument,
  createDocument,
  updateDocument,
  dailyIntentCollection,
  dateToTimestamp,
} from '@/lib/storage/firestore'
import { getTodayDateString } from '@/lib/utils/date'
import type { DailyIntent, PlanBias } from '@/types/database'
import type { ActionResponse } from '@/types/actions'

export async function getTodayIntent(userId: string): Promise<ActionResponse<DailyIntent | null>> {
  try {
    const todayId = getTodayDateString()
    const intent = await getDocument<DailyIntent>(dailyIntentCollection, `${userId}_${todayId}`)
    return { success: true, data: intent }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch daily intent',
    }
  }
}

export async function createOrUpdateDailyIntent(
  userId: string,
  intentData: {
    intentText?: string
    skipped?: boolean
    planBias?: PlanBias
    protectDeepWork?: boolean
  }
): Promise<ActionResponse<string>> {
  try {
    const todayId = getTodayDateString()
    const docId = `${userId}_${todayId}`
    
    const existing = await getDocument<DailyIntent>(dailyIntentCollection, docId)
    
    if (existing) {
      await updateDocument(dailyIntentCollection, docId, {
        ...intentData,
        updatedAt: dateToTimestamp(new Date()),
      })
    } else {
      await createDocument<DailyIntent>(
        dailyIntentCollection,
        {
          userId,
          intentText: intentData.intentText || '',
          skipped: intentData.skipped || false,
          planBias: intentData.planBias,
          protectDeepWork: intentData.protectDeepWork,
        },
        docId
      )
    }
    
    return { success: true, data: docId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save daily intent',
    }
  }
}
