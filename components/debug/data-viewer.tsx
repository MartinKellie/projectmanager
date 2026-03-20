'use client'

import { useEffect, useState } from 'react'
import { getUserProjects } from '@/services/projects'
import { getUserBusinesses } from '@/services/businesses'
import { getUserContacts } from '@/services/contacts'
import { GlassPanel } from '@/components/layout/glass-panel'
import { Button } from '@/components/ui/button'
import { useAuthContext } from '@/contexts/auth-context'
import type { Project, Business, Contact } from '@/types/database'

export function DataViewer() {
  const { user } = useAuthContext()
  const [projects, setProjects] = useState<Project[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        const [projectsResult, businessesResult, contactsResult] = await Promise.all([
          getUserProjects(user.uid),
          getUserBusinesses(user.uid),
          getUserContacts(user.uid),
        ])

        if (projectsResult.success) setProjects(projectsResult.data)
        if (businessesResult.success) setBusinesses(businessesResult.data)
        if (contactsResult.success) setContacts(contactsResult.data)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  if (!user) {
    return <div className="text-white/60">Not authenticated</div>
  }

  if (loading) {
    return <div className="text-white/60">Loading data...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Debug: Data Viewer</h3>
        <Button
          onClick={() => window.location.reload()}
          variant="ghost"
          size="sm"
        >
          Refresh
        </Button>
      </div>

      <GlassPanel variant="default" className="p-3">
        <h4 className="text-xs font-semibold mb-2 text-white/80">Businesses ({businesses.length})</h4>
        {businesses.length === 0 ? (
          <p className="text-xs text-white/40">No businesses</p>
        ) : (
          <ul className="text-xs text-white/60 space-y-1">
            {businesses.map((b) => (
              <li key={b.id}>• {b.name}</li>
            ))}
          </ul>
        )}
      </GlassPanel>

      <GlassPanel variant="default" className="p-3">
        <h4 className="text-xs font-semibold mb-2 text-white/80">Contacts ({contacts.length})</h4>
        {contacts.length === 0 ? (
          <p className="text-xs text-white/40">No contacts</p>
        ) : (
          <ul className="text-xs text-white/60 space-y-1">
            {contacts.map((c) => (
              <li key={c.id}>• {c.firstName} {c.lastName} ({c.role})</li>
            ))}
          </ul>
        )}
      </GlassPanel>

      <GlassPanel variant="default" className="p-3">
        <h4 className="text-xs font-semibold mb-2 text-white/80">Projects ({projects.length})</h4>
        {projects.length === 0 ? (
          <p className="text-xs text-white/40">No projects</p>
        ) : (
          <ul className="text-xs text-white/60 space-y-1">
            {projects.map((p) => (
              <li key={p.id}>• {p.name} - {p.clientName}</li>
            ))}
          </ul>
        )}
      </GlassPanel>

      <GlassPanel variant="default" className="p-3">
        <h4 className="text-xs font-semibold mb-2 text-white/80">LocalStorage Keys</h4>
        <ul className="text-xs text-white/60 space-y-1">
          {Object.keys(localStorage).map((key) => (
            <li key={key}>• {key}</li>
          ))}
        </ul>
      </GlassPanel>
    </div>
  )
}
