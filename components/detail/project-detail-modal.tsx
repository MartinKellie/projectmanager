'use client'

import type { Project } from '@/types/database'
import { DetailModalShell } from './detail-modal-shell'
import { DetailModalActions } from './detail-modal-actions'
import { ProjectDetailContent } from './project-detail-content'

interface ProjectDetailModalProps {
  userId: string
  project: Project | null
  linkedBusinessName: string | null
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void | Promise<void>
  onDelete?: () => void | Promise<void>
  onProjectUpdated?: () => void
}

export function ProjectDetailModal({
  userId,
  project,
  linkedBusinessName,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onProjectUpdated,
}: ProjectDetailModalProps) {
  if (!isOpen || !project) return null

  const subtitleParts = [
    project.archived ? 'Archived' : null,
    project.clientName,
  ].filter(Boolean)
  const subtitle = subtitleParts.length ? subtitleParts.join(' · ') : undefined

  const showActions = onEdit && onDelete

  return (
    <DetailModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={project.name}
      subtitle={subtitle}
      headerActions={
        showActions ? (
          <DetailModalActions onEdit={onEdit} onDelete={onDelete} />
        ) : null
      }
    >
      <ProjectDetailContent
        userId={userId}
        project={project}
        linkedBusinessName={linkedBusinessName}
        onProjectUpdated={onProjectUpdated}
      />
    </DetailModalShell>
  )
}
