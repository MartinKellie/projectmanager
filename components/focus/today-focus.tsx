'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { GlassPanel } from '@/components/layout/glass-panel'
import { AnimatedCard } from '@/components/ui/animated-card'
import { Button } from '@/components/ui/button'
import { DailyStartupModal } from './daily-startup-modal'
import { getTodayIntent, createOrUpdateDailyIntent } from '@/services/daily-intent'
import { getTodayPlan, createOrUpdateDailyPlan } from '@/services/daily-plan'
import {
  getTodayActions,
  getSuppressedCarryoverActions,
  createAction,
  completeAction,
  updateAction,
} from '@/services/actions'
import {
  getTodayPlanRecord,
  moveActionAcrossTodayPlanLists,
  moveActionWithinTodayPlan,
  reorderActionWithinTodayPlan,
  syncTodayPlanRecordFromActions,
  setTodayPlanRecordContext,
} from '@/services/daily-plan-record'
import { generateDailyPlan } from '@/services/planner'
import { useAuthContext } from '@/contexts/auth-context'
import type { DailyIntent, DailyPlan, DailyPlanRecord, Action, PlanBias } from '@/types/database'
import { ArrowDown, ArrowUp, Sparkles, Target, Trash2, MessageSquare, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { partitionTodayFocusActions } from '@/lib/today-focus-partition'
import { TodayFocusActionsSection } from '@/components/focus/today-focus-actions-section'
import { useSettings } from '@/contexts/settings-context'

interface DraftPlanAction {
  text: string
  projectId: string | null
  rationale?: string
}

interface DraftPlan {
  proposedActions: DraftPlanAction[]
  tensionCallouts: string[]
  anchorProjectId: string | null
  plannerContext: string | null
}

function orderTodayActionsByRecord(
  actions: Action[],
  record: DailyPlanRecord | null
): Action[] {
  if (!record) return actions

  const byId = new Map(actions.map((action) => [action.id, action]))
  const orderedIds = [...record.focusActionIds, ...record.queuedActionIds]
  const ordered = orderedIds
    .map((id) => byId.get(id))
    .filter((action): action is Action => Boolean(action))
  const remaining = actions
    .filter((action) => !orderedIds.includes(action.id))
    .sort((a, b) => a.orderIndex - b.orderIndex)

  return [...ordered, ...remaining]
}

interface TodayFocusProps {
  /** Compact strip instead of full focus (e.g. project open in Today’s Action area). */
  collapsed?: boolean
  onRestoreCollapsed?: () => void
  collapsedSubtitle?: string
}

export function TodayFocus({
  collapsed,
  onRestoreCollapsed,
  collapsedSubtitle,
}: TodayFocusProps) {
  const { user, loading: authLoading, error: authError } = useAuthContext()
  const { settings } = useSettings()
  const [intent, setIntent] = useState<DailyIntent | null>(null)
  const [plan, setPlan] = useState<DailyPlan | null>(null)
  const [planRecord, setPlanRecord] = useState<DailyPlanRecord | null>(null)
  const [actions, setActions] = useState<Action[]>([])
  const [suppressedActions, setSuppressedActions] = useState<Action[]>([])
  const [dismissedSuppressed, setDismissedSuppressed] = useState<Set<string>>(new Set())
  const [showStartupModal, setShowStartupModal] = useState(false)
  const [planning, setPlanning] = useState(false)
  const [autoPreparing, setAutoPreparing] = useState(false)
  const [applyingDraft, setApplyingDraft] = useState(false)
  const [editingIntent, setEditingIntent] = useState(false)
  const [intentDraft, setIntentDraft] = useState('')
  const [savingIntent, setSavingIntent] = useState(false)
  const [draftPlan, setDraftPlan] = useState<DraftPlan | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([])
  const [conversationInput, setConversationInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [syncWarning, setSyncWarning] = useState<string | null>(null)
  const [draftPreparedMs, setDraftPreparedMs] = useState<number | null>(null)
  const [draftPreparedSource, setDraftPreparedSource] = useState<'manual' | 'auto'>('manual')
  const planningStartedAtRef = useRef<number | null>(null)

  const { focus: focusActions, queued: queuedActions } = useMemo(
    () => partitionTodayFocusActions(actions),
    [actions]
  )

  const loadData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      setLoadError(null)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out while loading today data')), 12000)
      })
      const [intentResult, planResult, actionsResult, recordResult, suppressedResult] = await Promise.race([
        Promise.all([
          getTodayIntent(user.uid),
          getTodayPlan(user.uid),
          getTodayActions(user.uid, {
            carryoverSuppressAfter: settings.carryoverSuppressAfter,
          }),
          getTodayPlanRecord(user.uid),
          getSuppressedCarryoverActions(user.uid),
        ]),
        timeoutPromise,
      ])

      if (intentResult.success) {
        setIntent(intentResult.data)
        // Local calendar day: show modal only when there is no doc for today
        if (!intentResult.data) setShowStartupModal(true)
        else setShowStartupModal(false)
      } else {
        setLoadError(intentResult.error || 'Failed to load daily intent')
      }

      if (planResult.success) {
        setPlan(planResult.data)
      } else {
        setLoadError((prev) => prev || planResult.error || 'Failed to load daily plan')
      }

      if (actionsResult.success) {
        const orderedActions = orderTodayActionsByRecord(
          actionsResult.data,
          recordResult.success ? recordResult.data : null
        )
        setActions(orderedActions)
      } else {
        setLoadError((prev) => prev || actionsResult.error || 'Failed to load actions')
      }

      if (!recordResult.success) {
        setLoadError((prev) => prev || recordResult.error || 'Failed to load daily plan record')
      } else {
        setPlanRecord(recordResult.data)
      }

      if (!suppressedResult.success) {
        setLoadError((prev) => prev || suppressedResult.error || 'Failed to load suppressed actions')
      } else {
        setSuppressedActions(suppressedResult.data)
      }
    } catch (error) {
      console.error('Failed to load focus data:', error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load focus data')
    } finally {
      setLoading(false)
    }
  }, [user, settings.carryoverSuppressAfter])

  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }

    if (!user) {
      setLoading(false)
      return
    }

    loadData()
  }, [user, authLoading, loadData])

  const handleDraftPlanResult = useCallback((
    result: { success: boolean; data?: any; error?: string },
    source: 'manual' | 'auto' = 'manual'
  ) => {
    if (!user || !result.success || !result.data) {
      if (result.error) {
        alert(`Failed to generate plan: ${result.error}`)
      }
      return
    }

    setDraftPlan({
      proposedActions: result.data.proposedActions,
      tensionCallouts: result.data.tensionCallouts || [],
      anchorProjectId: result.data.anchorProjectId || null,
      plannerContext: [
        result.data.anchorRationale ? `Focus: ${result.data.anchorRationale}` : '',
        ...(result.data.tensionCallouts || []),
      ]
        .filter(Boolean)
        .join(' '),
    })
    if (planningStartedAtRef.current !== null) {
      setDraftPreparedMs(Math.max(0, Math.round(performance.now() - planningStartedAtRef.current)))
      planningStartedAtRef.current = null
    }
    setDraftPreparedSource(source)
  }, [user])

  useEffect(() => {
    if (!user) return
    if (loading) return
    if (showStartupModal) return
    if (!intent || intent.skipped) return
    if (draftPlan) return
    if (actions.length > 0) return
    if (autoPreparing || planning || applyingDraft) return

    const key = `auto_plan_draft_prepared_${user.uid}_${new Date().toDateString()}`
    if (typeof window !== 'undefined' && window.localStorage.getItem(key) === 'true') return

    const currentUser = user
    const currentIntent = intent

    async function prepareDraft() {
      setAutoPreparing(true)
      planningStartedAtRef.current = performance.now()
      try {
        const result = await generateDailyPlan(currentUser.uid, currentIntent.planBias || 'balanced')
        handleDraftPlanResult(result, 'auto')
        if (typeof window !== 'undefined') window.localStorage.setItem(key, 'true')
      } catch (error) {
        console.error('Failed to auto-prepare draft plan:', error)
      } finally {
        setAutoPreparing(false)
      }
    }

    void prepareDraft()
  }, [
    user,
    loading,
    showStartupModal,
    intent,
    draftPlan,
    actions.length,
    autoPreparing,
    planning,
    applyingDraft,
    handleDraftPlanResult,
  ])

  const handlePlanMyDayWithDefault = async () => {
    if (!user) return

    setPlanning(true)
    planningStartedAtRef.current = performance.now()
    try {
      const result = await generateDailyPlan(user.uid, 'balanced')
      handleDraftPlanResult(result, 'manual')
    } catch (error) {
      console.error('Failed to generate plan:', error)
      alert(`Failed to generate plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setPlanning(false)
    }
  }

  const handleApproveDraftPlan = async () => {
    if (!user || !draftPlan) return
    setApplyingDraft(true)
    try {
      // Create actions from proposed plan
      const createdActions = await Promise.all(
        draftPlan.proposedActions.map((proposed) =>
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
        anchorProjectId: draftPlan.anchorProjectId,
        proposedActionIds: actionIds,
        finalActionIds: actionIds,
      })

      const contextResult = await setTodayPlanRecordContext(user.uid, {
        intent: intent?.intentText || null,
        plannerContext: draftPlan.plannerContext,
        addedTodayActionIds: actionIds,
      }, planRecord?.updatedAt)
      if (!contextResult.success) {
        if (contextResult.error === 'stale_write_conflict') {
          await handleStaleConflict()
        } else {
          console.warn('Failed to save planner context:', contextResult.error)
        }
      }

      // Reload data
      await loadData()

      // Add AI message with plan
      setConversationMessages([
        {
          role: 'ai',
          text: `I've created ${draftPlan.proposedActions.length} actions for today:\n\n${draftPlan.proposedActions.map((a, i) => `${i + 1}. ${a.text}\n   ${a.rationale || 'Planned action'}`).join('\n\n')}${draftPlan.tensionCallouts.length > 0 ? `\n\nNote: ${draftPlan.tensionCallouts.join(' ')}` : ''}`,
        },
      ])
      setDraftPlan(null)
    } catch (error) {
      console.error('Failed to process plan result:', error)
      alert(`Failed to save plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setApplyingDraft(false)
    }
  }

  function handleDraftTextChange(index: number, text: string) {
    setDraftPlan((prev) => {
      if (!prev) return prev
      const next = [...prev.proposedActions]
      const existing = next[index]
      if (!existing) return prev
      next[index] = { ...existing, text }
      return { ...prev, proposedActions: next }
    })
  }

  function handleDraftRemove(index: number) {
    setDraftPlan((prev) => {
      if (!prev) return prev
      const next = prev.proposedActions.filter((_, i) => i !== index)
      return { ...prev, proposedActions: next }
    })
  }

  function handleDraftMove(index: number, direction: 'up' | 'down') {
    setDraftPlan((prev) => {
      if (!prev) return prev
      const next = [...prev.proposedActions]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      const current = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = current
      return { ...prev, proposedActions: next }
    })
  }

  const handlePlanMyDay = async () => {
    if (!user) return

    if (!intent) {
      // If no intent, use default
      handlePlanMyDayWithDefault()
      return
    }

    setPlanning(true)
    planningStartedAtRef.current = performance.now()
    try {
      const planBias = intent.planBias || 'balanced'
      const result = await generateDailyPlan(user.uid, planBias)
      handleDraftPlanResult(result, 'manual')
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

  const handleStaleConflict = useCallback(async () => {
    setSyncWarning('Another device changed your plan. Reloaded the latest version.')
    await loadData()
  }, [loadData])

  const handleMoveActionUp = async (
    actionId: string,
    list: 'focus' | 'queue'
  ) => {
    if (!user) return
    const result = await moveActionWithinTodayPlan(
      user.uid,
      actionId,
      list,
      'up',
      planRecord?.updatedAt
    )
    if (!result.success) {
      if (result.error === 'stale_write_conflict') {
        await handleStaleConflict()
        return
      }
      console.error('Failed to move action up:', result.error)
      return
    }
    await loadData()
  }

  const handleMoveActionDown = async (
    actionId: string,
    list: 'focus' | 'queue'
  ) => {
    if (!user) return
    const result = await moveActionWithinTodayPlan(
      user.uid,
      actionId,
      list,
      'down',
      planRecord?.updatedAt
    )
    if (!result.success) {
      if (result.error === 'stale_write_conflict') {
        await handleStaleConflict()
        return
      }
      console.error('Failed to move action down:', result.error)
      return
    }
    await loadData()
  }

  const handleMoveActionAcross = async (
    actionId: string,
    from: 'focus' | 'queue'
  ) => {
    if (!user) return
    const result = await moveActionAcrossTodayPlanLists(
      user.uid,
      actionId,
      from,
      planRecord?.updatedAt
    )
    if (!result.success) {
      if (result.error === 'stale_write_conflict') {
        await handleStaleConflict()
        return
      }
      console.error('Failed to move action between lists:', result.error)
      return
    }
    await loadData()
  }

  const handleReorderDrop = async (
    sourceActionId: string,
    targetActionId: string,
    list: 'focus' | 'queue'
  ) => {
    if (!user) return
    const result = await reorderActionWithinTodayPlan(
      user.uid,
      list,
      sourceActionId,
      targetActionId,
      planRecord?.updatedAt
    )
    if (!result.success) {
      if (result.error === 'stale_write_conflict') {
        await handleStaleConflict()
        return
      }
      console.error('Failed to reorder action:', result.error)
      return
    }
    await loadData()
  }

  const handleStartupComplete = async () => {
    setShowStartupModal(false)
    await loadData()
  }

  const handleSaveIntent = async () => {
    if (!user || !intentDraft.trim()) return
    setSavingIntent(true)
    const result = await createOrUpdateDailyIntent(user.uid, {
      intentText: intentDraft.trim(),
      skipped: false,
      planBias: intent?.planBias || 'balanced',
      protectDeepWork: intent?.protectDeepWork || false,
    })
    setSavingIntent(false)
    if (!result.success) {
      setLoadError(result.error || 'Failed to save today intent')
      return
    }
    setEditingIntent(false)
    await loadData()
  }

  const handleRestoreSuppressed = async (actionId: string) => {
    if (!user) return
    const result = await updateAction(actionId, {
      surfacedToday: true,
      suppressedAt: null,
      carryoverCount: 0,
      lastCarryoverDate: null,
    })
    if (!result.success) {
      console.error('Failed to restore suppressed action:', result.error)
      return
    }
    const sync = await syncTodayPlanRecordFromActions(user.uid)
    if (!sync.success) console.warn('Failed to sync plan record after restore:', sync.error)
    await loadData()
  }

  const handleKeepSuppressed = (actionId: string) => {
    setDismissedSuppressed((prev) => {
      const next = new Set(prev)
      next.add(actionId)
      return next
    })
  }

  if (authLoading || loading) {
    return (
      <div className="p-4">
        <GlassPanel>
          <p className="text-white/60">Loading...</p>
        </GlassPanel>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4">
        <GlassPanel>
          {authError ? (
            <>
              <p className="text-sm text-red-300">Sign-in failed.</p>
              <p className="text-xs text-white/60 mt-1">{authError}</p>
              <p className="text-xs text-white/50 mt-2">
                Check Firebase Authentication and enable Anonymous sign-in for local/dev use.
              </p>
            </>
          ) : (
            <p className="text-sm text-white/60">Signing you in…</p>
          )}
        </GlassPanel>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-4">
        <GlassPanel>
          <p className="text-sm text-red-300 mb-1">Could not load today&apos;s focus.</p>
          <p className="text-xs text-white/60 mb-3">{loadError}</p>
          <Button onClick={() => loadData()} type="button" variant="outline">
            Retry
          </Button>
        </GlassPanel>
      </div>
    )
  }

  if (collapsed && onRestoreCollapsed) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/20 px-4 py-2">
        <p className="min-w-0 truncate text-xs text-white/60">
          {collapsedSubtitle ??
            "Today's focus is hidden while you view a project."}
        </p>
        <Button type="button" size="sm" variant="outline" onClick={onRestoreCollapsed}>
          Back to Today
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {syncWarning ? (
        <GlassPanel className="border-amber-300/30 bg-amber-500/10">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-amber-100">{syncWarning}</p>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSyncWarning(null)}>
              Dismiss
            </Button>
          </div>
        </GlassPanel>
      ) : null}

      <DailyStartupModal
        isOpen={showStartupModal}
        userId={user?.uid || ''}
        onComplete={handleStartupComplete}
      />

      {/* Intent Card */}
      {intent && !intent.skipped && (
        <AnimatedCard index={0}>
          <div
            className="flex items-start gap-3"
            role="button"
            tabIndex={0}
            onClick={() => {
              setIntentDraft(intent.intentText || '')
              setEditingIntent(true)
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return
              e.preventDefault()
              setIntentDraft(intent.intentText || '')
              setEditingIntent(true)
            }}
          >
            <Sparkles size={20} className="text-white/60 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Today&apos;s Intent</h3>
              {editingIntent ? (
                <div
                  className="space-y-2"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <textarea
                    value={intentDraft}
                    onChange={(e) => setIntentDraft(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-white/20"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      disabled={savingIntent || !intentDraft.trim()}
                      onClick={() => void handleSaveIntent()}
                    >
                      {savingIntent ? 'Saving…' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={savingIntent}
                      onClick={() => setEditingIntent(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-white/70">{intent.intentText}</p>
                  <p className="mt-1 text-[11px] text-white/45">Click to edit</p>
                </>
              )}
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

      {draftPlan ? (
        <AnimatedCard index={1}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles size={18} />
            Review draft plan
          </h3>
          <div className="space-y-2">
            {draftPlan.proposedActions.map((action, index) => (
              <div key={`${action.text}-${index}`} className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                <div className="mb-1 flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 px-0 text-white/50 hover:text-white/80"
                    disabled={index === 0}
                    onClick={() => handleDraftMove(index, 'up')}
                    title="Move up"
                  >
                    <ArrowUp size={14} />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 px-0 text-white/50 hover:text-white/80"
                    disabled={index === draftPlan.proposedActions.length - 1}
                    onClick={() => handleDraftMove(index, 'down')}
                    title="Move down"
                  >
                    <ArrowDown size={14} />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-7 w-7 px-0 text-red-300/70 hover:text-red-200"
                    onClick={() => handleDraftRemove(index)}
                    title="Remove action"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                <input
                  type="text"
                  value={action.text}
                  onChange={(e) => handleDraftTextChange(index, e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-black/20 px-2 py-1 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                {action.rationale ? (
                  <p className="mt-1 text-xs text-white/55">{action.rationale}</p>
                ) : null}
              </div>
            ))}
          </div>
          {draftPlan.tensionCallouts.length > 0 ? (
            <p className="mt-3 text-xs text-white/55">
              {draftPlan.tensionCallouts.join(' ')}
            </p>
          ) : null}
          {draftPreparedMs !== null ? (
            <p className="mt-2 text-xs text-white/45">
              {draftPreparedSource === 'auto' ? 'Auto-prepared' : 'Prepared'} in{' '}
              {(draftPreparedMs / 1000).toFixed(1)}s
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={applyingDraft || draftPlan.proposedActions.length === 0}
              onClick={() => void handleApproveDraftPlan()}
            >
              {applyingDraft ? 'Applying…' : 'Approve and save plan'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={planning || autoPreparing || applyingDraft}
              onClick={() => void handlePlanMyDay()}
            >
              {planning || autoPreparing ? 'Refreshing…' : 'Regenerate draft'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={applyingDraft}
              onClick={() => setDraftPlan(null)}
            >
              Discard draft
            </Button>
          </div>
        </AnimatedCard>
      ) : null}

      {/* Proposed Actions / Tension Callouts */}
      {plan && plan.proposedActionIds.length > 0 && conversationMessages.length > 0 && (
        <AnimatedCard index={2}>
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

      {planRecord?.plannerContext ? (
        <AnimatedCard index={3}>
          <h3 className="font-semibold mb-2">Planner context</h3>
          <p className="text-sm text-white/70">{planRecord.plannerContext}</p>
        </AnimatedCard>
      ) : null}

      <TodayFocusActionsSection
        focusActions={focusActions}
        queuedActions={queuedActions}
        hasAnyToday={actions.length > 0}
        onComplete={handleCompleteAction}
        onMoveUp={handleMoveActionUp}
        onMoveDown={handleMoveActionDown}
        onMoveAcross={handleMoveActionAcross}
        onReorderDrop={handleReorderDrop}
      />

      {suppressedActions.filter((a) => !dismissedSuppressed.has(a.id)).length > 0 ? (
        <AnimatedCard index={4}>
          <h3 className="font-semibold mb-2">Suppressed after carryover</h3>
          <p className="text-xs text-white/50 mb-3">
            These were hidden after repeated carryover. Bring them back if they should re-enter today.
          </p>
          <div className="space-y-2">
            {suppressedActions
              .filter((action) => !dismissedSuppressed.has(action.id))
              .map((action) => (
                <div
                  key={action.id}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-2"
                >
                  <p className="text-sm text-white/80">{action.text}</p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleRestoreSuppressed(action.id)}
                    >
                      Bring back to today
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleKeepSuppressed(action.id)}
                    >
                      Keep suppressed
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </AnimatedCard>
      ) : null}

      {/* Conversational Refinement */}
      {plan && conversationMessages.length > 0 && (
        <AnimatedCard index={5}>
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
        <AnimatedCard index={6}>
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
