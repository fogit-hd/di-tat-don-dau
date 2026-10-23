import { z } from 'zod'
import type { Range } from './types'

const range = z.tuple([z.number(), z.number()])

export const effectSchema = z.object({
  durationSec: range,
  outputMul: range,
  priceMul: range,
  inflationMul: range,
  cash: range.optional(),
  cashPct: range.optional(),
  engineersAdd: range.optional(),
  engineersPct: range.optional(),
  machinesAdd: range.optional(),
  machinesPct: range.optional(),
  tech: range.optional(),
  support: range.optional(),
  pollution: range.optional(),
  dependency: range.optional(),
})

const AUTHORED_KEYS = ['revenuePct', 'costPct', 'assetsPct', 'cashPerYear', 'investmentPct'] as const

export type StoredEffect = z.infer<typeof effectSchema> & {
  yearSpan: number
  revenuePct?: Range
  costPct?: Range
  assetsPct?: Range
  cashPerYear?: Range
  investmentPct?: Range
}

function pair(value: number): Range {
  return [value, value]
}

function optionalNumber(row: Record<string, unknown>, key: string, label: string) {
  if (!(key in row) || row[key] == null) return undefined
  const value = row[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Sự kiện ${label} có ${key} không hợp lệ`)
  return value
}

function authored(row: Record<string, unknown>) {
  return AUTHORED_KEYS.some((key) => key in row && row[key] != null)
}

/** Industry rows store the illustrator effect. Older rows store engine ranges. */
export function readStoredEffect(raw: unknown, label: string): StoredEffect {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`Sự kiện ${label} có effect không hợp lệ`)
  const row = raw as Record<string, unknown>
  if (authored(row)) {
    const years = row.years
    if (typeof years !== 'number' || !Number.isInteger(years) || years < 1 || years > 30) {
      throw new Error(`Sự kiện ${label} cần years từ 1 đến 30`)
    }
    const revenuePct = optionalNumber(row, 'revenuePct', label)
    const costPct = optionalNumber(row, 'costPct', label)
    const assetsPct = optionalNumber(row, 'assetsPct', label)
    const cashPerYear = optionalNumber(row, 'cashPerYear', label)
    const investmentPct = optionalNumber(row, 'investmentPct', label)
    if (revenuePct == null && costPct == null && assetsPct == null && cashPerYear == null && investmentPct == null) {
      throw new Error(`Sự kiện ${label} có effect trống`)
    }
    return {
      durationSec: [years * 180, years * 180],
      outputMul: [1, 1],
      priceMul: [1, 1],
      inflationMul: [1, 1],
      yearSpan: years,
      revenuePct: revenuePct == null ? undefined : pair(revenuePct),
      costPct: costPct == null ? undefined : pair(costPct),
      assetsPct: assetsPct == null ? undefined : pair(assetsPct),
      cashPerYear: cashPerYear == null ? undefined : pair(cashPerYear),
      investmentPct: investmentPct == null ? undefined : pair(investmentPct),
    }
  }
  const parsed = effectSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Sự kiện ${label} có effect không hợp lệ`)
  const years = row.years
  const yearSpan = typeof years === 'number' && Number.isInteger(years) && years > 0 ? years : 1
  return { ...parsed.data, yearSpan }
}
