import { describe, expect, it } from 'vitest'
import { makeRng } from './rng'
import {
  applyTraitRules,
  balanceHeirWeights,
  companyHealth,
  deathChanceFor,
  deathStartYear,
  mortalityChanceFor,
  heirAssets,
  heirOutcomeDetail,
  HEIR_MULTIPLIER_RANGES,
  mildDeathChance,
  pickHeirOutcome,
  pickSuccessionReason,
  rollHeirMultiplier,
  successionChance,
  successionNotice,
  type HeirRow,
  type HealthWeight,
  type ReasonRow,
  type SuccessionGauge,
  type SuccessionPolicy,
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

const mild: SuccessionPolicy = {
  baseChance: 0.01,
  stepPerYear: 0.0025,
  maxChance: 0.3,
  longevityChance: 0.01,
  illnessAdd: 0.1,
  traitRules: {
    heir_trained: { outcome: 'prosper', add: 3 },
    family_fund: { outcome: 'bankrupt', set: 0 },
  },
}

describe('mild death curve', () => {
  it('starts at session length divided by seconds per year', () => {
    expect(deathStartYear(15 * 60, 60)).toBe(15)
    expect(deathStartYear(10 * 60, 30)).toBe(20)
  })

  it('holds at 1 percent through the operating period, then adds 0.25 point each year, capped at 30', () => {
    expect(mildDeathChance(1, 15, mild)).toBeCloseTo(0.01)
    expect(mildDeathChance(2, 15, mild)).toBeCloseTo(0.01)
    expect(mildDeathChance(15, 15, mild)).toBeCloseTo(0.01)
    expect(mildDeathChance(16, 15, mild)).toBeCloseTo(0.0125)
    expect(mildDeathChance(140, 15, mild)).toBeCloseTo(0.3)
  })

  it('locks longevity at 1 percent even when another trait would otherwise add risk', () => {
    expect(deathChanceFor(30, 15, mild, ['longevity'])).toBeCloseTo(0.01)
    expect(deathChanceFor(30, 15, mild, ['longevity', 'illness'])).toBeCloseTo(0.01)
    expect(deathChanceFor(1, 15, mild, ['illness'])).toBeCloseTo(0.11)
  })

  it('keeps mortality below the corresponding succession risk', () => {
    expect(mortalityChanceFor(15, 15, mild, [])).toBeCloseTo(0.005)
    expect(mortalityChanceFor(16, 15, mild, [])).toBeCloseTo(0.007)
    expect(mortalityChanceFor(16, 15, mild, [])).toBeLessThan(deathChanceFor(16, 15, mild, []))
  })
})

describe('heir multiplier ranges', () => {
  it('does not leave old equal min/max loss and gain multipliers fixed', () => {
    const draws = Array.from({ length: 30 }, (_, seed) => rollHeirMultiplier({ outcomeType: 'squander', multiplier: .65, multiplierMin: .65, multiplierMax: .65 }, makeRng(seed + 1)))
    expect(new Set(draws).size).toBeGreaterThan(20)
    for (const value of draws) { expect(value).toBeGreaterThanOrEqual(.4); expect(value).toBeLessThanOrEqual(.9) }
  })
  it.each(['squander', 'prosper', 'double'] as const)('randomizes legacy %s rows with missing bounds', outcomeType => {
    const [min, max] = HEIR_MULTIPLIER_RANGES[outcomeType]
    const draws = Array.from({ length: 64 }, (_, seed) => rollHeirMultiplier({ outcomeType, multiplier: (min + max) / 2, multiplierMin: null, multiplierMax: null }, makeRng(seed + 1)))
    expect(new Set(draws).size).toBeGreaterThan(25)
    for (const value of draws) {
      expect(value).toBeGreaterThanOrEqual(min)
      expect(value).toBeLessThanOrEqual(max)
      expect(value * 100).toBeCloseTo(Math.round(value * 100), 6)
    }
  })

  it('displays the exact rolled loss and uses it to calculate assets', () => {
    const rng = makeRng(1)
    rng.next = () => 0.2092
    const multiplier = rollHeirMultiplier({ outcomeType: 'squander', multiplier: 0.65 }, rng)
    expect(multiplier).toBe(0.5)
    expect(heirOutcomeDetail(multiplier)).toBe('Người thừa kế làm mất 50% tài sản.')
    expect(heirAssets(100000, multiplier)).toBe(50000)
    const saved = JSON.parse(JSON.stringify({ multiplier, outcomeDetail: heirOutcomeDetail(multiplier) }))
    expect(saved.multiplier).toBe(multiplier)
    expect(saved.outcomeDetail).toContain('50%')
  })

  it('shows the actual gain and distinguishes growth percent from the final multiplier', () => {
    expect(heirOutcomeDetail(1.49)).toContain('tăng thêm 49%')
    expect(heirOutcomeDetail(2.49)).toContain('tăng thêm 149% (tài sản sau bằng 249%')
    expect(heirOutcomeDetail(1)).toContain('thay đổi 0%')
    expect(heirOutcomeDetail(0)).toContain('mất 100%')
  })

  it('respects explicit configured ranges and keeps only bankruptcy/steady deterministic by default', () => {
    const rng = makeRng(1)
    rng.next = () => 0.5
    expect(rollHeirMultiplier({ outcomeType: 'squander', multiplier: 0.65, multiplierMin: .6, multiplierMax: .7 }, rng)).toBe(.65)
    expect(rollHeirMultiplier({ outcomeType: 'bankrupt', multiplier: .9 }, rng)).toBe(0)
    expect(rollHeirMultiplier({ outcomeType: 'steady', multiplier: .9 }, rng)).toBe(1)
  })
  it('rolls inside the seeded range and stays put when the range is a point', () => {
    const rng = makeRng(4)
    const rolled = rollHeirMultiplier({ multiplier: 0.65, multiplierMin: 0.4, multiplierMax: 0.9 }, rng)
    expect(rolled).toBeGreaterThanOrEqual(0.4)
    expect(rolled).toBeLessThanOrEqual(0.9)
    expect(rollHeirMultiplier({ multiplier: 0, multiplierMin: 0, multiplierMax: 0 }, makeRng(1))).toBe(0)
  })

  it('lets a family fund remove bankruptcy and training favor prosper', () => {
    const rows = heirs.map((row) => ({ ...row, weight: 1 }))
    const funded = applyTraitRules(rows, ['family_fund'], mild.traitRules)
    expect(funded.find((row) => row.outcomeType === 'bankrupt')?.weight).toBe(0)
    const trained = applyTraitRules(rows, ['heir_trained'], mild.traitRules)
    expect(trained.find((row) => row.id === 'prosper')?.weight).toBe(4)
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


describe('rare extreme inheritance outcomes', () => {
  it('keeps both ruin and 2–3x windfalls rare with equal base rows, and preserves protective perks', () => {
    const rows=heirs.map(row=>({...row,weight:1}))
    const balanced=balanceHeirWeights(rows)
    const counts: Record<string,number>={}
    const rng=makeRng(2041)
    for(let i=0;i<20000;i++) {
      const picked=pickHeirOutcome(balanced,'chip-ban-dan','khoi-nghiep',rng,null,[])!
      counts[picked.outcomeType]=(counts[picked.outcomeType]??0)+1
    }
    expect(counts.bankrupt!/20000).toBeLessThan(.03)
    expect(counts.double!/20000).toBeLessThan(.03)
    expect(counts.steady!/20000).toBeGreaterThan(.55)
    expect(applyTraitRules(balanced,['family_fund'],{family_fund:{outcome:'bankrupt',set:0}}).find(r=>r.outcomeType==='bankrupt')!.weight).toBe(0)
    expect(rows[0]!.weight).toBe(1)
  })
})
