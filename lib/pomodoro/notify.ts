/**
 * Browser notification when a Pomodoro period ends.
 * Requests permission on first use if not yet granted.
 */

import type { Phase } from './types'

const TITLE = 'Pomodoro'

const MESSAGES: Record<Phase, string> = {
  idle: '',
  focus: 'Focus complete. Time for a break.',
  relax: 'Break over. Ready to focus?',
  longBreak: 'Long break over. Ready to focus?',
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied'
  return Notification.permission
}

/** Request permission. Call when user enables notifications in settings. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const permission = await Notification.requestPermission()
  return permission
}

/** Show a notification for the phase that just ended. No-op if permission not granted. */
export function showPhaseEndNotification(phase: Phase): void {
  if (!isNotificationSupported()) return
  if (Notification.permission !== 'granted') return
  const body = MESSAGES[phase]
  if (!body) return
  try {
    new Notification(TITLE, { body })
  } catch {
    // ignore
  }
}
