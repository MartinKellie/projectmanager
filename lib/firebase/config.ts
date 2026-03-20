/**
 * Firebase app and Firestore configuration.
 * Only initialises when NEXT_PUBLIC_FIREBASE_* env vars are set.
 */

import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import type { FirebaseApp } from 'firebase/app'
import type { Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
}

let app: FirebaseApp | null = null
let firestore: Firestore | null = null

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null
  if (app) return app
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
  return app
}

export function getFirestoreDb(): Firestore | null {
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) return null
  if (firestore) return firestore
  firestore = getFirestore(firebaseApp)
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true'
  ) {
    connectFirestoreEmulator(firestore, 'localhost', 8080)
  }
  return firestore
}

/** True when Firebase env vars are set and we can use Firestore. */
export const isFirebaseEnabled = (): boolean => isFirebaseConfigured()
