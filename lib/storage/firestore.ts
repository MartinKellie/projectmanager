/**
 * Firestore data access wrapper.
 * Keeps the existing service-layer API stable while using Firebase Firestore.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query as fsQuery,
  setDoc,
  updateDoc,
  where as fsWhere,
  orderBy as fsOrderBy,
  limit as fsLimit,
  type QueryConstraint as FirestoreQueryConstraint,
} from 'firebase/firestore'
import { getFirestoreDb } from '@/lib/firebase/config'
import type { DocumentData } from '@/types/database'

export type QueryConstraint = {
  field: string
  operator: '==' | '!=' | '<' | '<=' | '>' | '>='
  value: unknown
} | {
  field: string
  direction: 'asc' | 'desc'
} | {
  limit: number
}

/**
 * Convert date string to Date object
 */
export function timestampToDate(timestamp: Date | string): Date {
  if (timestamp instanceof Date) return timestamp
  return new Date(timestamp)
}

/**
 * Convert Date to ISO string (for storage)
 */
export function dateToTimestamp(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date)
  return dateObj.toISOString()
}

/**
 * Generic CRUD operations
 */
export async function getDocument<T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const db = getFirestoreDb()
  if (!db) throw new Error('Firestore is not configured')

  const snap = await getDoc(doc(db, collectionName, docId))
  if (!snap.exists()) return null

  const data = snap.data() as Omit<T, 'id'>
  return { ...data, id: snap.id } as T
}

export async function getDocuments<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const db = getFirestoreDb()
  if (!db) throw new Error('Firestore is not configured')

  const colRef = collection(db, collectionName)
  const fsConstraints: FirestoreQueryConstraint[] = []

  for (const constraint of constraints) {
    if ('operator' in constraint) {
      fsConstraints.push(fsWhere(constraint.field, constraint.operator, constraint.value))
      continue
    }
    if ('direction' in constraint) {
      fsConstraints.push(fsOrderBy(constraint.field, constraint.direction))
      continue
    }
    if ('limit' in constraint) {
      fsConstraints.push(fsLimit(constraint.limit))
    }
  }

  const q = fsConstraints.length > 0 ? fsQuery(colRef, ...fsConstraints) : fsQuery(colRef)
  const snaps = await getDocs(q)

  return snaps.docs.map((d) => {
    const data = d.data() as Omit<T, 'id'>
    return { ...data, id: d.id } as T
  })
}

export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt'>,
  docId?: string
): Promise<string> {
  const db = getFirestoreDb()
  if (!db) throw new Error('Firestore is not configured')

  const colRef = collection(db, collectionName)
  const docRef = docId ? doc(colRef, docId) : doc(colRef)
  const nowIso = new Date().toISOString()

  await setDoc(docRef, {
    id: docRef.id,
    ...data,
    createdAt: nowIso,
  })

  return docRef.id
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData> | Record<string, unknown>
): Promise<void> {
  const db = getFirestoreDb()
  if (!db) throw new Error('Firestore is not configured')

  await updateDoc(doc(db, collectionName, docId), data)
}

export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const db = getFirestoreDb()
  if (!db) throw new Error('Firestore is not configured')

  await deleteDoc(doc(db, collectionName, docId))
}

/**
 * Query helpers (mimics Firestore query API)
 */
export function where(field: string, operator: '==' | '!=' | '<' | '<=' | '>' | '>=', value: unknown): QueryConstraint {
  return { field, operator, value }
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { field, direction }
}

export function limit(count: number): QueryConstraint {
  return { limit: count }
}

/**
 * Collection names
 */
export const businessesCollection = 'businesses'
export const contactsCollection = 'contacts'
export const projectsCollection = 'projects'
export const actionsCollection = 'actions'
export const timeLogsCollection = 'timeLogs'
export const dailyIntentCollection = 'dailyIntent'
export const dailyPlanCollection = 'dailyPlan'
export const dailyPlanRecordCollection = 'dailyPlanRecord'
export const aiEventsCollection = 'aiEvents'
export const projectConfidenceHistoryCollection = 'projectConfidenceHistory'
export const usersCollection = 'users'
