'use client'

import { useEffect, useState, useCallback } from 'react'
import { deleteContact, getUserContacts } from '@/services/contacts'
import { getUserBusinesses } from '@/services/businesses'
import { AnimatedCard } from '@/components/ui/animated-card'
import { APP_DATA_REFRESH_EVENT } from '@/lib/events/data-refresh'
import { triggerAppToast } from '@/lib/events/toast'
import type { Contact, Business } from '@/types/database'
import { User, Mail, Phone, Briefcase, Building2 } from 'lucide-react'
import { ContactDetailModal } from '@/components/detail/contact-detail-modal'
import { EditContactModal } from '@/components/edit-forms/edit-contact-modal'
import { handleCardOpenKeyDown } from '@/lib/utils/card-open-keyboard'
import { isSampleContact } from '@/lib/data/is-sample-data'

interface ContactsViewProps {
  userId: string
}

export function ContactsView({ userId }: ContactsViewProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [detailContact, setDetailContact] = useState<Contact | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [contactsResult, businessesResult] = await Promise.all([
        getUserContacts(userId),
        getUserBusinesses(userId),
      ])

      if (contactsResult.success) setContacts(contactsResult.data)
      if (businessesResult.success) setBusinesses(businessesResult.data)
    } catch (error) {
      console.error('Failed to load contacts:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) loadData()
  }, [userId, loadData])

  async function handleDeleteContact(contact: Contact) {
    const confirmed = window.confirm(`Delete contact "${contact.firstName} ${contact.lastName}"?`)
    if (!confirmed) return

    const result = await deleteContact(contact.id)
    if (!result.success) return window.alert(result.error || 'Failed to delete contact')

    triggerAppToast({ message: 'Contact deleted' })
    loadData()
    setDetailContact(null)
  }

  useEffect(() => {
    function handleRefresh() {
      if (!userId) return
      setLoading(true)
      loadData()
    }

    window.addEventListener(APP_DATA_REFRESH_EVENT, handleRefresh)
    return () => window.removeEventListener(APP_DATA_REFRESH_EVENT, handleRefresh)
  }, [userId, loadData])

  const getBusinessName = (businessId: string) => {
    return businesses.find((b) => b.id === businessId)?.name || 'Unknown Business'
  }

  if (loading) {
    return (
      <div className="text-white/60 text-sm">Loading contacts...</div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-8">
        <User size={48} className="mx-auto mb-4 text-white/40" />
        <p className="text-white/60">No contacts yet</p>
        <p className="text-xs text-white/40 mt-2">Use &quot;Add New&quot; to create your first contact</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {contacts.map((contact, index) => (
          <AnimatedCard
            key={contact.id}
            className="p-4"
            variant="default"
            tone={isSampleContact(contact) ? 'sample' : 'default'}
            index={index}
          >
            <div
              className="flex items-start gap-3 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/25 -m-1 p-1"
              role="button"
              tabIndex={0}
              onClick={() => setDetailContact(contact)}
              onKeyDown={(e) =>
                handleCardOpenKeyDown(e, () => setDetailContact(contact))
              }
            >
              <div className="p-2 rounded-lg bg-white/10 flex-shrink-0 icon-bounce pointer-events-none">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1">
                  {contact.firstName} {contact.lastName}
                </h3>
                <div
                  className="mb-2 flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="text-xs text-white/60 hover:text-white"
                    onClick={() => setEditingContact(contact)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-300 hover:text-red-200"
                    onClick={() => handleDeleteContact(contact)}
                  >
                    Delete
                  </button>
                </div>
                <div className="space-y-1 text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <Building2 size={12} />
                    <span>{getBusinessName(contact.businessId)}</span>
                  </div>
                  {contact.role && (
                    <div className="flex items-center gap-2">
                      <Briefcase size={12} />
                      <span>{contact.role}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={12} />
                      <a
                        href={`mailto:${contact.email}`}
                        className="hover:text-white transition-colors truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} />
                      <a
                        href={`tel:${contact.phone}`}
                        className="hover:text-white transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.notes && (
                    <p className="text-white/50 mt-2 line-clamp-2">{contact.notes}</p>
                  )}
                </div>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>
      <ContactDetailModal
        contact={detailContact}
        businessName={
          detailContact ? getBusinessName(detailContact.businessId) : ''
        }
        isOpen={detailContact !== null}
        onClose={() => setDetailContact(null)}
        onEdit={() => {
          if (!detailContact) return
          setEditingContact(detailContact)
          setDetailContact(null)
        }}
        onDelete={() => {
          if (!detailContact) return
          void handleDeleteContact(detailContact)
        }}
      />
      <EditContactModal
        userId={userId}
        contact={editingContact}
        isOpen={editingContact !== null}
        onClose={() => setEditingContact(null)}
        onSaved={() => {
          triggerAppToast({ message: 'Contact updated' })
          loadData()
        }}
      />
    </>
  )
}
