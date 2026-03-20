/**
 * Business service layer
 */

import {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  businessesCollection,
  where,
} from '@/lib/storage/firestore'
import type { Business } from '@/types/database'
import type { ActionResponse } from '@/types/actions'

export async function getBusiness(businessId: string): Promise<ActionResponse<Business>> {
  try {
    const business = await getDocument<Business>(businessesCollection, businessId)
    if (!business) {
      return { success: false, error: 'Business not found' }
    }
    return { success: true, data: business }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch business',
    }
  }
}

export async function getUserBusinesses(userId: string): Promise<ActionResponse<Business[]>> {
  try {
    const businesses = await getDocuments<Business>(businessesCollection, [
      where('userId', '==', userId),
      where('archived', '==', false),
    ])
    businesses.sort((a, b) => a.name.localeCompare(b.name))
    return { success: true, data: businesses }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch businesses',
    }
  }
}

export async function createBusiness(
  userId: string,
  businessData: Omit<Business, 'id' | 'userId' | 'createdAt' | 'archived'>
): Promise<ActionResponse<string>> {
  try {
    const businessId = await createDocument<Business>(
      businessesCollection,
      {
        ...businessData,
        userId,
        archived: false,
      }
    )
    return { success: true, data: businessId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create business',
    }
  }
}

export async function updateBusiness(
  businessId: string,
  updates: Partial<Business>
): Promise<ActionResponse<void>> {
  try {
    await updateDocument(businessesCollection, businessId, updates)
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update business',
    }
  }
}

export async function archiveBusiness(businessId: string): Promise<ActionResponse<void>> {
  try {
    await updateDocument(businessesCollection, businessId, {
      archived: true,
    })
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to archive business',
    }
  }
}

export async function deleteBusiness(businessId: string): Promise<ActionResponse<void>> {
  try {
    await deleteDocument(businessesCollection, businessId)
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete business',
    }
  }
}
