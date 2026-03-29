/**
 * Daily Planner service
 * Implements ranking logic and AI-assisted planning
 */

import { getUserProjects } from './projects'
import { getUserActions } from './actions'
import { getTodayIntent } from './daily-intent'
import { calculateProjectHealth } from '@/lib/utils/project-health'
import { getDocuments, timeLogsCollection, actionsCollection, where } from '@/lib/storage/firestore'
import type { Project, Action, PlanBias, TimeLog } from '@/types/database'
import { callGemini, formatProjectSignalsForAI } from '@/lib/ai/gemini'
import type { ActionResponse } from '@/types/actions'
import { FOCUS_ACTIONS_MAX } from '@/lib/today-focus-partition'

export interface ProjectSignal {
  project: Project
  deadlineRisk: number
  financialPain: string | null
  confidenceScore: number
  staleness: number
  actionsCompletedLast7Days: number
  timeLoggedLast7Days: number
  heuristicScore: number
}

export interface PlannerResult {
  proposedActions: Array<{
    id?: string
    text: string
    projectId: string | null
    rationale: string
  }>
  tensionCallouts: string[]
  anchorProjectId: string | null
  anchorRationale: string
}

/**
 * Calculate heuristic score for a project based on plan bias
 */
function calculateHeuristicScore(
  signal: ProjectSignal,
  planBias: PlanBias
): number {
  let score = 0

  switch (planBias) {
    case 'risk-first':
      // Deadline + financial dominate
      score = (signal.deadlineRisk * 0.5) + 
              (signal.financialPain === 'risk' ? 40 : signal.financialPain === 'watch' ? 20 : 0) +
              (signal.staleness * 0.1)
      break

    case 'momentum-first':
      // Staleness + recent progress weighted higher
      score = (signal.staleness * 0.4) +
              (signal.actionsCompletedLast7Days * 5) +
              (signal.timeLoggedLast7Days * 0.1) +
              (signal.confidenceScore * 0.2)
      break

    case 'balanced':
    default:
      // Mixed weighting across all signals
      score = (signal.deadlineRisk * 0.3) +
              (signal.financialPain === 'risk' ? 30 : signal.financialPain === 'watch' ? 15 : 0) +
              (signal.staleness * 0.2) +
              (signal.actionsCompletedLast7Days * 3) +
              (signal.timeLoggedLast7Days * 0.05) +
              ((100 - signal.confidenceScore) * 0.15) // Lower confidence = higher priority
      break
  }

  return Math.round(score)
}

/**
 * Gather project signals
 */
async function gatherProjectSignals(
  userId: string,
  projects: Project[]
): Promise<ProjectSignal[]> {
  const timeLogs = await getDocuments<TimeLog>(timeLogsCollection, [
    where('userId', '==', userId),
  ])

  const actions = await getDocuments<Action>(actionsCollection, [
    where('userId', '==', userId),
  ])

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  return projects.map((project) => {
    const health = calculateProjectHealth(project, timeLogs)
    
    const projectTimeLogs = timeLogs.filter((log) => log.projectId === project.id)
    const projectActions = actions.filter((action) => action.projectId === project.id)

    const actionsCompletedLast7Days = projectActions.filter((action) => {
      if (!action.completedAt) return false
      const completed = new Date(action.completedAt)
      return completed >= weekAgo
    }).length

    const timeLoggedLast7Days = projectTimeLogs
      .filter((log) => {
        const logDate = new Date(log.createdAt)
        return logDate >= weekAgo
      })
      .reduce((sum, log) => sum + log.durationMinutes, 0)

    return {
      project,
      deadlineRisk: health.deadlineRisk,
      financialPain: health.financialPain,
      confidenceScore: project.confidenceScore,
      staleness: health.staleness,
      actionsCompletedLast7Days,
      timeLoggedLast7Days,
      heuristicScore: 0, // Will be calculated with plan bias
    }
  })
}

/**
 * Generate plan using AI
 */
