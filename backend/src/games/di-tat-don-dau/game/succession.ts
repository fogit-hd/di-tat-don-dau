import type { Rng } from './rng'
import { rollWholeMultiplier } from './percent'

export const HEIR_OUTCOMES = ['bankrupt', 'squander', 'steady', 'prosper', 'double'] as const
export type HeirOutcome = (typeof HEIR_OUTCOMES)[number]
export const HEIR_MULTIPLIER_RANGES: Record<HeirOutcome, [number, number]> = {
  bankrupt: [0, 0],
  squander: [0.4, 0.9],
  steady: [1, 1],
  prosper: [1.2, 2],
  double: [2, 3],
}

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
  multiplierMin?: number | null
  multiplierMax?: number | null
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

export type SuccessionPolicy = {
  baseChance: number
  stepPerYear: number
  maxChance: number
  longevityChance: number
  illnessAdd: number
  traitRules: Record<string, { outcome?: string; add?: number; set?: number }>
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

/** Years of play before death risk starts: session length divided by seconds per year. */
export function deathStartYear(durationSec: number, cycleSeconds: number) {
  const cycle = Math.max(1, Math.round(cycleSeconds))
  return Math.max(1, Math.floor(Math.max(0, durationSec) / cycle))
}

/**
 * The base transfer risk stays flat through the initial operating period.
 * It only rises after that period, keeping the early game legible and giving
 * teams time to build safeguards before succession pressure compounds.
 */
export function mildDeathChance(year: number, startYear: number, policy: Pick<SuccessionPolicy, 'baseChance' | 'stepPerYear' | 'maxChance'>) {
  const steps = Math.max(0, Math.round(year) - Math.max(1, Math.round(startYear)))
  return Math.min(policy.maxChance, policy.baseChance + steps * policy.stepPerYear)
}

export function deathChanceFor(year: number, startYear: number, policy: SuccessionPolicy, traits: string[]) {
  // Trường thọ is intentionally a true lock: other annual escalation does not leak through.
  if (traits.includes('longevity')) return Math.max(0, Math.min(0.95, policy.longevityChance))
  let chance = mildDeathChance(year, startYear, policy)
  if (traits.includes('illness')) chance += policy.illnessAdd
  return Math.max(0, Math.min(0.95, chance))
}

/** Mortality remains materially rarer than a management handover at every point on the curve. */
export function mortalityChanceFor(year: number, startYear: number, policy: SuccessionPolicy, traits: string[]) {
  if (traits.includes('longevity')) return Math.max(0, Math.min(.95, policy.longevityChance / 2))
  return deathChanceFor(year, startYear, {
    ...policy,
    baseChance: policy.baseChance / 2,
    stepPerYear: .002, // +0.2 percentage points/year, independent of the succession increment.
    maxChance: policy.maxChance / 2,
    illnessAdd: policy.illnessAdd / 2,
  }, traits)
}

export function rollHeirMultiplier(row: Pick<HeirRow, 'multiplier' | 'multiplierMin' | 'multiplierMax'> & Partial<Pick<HeirRow, 'outcomeType'>>, rng: Rng) {
  // Older database rows have no bounds. Use the outcome's range instead of a fixed midpoint.
  const fallback = row.outcomeType ? HEIR_MULTIPLIER_RANGES[row.outcomeType] : undefined
  const min = row.multiplierMin ?? fallback?.[0] ?? row.multiplier
  const max = row.multiplierMax ?? fallback?.[1] ?? row.multiplier
  if (!(max > min)) {
    if (min === 0 || min === 1) return min
    const [low, high] = fallback ?? [Math.min(min * .8, min * 1.2), Math.max(min * .8, min * 1.2)]
    return rollWholeMultiplier(low, high, rng)
  }
  return rollWholeMultiplier(min, max, rng)
}

export function heirOutcomeDetail(multiplier: number) {
  const percent = Math.round(Math.abs(multiplier - 1) * 100).toLocaleString('vi-VN')
  if (multiplier === 0) return 'Người thừa kế làm mất 100% tài sản. Tài sản còn lại bằng 0.'
  if (multiplier === 1) return 'Người thừa kế giữ nguyên tài sản (thay đổi 0%).'
  if (multiplier < 1) return `Người thừa kế làm mất ${percent}% tài sản.`
  return `Người thừa kế làm tài sản tăng thêm ${percent}% (tài sản sau bằng ${Math.round(multiplier * 100).toLocaleString('vi-VN')}% ban đầu).`
}

/** Relative to the old equally weighted outcomes; applied once before perk modifiers. */
export function balanceHeirWeights<T extends { outcomeType: HeirOutcome; weight: number }>(rows: T[]): T[] {
  const weights: Record<HeirOutcome, number> = { bankrupt: 2, squander: 13, steady: 60, prosper: 23, double: 2 }
  return rows.map(row => ({ ...row, weight: row.weight * weights[row.outcomeType] }))
}

export function applyTraitRules<T extends { outcomeType: string; weight: number }>(
  rows: T[],
  traits: string[],
  rules: SuccessionPolicy['traitRules'],
) {
  return rows.map((row) => {
    let weight = row.weight
    for (const trait of traits) {
      const rule = rules[trait]
      if (!rule || rule.outcome !== row.outcomeType) continue
      if (typeof rule.set === 'number') weight = rule.set
      if (typeof rule.add === 'number') weight += rule.add
    }
    return { ...row, weight: Math.max(0, weight) }
  })
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
