'use client'

import type { Action } from '@/types/database'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TodayFocusActionRowsProps {
  actions: Action[]
  onComplete: (actionId: string, projectId: string | null) => void
  variant?: 'focus' | 'queued'
}

export function TodayFocusActionRows({
  actions,
  onComplete,
  variant = 'focus',
}: TodayFocusActionRowsProps) {
  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <div
          key={action.id}
          role="button"
          tabIndex={0}
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg glass cursor-pointer transition-all',
            variant === 'focus' ? 'hover:glass-strong' : 'border border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
          )}
          onClick={() => onComplete(action.id, action.projectId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onComplete(action.id, action.projectId)
            }
          }}
        >
          <button type="button" className="mt-0.5" aria-hidden tabIndex={-1}>
            {action.status === 'completed' ? (
              <CheckCircle2 size={20} className="text-green-400" />
            ) : (
              <Circle size={20} className="text-white/40 hover:text-white/60" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm',
                action.status === 'completed' && 'line-through text-white/40'
              )}
            >
              {action.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
