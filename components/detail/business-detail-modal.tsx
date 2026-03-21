'use client'

import type { Business } from '@/types/database'
import { formatDate } from '@/lib/utils/date'
import { DetailModalShell } from './detail-modal-shell'
import { DetailFieldList, DetailFieldRow } from './detail-field-list'
import { PlaceholderDetailSection } from './placeholder-detail-section'
import { DetailModalActions } from './detail-modal-actions'
import { SampleDataNotice } from './sample-data-notice'
import { isSampleBusiness } from '@/lib/data/is-sample-data'

interface BusinessDetailModalProps {
  business: Business | null
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void | Promise<void>
  onDelete?: () => void | Promise<void>
}

export function BusinessDetailModal({
  business,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: BusinessDetailModalProps) {
  if (!isOpen || !business) return null

  const subtitle = business.archived ? 'Archived' : undefined

  const showActions = onEdit && onDelete

  return (
    <DetailModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={business.name}
      subtitle={subtitle}
      headerActions={
        showActions ? (
          <DetailModalActions onEdit={onEdit} onDelete={onDelete} />
        ) : null
      }
    >
      {isSampleBusiness(business) ? <SampleDataNotice /> : null}
      <DetailFieldList>
        <DetailFieldRow label="Industry" value={business.industry} />
        <DetailFieldRow
          label="Website"
          value={
            business.website ? (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
              >
                {business.website}
              </a>
            ) : null
          }
        />
        <DetailFieldRow label="Notes" value={business.notes} />
        <DetailFieldRow
          label="Created"
          value={formatDate(business.createdAt)}
        />
        <DetailFieldRow label="Record ID" value={<code className="text-xs text-white/70">{business.id}</code>} />
      </DetailFieldList>
      <PlaceholderDetailSection />
    </DetailModalShell>
  )
}
