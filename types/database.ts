/**
 * Firestore data model types
 * Based on AI_Productivity_OS_Technical_Spec.md
 */

/** Base for stored documents (all have id). */
export interface DocumentData {
  id: string
}

export interface User {
  id: string
  settings: UserSettings
  createdAt: Date | string
}

export interface UserSettings {
  financialThresholdBaseline?: number // Effective hourly rate threshold
  deadlineWarningWindow?: number // Days before deadline to warn
  aiVerbosityLevel?: 'minimal' | 'normal' | 'verbose'
  focusModeIntensity?: 'light' | 'medium' | 'strong'
  googleDriveFolderId?: string
}

export interface Business {
  id: string
  userId: string
  name: string
  website?: string | null
  industry?: string | null
  notes?: string | null
  createdAt: Date | string
  archived: boolean
}

export interface Contact {
  id: string
  userId: string
  businessId: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  role?: string | null
  notes?: string | null
  createdAt: Date | string
  archived: boolean
}

export interface Project {
  id: string
  userId: string
  businessId: string | null // null for personal projects
  name: string
  clientName: string // Keep for backward compatibility, derived from business if businessId exists
  fixedFee: number | null
  deadline: Date | string | null
  confidenceScore: number // 0-100
  lastTouchedAt: Date | string
  createdAt: Date | string
  archived: boolean
  templateProjectId: string | null // If created from a template, reference the original project
}

export interface TimeLog {
  id: string
  userId: string
  projectId: string
  startTime: Date | string
  endTime: Date | string | null
  durationMinutes: number
  createdAt: Date | string
}

export interface Action {
  id: string
  userId: string
  projectId: string | null // null for ad-hoc actions
  text: string
  status: 'active' | 'completed'
  createdAt: Date | string
  completedAt: Date | string | null
  surfacedToday: boolean
  orderIndex: number
}

export type PlanBias = 'risk-first' | 'balanced' | 'momentum-first'

export interface DailyIntent {
  id: string // date-based (e.g., "2026-02-21")
  userId: string
  intentText: string
  skipped: boolean
  planBias?: PlanBias
  protectDeepWork?: boolean
  createdAt: Date | string
}

export interface DailyPlan {
  id: string // date-based (e.g., "2026-02-21")
  userId: string
  planBias: PlanBias
  anchorProjectId: string | null
  proposedActionIds: string[] // Array of action IDs
  finalActionIds: string[] // User-approved action IDs
  createdAt: Date | string
  updatedAt: Date | string
}

export type AIEventType = 'insight' | 'suggestion' | 'summary' | 'praise'

export interface AIEvent {
  id: string
  userId: string
  type: AIEventType
  relatedProjectId: string | null
  content: string
  acknowledged: boolean
  createdAt: Date | string
  // For threaded conversations
  parentEventId?: string | null
  replies?: AIEvent[]
}

export interface ProjectConfidenceHistory {
  id: string
  projectId: string
  previousScore: number
  newScore: number
  changedAt: Date | string
}

/**
 * Derived/computed types
 */
export type FinancialPainLevel = 'healthy' | 'watch' | 'risk'

export interface ProjectHealth {
  project: Project
  deadlineRisk: number // 0-100, higher = more risk
  financialPain: FinancialPainLevel | null
  staleness: number // Days since lastTouchedAt
  timeLoggedThisWeek: number // minutes
  aiNudge?: AIEvent | null
}

export interface TimerState {
  state: 'idle' | 'running' | 'stopped'
  projectId: string | null
  startTime: Date | null
  elapsedMinutes: number
}
