'use client'

import type { Project } from '@/types/database'
import { formatDate, formatRelativeTime } from '@/lib/utils/date'
import { DetailModalShell } from './detail-modal-shell'
import { DetailFieldList, DetailFieldRow } from './detail-field-list'
import { PlaceholderDetailSection } from './placeholder-detail-section'
import { DetailModalActions } from './detail-modal-actions'
import { SampleDataNotice } from './sample-data-notice'
import { isSampleProject } from '@/lib/data/is-sample-data'

interface ProjectDetailModalProps {
  project: Project | null
  linkedBusinessName: string | null
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void | Promise<void>
  onDelete?: () => void | Promise<void>
}

export function ProjectDetailModal({
  project,
  linkedBusinessName,
  isOpen,
  onClose,
  onEdit,
  onDelete,
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
      {isSampleProject(project) ? <SampleDataNotice /> : null}
      <DetailFieldList>
        <DetailFieldRow label="Client" value={project.clientName} />
        <DetailFieldRow
          label="Linked business"
          value={
            project.businessId
              ? linkedBusinessName || `Business ID: ${project.businessId}`
              : 'Personal / no business'
          }
        />
        <DetailFieldRow
          label="Fixed fee"
          value={
            project.fixedFee != null
              ? `£${project.fixedFee.toLocaleString('en-GB')}`
              : null
          }
        />
        <DetailFieldRow
          label="Deadline"
          value={project.deadline ? formatDate(project.deadline) : null}
        />
        <DetailFieldRow
          label="Confidence"
          value={`${project.confidenceScore}%`}
        />
        <DetailFieldRow
          label="Last touched"
          value={formatRelativeTime(project.lastTouchedAt)}
        />
        <DetailFieldRow
          label="Created"
          value={formatDate(project.createdAt)}
        />
        <DetailFieldRow
          label="Template"
          value={
            project.templateProjectId
              ? `Linked · ${project.templateProjectId.slice(0, 8)}…`
              : null
          }
        />
        <DetailFieldRow label="Record ID" value={<code className="text-xs text-white/70">{project.id}</code>} />
      </DetailFieldList>
      <PlaceholderDetailSection />
    </DetailModalShell>
  )
}
