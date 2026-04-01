Here is the complete Markdown file content.



You can copy this directly into `AI\_Productivity\_OS\_Technical\_Spec.md`.



---



\# AI Focus Hub



\## Technical Specification for Cursor



---



\# 1. Overview



\*\*Type:\*\* Single-user AI-assisted project control dashboard

\*\*Backend:\*\* Firebase (Auth, Firestore, Cloud Functions)

\*\*Primary Goal:\*\* Projects feel calmer and more under control.



This system is a personal operating system for managing outcome-based projects, tracking time intentionally, and receiving AI-assisted insights without surrendering authority to automation.



AI may observe, suggest, and summarize.

AI may never override user decisions.



---



\# 2. Architecture Overview



\## Frontend



\* React (Next.js recommended)

\* Tailwind CSS

\* Custom animation layer

\* Local state + Firebase realtime listeners



\## Backend



\* Firebase Auth

\* Firestore

\* Cloud Functions (AI + derived signals)

\* Firebase Storage (optional)



\## AI Layer



\* OpenAI (or similar) via Cloud Functions proxy

\* All AI responses stored in Firestore



---



\# 3. Layout Structure



Three persistent columns.



\## Left Column — Utilities



\* Pomodoro timer

\* Music player (Google Drive folder reader)

\* Settings

\* Future micro-gadgets



Rules:



\* Always visible

\* Never dominant

\* Collapsible but not hidden by default



---



\## Middle Column — Today / Focus



Purpose: Execution.



Contains:



\* Daily startup intent ritual

\* Max 3–5 next actions

\* AI suggestions (conversational)

\* Active work context



Rules:



\* Hard cap: 5 surfaced actions

\* Hybrid action model:



&nbsp; \* Project-bound

&nbsp; \* Ad-hoc

\* Completing an action:



&nbsp; \* Mark complete

&nbsp; \* Update project lastTouchedAt

&nbsp; \* Auto-suggest next action

&nbsp; \* Trigger AI review



---



\## Right Column — Project Radar



Each project card (medium density) displays:



\* Project name

\* Client name

\* Confidence slider

\* Deadline risk

\* Financial pain indicator

\* Last touched date

\* Time logged this week

\* AI nudge (if applicable)



---



\# 4. Data Model (Firestore)



\## users



```

id

settings

createdAt

```



---



\## projects



```

id

userId

name

clientName

fixedFee (nullable)

deadline (nullable)

confidenceScore (0–100)

lastTouchedAt

createdAt

archived (boolean)

```



---



\## timeLogs



```

id

userId

projectId

startTime

endTime

durationMinutes

createdAt

```



---



\## actions



```

id

userId

projectId (nullable)

text

status (active | completed)

createdAt

completedAt

surfacedToday (boolean)

orderIndex

```



---



\## dailyIntent



```

id (date-based)

userId

intentText

skipped (boolean)

createdAt

```



---



\## aiEvents



```

id

userId

type (insight | suggestion | summary | praise)

relatedProjectId (nullable)

content

acknowledged (boolean)

createdAt

```



---



\## projectConfidenceHistory



```

id

projectId

previousScore

newScore

changedAt

```



---



\# 5. Core Logic Systems



---



\# 5.1 Project Health Model



Project health combines:



1\. Confidence slider (manual, primary signal)

2\. Deadline proximity

3\. Financial pain (if fixedFee exists)

4\. Staleness (derived from lastTouchedAt)



AI may flag contradictions but cannot modify state.



---



\# 5.2 Confidence Slider



\* Manual only

\* Persist immediately

\* Log history entry on change

\* Trigger AI review



Never auto-adjusted.



---



\# 5.3 Time Tracking



Manual timer states:



\* Idle

\* Running (bound to project)

\* Stopped



On stop:



\* Persist timeLog

\* Update project.lastTouchedAt

\* Recalculate financial signal



Pomodoro is optional support, not source of truth.



---



\# 5.4 Financial Pain



Purpose:



