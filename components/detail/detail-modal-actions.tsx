'use client'

import { Button } from '@/components/ui/button'

interface DetailModalActionsProps {
  onEdit: () => void | Promise<void>
  onDelete: () => void | Promise<void>
}

export function DetailModalActions({ onEdit, onDelete }: DetailModalActionsProps) {
  return (
    <div className="flex items-center gap-2 mr-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void onEdit()}
      >
        Edit
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-red-300 hover:text-red-200 hover:bg-red-500/15"
        onClick={() => void onDelete()}
      >
        Delete
      </Button>
    </div>
  )
}
