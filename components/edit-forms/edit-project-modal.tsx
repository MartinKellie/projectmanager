'use client'

import { useEffect, useState } from 'react'
import { getUserBusinesses } from '@/services/businesses'
import { updateProject } from '@/services/projects'
import { dateToTimestamp } from '@/lib/storage/firestore'
import type { Business, Project } from '@/types/database'
import { EditRecordModalShell } from './edit-record-modal-shell'
import { formInputClass, formSelectClass } from './form-input-classes'

interface EditProjectModalProps {
  userId: string
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

function deadlineToInputValue(deadline: Date | string | null): string {
  if (!deadline) return ''
  const d = deadline instanceof Date ? deadline : new Date(deadline)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export function EditProjectModal({
  userId,
  project,
  isOpen,
  onClose,
  onSaved,
}: EditProjectModalProps) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loadingBusinesses, setLoadingBusinesses] = useState(true)
  const [businessId, setBusinessId] = useState<string>('')
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [fixedFee, setFixedFee] = useState('')
  const [deadline, setDeadline] = useState('')
  const [confidenceScore, setConfidenceScore] = useState('50')
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
    if (!project || !isOpen) return
    setBusinessId(project.businessId || '')
    setName(project.name)
    setClientName(project.clientName)
    setFixedFee(project.fixedFee != null ? String(project.fixedFee) : '')
    setDeadline(deadlineToInputValue(project.deadline))
    setConfidenceScore(String(project.confidenceScore))
    setError(null)
  }, [project, isOpen])

  async function handleSubmit() {
    if (!project) return
    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    const parsedFee = fixedFee.trim() ? Number(fixedFee.trim()) : null
    if (fixedFee.trim() && Number.isNaN(parsedFee)) {
      setError('Fixed fee must be a number')
      return
    }

    const conf = Number(confidenceScore)
    if (Number.isNaN(conf) || conf < 0 || conf > 100) {
      setError('Confidence must be between 0 and 100')
      return
    }

    const selectedBusiness = businesses.find((b) => b.id === businessId)
    const resolvedClient =
      clientName.trim() || selectedBusiness?.name || project.clientName

    setSaving(true)
    setError(null)

    const deadlineIso = deadline.trim()
      ? dateToTimestamp(new Date(`${deadline.trim()}T12:00:00`))
      : null

    const result = await updateProject(project.id, {
      name: name.trim(),
      clientName: resolvedClient,
      businessId: businessId || null,
      fixedFee: parsedFee,
      deadline: deadlineIso,
      confidenceScore: Math.round(conf),
      lastTouchedAt: dateToTimestamp(new Date()),
    })
    setSaving(false)

    if (!result.success) {
      setError(result.error || 'Failed to update project')
      return
    }

    onSaved()
    onClose()
  }

  if (!isOpen || !project) return null

  return (
    <EditRecordModalShell
      isOpen={isOpen}
      title="Edit project"
      onClose={onClose}
      saving={saving}
      error={error}
      onSubmit={handleSubmit}
    >
      {loadingBusinesses ? (
        <p className="text-sm text-white/60">Loading businesses…</p>
      ) : (
        <select
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          className={formSelectClass}
        >
          <option value="">No business (personal / internal)</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id} className="bg-slate-900 text-white">
              {b.name}
            </option>
          ))}
        </select>
      )}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name"
        className={formInputClass}
      />
      <input
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
        placeholder="Client name (optional — defaults to business name)"
        className={formInputClass}
      />
      <input
        value={fixedFee}
        onChange={(e) => setFixedFee(e.target.value)}
        placeholder="Fixed fee in GBP (optional)"
        className={formInputClass}
        inputMode="decimal"
      />
      <div>
        <label className="block text-xs text-white/50 mb-1">Deadline (optional)</label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={formInputClass}
        />
      </div>
      <div>
        <label className="block text-xs text-white/50 mb-1">
          Confidence (0–100)
        </label>
        <input
          value={confidenceScore}
          onChange={(e) => setConfidenceScore(e.target.value)}
          placeholder="50"
          className={formInputClass}
          inputMode="numeric"
          min={0}
          max={100}
        />
      </div>
    </EditRecordModalShell>
  )
}
