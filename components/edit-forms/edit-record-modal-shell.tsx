'use client'

import { GlassPanel } from '@/components/layout/glass-panel'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'

interface EditRecordModalShellProps {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
  saving: boolean
  error: string | null
  onSubmit: () => void
  submitLabel?: string
}

export function EditRecordModalShell({
  isOpen,
  title,
  onClose,
  children,
  saving,
  error,
  onSubmit,
  submitLabel = 'Save changes',
}: EditRecordModalShellProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <GlassPanel
        variant="solid"
        className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-record-title"
        >
        <div className="flex justify-between items-start gap-3">
          <h2 id="edit-record-title" className="text-lg font-semibold pr-2">
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0 flex-shrink-0"
            aria-label="Close"
            disabled={saving}
          >
            <X size={18} />
          </Button>
        </div>

        <div className="space-y-3">{children}</div>

        {error ? <p className="text-xs text-red-300">{error}</p> : null}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? 'Saving…' : submitLabel}
          </Button>
        </div>
        </div>
      </GlassPanel>
    </div>
  )
}
