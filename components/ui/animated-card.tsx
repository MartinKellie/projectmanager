'use client'

import { GlassPanel } from '@/components/layout/glass-panel'
import { cn } from '@/lib/utils/cn'
import { useSettings } from '@/contexts/settings-context'
import { type ReactNode, useMemo, useEffect, useState, useRef } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'strong'
  delay?: number
  index?: number
  shimmer?: boolean
  breathing?: boolean
  glimmer?: boolean
}

const delayClasses = [
  'animate-card-in',
  'animate-card-in-delay-1',
  'animate-card-in-delay-2',
  'animate-card-in-delay-3',
  'animate-card-in-delay-4',
  'animate-card-in-delay-5',
]

export function AnimatedCard({
  children,
  className,
  variant = 'default',
  delay,
  index,
  shimmer = true,
  breathing = true,
  glimmer = false,
}: AnimatedCardProps) {
  const { settings } = useSettings()
  const delayClass = delay !== undefined 
    ? delayClasses[Math.min(delay, delayClasses.length - 1)]
    : index !== undefined
    ? delayClasses[Math.min(index, delayClasses.length - 1)]
    : delayClasses[0]

  const [glimmerActive, setGlimmerActive] = useState(false)
  const [glimmerColor, setGlimmerColor] = useState<{ r: number; g: number; b: number }>({ r: 255, g: 255, b: 255 })
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Generate a random color (bright, vibrant colors)
  const generateRandomColor = () => {
    // Generate bright, vibrant colors (avoiding too dark)
    const hue = Math.random() * 360
    const saturation = 70 + Math.random() * 30 // 70-100%
    const lightness = 60 + Math.random() * 20 // 60-80%
    
    // Convert HSL to RGB
    const h = hue / 360
    const s = saturation / 100
    const l = lightness / 100
    
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs((h * 6) % 2 - 1))
    const m = l - c / 2
    
    let r = 0, g = 0, b = 0
    
    if (h < 1/6) {
      r = c; g = x; b = 0
    } else if (h < 2/6) {
      r = x; g = c; b = 0
    } else if (h < 3/6) {
      r = 0; g = c; b = x
    } else if (h < 4/6) {
      r = 0; g = x; b = c
    } else if (h < 5/6) {
      r = x; g = 0; b = c
    } else {
      r = c; g = 0; b = x
    }
    
    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    b = Math.round((b + m) * 255)
    
    return { r, g, b }
  }

  // Generate random glimmer properties for each card instance
  const glimmerConfig = useMemo(() => {
    if (!glimmer) return null
    
    // Random vertical position (-20% to 20%)
    const glimmerY = -20 + Math.random() * 40
    // Slight variation in duration (1.0s to 1.4s)
    const glimmerDuration = 1.0 + Math.random() * 0.4
    
    return {
      y: glimmerY,
      duration: glimmerDuration,
    }
  }, [glimmer])

  useEffect(() => {
    if (!glimmer || !glimmerConfig) return

    const scheduleNextGlimmer = () => {
      // Random delay between 30 seconds and 4 minutes
      const delay = (30 + Math.random() * 210) * 1000
      
      timeoutRef.current = setTimeout(() => {
        // Generate new random color if random color is enabled
        if (settings.glimmerRandomColor) {
          setGlimmerColor(generateRandomColor())
        }
        
        setGlimmerActive(true)
        
        // Reset after animation completes
        setTimeout(() => {
          setGlimmerActive(false)
          scheduleNextGlimmer()
        }, glimmerConfig.duration * 1000)
      }, delay)
    }

    // Start the first glimmer
    scheduleNextGlimmer()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [glimmer, glimmerConfig, settings.glimmerRandomColor])

  const glimmerStyle = useMemo(() => {
    if (!glimmer || !glimmerConfig) return {}
    
    return {
      '--glimmer-y': `${glimmerConfig.y.toFixed(1)}%`,
      '--glimmer-duration': `${glimmerConfig.duration.toFixed(2)}s`,
      '--glimmer-color-r': glimmerColor.r,
      '--glimmer-color-g': glimmerColor.g,
      '--glimmer-color-b': glimmerColor.b,
    } as React.CSSProperties
  }, [glimmer, glimmerConfig, glimmerColor])

  return (
    <GlassPanel
      className={cn(
        'card-hover transition-gpu relative',
        delayClass,
        shimmer && 'card-shimmer',
        breathing && 'card-breathe',
        glimmer && 'card-glimmer',
        glimmerActive && 'card-glimmer-active',
        className
      )}
      variant={variant}
      style={glimmerStyle}
    >
      <div className="relative z-10">
        {children}
      </div>
    </GlassPanel>
  )
}