export async function generateDailyPlan(
  userId: string,
  planBias: PlanBias
): Promise<ActionResponse<PlannerResult>> {
  try {
    // Gather data
    const [projectsResult, actionsResult, intentResult] = await Promise.all([
      getUserProjects(userId),
      getUserActions(userId),
      getTodayIntent(userId),
    ])

    if (!projectsResult.success || !projectsResult.data) {
      return { success: false, error: 'Failed to load projects' }
    }

    const projects = projectsResult.data
    const existingActions = actionsResult.success ? actionsResult.data : []
    const intent = intentResult.success ? intentResult.data : null

    // Calculate project signals
    const signals = await gatherProjectSignals(userId, projects)
    
    // Calculate heuristic scores
    signals.forEach((signal) => {
      signal.heuristicScore = calculateHeuristicScore(signal, planBias)
    })

    // Sort by heuristic score (highest first)
    signals.sort((a, b) => b.heuristicScore - a.heuristicScore)

    // Prepare AI prompt
    const projectSignalsText = formatProjectSignalsForAI(signals.map((s) => ({
      projectName: s.project.name,
      deadlineRisk: s.deadlineRisk,
      financialPain: s.financialPain,
      confidenceScore: s.confidenceScore,
      staleness: s.staleness,
      actionsCompletedLast7Days: s.actionsCompletedLast7Days,
      timeLoggedLast7Days: s.timeLoggedLast7Days,
    })))

    const intentText = intent?.intentText || 'No specific intent stated'

    const topProjects = signals.slice(0, 5).map((s) => s.project)
    const projectIdsMap = new Map(topProjects.map((p) => [p.name, p.id]))

    const prompt = `You are an AI assistant helping plan today's work. Generate 3-5 specific, actionable next steps.

User's intent for today: "${intentText}"
Plan bias: ${planBias}

Project signals:
${projectSignalsText}

Available project IDs (use exact name to match):
${topProjects.map((p) => `- "${p.name}": "${p.id}"`).join('\n')}

Existing actions already surfaced:
${existingActions.map((a) => `- ${a.text}`).join('\n') || 'None'}

Generate 3-5 actions following these rules:
1. Mix project-bound and ad-hoc actions
2. Choose smallest meaningful steps
3. Prefer momentum-restoring actions
4. Each action should have a 1-line rationale explaining why it matters
5. Maximum ${FOCUS_ACTIONS_MAX} actions total
6. Use projectId from the map above, or null for ad-hoc actions

Format as JSON (no markdown, just JSON):
{
  "actions": [
    {
      "text": "Action description",
      "projectId": "project-id or null",
      "rationale": "Why this matters"
    }
  ],
  "tensionCallouts": ["Any conflicts or tensions to note"],
  "anchorProjectId": "project-id or null",
  "anchorRationale": "Why this is the focus anchor"
}`

    // Call AI
    const aiResponse = await callGemini([
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ])

    // Parse AI response (expecting JSON)
    let result: PlannerResult
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                       aiResponse.match(/```\n([\s\S]*?)\n```/) ||
                       aiResponse.match(/\{[\s\S]*\}/)
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse
      result = JSON.parse(jsonText)
      
      // Validate structure
      if (!result.proposedActions || !Array.isArray(result.proposedActions)) {
        throw new Error('Invalid AI response structure')
      }
    } catch (parseError) {
      console.warn('Failed to parse AI response, using fallback:', parseError)
      // Fallback: create simple plan from top projects
      const fallbackProjects = signals.slice(0, Math.min(5, signals.length))
      result = {
        proposedActions: fallbackProjects.map((signal) => ({
          text: `Work on ${signal.project.name}`,
          projectId: signal.project.id,
          rationale: `High priority project (score: ${signal.heuristicScore})`,
        })),
        tensionCallouts: [],
        anchorProjectId: fallbackProjects[0]?.project.id || null,
        anchorRationale: 'Top priority project',
      }
    }

    if (result.proposedActions.length > FOCUS_ACTIONS_MAX) {
      result.proposedActions = result.proposedActions.slice(0, FOCUS_ACTIONS_MAX)
    }

    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate plan',
    }
  }
}
