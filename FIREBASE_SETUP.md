# Firebase & Firestore setup

The app uses **Firebase** (Auth, Firestore) as per the technical spec. The Firebase CLI is installed as a dev dependency so you can initialise and deploy from this repo.

## What’s already done in the repo

- **Firebase JS SDK** (`firebase`) — in `dependencies`
- **Firebase CLI** (`firebase-tools`) — in `devDependencies`  
  Run via: `npm run firebase -- <command>` or `npx firebase <command>`
- **Firebase config** — `lib/firebase/config.ts` reads env vars and exposes `getFirebaseApp()`, `getFirestoreDb()`, `isFirebaseEnabled()`
- **.env.example** — lists all `NEXT_PUBLIC_FIREBASE_*` variables

Until you complete the steps below, the app keeps using the existing **local storage** layer (Firestore-compatible API in `lib/storage/firestore.ts`).

---

## What you need to do

### 1. Log in to Firebase CLI

```bash
npm run firebase -- login
```

(or `npx firebase login`). Use the Google account you want for the Firebase project.

### 2. Create a Firebase project (if you don’t have one)

1. Open [Firebase Console](https://console.firebase.google.com/)
2. **Add project** (or pick an existing one)
3. Note the **Project ID** — you’ll use it in `.env` and when running `firebase init`

### 3. Enable Firestore and Auth

In the Firebase Console for your project:

- **Build → Firestore Database** → Create database (start in **test mode** for dev; lock down rules before production).
- **Build → Authentication** → Get started → enable the sign-in methods you need (e.g. Email/Password).

### 4. Get your web app config

1. In Firebase Console: **Project settings** (gear) → **General**
2. Under “Your apps”, add a **Web** app (or use an existing one)
3. Copy the `firebaseConfig` object (or the individual fields)

### 5. Put config in `.env`

Copy `.env.example` to `.env` if you haven’t already, then set:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

(Use the values from the Firebase Console web app config.)

Restart the Next dev server after changing `.env`.

### 6. Link this repo to your Firebase project (optional but recommended)

From the project root:

```bash
npm run firebase -- init
```

When prompted:

- **What do you want to use?** — choose **Firestore** (and **Hosting** / **Functions** later if you want)
- **Select a default Firebase project** — pick the project you created
- **File for Firestore rules** — accept default (e.g. `firestore.rules`) or name your own
- **File for Firestore indexes** — accept default (e.g. `firestore.indexes.json`) or name your own

This creates `firebase.json` and `firestore.rules` (and indexes file) so you can deploy rules and use emulators.

### 7. (Optional) Use the Firestore emulator locally

1. In `.env`, set:  
   `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true`
2. Start the emulator:  
   `npm run firebase -- emulators:start --only firestore`
3. The app will connect to the emulator when the env var is set and the emulator is running (see `lib/firebase/config.ts`).

---

## Summary checklist

- [ ] `npm run firebase -- login`
- [ ] Create/select project in Firebase Console
- [ ] Enable Firestore and Authentication
- [ ] Add a Web app and copy config into `.env`
- [ ] (Optional) `npm run firebase -- init` and deploy rules / use emulators

After this, the app can use `getFirestoreDb()` and `getFirebaseApp()` from `lib/firebase/config.ts` when `isFirebaseEnabled()` is true. The existing UI still uses the local-storage-backed API until you switch the data layer to Firestore.

## Analytics (optional)

If you’ve enabled Google Analytics for your Firebase project (and you have a `measurementId`), you can initialise Analytics on the client using:

- `lib/firebase/analytics.ts` → `getFirebaseAnalytics()`

This helper is client-only safe (won’t run during SSR) and checks Analytics support before initialising.
