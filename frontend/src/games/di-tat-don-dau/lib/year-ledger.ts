import type { YearCauseView } from '../api/types.ts'

export type LedgerGroup = { key: string; kind: string; label: string; cash: number; packages: number; entries: YearCauseView[] }

export function packageCount(cause: YearCauseView) {
  if (cause.kind !== 'investment') return 0
  const count = cause.packages ?? Number(cause.detail?.match(/^(\d+) gói(?:\s|$)/)?.[1] ?? 1)
  return Number.isSafeInteger(count) && count > 0 ? count : 1
}

/** Group the presentation only. Retain every source entry, actual cash and non-cash effect. */
export function groupYearCauses(causes: YearCauseView[]): LedgerGroup[] {
  const groups = new Map<string, LedgerGroup>()
  for (const cause of causes) {
    const key = JSON.stringify([cause.kind, cause.label])
    const group = groups.get(key) ?? { key, kind: cause.kind, label: cause.label, cash: 0, packages: 0, entries: [] }
    group.cash += cause.cash
    group.packages += packageCount(cause)
    group.entries.push(cause)
    groups.set(key, group)
  }
  return [...groups.values()]
}

export function summarizeYear(causes: YearCauseView[]) {
  const groups = new Map<string, { kind: string; cash: number; packages: number; hasCash: boolean }>()
  for (const cause of causes) {
    const group = groups.get(cause.kind) ?? { kind: cause.kind, cash: 0, packages: 0, hasCash: false }
    group.cash += cause.cash
    group.packages += packageCount(cause)
    group.hasCash ||= Math.abs(cause.cash) >= .005
    groups.set(cause.kind, group)
  }
  return [...groups.values()]
}
