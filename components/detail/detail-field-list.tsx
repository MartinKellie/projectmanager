'use client'

import { type ReactNode } from 'react'

interface DetailFieldRowProps {
  label: string
  value: ReactNode
}

export function DetailFieldRow({ label, value }: DetailFieldRowProps) {
  if (value === null || value === undefined || value === '') return null

  return (
    <div className="py-2.5 border-b border-white/10 last:border-b-0">
      <dt className="text-[11px] uppercase tracking-wide text-white/45">{label}</dt>
      <dd className="text-sm text-white/90 mt-1 break-words">{value}</dd>
    </div>
  )
}

interface DetailFieldListProps {
  children: ReactNode
}

export function DetailFieldList({ children }: DetailFieldListProps) {
  return <dl className="space-y-0">{children}</dl>
}
