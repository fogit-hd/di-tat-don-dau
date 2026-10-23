import type { Rng } from './rng'

export const HEIR_OUTCOMES = ['bankrupt', 'squander', 'steady', 'prosper', 'double'] as const
export type HeirOutcome = (typeof HEIR_OUTCOMES)[number]

export type OddsPoint = { minYear: number; chance: number }

export type ReasonRow = {
  id: string
  industryId: string | null
  contextId: string | null
  text: string
  weight: number
  sort: number
}

export type HeirRow = {
  id: string
  outcomeType: HeirOutcome
  industryId: string | null
  contextId: string | null
  label: string
  detail: string
  weight: number
  multiplier: number
  sort: number
}

export type SuccessionGauge = {
  debtDependencyWeight: number
  debtLeverageWeight: number
  debtCap: number
  valueFloor: number
}

export type HealthWeight = {
  id: string
  outcome: HeirOutcome
  minReserveRatio: number | null
  maxReserveRatio: number | null
  minDebtRatio: number | null
  maxDebtRatio: number | null
  weightAdd: number
}

export type CompanyBooks = { cash: number; dependency: number; value: number }

export type SuccessionNotice = {
  teamId: string
  year: number
  causeText: string
  outcome: HeirOutcome
  assetsBefore: number
  assetsAfter: number
  finished: true
}

export function isHeirOutcome(value: string): value is HeirOutcome {
  return (HEIR_OUTCOMES as readonly string[]).includes(value)
}

export function successionChance(year: number, curve: OddsPoint[]) {
  let chance = 0
  const sorted = curve.slice().sort((a, b) => a.minYear - b.minYear)
  for (const point of sorted) {
    if (point.minYear <= year) chance = point.chance
  }
  return chance
}

export function heirAssets(before: number, multiplier: number) {
  return Math.max(0, Math.round(before * multiplier))
}

export function companyHealth(books: CompanyBooks, gauge: SuccessionGauge) {
  const value = Math.max(books.value, gauge.valueFloor)
  const reserveRatio = books.cash / value
  const leverage = Math.max(0, 1 - reserveRatio)
  const raw = gauge.debtDependencyWeight * books.dependency + gauge.debtLeverageWeight * leverage
  const debtRatio = Math.min(gauge.debtCap, Math.max(0, raw))
  return { reserveRatio, debtRatio }
}

export function healthWeightAdd(rows: HealthWeight[], outcome: HeirOutcome, reserveRatio: number, debtRatio: number) {
  return rows.reduce((sum, row) => {
    if (row.outcome !== outcome) return sum
    if (row.minReserveRatio != null && reserveRatio < row.minReserveRatio) return sum
    if (row.maxReserveRatio != null && reserveRatio > row.maxReserveRatio) return sum
    if (row.minDebtRatio != null && debtRatio < row.minDebtRatio) return sum
    if (row.maxDebtRatio != null && debtRatio > row.maxDebtRatio) return sum
    return sum + row.weightAdd
  }, 0)
}

export function successionNotice(input: Omit<SuccessionNotice, 'finished'>): SuccessionNotice {
  return {
    teamId: input.teamId,
    year: input.year,
    causeText: input.causeText,
    outcome: input.outcome,
    assetsBefore: input.assetsBefore,
    assetsAfter: input.assetsAfter,
    finished: true,
  }
}

function matches(row: { industryId: string | null; contextId: string | null }, industryId: string, contextId: string) {
  if (row.industryId && row.industryId !== industryId) return false
  if (row.contextId && row.contextId !== contextId) return false
  return true
}

function specificity(row: { industryId: string | null; contextId: string | null }) {
  return (row.industryId ? 2 : 0) + (row.contextId ? 1 : 0)
}

export function weightedPick<T extends { weight: number }>(rows: T[], rng: Rng): T | null {
  const pool = rows.filter((row) => row.weight > 0)
  if (!pool.length) return null
  const total = pool.reduce((sum, row) => sum + row.weight, 0)
  let cursor = rng.next() * total
  for (const row of pool) {
    cursor -= row.weight
    if (cursor <= 0) return row
  }
  return pool[pool.length - 1] ?? null
}

export function pickSuccessionReason(rows: ReasonRow[], industryId: string, contextId: string, rng: Rng) {
  const pool = rows
    .filter((row) => matches(row, industryId, contextId))
    .slice()
    .sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id))
  return weightedPick(pool, rng)
}

export function pickHeirOutcome(
  rows: HeirRow[],
  industryId: string,
  contextId: string,
  rng: Rng,
  health: { reserveRatio: number; debtRatio: number } | null,
  adjustments: HealthWeight[],
) {
  const matched = rows.filter((row) => matches(row, industryId, contextId))
  const best = new Map<string, HeirRow[]>()
  for (const row of matched) {
    const score = specificity(row)
    const current = best.get(row.outcomeType)
    if (!current || score > specificity(current[0]!)) best.set(row.outcomeType, [row])
    else if (score === specificity(current[0]!)) current.push(row)
  }
  const pool = [...best.values()]
    .flat()
    .map((row) => {
      const add = health ? healthWeightAdd(adjustments, row.outcomeType, health.reserveRatio, health.debtRatio) : 0
      return { ...row, weight: Math.max(0, row.weight + add) }
    })
    .sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id))
  return weightedPick(pool, rng)
}
