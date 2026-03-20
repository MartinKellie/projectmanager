/**
 * Server action response types
 * Following next-safe-action pattern
 */

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }
