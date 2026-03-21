'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createBusiness, getUserBusinesses } from '@/services/businesses'
import { createContact } from '@/services/contacts'
import type { Business } from '@/types/database'

interface BusinessCreateFormProps {
  userId: string
  onCancel: () => void
  onSuccess: () => void
}

interface ContactCreateFormProps {
  userId: string
  onCancel: () => void
  onSuccess: () => void
  onSwitchToBusiness: () => void
}

export function BusinessCreateForm({ userId, onCancel, onSuccess }: BusinessCreateFormProps) {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Business name is required')
      return
    }

    setSaving(true)
    setError(null)
    const result = await createBusiness(userId, {
      name: name.trim(),
      website: website.trim() || null,
      industry: industry.trim() || null,
      notes: notes.trim() || null,
    })
    setSaving(false)

    if (!result.success) {
      setError(result.error || 'Failed to create business')
      return
    }

    onSuccess()
  }

  return (
    <div className="space-y-3">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Business name"
        className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-sm"
      />
      <input
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
        placeholder="Website (optional)"
        className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-sm"
      />
      <input
        value={industry}
        onChange={(event) => setIndustry(event.target.value)}
        placeholder="Industry (optional)"
        className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-sm"
      />
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Notes (optional)"
        className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-sm min-h-[88px]"
      />
      {error && <p className="text-xs text-red-300">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={onCancel} variant="outline" className="flex-1" disabled={saving}>Back</Button>
        <Button onClick={handleSubmit} variant="default" className="flex-1" disabled={saving}>
          {saving ? 'Saving...' : 'Save Business'}
        </Button>
      </div>
    </div>
  )
}

export function ContactCreateForm({
  userId,
  onCancel,
  onSuccess,
  onSwitchToBusiness,
}: ContactCreateFormProps) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [businessId, setBusinessId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingBusinesses, setLoadingBusinesses] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBusinesses() {
      setLoadingBusinesses(true)
      const result = await getUserBusinesses(userId)
      if (result.success) {
        setBusinesses(result.data)
        if (result.data.length > 0) setBusinessId(result.data[0].id)
      } else {
        setError(result.error || 'Failed to load businesses')
      }
      setLoadingBusinesses(false)
    }
    loadBusinesses()
  }, [userId])

  async function handleSubmit() {
    if (!businessId) return setError('Please choose a business')
    if (!firstName.trim()) return setError('First name is required')
    if (!lastName.trim()) return setError('Last name is required')

    setSaving(true)
    setError(null)
    const result = await createContact(userId, {
      businessId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      role: role.trim() || null,
      notes: notes.trim() || null,
    })
    setSaving(false)

    if (!result.success) return setError(result.error || 'Failed to create contact')
    onSuccess()
  }

  return (
    <div className="space-y-3">
      {loadingBusinesses ? (
        <p className="text-sm text-white/60">Loading businesses...</p>
      ) : businesses.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-white/70">Create a business first, then add a contact.</p>
          <div className="flex gap-2">
            <Button onClick={onCancel} variant="outline" className="flex-1">Back</Button>
            <Button onClick={onSwitchToBusiness} variant="default" className="flex-1">Add Business</Button>
          </div>
        </div>
      ) : (
        <>
          <select
            value={businessId}
            onChange={(event) => setBusinessId(event.target.value)}
            className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-black/20 text-white text-sm"
          >
            {businesses.map((business) => (
              <option
                key={business.id}
                value={business.id}
                className="bg-slate-900 text-white"
              >
                {business.name}
              </option>
            ))}
          </select>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-sm" />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-sm" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-sm" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-sm" />
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (optional)" className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-sm" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-sm min-h-[88px]" />
          {error && <p className="text-xs text-red-300">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={onCancel} variant="outline" className="flex-1" disabled={saving}>Back</Button>
            <Button onClick={handleSubmit} variant="default" className="flex-1" disabled={saving}>
              {saving ? 'Saving...' : 'Save Contact'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

