'use client'

import { useCallback, useEffect, useState } from 'react'
import { updateProject } from '@/services/projects'
import {
  getProjectBacklogActions,
  replaceProjectBacklogActions,
} from '@/services/actions'
import { generateTasksFromScope } from '@/services/scope-task-generator'
import type { Project } from '@/types/database'
import type { ScopeTaskGroupKey } from '@/lib/scope-task-grouping'
import { MAX_SCOPE_CHARS } from '@/lib/constants/scope-limits'

export function useProjectScopeSection(
  userId: string,
  project: Project,
  onProjectUpdated: () => void
) {
  const [scopeDraft, setScopeDraft] = useState(project.scopeMarkdown || '')
  const [backlog, setBacklog] = useState<
    {
      id: string
      text: string
      orderIndex: number
      scopeGroup?: ScopeTaskGroupKey | null
    }[]
  >([])
  const [loadingBacklog, setLoadingBacklog] = useState(true)
  const [savingScope, setSavingScope] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [genSource, setGenSource] = useState<'gemini' | 'heuristic' | null>(null)

  const loadBacklog = useCallback(async () => {
    setLoadingBacklog(true)
    const result = await getProjectBacklogActions(userId, project.id)
    setLoadingBacklog(false)
    if (result.success) {
      setBacklog(
        result.data.map((a) => ({
          id: a.id,
          text: a.text,
          orderIndex: a.orderIndex,
          scopeGroup: a.scopeGroup,
        }))
      )
    }
  }, [userId, project.id])

  useEffect(() => {
    setScopeDraft(project.scopeMarkdown || '')
  }, [project.id, project.scopeMarkdown])

  useEffect(() => {
    void loadBacklog()
  }, [loadBacklog])

  async function saveScope() {
    if (scopeDraft.length > MAX_SCOPE_CHARS) {
      setError(`Scope is too long (max ${MAX_SCOPE_CHARS.toLocaleString()} characters).`)
      return
    }
    setSavingScope(true)
    setError(null)
    const result = await updateProject(project.id, {
      scopeMarkdown: scopeDraft.trim() || null,
    })
    setSavingScope(false)
    if (!result.success) {
      setError(result.error || 'Failed to save scope')
      return
    }
    onProjectUpdated()
  }

  function applyFileText(text: string) {
    if (text.length > MAX_SCOPE_CHARS) {
      setError(`File is too long (max ${MAX_SCOPE_CHARS.toLocaleString()} characters).`)
      return
    }
    setScopeDraft(text)
    setError(null)
  }

  async function generateTasks() {
    const scope = scopeDraft.trim() || (project.scopeMarkdown || '').trim()
    if (!scope) {
      setError('Paste or import scope, then save — or generate using saved scope.')
      return
    }

    const existing = await getProjectBacklogActions(userId, project.id)
    if (
      existing.success &&
      existing.data.length > 0 &&
      !window.confirm(
        'Replace existing backlog tasks with a new list generated from scope? This cannot be undone.'
      )
    ) {
      return
    }

    setGenerating(true)
    setError(null)
    setGenSource(null)

    const gen = await generateTasksFromScope(scope, project.name)
    if (!gen.success) {
      setGenerating(false)
      setError(gen.error || 'Failed to generate tasks')
      return
    }
    if (!gen.data) {
      setGenerating(false)
      setError('Failed to generate tasks')
      return
    }

    const replace = await replaceProjectBacklogActions(
      userId,
      project.id,
      gen.data.tasks
    )
    setGenerating(false)

    if (!replace.success) {
      setError(replace.error || 'Failed to save tasks')
      return
    }

    setGenSource(gen.data.source)
    await loadBacklog()
    onProjectUpdated()
  }

  const scopeTooLong = scopeDraft.length > MAX_SCOPE_CHARS

  return {
    scopeDraft,
    setScopeDraft,
    backlog,
    loadingBacklog,
    savingScope,
    generating,
    error,
    setError,
    genSource,
    saveScope,
    applyFileText,
    generateTasks,
    scopeTooLong,
    loadBacklog,
    maxScopeChars: MAX_SCOPE_CHARS,
  }
}
