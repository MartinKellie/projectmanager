'use client'

import { useState, useEffect } from 'react'
import { GlassPanel } from '@/components/layout/glass-panel'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { createOrUpdateDailyIntent } from '@/services/daily-intent'
import type { PlanBias } from '@/types/database'
import { cn } from '@/lib/utils/cn'

interface DailyStartupModalProps {
  isOpen: boolean
  userId: string
  onComplete: () => void
}

export function DailyStartupModal({ isOpen, userId, onComplete }: DailyStartupModalProps) {
  const [step, setStep] = useState<'intent' | 'bias'>('intent')
  const [intentText, setIntentText] = useState('')
  const [planBias, setPlanBias] = useState<PlanBias>('balanced')
  const [protectDeepWork, setProtectDeepWork] = useState(false)
  const [loading, setLoading] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('intent')
      setIntentText('')
      setPlanBias('balanced')
      setProtectDeepWork(false)
    }
  }, [isOpen])

  const handleIntentSubmit = async () => {
    if (!intentText.trim()) return

    setStep('bias')
  }

  const handleSkip = async () => {
    setLoading(true)
    try {
      const result = await createOrUpdateDailyIntent(userId, {
        skipped: true,
        planBias: 'balanced',
      })
      if (!result.success) {
        console.error('Failed to skip intent:', result.error)
        return
      }
      onComplete()
    } finally {
      setLoading(false)
    }
  }

  const handleBiasSubmit = async () => {
    setLoading(true)
    try {
      const result = await createOrUpdateDailyIntent(userId, {
        intentText,
        planBias,
        protectDeepWork,
      })
      if (!result.success) {
        console.error('Failed to save intent:', result.error)
        alert(`Failed to save: ${result.error}`)
      }
    } catch (error) {
      console.error('Error saving intent:', error)
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
      onComplete()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <GlassPanel
        className="relative w-full max-w-lg p-8 shadow-depth"
        variant="strong"
      >
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-white/60" size={24} />
          <h2 className="text-2xl font-semibold">What do you want to make progress on today?</h2>
        </div>

        {step === 'intent' && (
          <div className="space-y-4">
            <textarea
              value={intentText}
              onChange={(e) => setIntentText(e.target.value)}
              placeholder="e.g., Finish the API integration, catch up on client emails, or focus on the dashboard redesign..."
              className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 bg-transparent resize-none min-h-[120px]"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSkip}
                variant="ghost"
                className="flex-1"
                disabled={loading}
              >
                Skip
              </Button>
              <Button
                onClick={handleIntentSubmit}
                variant="default"
                className="flex-1"
                disabled={loading || !intentText.trim()}
              >
                Continue
              </Button>
            </div>
            {!intentText.trim() ? (
              <p className="text-xs text-amber-200">
                Add what you want to make progress on before continuing.
              </p>
            ) : null}
          </div>
        )}

        {step === 'bias' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">How should I bias today&apos;s plan?</h3>
              <p className="text-sm text-white/50 mb-4">Selected: <span className="capitalize font-medium text-white/70">{planBias.replace('-', ' ')}</span></p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setPlanBias('risk-first')
                    // Auto-submit after a brief delay to show selection
                    setTimeout(() => {
                      handleBiasSubmit()
                    }, 300)
                  }}
                  className={cn(
                    'w-full p-4 rounded-lg glass border-2 transition-all text-left cursor-pointer',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    planBias === 'risk-first'
                      ? 'border-white/40 bg-white/15 shadow-lg shadow-white/10'
                      : 'border-white/10 hover:border-white/20'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold">Risk-First</div>
                    {planBias === 'risk-first' && (
                      <div className="w-2 h-2 rounded-full bg-white/60" />
                    )}
                  </div>
                  <div className="text-sm text-white/60">
                    Prioritise deadlines and financial pressure
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPlanBias('balanced')
                    setTimeout(() => {
                      handleBiasSubmit()
                    }, 300)
                  }}
                  className={cn(
                    'w-full p-4 rounded-lg glass border-2 transition-all text-left cursor-pointer',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    planBias === 'balanced'
                      ? 'border-white/40 bg-white/15 shadow-lg shadow-white/10'
                      : 'border-white/10 hover:border-white/20'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold">Balanced</div>
                    {planBias === 'balanced' && (
                      <div className="w-2 h-2 rounded-full bg-white/60" />
                    )}
                  </div>
                  <div className="text-sm text-white/60">
                    Mix of risk, momentum, and progress
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPlanBias('momentum-first')
                    setTimeout(() => {
                      handleBiasSubmit()
                    }, 300)
                  }}
                  className={cn(
                    'w-full p-4 rounded-lg glass border-2 transition-all text-left cursor-pointer',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    planBias === 'momentum-first'
                      ? 'border-white/40 bg-white/15 shadow-lg shadow-white/10'
                      : 'border-white/10 hover:border-white/20'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold">Momentum-First</div>
                    {planBias === 'momentum-first' && (
                      <div className="w-2 h-2 rounded-full bg-white/60" />
                    )}
                  </div>
                  <div className="text-sm text-white/60">
                    Focus on building progress and restoring confidence
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={protectDeepWork}
                  onChange={(e) => {
                    setProtectDeepWork(e.target.checked)
                  }}
                  className="w-4 h-4 rounded glass border-white/20 accent-white/20 cursor-pointer"
                />
                <span className="text-sm">Protect deep work</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep('intent')}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleBiasSubmit}
                variant="default"
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Continue'}
              </Button>
            </div>
            <p className="text-xs text-white/40 text-center mt-2">
              Click an option above to select, or use Continue to proceed
            </p>
          </div>
        )}
      </GlassPanel>
    </div>
  )
}
