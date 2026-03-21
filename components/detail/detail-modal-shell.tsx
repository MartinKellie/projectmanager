'use client'

import { GlassPanel } from '@/components/layout/glass-panel'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'

interface DetailModalShellProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string | null
  /** e.g. Edit / Delete — shown before the close control */
  headerActions?: ReactNode
  children: React.ReactNode
  footerNote?: ReactNode
}

export function DetailModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  headerActions,
  children,
  footerNote,
}: DetailModalShellProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <GlassPanel
        variant="solid"
        className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0"
      >
        <div
          className="flex flex-col h-full min-h-0"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
        >
        <div className="flex items-start justify-between gap-3 p-6 pb-4 border-b border-white/10 flex-shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <h2 id="detail-modal-title" className="text-xl font-semibold truncate">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-sm text-white/55 mt-1">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {headerActions}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              aria-label="Close"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 px-6 py-4">{children}</div>

        {footerNote ? (
          <div className="px-6 py-3 border-t border-white/10 bg-black/20 flex-shrink-0 text-xs text-white/45">
            {footerNote}
          </div>
        ) : null}
        </div>
      </GlassPanel>
    </div>
  )
}
