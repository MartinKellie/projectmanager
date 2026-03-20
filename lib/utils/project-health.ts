/**
 * Project health calculation utilities
 * Based on confidence, deadline, financial pain, and staleness
 */

import type { Project, TimeLog, FinancialPainLevel, ProjectHealth } from '@/types/database'
import { timestampToDate } from '@/lib/storage/firestore'

/**
 * Calculate deadline risk (0-100)
 * Higher = more risk
 */
export function calculateDeadlineRisk(
  deadline: Date | string | null,
  warningWindowDays: number = 7
): number {
  if (!deadline) return 0

  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline)
  const now = new Date()
  const daysUntilDeadline = Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysUntilDeadline < 0) return 100 // Past deadline
  if (daysUntilDeadline <= warningWindowDays) {
    // Linear scale from 0 to 100 within warning window
    return Math.max(0, 100 - (daysUntilDeadline / warningWindowDays) * 100)
  }

  return 0
}

/**
 * Calculate financial pain level
 */
export function calculateFinancialPain(
  project: Project,
  timeLogs: TimeLog[],
  thresholdBaseline: number = 50 // Default £50/hour threshold
): FinancialPainLevel | null {
  if (!project.fixedFee) return null

  const totalMinutes = timeLogs.reduce(
    (sum, log) => sum + log.durationMinutes,
    0
  )
  const totalHours = totalMinutes / 60

  if (totalHours === 0) return null

  const effectiveHourlyRate = project.fixedFee / totalHours

  if (effectiveHourlyRate >= thresholdBaseline) return 'healthy'
  if (effectiveHourlyRate >= thresholdBaseline * 0.7) return 'watch'
  return 'risk'
}

/**
 * Calculate staleness (days since last touched)
 */
export function calculateStaleness(lastTouchedAt: Date | string): number {
  const lastTouched = timestampToDate(lastTouchedAt)
  const now = new Date()
  const diffTime = now.getTime() - lastTouched.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Calculate time logged this week
 */
export function calculateTimeThisWeek(timeLogs: TimeLog[]): number {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  return timeLogs
    .filter((log) => {
      const logDate = timestampToDate(log.createdAt)
      return logDate >= weekAgo
    })
    .reduce((sum, log) => sum + log.durationMinutes, 0)
}

/**
 * Calculate complete project health
 */
export function calculateProjectHealth(
  project: Project,
  timeLogs: TimeLog[],
  thresholdBaseline?: number,
  warningWindowDays?: number
): ProjectHealth {
  const projectTimeLogs = timeLogs.filter(
    (log) => log.projectId === project.id
  )

  return {
    project,
    deadlineRisk: calculateDeadlineRisk(project.deadline, warningWindowDays),
    financialPain: calculateFinancialPain(
      project,
      projectTimeLogs,
      thresholdBaseline
    ),
    staleness: calculateStaleness(project.lastTouchedAt),
    timeLoggedThisWeek: calculateTimeThisWeek(projectTimeLogs),
  }
}
