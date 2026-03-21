'use client'

import { useEffect, useState } from 'react'
import { updateBusiness } from '@/services/businesses'
import type { Business } from '@/types/database'
import { EditRecordModalShell } from './edit-record-modal-shell'
import { formInputClass, formTextareaClass } from './form-input-classes'

interface EditBusinessModalProps {
  business: Business | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export function EditBusinessModal({
  business,
  isOpen,
  onClose,
  onSaved,
}: EditBusinessModalProps) {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!business || !isOpen) return
    setName(business.name)
    setWebsite(business.website || '')
    setIndustry(business.industry || '')
    setNotes(business.notes || '')
    setError(null)
  }, [business, isOpen])

  async function handleSubmit() {
    if (!business) return
    if (!name.trim()) {
      setError('Business name is required')
      return
    }

    setSaving(true)
    setError(null)
    const result = await updateBusiness(business.id, {
      name: name.trim(),
      website: website.trim() || null,
      industry: industry.trim() || null,
      notes: notes.trim() || null,
    })
    setSaving(false)

    if (!result.success) {
      setError(result.error || 'Failed to update business')
      return
    }

    onSaved()
    onClose()
  }

  if (!isOpen || !business) return null

  return (
    <EditRecordModalShell
      isOpen={isOpen}
      title="Edit business"
      onClose={onClose}
      saving={saving}
      error={error}
      onSubmit={handleSubmit}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Business name"
        className={formInputClass}
        autoComplete="organization"
      />
      <input
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="Website (optional)"
        className={formInputClass}
        inputMode="url"
      />
      <input
        value={industry}
        onChange={(e) => setIndustry(e.target.value)}
        placeholder="Industry (optional)"
        className={formInputClass}
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className={formTextareaClass}
      />
    </EditRecordModalShell>
  )
}
