# AI Focus Hub — Work so far (scope snapshot)

**Document purpose:** A working snapshot for revising overall product scope offline. It is not the canonical technical spec; see `README.md`, `AI_Focus_Hub_Technical_Spec.md`, and `AI_Focus_Hub_Todays_Focus_Planner.md` for source material.

**Snapshot date:** 29 March 2026  
**App version:** 0.2.1 (from `package.json`)

---

## 1. Why this file exists

You asked for a single artefact that:

- Reflects **original intent** from the repo’s markdown specs.
- Describes **what the codebase actually does today**, including UX and data behaviour that may not be spelled out in older docs.
- Flags **drift** between README / phase lists and reality.
- Lists **open scope questions** to resolve when you write or refresh a master `scope.md`.

Per-project delivery scope (e.g. “Bookmarks” technical work) lives in **Firestore** on each project as `scopeMarkdown`, and in generated backlog **actions**—not only in repository markdown.

---

## 2. Product intent (from specs)

The following is a condensed synthesis of `AI_Focus_Hub_Technical_Spec.md`, `AI_Focus_Hub_Todays_Focus_Planner.md`, and `README.md`.

### 2.1 Positioning

- A **single-user** AI-assisted **project control** surface: calmer, outcome-based work, without surrendering decisions to automation.
- **AI may observe, suggest, and summarise**; it must **not** override user choices.
- **Backend direction:** Firebase (Auth, Firestore; Cloud Functions for AI in the longer arc).

### 2.2 Layout (three columns)

| Column | Role |
|--------|------|
| Left | Utilities: Pomodoro, music, settings (and room for future gadgets). |
| Middle | **Today / Focus**: daily intent, plan, executable actions, planner entry points. |
| Right | **Project Radar**: project cards, health-style signals, entry into project detail / scope. |

### 2.3 Data concepts (spec-level)

- **Projects** with confidence, deadlines, businesses/clients, optional **scope markdown**.
- **Actions** (next steps), project-bound or ad-hoc, with “surfaced today” semantics for the daily layer.
- **Daily intent** and **daily plan** documents keyed by calendar day / user.
- **Time logs**, **contacts**, **businesses**—supported in the model and navigation; depth of UI varies.

### 2.4 Today’s Focus / planner principles (`AI_Focus_Hub_Todays_Focus_Planner.md`)

- Turn project reality into a **small executable daily plan** (historically **3–5** actions from the planner).
- Balance risk, momentum, and **user-stated intent** at startup.
- **Tone:** calm, warm, not authoritarian; planner optional but encouraged.
- System must **function without AI** (heuristic / offline paths).

---

## 3. Implemented capability snapshot (current codebase)

This section is **descriptive**, not a promise for future releases.

### 3.1 Shell and delivery

- **Next.js 14** App Router; root layout with dark theme, **glass** styling (`app/globals.css`, Tailwind).
- **`output: 'export'`** static site under `out/`; production preview via `serve` / Firebase Hosting (`next.config.js`, `firebase.json`).
- **Inline body fallback colours** in `app/layout.tsx` so a missing CSS bundle does not yield an unreadable white page.
- **App version** surfaced in the left column footer (`NEXT_PUBLIC_APP_VERSION` from package version).

### 3.2 Authentication

- **`lib/storage/auth.ts`**: Firebase Auth when `NEXT_PUBLIC_FIREBASE_*` env vars are set; anonymous sign-in via `ensureSignedIn` from `AuthProvider`.
- **Stable `uid` mapping** to a shared logical user id for data rows (see code comments in auth module)—align with Firestore rules in production.
- **`hooks/use-auth.ts`**: Subscribes before paint (`useLayoutEffect`); safety timeout so loading does not hang indefinitely if the bridge misbehaves.

### 3.3 Storage layer

- **`lib/storage/firestore.ts`** implements the app’s document API using the **Firebase JS SDK** against `getFirestoreDb()`. If Firestore is not configured, calls fail with a clear error (there is no silent in-browser “fake” Firestore in that path).
- **`FIREBASE_SETUP.md`** still describes a transition period from an older local-storage story; **operational reality** for a configured dev/prod environment is **Firebase Firestore** for persistence (see drift below).

### 3.4 Dashboard layout and navigation

- **`AppLayout`** + **`TopNav`**: Dashboard vs Businesses / Contacts / Projects views; non-dashboard views reuse columns with routed content.
- **Toasts** via custom event (`lib/events/toast.ts`); **data refresh** broadcast (`lib/events/data-refresh.ts`) so lists reload after mutations.
- **Dummy data initialisation** on first load (`components/onboarding/dummy-data-initializer.tsx`) when appropriate.

### 3.5 Left column utilities

- **Pomodoro** (`lib/pomodoro/`, `components/pomodoro/`): timer, sessions, local persistence via pomodoro store adapter.
- **Music** (`components/music-player/`): folder selection (e.g. Drive-oriented workflow per README), playback controls.
- **Settings** (`contexts/settings-context.tsx`): glimmer, toasts, etc.

### 3.6 Middle column — Today’s Focus