> Detect bleeding on fixed-fee work.



If fixedFee exists:



\* Calculate effective hourly rate

\* Compare against threshold (from settings)

\* Label:



&nbsp; \* Healthy

&nbsp; \* Watch

&nbsp; \* Risk



No forecasting.

No accounting depth.



---



\# 5.5 Next Actions



Hybrid model:



\* Project-derived

\* Ad-hoc



Constraints:



\* Max 5 surfacedToday = true

\* UI prevents adding a sixth



On completion:



1\. Mark completed

2\. Update project lastTouchedAt

3\. Trigger suggestion generator

4\. Offer next action inline



---



\# 5.6 Daily Startup Ritual



On first load of the day:



\* If no dailyIntent exists:



&nbsp; \* Show full-screen modal

&nbsp; \* Ask: “What do you want to make progress on today?”

&nbsp; \* Soft skip allowed

\* Persist intent or skipped state



This ritual anchors execution.



---



\# 6. AI System



All AI calls run through Cloud Functions.



---



\## Trigger Events



\* Confidence change

\* Deadline threshold crossed

\* Financial risk detected

\* Action completion

\* Long inactivity

\* End-of-day

\* End-of-week



---



\## AI Event Types



\* insight

\* suggestion

\* praise

\* summary



All stored in aiEvents.



UI:



\* Tap-on-shoulder style

\* Dismissible

\* Conversational reply box

\* Replies stored as threaded events



---



\# 6.1 Positive Reinforcement



Trigger when:



\* Meaningful action completed

\* Confidence improves significantly

\* Risk reduced

\* Project recovered



Tone:

Warm, understated, human.



Never gamified.

Never exaggerated.



---



\# 6.2 Bad Day Handling



If low activity or missed intent:



\* Normalize gently

\* No analysis dump

\* No guilt language



---



\# 7. Deep History



All historical data retained:



\* Time logs

\* Confidence shifts

\* Completed actions

\* AI events



AI summarizes patterns to prevent overload.



---



\# 8. Music Player



Google Drive integration:



\* OAuth login

\* Select folder

\* Read mp3 files

\* Local playback controls:



&nbsp; \* Play

&nbsp; \* Pause

&nbsp; \* Next

&nbsp; \* Shuffle



No uploads.

No server streaming.



---



\# 9. Visual System



Base Mode:



\* Dark

\* Glassmorphism panels

\* Gradient mesh background

\* Noise/grain overlay

\* Depth shadows

\* Subtle glow interactions



Focus Mode:



\* Dim background

\* Reduce glow

\* Reduce motion



Animation:



\* GPU-friendly

\* <300ms transitions

\* No distracting loops



---



\# 10. Settings



Include:



\* Financial threshold baseline

\* Deadline warning window (days)

\* AI verbosity level

\* Focus mode intensity

\* Google Drive folder selection



---



\# 11. Performance Constraints



\* Avoid full list re-renders

\* Memoize project cards

\* Virtualize if project count > 20

\* AI calls async and non-blocking

\* No layout shift during data load



Must feel like an app, not a website.



---



\# 12. Build Order



\## Phase 1



\* Auth

\* Layout shell

\* Project CRUD

\* Time tracking

\* Next actions

\* Daily intent ritual



\## Phase 2



\* Financial logic

\* Deadline risk logic

\* Confidence history

\* AI insight (basic)

\* End-of-day summary



\## Phase 3



\* Conversational AI

\* Praise engine

\* Pattern summaries

\* Music integration

\* Visual polish



---



\# 13. Guardrails



\* AI never mutates project state automatically

\* Confidence slider is manual only

\* No automatic reprioritization

\* Max 5 surfaced actions

\* System must function without AI enabled



---



\# 14. Definition of Done



System is complete when:



\* Projects update in real time

\* Time logs affect financial signals correctly

\* AI suggestions are dismissible and conversational

\* Daily ritual triggers reliably

\* End-of-day summary works consistently

\* UI remains responsive with 20+ projects

