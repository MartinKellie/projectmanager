# AI Focus Hub — Updated Scope (vNext)

## 1. Product Definition

AI Focus Hub is a **single-user, cloud-backed work system** designed to:

- enable intentional daily execution
- maintain clear project structure
- provide AI-assisted planning without removing user control

AI is assistive only:
- suggests, summarises, supports
- never overrides user decisions

---

## 2. Architecture

### 2.1 Runtime Model

- Cloud-first system
- Firebase Auth + Firestore are the **source of truth**
- Single-user, multi-device accessible

### 2.2 Development Model

- Local development is encouraged for speed and iteration
- Deployment occurs at meaningful checkpoints

Local development **does not imply local-first architecture**

### 2.3 Offline Position

- Not offline-first
- Partial offline tolerance acceptable
- Full offline sync is out of scope

---

## 3. Core System Model

The system is composed of three distinct layers:

### 3.1 Backlog (Project Layer)

Represents all possible work

- Derived from scope + manual additions
- Structured by sections/groups
- Long-lived
- Not time-bound

---

### 3.2 Daily Plan (Day Layer)

A **first-class object** representing the plan for a specific day

#### DailyPlanRecord

Contains:

- date
- userId
- intent
- plannerContext (short AI reasoning)
- focusActions (ordered, max ~5)
- queuedActions (ordered)
- addedToday (optional)
- timestamps

---

### 3.3 Execution Layer

UI representation of the day

- Focus = top ~5 actions
- Queue = remaining actions

Behaviour:
- completing a focus task promotes the first queued item
- ordering is explicit and persisted

---

## 4. Daily Planning Flow

### 4.1 System Behaviour

On app open:

1. Generate draft plan from:
   - unfinished work
   - backlog priorities
   - deadlines
   - recent activity

2. User reviews:
   - accept
   - reorder
   - swap

3. Save as DailyPlanRecord

---

### 4.2 Time Expectation

- Normal: 1–3 minutes
- Complex: ≤5 minutes

System must be:

**system-prepared, user-approved**

---

### 4.3 Carryover Rules

- Unfinished work may carry forward
- Repeatedly ignored tasks should not persist indefinitely

---

## 5. Queue Model

Queue is a **real, stored structure**

- Ordered
- Meaningful
- User-adjustable

### Promotion Rule

- Completing a focus task promotes the first queued item

---

## 6. Backlog Behaviour

### 6.1 Structure

- Grouped by scope or classification

### 6.2 Completion Handling

When a section is complete:

- remains visible
- marked complete
- collapsed by default

Optional:
- completion summary (e.g. 4/4 complete)

### Principle

Completion reduces noise, not history

---

## 7. Scope → Backlog Generation

### 7.1 Default Behaviour

Merge, do not replace

System must:

1. Match existing tasks
   - preserve status
   - preserve edits

2. Add new tasks

3. Handle removed tasks
   - do not delete silently
   - mark as removed or detached

---

### 7.2 Full Reset (Optional)

- Explicit action only
- Requires confirmation

---

### Principle

Generated structure adapts to reality

---

## 8. AI Behaviour

AI is a **light system layer**, not a feature

### Responsibilities

- generate plans
- generate tasks
- summarise reasoning

### Requirements

- provide short reasoning context
- remain assistive and predictable

### Learning Signals

- completion
- deferral
- repetition

### Non-goals

- no autonomous replanning
- no overriding user decisions

### Principle

AI creates continuity, not control

---

## 9. Multi-Device Behaviour

- Shared state via Firestore
- Latest state visible across devices

Conflict handling:
- simple last-write-wins

---

## 10. Core Principles

1. Planning is explicit, execution is fluid
2. User intent overrides system suggestions
3. Structure persists; nothing important disappears
4. Behaviour must be explainable
5. If the user sees it, the system understands it
6. Minimise friction, maximise clarity
7. Start messy, refine through use

---

## 11. Product Focus

Primary system loop:

**Scope → Backlog → Day Plan → Execution**

All features must support this loop.

Secondary features (utilities, chat, etc.) must not interfere with it.

---

End of document.

