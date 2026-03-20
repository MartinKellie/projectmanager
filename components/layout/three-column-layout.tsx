'use client'

import { cn } from '@/lib/utils/cn'

interface ThreeColumnLayoutProps {
  leftColumn: React.ReactNode
  middleColumn: React.ReactNode
  rightColumn: React.ReactNode
  className?: string
}

export function ThreeColumnLayout({
  leftColumn,
  middleColumn,
  rightColumn,
  className,
}: ThreeColumnLayoutProps) {
  return (
    <div className={cn('relative z-10 flex h-full w-full overflow-hidden', className)}>
      {/* Left Column - Widgets */}
      <aside className="w-64 flex-shrink-0 border-r border-white/10 h-full overflow-y-auto">
        {leftColumn}
      </aside>

      {/* Middle Column - Today / Focus */}
      <main className="flex-1 border-r border-white/10 h-full overflow-y-auto">
        {middleColumn}
      </main>

      {/* Right Column - Project Radar */}
      <aside className="w-96 flex-shrink-0 h-full overflow-y-auto">
        {rightColumn}
      </aside>
    </div>
  )
}
