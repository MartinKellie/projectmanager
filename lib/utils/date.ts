/**
 * Date utility functions
 */

/**
 * Format a Date as YYYY-MM-DD in the **local** calendar (not UTC).
 * `toISOString().slice(0, 10)` is wrong for daily boundaries — e.g. UK morning
 * can still be "yesterday" in UTC, so intent/plan doc IDs would not roll over
 * when the user's local day changes.
 */
export function formatLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Get today's date as YYYY-MM-DD string (for dailyIntent / dailyPlan document ids)
 */
export function getTodayDateString(): string {
  return formatLocalDateString(new Date())
}

/**
 * Check if a date string is today (YYYY-MM-DD format)
 */
export function isTodayDate(dateString: string): boolean {
  return dateString === getTodayDateString()
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = date instanceof Date ? date : new Date(date)
  const today = new Date()
  
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  )
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date)
  return dateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}
