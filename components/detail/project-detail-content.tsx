'use client'

import type { Project } from '@/types/database'
import { formatDate, formatRelativeTime } from '@/lib/utils/date'
import { DetailFieldList, DetailFieldRow } from './detail-field-list'
import { PlaceholderDetailSection } from './placeholder-detail-section'
import { SampleDataNotice } from './sample-data-notice'
import { isSampleProject } from '@/lib/data/is-sample-data'
import { ProjectDetailScopeSection } from './project-detail-scope-section'

interface ProjectDetailContentProps {
  userId: string
  project: Project
  linkedBusinessName: string | null
  onProjectUpdated?: () => void
}

export function ProjectDetailContent({
  userId,
  project,
  linkedBusinessName,
  onProjectUpdated,
}: ProjectDetailContentProps) {
  return (
    <>
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
        <DetailFieldRow
          label="Record ID"
          value={<code className="text-xs text-white/70">{project.id}</code>}
        />
      </DetailFieldList>

      <ProjectDetailScopeSection
        userId={userId}
        project={project}
        onProjectUpdated={() => onProjectUpdated?.()}
      />

      <PlaceholderDetailSection />
    </>
  )
}
