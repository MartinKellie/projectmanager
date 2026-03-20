'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getUserBusinesses } from '@/services/businesses'
import { createProject } from '@/services/projects'
import type { Business } from '@/types/database'

interface ProjectCreateFormProps {
  userId: string
  onCancel: () => void
  onSuccess: (projectId: string) => void
}

export function ProjectCreateForm({ userId, onCancel, onSuccess }: ProjectCreateFormProps) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [businessId, setBusinessId] = useState<string>('')
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [fixedFee, setFixedFee] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingBusinesses, setLoadingBusinesses] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBusinesses() {
      setLoadingBusinesses(true)
      const result = await getUserBusinesses(userId)
      if (result.success) setBusinesses(result.data)
      setLoadingBusinesses(false)
    }
    loadBusinesses()
  }, [userId])

  async function handleSubmit() {
    if (!name.trim()) return setError('Project name is required')

    const selectedBusiness = businesses.find((business) => business.id === businessId)
    const resolvedClientName = clientName.trim() || selectedBusiness?.name || 'Personal'
    const parsedFee = fixedFee.trim() ? Number(fixedFee.trim()) : null
    if (fixedFee.trim() && Number.isNaN(parsedFee)) return setError('Fixed fee must be a number')

    setSaving(true)
    setError(null)
    const result = await createProject(userId, {
      businessId: businessId || null,
      name: name.trim(),
      clientName: resolvedClientName,
      fixedFee: parsedFee,
      deadline: null,
      confidenceScore: 50,
      archived: false,
      templateProjectId: null,
    })
    setSaving(false)

    if (!result.success) return setError(result.error || 'Failed to create project')
    onSuccess(result.data)
  }

  return (
    <div className="space-y-3">
      {loadingBusinesses ? (
        <p className="text-sm text-white/60">Loading businesses...</p>
      ) : (
        <select
          value={businessId}
          onChange={(event) => setBusinessId(event.target.value)}
          className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-black/20 text-white text-sm"
        >
          <option value="">No business (personal/internal)</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>{business.name}</option>
          ))}
        </select>
      )}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-sm" />
      <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name (optional)" className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-sm" />
      <input value={fixedFee} onChange={(e) => setFixedFee(e.target.value)} placeholder="Fixed fee in GBP (optional)" className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-sm" />
      {error && <p className="text-xs text-red-300">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={onCancel} variant="outline" className="flex-1" disabled={saving}>Back</Button>
        <Button onClick={handleSubmit} variant="default" className="flex-1" disabled={saving}>
          {saving ? 'Saving...' : 'Save Project'}
        </Button>
      </div>
    </div>
  )
}

