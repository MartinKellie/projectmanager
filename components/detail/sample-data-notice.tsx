'use client'

export function SampleDataNotice() {
  return (
    <p className="mb-3 rounded-md border border-amber-500/25 bg-amber-950/40 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
      <span className="font-medium">Sample data</span>
      {' — '}
      This record came from the demo seed. Your own businesses, contacts and projects are your
      source of truth.
    </p>
  )
}
