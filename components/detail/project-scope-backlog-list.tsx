'use client'

interface Item {
  id: string
  text: string
}

interface ProjectScopeBacklogListProps {
  loading: boolean
  items: Item[]
}

export function ProjectScopeBacklogList({
  loading,
  items,
}: ProjectScopeBacklogListProps) {
  return (
    <div>
      <h4 className="text-xs font-medium text-white/55 uppercase tracking-wide mb-2">
        Backlog ({loading ? '…' : items.length})
      </h4>
      {loading ? (
        <p className="text-xs text-white/45">Loading tasks…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-white/45">No backlog tasks yet.</p>
      ) : (
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-white/80">
          {items.map((t) => (
            <li key={t.id} className="pl-1">
              {t.text}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
