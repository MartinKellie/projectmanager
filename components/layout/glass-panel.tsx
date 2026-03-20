'use client'

import { cn } from '@/lib/utils/cn'
import { type CSSProperties, type ReactNode } from 'react'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'strong'
  glow?: boolean
  style?: CSSProperties
}

export function GlassPanel({
  children,
  className,
  variant = 'default',
  glow = false,
  style,
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-lg p-4 shadow-depth transition-gpu',
        variant === 'strong' ? 'glass-strong' : 'glass',
        glow && 'glow-hover',
        className
      )}
      style={style}
    >
      {children}
    </div>
  )
}
