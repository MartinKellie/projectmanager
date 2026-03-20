# Migration Guide: Local Storage → Firebase

This document outlines how to migrate from the local storage implementation to Firebase when ready.

## Architecture Design

The current local storage layer (`lib/storage/`) is designed to match Firebase's API exactly. This means:

1. **Same function signatures** - All storage functions have identical signatures
2. **Same data structures** - Types are compatible
3. **Same query patterns** - Query constraints work the same way

## Migration Steps

### 1. Install Firebase Dependencies

```bash
npm install firebase
```

### 2. Create Firebase Configuration

Create `lib/firebase/config.ts`:

```typescript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  // Your Firebase config
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

### 3. Replace Storage Layer

Simply swap the imports:

**Before:**
```typescript
import { getDocument, createDocument } from '@/lib/storage/firestore'
import { signIn, signUp } from '@/lib/storage/auth'
```

**After:**
```typescript
import { getDocument, createDocument } from '@/lib/firebase/firestore'
import { signIn, signUp } from '@/lib/firebase/auth'
```

### 4. Update Firestore Utilities

Create `lib/firebase/firestore.ts` using Firebase SDK:

```typescript
import { collection, doc, getDoc, getDocs, ... } from 'firebase/firestore'
import { db } from './config'

// Implement same functions as lib/storage/firestore.ts
// but using Firebase SDK
```

### 5. Update Auth Utilities

Create `lib/firebase/auth.ts` using Firebase Auth:

```typescript
import { signInWithEmailAndPassword, ... } from 'firebase/auth'
import { auth } from './config'

// Implement same functions as lib/storage/auth.ts
// but using Firebase Auth SDK
```

### 6. Update Types (if needed)

The `AuthUser` type in `lib/storage/auth.ts` should be replaced with Firebase's `User` type:

```typescript
import type { User } from 'firebase/auth'
// Use User instead of AuthUser
```

### 7. Update Contexts/Hooks

Update `hooks/use-auth.ts` and `contexts/auth-context.tsx` to use Firebase's `User` type instead of `AuthUser`.

## What Stays the Same

- ✅ All service layer functions (`services/projects.ts`, etc.)
- ✅ All component code
- ✅ All type definitions (`types/database.ts`)
- ✅ All utility functions
- ✅ All business logic

## Data Migration

When migrating existing local storage data to Firebase:

1. Export data from localStorage
2. Transform to Firestore format (if needed)
3. Import into Firestore using Firebase Admin SDK or console

## Testing

After migration:

1. Test all CRUD operations
2. Test authentication flow
3. Test query operations
4. Verify real-time updates work (if using Firestore listeners)

## Benefits of This Approach

- ✅ **Zero component changes** - UI code stays identical
- ✅ **Zero service changes** - Business logic unchanged
- ✅ **Easy rollback** - Can switch back to local storage if needed
- ✅ **Incremental migration** - Can migrate one collection at a time
