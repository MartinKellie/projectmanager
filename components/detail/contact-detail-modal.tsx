'use client'

import type { Contact } from '@/types/database'
import { formatDate } from '@/lib/utils/date'
import { DetailModalShell } from './detail-modal-shell'
import { DetailFieldList, DetailFieldRow } from './detail-field-list'
import { PlaceholderDetailSection } from './placeholder-detail-section'
import { DetailModalActions } from './detail-modal-actions'
import { SampleDataNotice } from './sample-data-notice'
import { isSampleContact } from '@/lib/data/is-sample-data'

interface ContactDetailModalProps {
  contact: Contact | null
  businessName: string
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void | Promise<void>
  onDelete?: () => void | Promise<void>
}

export function ContactDetailModal({
  contact,
  businessName,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: ContactDetailModalProps) {
  if (!isOpen || !contact) return null

  const fullName = `${contact.firstName} ${contact.lastName}`.trim()
  const subtitle = [contact.archived ? 'Archived' : null, businessName]
    .filter(Boolean)
    .join(' · ') || undefined

  const showActions = onEdit && onDelete

  return (
    <DetailModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={fullName || 'Contact'}
      subtitle={subtitle || undefined}
      headerActions={
        showActions ? (
          <DetailModalActions onEdit={onEdit} onDelete={onDelete} />
        ) : null
      }
    >
      {isSampleContact(contact) ? <SampleDataNotice /> : null}
      <DetailFieldList>
        <DetailFieldRow label="Business" value={businessName} />
        <DetailFieldRow label="Role" value={contact.role} />
        <DetailFieldRow
          label="Email"
          value={
            contact.email ? (
              <a
                href={`mailto:${contact.email}`}
                className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
              >
                {contact.email}
              </a>
            ) : null
          }
        />
        <DetailFieldRow
          label="Phone"
          value={
            contact.phone ? (
              <a
                href={`tel:${contact.phone}`}
                className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
              >
                {contact.phone}
              </a>
            ) : null
          }
        />
        <DetailFieldRow label="Notes" value={contact.notes} />
        <DetailFieldRow
          label="Created"
          value={formatDate(contact.createdAt)}
        />
        <DetailFieldRow label="Record ID" value={<code className="text-xs text-white/70">{contact.id}</code>} />
      </DetailFieldList>
      <PlaceholderDetailSection />
    </DetailModalShell>
  )
}
