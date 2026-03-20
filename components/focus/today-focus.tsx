'use client'

import { useState, useEffect } from 'react'
import { GlassPanel } from '@/components/layout/glass-panel'
import { AnimatedCard } from '@/components/ui/animated-card'
import { Button } from '@/components/ui/button'
import { DailyStartupModal } from './daily-startup-modal'
import { getTodayIntent, createOrUpdateDailyIntent } from '@/services/daily-intent'
import { getTodayPlan, createOrUpdateDailyPlan } from '@/services/daily-plan'
import { getTodayActions, createAction, completeAction } from '@/services/actions'
import { generateDailyPlan } from '@/services/planner'
import { useAuthContext } from '@/contexts/auth-context'
import type { DailyIntent, DailyPlan, Action, PlanBias } from '@/types/database'
// Removed unused imports
import { Sparkles, CheckCircle2, Circle, Target, MessageSquare, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function TodayFocus() {
  const { user } = useAuthContext()
  const [intent, setIntent] = useState<DailyIntent | null>(null)
  const [plan, setPlan] = useState<DailyPlan | null>(null)
  const [actions, setActions] = useState<Action[]>([])
  const [showStartupModal, setShowStartupModal] = useState(false)
  const [planning, setPlanning] = useState(false)
  const [conversationMessages, setConversationMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([])
  const [conversationInput, setConversationInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadData() {
    if (!user) return

    setLoading(true)
    try {
      const [intentResult, planResult, actionsResult] = await Promise.all([
        getTodayIntent(user.uid),
        getTodayPlan(user.uid),
        getTodayActions(user.uid),
      ])

      if (intentResult.success) {
        setIntent(intentResult.data)
        // Show startup modal if no intent for today
        if (!intentResult.data) {
          setShowStartupModal(true)
        }
      }

      if (planResult.success) {
        setPlan(planResult.data)
      }

      if (actionsResult.success) {
        setActions(actionsResult.data)
      }
    } catch (error) {
      console.error('Failed to load focus data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlanMyDayWithDefault = async () => {
    if (!user) return

    setPlanning(true)
    try {
      const result = await generateDailyPlan(user.uid, 'balanced')
      await handlePlanResult(result)
    } catch (error) {
      console.error('Failed to generate plan:', error)
      alert(`Failed to generate plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setPlanning(false)
    }
  }

  const handlePlanResult = async (result: { success: boolean; data?: any; error?: string }) => {
    if (!user || !result.success || !result.data) {
      if (result.error) {
        alert(`Failed to generate plan: ${result.error}`)
      }
      return
    }

    try {
      // Create actions from proposed plan
      const createdActions = await Promise.all(
        result.data.proposedActions.map((proposed: any) =>
          createAction(user.uid, {
            text: proposed.text,
            projectId: proposed.projectId,
          })
        )
      )

      const actionIds = createdActions
        .filter((r) => r.success)
        .map((r) => r.data!)

      // Save plan
      const planBias = intent?.planBias || 'balanced'
      await createOrUpdateDailyPlan(user.uid, {
        planBias,
        anchorProjectId: result.data.anchorProjectId,
        proposedActionIds: actionIds,
        finalActionIds: actionIds,
      })

      // Reload data
      await loadData()

      // Add AI message with plan
      setConversationMessages([
        {
          role: 'ai',
          text: `I've created ${result.data.proposedActions.length} actions for today:\n\n${result.data.proposedActions.map((a: any, i: number) => `${i + 1}. ${a.text}\n   ${a.rationale}`).join('\n\n')}\n\n${result.data.tensionCallouts.length > 0 ? '\nNote: ' + result.data.tensionCallouts.join(' ') : ''}`,
        },
      ])
    } catch (error) {
      console.error('Failed to process plan result:', error)
      alert(`Failed to save plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handlePlanMyDay = async () => {
    if (!user) return

    if (!intent) {
      // If no intent, use default
      handlePlanMyDayWithDefault()
      return
    }

    setPlanning(true)
    try {
      const planBias = intent.planBias || 'balanced'
      console.log('Generating plan with bias:', planBias)
      const result = await generateDailyPlan(user.uid, planBias)
      await handlePlanResult(result)
    } catch (error) {
      console.error('Failed to generate plan:', error)
      alert(`Failed to generate plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setPlanning(false)
    }
  }

  const handleCompleteAction = async (actionId: string, projectId: string | null) => {
    if (!user) return

    try {
      const result = await completeAction(actionId, projectId)
      if (result.success) {
        await loadData()
      } else {
        console.error('Failed to complete action:', result.error)
      }
    } catch (error) {
      console.error('Error completing action:', error)
    }
  }

  const handleStartupComplete = async () => {
    setShowStartupModal(false)
    await loadData()
  }

  if (loading) {
    return (
      <div className="p-4">
        <GlassPanel>
          <p className="text-white/60">Loading...</p>
        </GlassPanel>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <DailyStartupModal
        isOpen={showStartupModal}
        userId={user?.uid || ''}
        onComplete={handleStartupComplete}
      />

      {/* Intent Card */}
      {intent && !intent.skipped && (
        <AnimatedCard index={0}>
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="text-white/60 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Today&apos;s Intent</h3>
              <p className="text-sm text-white/70">{intent.intentText}</p>
              {intent.planBias && (
                <div className="mt-2 text-xs text-white/50">
                  Bias: <span className="capitalize">{intent.planBias.replace('-', ' ')}</span>
                  {intent.protectDeepWork && ' • Deep work protected'}
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>
      )}

      {/* Plan My Day Button */}
      {intent && !intent.skipped && (
        <Button
          onClick={(e) => {
            e.preventDefault()
            console.log('Plan My Day clicked, intent:', intent)
            handlePlanMyDay()
          }}
          disabled={planning || !intent}
          className="w-full gap-2"
          variant="default"
          type="button"
        >
          <Target size={18} />
          {planning ? 'Planning...' : 'Plan My Day'}
        </Button>
      )}
      
      {/* Show button even if no intent, but allow manual planning */}
      {(!intent || intent.skipped) && (
        <Button
          onClick={(e) => {
            e.preventDefault()
            console.log('Plan My Day clicked (no intent)')
            // Allow planning with default balanced bias
            if (user) {
              handlePlanMyDayWithDefault()
            }
          }}
          disabled={planning}
          className="w-full gap-2"
          variant="default"
          type="button"
        >
          <Target size={18} />
          {planning ? 'Planning...' : 'Plan My Day'}
        </Button>
      )}

      {/* Proposed Actions / Tension Callouts */}
      {plan && plan.proposedActionIds.length > 0 && conversationMessages.length > 0 && (
        <AnimatedCard index={1}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles size={18} />
            Proposed Plan
          </h3>
          <div className="space-y-2 text-sm text-white/80 whitespace-pre-line">
            {conversationMessages.map((msg, idx) => (
              <div key={idx} className={cn('p-3 rounded-lg', msg.role === 'ai' ? 'glass' : '')}>
                {msg.text}
              </div>
            ))}
          </div>
        </AnimatedCard>
      )}

      {/* Focus Anchor */}
      {plan && plan.anchorProjectId && (
        <AnimatedCard index={2} variant="strong">
          <div className="flex items-start gap-3">
            <Target size={20} className="text-white/60 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Focus Anchor</h3>
              <p className="text-sm text-white/70">
                If you do nothing else today, move this forward
              </p>
            </div>
          </div>
        </AnimatedCard>
      )}

      {/* Today's Actions */}
      <AnimatedCard index={3}>
        <h3 className="font-semibold mb-3">Today&apos;s Actions ({actions.length}/5)</h3>
        {actions.length === 0 ? (
          <p className="text-sm text-white/60">No actions yet. Click &quot;Plan My Day&quot; to get started.</p>
        ) : (
          <div className="space-y-2">
            {actions.map((action, index) => (
              <div
                key={action.id}
                className="flex items-start gap-3 p-3 rounded-lg glass hover:glass-strong transition-all cursor-pointer"
                onClick={() => handleCompleteAction(action.id, action.projectId)}
              >
                <button className="mt-0.5">
                  {action.status === 'completed' ? (
                    <CheckCircle2 size={20} className="text-green-400" />
                  ) : (
                    <Circle size={20} className="text-white/40 hover:text-white/60" />
                  )}
                </button>
                <div className="flex-1">
                  <p className={cn('text-sm', action.status === 'completed' && 'line-through text-white/40')}>
                    {action.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatedCard>

      {/* Conversational Refinement */}
      {plan && conversationMessages.length > 0 && (
        <AnimatedCard index={4}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MessageSquare size={18} />
            Refine Plan
          </h3>
          <div className="space-y-2">
            <input
              type="text"
              value={conversationInput}
              onChange={(e) => setConversationInput(e.target.value)}
              placeholder="e.g., 'Too heavy. Lighten it.' or 'Quick wins first.'"
              className="w-full px-3 py-2 rounded-lg glass border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 bg-transparent text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && conversationInput.trim()) {
                  // TODO: Implement conversational refinement
                  setConversationInput('')
                }
              }}
            />
            <p className="text-xs text-white/40">
              Ask for adjustments to your plan
            </p>
          </div>
        </AnimatedCard>
      )}

      {/* Wins / Progress */}
      {actions.filter((a) => a.status === 'completed').length > 0 && (
        <AnimatedCard index={5}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy size={18} />
            Today&apos;s Progress
          </h3>
          <p className="text-sm text-white/70">
            {actions.filter((a) => a.status === 'completed').length} action{actions.filter((a) => a.status === 'completed').length !== 1 ? 's' : ''} completed
          </p>
        </AnimatedCard>
      )}
    </div>
  )
}
