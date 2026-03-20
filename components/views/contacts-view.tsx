'use client'

import { useEffect, useState } from 'react'
import { getUserContacts } from '@/services/contacts'
import { getUserBusinesses } from '@/services/businesses'
import { AnimatedCard } from '@/components/ui/animated-card'
import type { Contact, Business } from '@/types/database'
import { User, Mail, Phone, Briefcase, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ContactsViewProps {
  userId: string
}

export function ContactsView({ userId }: ContactsViewProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [contactsResult, businessesResult] = await Promise.all([
          getUserContacts(userId),
          getUserBusinesses(userId),
        ])

        if (contactsResult.success) {
          setContacts(contactsResult.data)
        }
        if (businessesResult.success) {
          setBusinesses(businessesResult.data)
        }
      } catch (error) {
        console.error('Failed to load contacts:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadData()
    }
  }, [userId])

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
    <div className="space-y-3">
      {contacts.map((contact, index) => (
        <AnimatedCard
          key={contact.id}
          className="p-4"
          variant="default"
          index={index}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white/10 flex-shrink-0 icon-bounce">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold mb-1">
                {contact.firstName} {contact.lastName}
              </h3>
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
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.notes && (
                  <p className="text-white/50 mt-2">{contact.notes}</p>
                )}
              </div>
            </div>
          </div>
        </AnimatedCard>
      ))}
    </div>
  )
}
