'use client'

import type { Action } from '@/types/database'
import { ArrowDown, ArrowUp, CheckCircle2, Circle, CornerDownRight, CornerUpLeft } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface TodayFocusActionRowsProps {
  actions: Action[]
  onComplete: (actionId: string, projectId: string | null) => void
  variant?: 'focus' | 'queued'
  onMoveUp?: (actionId: string) => void
  onMoveDown?: (actionId: string) => void
  onMoveAcross?: (actionId: string, from: 'focus' | 'queue') => void
  onReorderDrop?: (
    sourceActionId: string,
    targetActionId: string,
    list: 'focus' | 'queue'
  ) => void
}

export function TodayFocusActionRows({
  actions,
  onComplete,
  variant = 'focus',
  onMoveUp,
  onMoveDown,
  onMoveAcross,
  onReorderDrop,
}: TodayFocusActionRowsProps) {
  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <div
          key={action.id}
          role="button"
          tabIndex={0}
          draggable
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg glass cursor-pointer transition-all',
            variant === 'focus' ? 'hover:glass-strong' : 'border border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
          )}
          onClick={() => onComplete(action.id, action.projectId)}
          onDragStart={(e) => {
            e.dataTransfer.setData('text/action-id', action.id)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const sourceActionId = e.dataTransfer.getData('text/action-id')
            if (!sourceActionId || sourceActionId === action.id) return
            onReorderDrop?.(sourceActionId, action.id, variant === 'focus' ? 'focus' : 'queue')
          }}
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
          <div className="ml-1 flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 px-0 text-white/50 hover:text-white/80"
              title="Move up"
              onClick={(e) => {
                e.stopPropagation()
                onMoveUp?.(action.id)
              }}
            >
              <ArrowUp size={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 px-0 text-white/50 hover:text-white/80"
              title="Move down"
              onClick={(e) => {
                e.stopPropagation()
                onMoveDown?.(action.id)
              }}
            >
              <ArrowDown size={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 px-0 text-white/50 hover:text-white/80"
              title={variant === 'focus' ? 'Send to queue' : 'Send to focus'}
              onClick={(e) => {
                e.stopPropagation()
                onMoveAcross?.(action.id, variant === 'focus' ? 'focus' : 'queue')
              }}
            >
              {variant === 'focus' ? <CornerDownRight size={14} /> : <CornerUpLeft size={14} />}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
