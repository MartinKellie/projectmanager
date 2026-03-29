'use client'

import { Button } from '@/components/ui/button'
import type { Project } from '@/types/database'
import { formTextareaClass } from '@/components/edit-forms/form-input-classes'
import { FileUp, Loader2 } from 'lucide-react'
import { useProjectScopeSection } from '@/hooks/use-project-scope-section'
import { ProjectScopeBacklogList } from './project-scope-backlog-list'

interface ProjectDetailScopeSectionProps {
  userId: string
  project: Project
  onProjectUpdated: () => void
}

export function ProjectDetailScopeSection({
  userId,
  project,
  onProjectUpdated,
}: ProjectDetailScopeSectionProps) {
  const {
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
    maxScopeChars,
  } = useProjectScopeSection(userId, project, onProjectUpdated)

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      applyFileText(text)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <section className="mt-6 space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div>
        <h3 className="text-sm font-semibold text-white/90">Scope & tasks</h3>
        <p className="text-xs text-white/45 mt-1">
          Add or import <code className="text-white/60">scope.md</code>, save, then generate an
          ordered backlog. Max {maxScopeChars.toLocaleString()} characters.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            className="sr-only"
            onChange={handleFilePick}
          />
          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5">
            <FileUp size={14} />
            Import file
          </span>
        </label>
        <span className="text-xs text-white/40">
          {scopeDraft.length.toLocaleString()} / {maxScopeChars.toLocaleString()}
        </span>
      </div>

      <textarea
        value={scopeDraft}
        onChange={(e) => {
          setScopeDraft(e.target.value)
          setError(null)
        }}
        placeholder="Paste scope markdown here…"
        className={formTextareaClass}
        rows={8}
        spellCheck={false}
      />

      {scopeTooLong ? (
        <p className="text-xs text-amber-200">Reduce size to save.</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={savingScope || scopeTooLong}
          onClick={() => void saveScope()}
        >
          {savingScope ? 'Saving…' : 'Save scope'}
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={generating || scopeTooLong}
          onClick={() => void generateTasks()}
        >
          {generating ? (
            <>
              <Loader2 size={14} className="animate-spin mr-1 inline" />
              Generating…
            </>
          ) : (
            'Generate tasks from scope'
          )}
        </Button>
      </div>

      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      {genSource ? (
        <p className="text-xs text-white/45">
          Tasks generated using {genSource === 'gemini' ? 'AI' : 'offline heuristics'} (headings &
          bullets).
        </p>
      ) : null}

      <ProjectScopeBacklogList
        loading={loadingBacklog}
        items={backlog}
        userId={userId}
        projectId={project.id}
        onBacklogChanged={() => void loadBacklog()}
      />
    </section>
  )
}
