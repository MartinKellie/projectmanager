/**
 * Contact service layer
 */

import {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  contactsCollection,
  where,
  orderBy,
  dateToTimestamp,
} from '@/lib/storage/firestore'
import type { Contact } from '@/types/database'
import type { ActionResponse } from '@/types/actions'

export async function getContact(contactId: string): Promise<ActionResponse<Contact>> {
  try {
    const contact = await getDocument<Contact>(contactsCollection, contactId)
    if (!contact) {
      return { success: false, error: 'Contact not found' }
    }
    return { success: true, data: contact }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contact',
    }
  }
}

export async function getBusinessContacts(businessId: string): Promise<ActionResponse<Contact[]>> {
  try {
    const contacts = await getDocuments<Contact>(contactsCollection, [
      where('businessId', '==', businessId),
      where('archived', '==', false),
      orderBy('lastName', 'asc'),
    ])
    return { success: true, data: contacts }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contacts',
    }
  }
}

export async function getUserContacts(userId: string): Promise<ActionResponse<Contact[]>> {
  try {
    const contacts = await getDocuments<Contact>(contactsCollection, [
      where('userId', '==', userId),
      where('archived', '==', false),
      orderBy('lastName', 'asc'),
    ])
    return { success: true, data: contacts }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contacts',
    }
  }
}

export async function createContact(
  userId: string,
  contactData: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'archived'>
): Promise<ActionResponse<string>> {
  try {
    const contactId = await createDocument<Contact>(
      contactsCollection,
      {
        ...contactData,
        userId,
        archived: false,
      }
    )
    return { success: true, data: contactId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create contact',
    }
  }
}

export async function updateContact(
  contactId: string,
  updates: Partial<Contact>
): Promise<ActionResponse<void>> {
  try {
    await updateDocument(contactsCollection, contactId, updates)
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contact',
    }
  }
}

export async function archiveContact(contactId: string): Promise<ActionResponse<void>> {
  try {
    await updateDocument(contactsCollection, contactId, {
      archived: true,
    })
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to archive contact',
    }
  }
}

export async function deleteContact(contactId: string): Promise<ActionResponse<void>> {
  try {
    await deleteDocument(contactsCollection, contactId)
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete contact',
    }
  }
}
