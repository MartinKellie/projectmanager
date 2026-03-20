/**
 * Firebase Auth wrapper with a stable app-level API.
 * Uses anonymous auth by default so data can always be scoped to a user.
 */

export interface AuthUser {
  uid: string
  email: string | null
  displayName?: string | null
}

export interface UserCredential {
  user: AuthUser
}

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { getAuth } from 'firebase/auth'
import { getFirebaseApp } from '@/lib/firebase/config'

let currentUser: AuthUser | null = null
const authListeners: Set<(user: AuthUser | null) => void> = new Set()

function notifyListeners() {
  authListeners.forEach((callback) => callback(currentUser))
}

function mapUser(user: User | null): AuthUser | null {
  if (!user) return null
  return {
    // We want the same dataset across laptops without adding a sign-in UI.
    // So we store a stable shared uid in our `userId` fields.
    // Security-wise: Firestore rules should mirror this (see `firestore.rules`).
    uid: 'shared',
    email: user.email,
    displayName: user.displayName,
  }
}

function getFirebaseAuth() {
  const app = getFirebaseApp()
  if (!app) throw new Error('Firebase is not configured')
  return getAuth(app)
}

if (typeof window !== 'undefined') {
  try {
    const auth = getFirebaseAuth()
    onAuthStateChanged(auth, (user) => {
      currentUser = mapUser(user)
      notifyListeners()
    })
  } catch (e) {
    console.warn('Auth: Firebase is not configured', e)
  }
}

export async function signIn(email: string, password: string): Promise<UserCredential> {
  const auth = getFirebaseAuth()
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const user = mapUser(credential.user)
  if (!user) throw new Error('Sign in failed')
  currentUser = user
  notifyListeners()
  return { user }
}

/** Re-notify all auth listeners with current user (e.g. after late subscribers mount). */
export function syncAuthListeners(): void {
  notifyListeners()
}

export async function signUp(email: string, password: string): Promise<UserCredential> {
  const auth = getFirebaseAuth()
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const user = mapUser(credential.user)
  if (!user) throw new Error('Sign up failed')
  currentUser = user
  notifyListeners()
  return { user }
}

export async function logOut(): Promise<void> {
  const auth = getFirebaseAuth()
  await signOut(auth)
}

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  authListeners.add(callback)
  
  // Call immediately with current user
  callback(currentUser)
  
  // Return unsubscribe function
  return () => {
    authListeners.delete(callback)
  }
}

export function getCurrentUser(): AuthUser | null {
  return currentUser
}

export async function ensureSignedIn(): Promise<AuthUser> {
  const auth = getFirebaseAuth()
  if (auth.currentUser) {
    const user = mapUser(auth.currentUser)
    if (!user) throw new Error('Auth state invalid')
    currentUser = user
    notifyListeners()
    return user
  }

  const credential = await signInAnonymously(auth)
  const user = mapUser(credential.user)
  if (!user) throw new Error('Anonymous sign-in failed')
  currentUser = user
  notifyListeners()
  return user
}
