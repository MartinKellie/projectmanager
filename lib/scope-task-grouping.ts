export interface ScopeBacklogItem {
  id: string
  text: string
  orderIndex?: number
  /** When set (from Firestore), takes precedence over classifyScopeTask(text). */
  scopeGroup?: ScopeTaskGroupKey | null
}

export interface ScopeTaskGroup {
  key: ScopeTaskGroupKey
  label: string
  items: ScopeBacklogItem[]
}

export const SCOPE_TASK_GROUPS = [
  { key: 'libraries', label: 'Libraries & dependencies' },
  { key: 'layout', label: 'Screen layout & structure' },
  { key: 'components', label: 'UI components' },
  { key: 'data', label: 'Data & state' },
  { key: 'integrations', label: 'Integrations / APIs' },
  { key: 'testing', label: 'Testing & QA' },
  { key: 'deployment', label: 'Deployment / release' },
  { key: 'other', label: 'Other' },
] as const

export type ScopeTaskGroupKey = (typeof SCOPE_TASK_GROUPS)[number]['key']

const GROUP_KEYWORDS: Record<ScopeTaskGroupKey, string[]> = {
  libraries: [
    'install',
    'dependency',
    'dependencies',
    'library',
    'libraries',
    'package',
    'sdk',
    'npm',
    'pnpm',
  ],
  layout: [
    'layout',
    'screen',
    'page',
    'navigation',
    'routing',
    'wireframe',
    'responsive',
    'grid',
    'header',
    'footer',
  ],
  components: [
    'component',
    'button',
    'form',
    'modal',
    'card',
    'table',
    'dialog',
    'input',
    'ui',
  ],
  data: [
    'state',
    'store',
    'schema',
    'model',
    'database',
    'firestore',
    'query',
    'mutation',
    'cache',
    'validation',
  ],
  integrations: [
    'api',
    'endpoint',
    'webhook',
    'integration',
    'oauth',
    'auth',
    'connect',
    'sync',
  ],
  testing: [
    'test',
    'qa',
    'verify',
    'coverage',
    'e2e',
    'unit',
    'integration test',
    'regression',
  ],
  deployment: [
    'deploy',
    'release',
    'hosting',
    'production',
    'build',
    'ci',
    'pipeline',
    'monitoring',
  ],
  other: [],
}

/** Keyword-based bucket for backlog / scope lines (stable for persisted `scopeGroup`). */
export function classifyScopeTask(text: string): ScopeTaskGroupKey {
  const lower = text.toLowerCase()
  for (const group of SCOPE_TASK_GROUPS) {
    if (group.key === 'other') continue
    if (GROUP_KEYWORDS[group.key].some((keyword) => lower.includes(keyword)))
      return group.key
  }
  return 'other'
}

function byOrderIndex(a: ScopeBacklogItem, b: ScopeBacklogItem): number {
  const left = typeof a.orderIndex === 'number' ? a.orderIndex : Number.MAX_SAFE_INTEGER
  const right = typeof b.orderIndex === 'number' ? b.orderIndex : Number.MAX_SAFE_INTEGER
  return left - right
}

export function groupScopeTasks(items: ScopeBacklogItem[]): ScopeTaskGroup[] {
  const map = new Map<ScopeTaskGroupKey, ScopeBacklogItem[]>()
  for (const group of SCOPE_TASK_GROUPS) map.set(group.key, [])

  for (const item of items) {
    const groupKey =
      item.scopeGroup != null &&
      SCOPE_TASK_GROUPS.some((g) => g.key === item.scopeGroup)
        ? item.scopeGroup
        : classifyScopeTask(item.text)
    map.get(groupKey)?.push(item)
  }

  const grouped = SCOPE_TASK_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    items: (map.get(group.key) || []).sort(byOrderIndex),
  }))

  return grouped.filter((group) => group.items.length > 0)
}
