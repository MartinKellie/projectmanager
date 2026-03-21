'use client'

interface PlaceholderDetailSectionProps {
  title?: string
}

export function PlaceholderDetailSection({
  title = 'More detail soon',
}: PlaceholderDetailSectionProps) {
  return (
    <section className="mt-6 rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-4">
      <h3 className="text-sm font-medium text-white/70 mb-1">{title}</h3>
      <p className="text-xs text-white/45 leading-relaxed">
        This is a focused view of the record. Extra context, history, and actions can be added here
        when you&apos;re ready.
      </p>
    </section>
  )
}
