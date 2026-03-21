'use client'

import { useEffect, useState } from 'react'
import { getUserBusinesses } from '@/services/businesses'
import { updateContact } from '@/services/contacts'
import type { Business, Contact } from '@/types/database'
import { EditRecordModalShell } from './edit-record-modal-shell'
import { formInputClass, formSelectClass, formTextareaClass } from './form-input-classes'

interface EditContactModalProps {
  userId: string
  contact: Contact | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export function EditContactModal({
  userId,
  contact,
  isOpen,
  onClose,
  onSaved,
}: EditContactModalProps) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loadingBusinesses, setLoadingBusinesses] = useState(true)
  const [businessId, setBusinessId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !userId) return
    async function load() {
      setLoadingBusinesses(true)
      const result = await getUserBusinesses(userId)
      if (result.success) setBusinesses(result.data)
      setLoadingBusinesses(false)
    }
    void load()
  }, [isOpen, userId])

  useEffect(() => {
    if (!contact || !isOpen) return
    setBusinessId(contact.businessId)
    setFirstName(contact.firstName)
    setLastName(contact.lastName)
    setEmail(contact.email || '')
    setPhone(contact.phone || '')
    setRole(contact.role || '')
    setNotes(contact.notes || '')
    setError(null)
  }, [contact, isOpen])

  async function handleSubmit() {
    if (!contact) return
    if (!businessId) {
      setError('Please choose a business')
      return
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required')
      return
    }

    setSaving(true)
    setError(null)
    const result = await updateContact(contact.id, {
      businessId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      role: role.trim() || null,
      notes: notes.trim() || null,
    })
    setSaving(false)

    if (!result.success) {
      setError(result.error || 'Failed to update contact')
      return
    }

    onSaved()
    onClose()
  }

  if (!isOpen || !contact) return null

  return (
    <EditRecordModalShell
      isOpen={isOpen}
      title="Edit contact"
      onClose={onClose}
      saving={saving}
      error={error}
      onSubmit={handleSubmit}
    >
      {loadingBusinesses ? (
        <p className="text-sm text-white/60">Loading businesses…</p>
      ) : businesses.length === 0 ? (
        <p className="text-sm text-amber-200/90">
          Add a business first, then you can assign this contact to it.
        </p>
      ) : (
        <select
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          className={formSelectClass}
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id} className="bg-slate-900 text-white">
              {b.name}
            </option>
          ))}
        </select>
      )}
      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First name"
        className={formInputClass}
        autoComplete="given-name"
      />
      <input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Last name"
        className={formInputClass}
        autoComplete="family-name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (optional)"
        className={formInputClass}
        type="email"
        autoComplete="email"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone (optional)"
        className={formInputClass}
        type="tel"
        autoComplete="tel"
      />
      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Role (optional)"
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
