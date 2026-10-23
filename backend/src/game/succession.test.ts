import { describe, expect, it } from 'vitest'
import { makeRng } from './rng'
import {
  companyHealth,
  heirAssets,
  pickHeirOutcome,
  pickSuccessionReason,
  successionChance,
  successionNotice,
  type HeirRow,
  type HealthWeight,
  type ReasonRow,
  type SuccessionGauge,
} from './succession'

const curve = [
  { minYear: 1, chance: 0 },
  { minYear: 18, chance: 0.03 },
  { minYear: 20, chance: 0.1 },
  { minYear: 27, chance: 0.36 },
]

const gauge: SuccessionGauge = {
  debtDependencyWeight: 0.04,
  debtLeverageWeight: 0.55,
  debtCap: 1.5,
  valueFloor: 1,
}

const adjustments: HealthWeight[] = [
  { id: 'sound.prosper', outcome: 'prosper', minReserveRatio: 0.2, maxReserveRatio: null, minDebtRatio: null, maxDebtRatio: 0.55, weightAdd: 2.2 },
  { id: 'sound.double', outcome: 'double', minReserveRatio: 0.2, maxReserveRatio: null, minDebtRatio: null, maxDebtRatio: 0.55, weightAdd: 1.8 },
  { id: 'heavy.bankrupt', outcome: 'bankrupt', minReserveRatio: null, maxReserveRatio: null, minDebtRatio: 0.72, maxDebtRatio: null, weightAdd: 3 },
  { id: 'heavy.prosper', outcome: 'prosper', minReserveRatio: null, maxReserveRatio: null, minDebtRatio: 0.72, maxDebtRatio: null, weightAdd: -1 },
  { id: 'heavy.double', outcome: 'double', minReserveRatio: null, maxReserveRatio: null, minDebtRatio: 0.72, maxDebtRatio: null, weightAdd: -0.7 },
]

const heirs: HeirRow[] = [
  { id: 'bankrupt', outcomeType: 'bankrupt', industryId: null, contextId: null, label: 'Phá sản', detail: 'Hết', weight: 1, multiplier: 0, sort: 1 },
  { id: 'squander', outcomeType: 'squander', industryId: null, contextId: null, label: 'Hoang phí', detail: 'Bớt', weight: 1.4, multiplier: 0.75, sort: 2 },
  { id: 'steady', outcomeType: 'steady', industryId: null, contextId: null, label: 'Giữ', detail: 'Như cũ', weight: 2.2, multiplier: 1, sort: 3 },
  { id: 'prosper', outcomeType: 'prosper', industryId: null, contextId: null, label: 'Khá', detail: 'Chung', weight: 1.4, multiplier: 1.5, sort: 4 },
  { id: 'double', outcomeType: 'double', industryId: null, contextId: null, label: 'Đôi', detail: 'Gấp đôi', weight: 0.8, multiplier: 2, sort: 5 },
  {
    id: 'prosper.chip',
    outcomeType: 'prosper',
    industryId: 'chip-ban-dan',
    contextId: null,
    label: 'Khá',
    detail: 'Xưởng chip còn chạy',
    weight: 1.4,
    multiplier: 1.5,
    sort: 4,
  },
]

describe('successionChance', () => {
  it('stays at zero until the curve reaches the later years', () => {
    expect(successionChance(1, curve)).toBe(0)
    expect(successionChance(17, curve)).toBe(0)
    expect(successionChance(18, curve)).toBe(0.03)
    expect(successionChance(20, curve)).toBe(0.1)
    expect(successionChance(30, curve)).toBe(0.36)
  })
})

describe('heirAssets', () => {
  it('applies the seeded multiplier', () => {
    expect(heirAssets(1000, 0)).toBe(0)
    expect(heirAssets(1000, 0.75)).toBe(750)
    expect(heirAssets(1000, 1)).toBe(1000)
    expect(heirAssets(1000, 1.5)).toBe(1500)
    expect(heirAssets(1000, 2)).toBe(2000)
  })
})

describe('companyHealth', () => {
  it('treats cash cover as reserves and dependency plus leverage as debt', () => {
    const sound = companyHealth({ cash: 4000, dependency: 2, value: 10000 }, gauge)
    expect(sound.reserveRatio).toBeCloseTo(0.4)
    expect(sound.debtRatio).toBeCloseTo(0.41)
    const heavy = companyHealth({ cash: 800, dependency: 6, value: 10000 }, gauge)
    expect(heavy.reserveRatio).toBeCloseTo(0.08)
    expect(heavy.debtRatio).toBeGreaterThan(0.72)
  })
})

describe('pickHeirOutcome', () => {
  it('uses the industry line instead of the generic one for that outcome', () => {
    const picked = pickHeirOutcome(
      heirs.filter((row) => row.outcomeType === 'prosper').map((row) => ({ ...row, weight: row.industryId ? 1 : 0 })),
      'chip-ban-dan',
      'khoi',
      makeRng(2),
      null,
      [],
    )
    expect(picked?.detail).toBe('Xưởng chip còn chạy')
  })

  it('shifts the draw toward prosper or double when reserves are high and debt is low', () => {
    const health = companyHealth({ cash: 4000, dependency: 2, value: 10000 }, gauge)
    const seen = tally(health)
    expect(seen.prosper + seen.double).toBeGreaterThan(seen.bankrupt + seen.squander)
  })

  it('shifts the draw toward bankrupt when borrowing is heavy', () => {
    const health = companyHealth({ cash: 800, dependency: 6, value: 10000 }, gauge)
    const seen = tally(health)
    expect(seen.bankrupt).toBeGreaterThan(seen.prosper + seen.double)
  })
})

describe('successionNotice', () => {
  it('matches the agreed payload', () => {
    const notice = successionNotice({
      teamId: 'team-1',
      year: 21,
      causeText: 'Tuổi già',
      outcome: 'steady',
      assetsBefore: 1000,
      assetsAfter: 1000,
    })
    expect(Object.keys(notice).sort()).toEqual(['assetsAfter', 'assetsBefore', 'causeText', 'finished', 'outcome', 'teamId', 'year'])
    expect(notice.finished).toBe(true)
    expect(notice.outcome).toBe('steady')
  })
})

describe('pickSuccessionReason', () => {
  it('can draw an industry reason or a shared one', () => {
    const rows: ReasonRow[] = [
      { id: 'age', industryId: null, contextId: null, text: 'Tuổi già', weight: 1, sort: 1 },
      { id: 'chip', industryId: 'chip-ban-dan', contextId: null, text: 'Tai nạn phòng sạch', weight: 1, sort: 2 },
      { id: 'other', industryId: 'thep', contextId: null, text: 'Lò', weight: 10, sort: 3 },
    ]
    const seen = new Set<string>()
    for (let seed = 1; seed <= 40; seed += 1) {
      const drawn = pickSuccessionReason(rows, 'chip-ban-dan', 'khoi', makeRng(seed))
      if (drawn) seen.add(drawn.id)
    }
    expect(seen.has('other')).toBe(false)
    expect(seen.has('age') || seen.has('chip')).toBe(true)
  })
})

function tally(health: { reserveRatio: number; debtRatio: number }) {
  const seen = { bankrupt: 0, squander: 0, steady: 0, prosper: 0, double: 0 }
  for (let seed = 1; seed <= 240; seed += 1) {
    const drawn = pickHeirOutcome(heirs, 'thep', 'khoi', makeRng(seed), health, adjustments)
    if (drawn) seen[drawn.outcomeType] += 1
  }
  return seen
}
