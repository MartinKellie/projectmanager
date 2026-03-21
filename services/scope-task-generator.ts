/**
 * Turn project scope markdown into ordered task strings (AI + heuristic fallback).
 */

import { callGemini } from '@/lib/ai/gemini'
import type { ActionResponse } from '@/types/actions'

export interface ScopeTaskGenerationResult {
  tasks: string[]
  source: 'gemini' | 'heuristic'
}

function extractJsonObject(text: string): string {
  const jsonBlock = text.match(/```(?:json)?\n([\s\S]*?)\n```/)
  if (jsonBlock?.[1]) return jsonBlock[1].trim()
  const brace = text.match(/\{[\s\S]*\}/)
  return brace ? brace[0] : text
}

/** Deterministic tasks when Gemini is unavailable or fails. */
export function tasksFromScopeHeuristic(scopeMarkdown: string): string[] {
  const lines = scopeMarkdown.split(/\r?\n/)
  const tasks: string[] = []
  const bullet = /^[\s]*[-*]\s+(.+)$/
  const numbered = /^[\s]*\d+[.)]\s+(.+)$/

  const h2Blocks = scopeMarkdown.split(/\n(?=##\s)/)
  if (h2Blocks.length > 1) {
    for (const block of h2Blocks) {
      const first = block.trim()
      if (!first) continue
      const titleLine = first.split('\n')[0].replace(/^##+\s*/, '').trim()
      if (titleLine.length > 2 && titleLine.length < 200) tasks.push(titleLine)
    }
    if (tasks.length >= 2) return dedupeTasks(tasks)
  }

  for (const line of lines) {
    const m = line.match(bullet) || line.match(numbered)
    if (m?.[1]) {
      const t = m[1].trim()
      if (t.length > 1 && t.length < 500) tasks.push(t)
    }
  }

  if (tasks.length > 0) return dedupeTasks(tasks)

  const nonEmpty = lines.map((l) => l.trim()).filter((l) => l.length > 2 && l.length < 400)
  return dedupeTasks(nonEmpty.slice(0, 25))
}

function dedupeTasks(tasks: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of tasks) {
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}

export async function generateTasksFromScope(
  scopeMarkdown: string,
  projectName: string
): Promise<ActionResponse<ScopeTaskGenerationResult>> {
  const trimmed = scopeMarkdown.trim()
  if (!trimmed) {
    return { success: false, error: 'Scope is empty' }
  }

  const prompt = `You break a project scope document into an ordered list of concrete tasks (execution order: dependencies first).

Project name: "${projectName}"

Scope (markdown):
---
${trimmed.slice(0, 120000)}
---

Rules:
1. Output ONLY valid JSON, no markdown fences.
2. Each task is one short imperative line (e.g. "Confirm API contract with client").
3. Order tasks so prerequisites come before dependent work.
4. Aim for 5–25 tasks; merge tiny steps if needed.
5. Skip purely decorative headings with no actionable content.

Format:
{"tasks":[{"text":"...","order":1},{"text":"...","order":2}]}

The "order" field is 1-based sequence.`

  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return {
        success: true,
        data: {
          tasks: tasksFromScopeHeuristic(trimmed),
          source: 'heuristic',
        },
      }
    }

    const raw = await callGemini(
      [{ role: 'user', parts: [{ text: prompt }] }],
      { temperature: 0.2, maxTokens: 4096 }
    )

    const jsonText = extractJsonObject(raw)
    const parsed = JSON.parse(jsonText) as {
      tasks?: Array<{ text?: string; order?: number }>
    }

    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      throw new Error('Invalid tasks array')
    }

    const sorted = [...parsed.tasks]
      .filter((t) => t.text && String(t.text).trim())
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    const tasks = sorted.map((t) => String(t.text).trim()).filter(Boolean)

    if (tasks.length === 0) {
      return {
        success: true,
        data: {
          tasks: tasksFromScopeHeuristic(trimmed),
          source: 'heuristic',
        },
      }
    }

    return {
      success: true,
      data: { tasks: dedupeTasks(tasks), source: 'gemini' },
    }
  } catch (error) {
    console.warn('Scope task generation falling back to heuristic:', error)
    return {
      success: true,
      data: {
        tasks: tasksFromScopeHeuristic(trimmed),
        source: 'heuristic',
      },
    }
  }
}