- **Loads** daily intent, daily plan, and **today’s actions** for the signed-in user (`services/daily-intent.ts`, `services/daily-plan.ts`, `services/actions.ts`).
- **Daily startup modal** flow when intent missing for the day (`components/focus/daily-startup-modal.tsx`).
- **Plan My Day** invokes **`generateDailyPlan`** (`services/planner.ts`): Gemini when configured, otherwise **heuristic** fallback; proposed actions capped with **`FOCUS_ACTIONS_MAX`** (5) in one place (`lib/today-focus-partition.ts`).
- **Focus vs queue UI**: Not all surfaced-today actions are shown at once. **`partitionTodayFocusActions`** splits the list: up to **five** in the primary “Today’s Actions” list; additional items appear under **“Queued for today”**, **collapsed by default**, expandable (`components/focus/today-focus-actions-section.tsx`, `today-focus-action-rows.tsx`). Completing any item triggers **`completeAction`** then **`loadData()`**, so the next items **promote** into the focus slots by ordering.
- **Completing an action** updates Firestore: `status: 'completed'`, `completedAt`, `surfacedToday: false` (`completeAction` in `services/actions.ts`). The today query only returns **active** surfaced actions, so completed rows disappear from the list after refresh.

### 3.7 Right column — Project Radar and project depth

- **`ProjectList`**: Loads projects and businesses; cards open a project via **`onProjectOpen`** from the dashboard (`app/page.tsx`) into a **large overlay** (`ProjectFocusOverlay`) with **ProjectDetailContent**-style scope and tasks, or supports legacy modal flow when `onProjectOpen` is absent.
- **Inline focus mode**: User can switch overlay to **inline backlog**; middle column shows a **collapsed Today strip** with **“Back to Today”** (not “Restore”) to exit (`TodayFocus` collapsed props).
- **Project scope**: `ProjectDetailScopeSection` + **`useProjectScopeSection`**: paste/import scope, save `scopeMarkdown`, **generate tasks** (AI or offline generator in `services/scope-task-generator.ts`), replace backlog via `replaceProjectBacklogActions`.
- **Scope backlog list** (`components/detail/project-scope-backlog-list.tsx`): Tasks grouped by **`scopeGroup`** and/or **`classifyScopeTask`** (`lib/scope-task-grouping.ts`); glass cards; expand/collapse; **group complete** runs **`completeAction`** for every line in the group, then **`onBacklogChanged`** / `loadBacklog()`. Completed actions **leave** the active backlog query—**sections with no remaining active tasks disappear** rather than showing a persistent “ticked section” row.
- **Edit project** modal from dashboard when editing from overlay flow.

### 3.8 Embedded chat

- **Abacus mini-browser** (`components/embedded-chat/abacus-mini-browser.tsx`): iframe / panel in the middle column footer area (exact placement follows `app/page.tsx` structure).

### 3.9 Not exhaustively verified in this snapshot

- Time logging **UI** depth vs spec.
- End-to-end **Contacts / Businesses / Projects** CRUD versus Phase 2/3 lists in README.
- Full **AI conversational refinement** block in Today’s Focus (placeholder / TODO in UI in places).

---

## 4. Spec and README drift

Use this when you update documentation or a formal `scope.md`.

| Area | Docs say | Code / product reality (snapshot) |
|------|----------|-------------------------------------|
| Storage | README still emphasises browser **local storage** and “Firebase-ready” migration | Persistence path is **Firebase Firestore** when env is configured; `lib/storage/firestore.ts` is not an in-memory local DB |
| Phase 1 checklist | ⏳ Project CRUD, time tracking, next actions, daily intent | **Projects** and **actions** exist in the UI; **daily intent** ritual exists; **time tracking** may still be lighter than final spec |
| “Max 5 actions” | README: “hard cap on surfaced actions” | Planner output capped at 5; **more** than five can exist as “surfaced today” in data; **UI** shows five in focus plus a **queue** |
| Technical spec file | Very long; some escaped markdown | Treat as **source of principles**; prefer editing smaller living docs + this snapshot |

---

## 5. Open scope questions (for your next scope pass)

Short prompts—not decisions:

1. **Backlog UX after completion:** Should **completed scope sections** remain visible as checked (audit trail), or is **removal from backlog** always correct?
2. **Queue vs data model:** Queue ordering is now persisted via `DailyPlanRecord`; decide whether to hard-enforce queue-only visibility rules server-side or keep this as a UI-first contract.
3. **Time and confidence:** How much of **time logging** and **confidence history** belongs in the next milestone?
4. **AI surface:** Gemini for planning and scope generation is present; where should **Cloud Functions** and **stored AI events** land relative to static hosting?
5. **Multi-device:** Shared uid mapping implies careful **rules**; is multi-device sync an explicit goal for the next scope?
6. **Phase 3** items in README (praise engine, pattern summaries): **prioritise** or **defer** explicitly in the next `scope.md`.

---

## 6. Key file map (for scope maintainers)

| Concern | Location |
|---------|----------|
| Dashboard composition, overlay, inline backlog | `app/page.tsx` |
| Today’s focus + partition + queue | `components/focus/today-focus.tsx`, `today-focus-actions-section.tsx`, `lib/today-focus-partition.ts` |
| Planner + cap | `services/planner.ts` |
| Actions CRUD / today / backlog / complete | `services/actions.ts` |
| Scope grouping | `lib/scope-task-grouping.ts` |
| Scope backlog UI | `components/detail/project-scope-backlog-list.tsx` |
| Auth + Firestore entry | `lib/storage/auth.ts`, `lib/storage/firestore.ts`, `lib/firebase/config.ts` |
| Static export & hosting | `next.config.js`, `firebase.json`, `README.md` |

---

## 7. Meta

- **Repository markdown** describes **product** scope; **`scopeMarkdown` on projects** describes **delivery** scope for that project.
- Regenerate or refresh this file when major features land or before a formal roadmap exercise.
- **British English** preferred for user-facing copy in the app; this document follows that convention.

---

*End of snapshot. Approx. length: scope snapshot for download and offline editing; revise sections 4–5 first when drafting a formal `scope.md`.*
