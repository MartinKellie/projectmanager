'use client'

import { GlassPanel } from '@/components/layout/glass-panel'
import { Button } from '@/components/ui/button'
import { DetailModalActions } from '@/components/detail/detail-modal-actions'
import { ProjectDetailContent } from '@/components/detail/project-detail-content'
import type { Project } from '@/types/database'
import { X } from 'lucide-react'

interface ProjectFocusOverlayProps {
  userId: string
  project: Project
  linkedBusinessName: string | null
  onClose: () => void
  onOpenInline: () => void
  onEdit: () => void
  onDelete: () => void | Promise<void>
  onProjectUpdated?: () => void
}

export function ProjectFocusOverlay({
  userId,
  project,
  linkedBusinessName,
  onClose,
  onOpenInline,
  onEdit,
  onDelete,
  onProjectUpdated,
}: ProjectFocusOverlayProps) {
  const subtitleParts = [
    project.archived ? 'Archived' : null,
    project.clientName,
  ].filter(Boolean)
  const subtitle = subtitleParts.length ? subtitleParts.join(' · ') : undefined

  return (
    <div
      className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center p-3 sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="pointer-events-auto absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close project overlay"
      />
      <GlassPanel
        variant="solid"
        className="pointer-events-auto relative z-10 flex h-full max-h-[min(88vh,100%)] w-full max-w-4xl flex-col overflow-hidden p-0"
      >
        <div
          className="flex min-h-0 flex-1 flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-focus-title"
        >
          <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-white/10 p-5 pb-4">
            <div className="min-w-0 flex-1 pr-2">
              <h2
                id="project-focus-title"
                className="truncate text-xl font-semibold"
              >
                {project.name}
              </h2>
              {subtitle ? (
                <p className="mt-1 text-sm text-white/55">{subtitle}</p>
              ) : null}
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <DetailModalActions onEdit={onEdit} onDelete={onDelete} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
                aria-label="Close"
              >
                <X size={18} />
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <ProjectDetailContent
              userId={userId}
              project={project}
              linkedBusinessName={linkedBusinessName}
              onProjectUpdated={onProjectUpdated}
            />
          </div>

          <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/10 bg-black/20 px-5 py-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button type="button" size="sm" onClick={onOpenInline}>
              Open in Today&apos;s Action area
            </Button>
          </div>
        </div>
      </GlassPanel>
    </div>
  )
}
