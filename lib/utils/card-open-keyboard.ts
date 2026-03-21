import type { KeyboardEvent } from 'react'

export function handleCardOpenKeyDown(
  e: KeyboardEvent<Element>,
  open: () => void
) {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  open()
}
