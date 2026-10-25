import { describe, expect, it } from 'vitest'
import { balance } from '../../prisma/seed/balance'
import { annualBalance, annualEconomy, annualPolicy, annualWeights } from './random-economy'
import { deathChanceFor, mortalityChanceFor, type SuccessionPolicy } from './succession'

const policy: SuccessionPolicy = { baseChance: .01, stepPerYear: .0025, maxChance: .3, longevityChance: .01, illnessAdd: .1, traitRules: {} }

describe('annual random economy', () => {
  it('varies weighted outcome odds without re-enabling an outcome disabled by a protective perk', () => {
    const state = { seed: 89, cycles: 5 }
    const rows = [{ id: 'bankrupt', weight: 0 }, { id: 'squander', weight: 1 }, { id: 'prosper', weight: 1 }]
    const weighted = annualWeights(state, rows, 'heirs')
    expect(weighted[0]?.weight).toBe(0)
    expect(weighted[1]?.weight).not.toBe(weighted[2]?.weight)
    expect(annualWeights(state, rows, 'heirs')).toEqual(weighted)
    expect(annualWeights({ ...state, cycles: 6 }, rows, 'heirs')).not.toEqual(weighted)
    expect(rows[1]?.weight).toBe(1)
  })
  it('is stable across snapshots, JSON restore, changing cash and repeated purchases', () => {
    const state = { seed: 143, cycles: 12, cash: 10000 }
    const before = annualEconomy(state)
    state.cash = 100
    expect(annualEconomy(state)).toEqual(before)
    expect(annualEconomy(JSON.parse(JSON.stringify(state)))).toEqual(before)
    expect(annualEconomy(state, 13)).not.toEqual(before)
    expect(annualEconomy({ ...state, seed: 144 })).not.toEqual(before)
  })

  it('keeps upgrades in 90–110 percent and other annual factors in 80–120 percent', () => {
    const profiles = Array.from({ length: 200 }, (_, seed) => annualEconomy({ seed: seed + 1, cycles: 4 }))
    for (const profile of profiles) {
      for (const value of [...Object.values(profile.upgrade), ...Object.entries(profile).filter(([key]) => key !== 'upgrade').map(([, value]) => value as number)]) {
        expect(value).toBeGreaterThanOrEqual(.8); expect(value).toBeLessThanOrEqual(1.2)
        expect(value * 100).toBeCloseTo(Math.round(value * 100), 8)
      }
      for (const value of Object.values(profile.upgrade)) { expect(value).toBeGreaterThanOrEqual(.9); expect(value).toBeLessThanOrEqual(1.1) }
      expect(new Set(Object.values(profile.upgrade)).size).toBeGreaterThan(1)
    }
    for (const key of ['illness','events','extraEvents','classEvents','family','questions','support','interest','wear','insurance','centennial'] as const) {
      expect(new Set(profiles.map(p => p[key])).size).toBeGreaterThan(30)
    }
  })

  it('keeps annual risk increments exact while the randomly drawn illness penalty remains stable', () => {
    const chances: number[] = []
    for (let year = 1; year <= 80; year++) {
      const state = { seed: 39, cycles: year - 1 }
      const rolled = annualPolicy(state, policy, year)
      chances.push(deathChanceFor(year, 15, rolled, []))
      for (const traits of [[], ['illness'], ['longevity'], ['illness','longevity']]) {
        const succession = deathChanceFor(year, 15, rolled, traits)
        expect(mortalityChanceFor(year, 15, rolled, traits)).toBeLessThan(succession)
        expect(succession).toBeGreaterThan(0); expect(succession).toBeLessThanOrEqual(.95)
      }
    }
    expect(new Set(chances).size).toBeGreaterThan(10)
    expect(chances.at(-1)).toBe(.04)
    expect(mortalityChanceFor(80, 15, annualPolicy({ seed: 39, cycles: 79 }, policy), [])).toBe(.02)
    const state = { seed: 39, cycles: 16 }
    const first = annualPolicy(state, policy, 16)
    const second = annualPolicy(state, policy, 17)
    expect(first).toEqual(second)
    expect(first.baseChance).toBe(policy.baseChance)
    expect(first.longevityChance).toBe(policy.longevityChance)
    expect(deathChanceFor(17, 15, second, []) - deathChanceFor(16, 15, first, [])).toBeCloseTo(.0025, 12)
    expect(mortalityChanceFor(17, 15, second, []) - mortalityChanceFor(16, 15, first, [])).toBeCloseTo(.002, 12)
    expect(first.illnessAdd * 100).toBeCloseTo(Math.round(first.illnessAdd * 100), 8)
  })

  it('uses next-year conditions for interest and event rolls and preserves explicit disabled probabilities', () => {
    const state = { seed: 7, cycles: 3 }
    const adjusted = annualBalance(state, balance)
    expect(adjusted.debtInterest).toBeGreaterThanOrEqual(.06)
    expect(adjusted.debtInterest).toBeLessThanOrEqual(.10)
    for (const rate of [adjusted.debtInterest, adjusted.yearEventChance, adjusted.yearExtraChance, adjusted.classEventChance, adjusted.questionChance, 1 - adjusted.conditionDecay]) {
      expect(rate * 100).toBeCloseTo(Math.round(rate * 100), 8)
    }
    expect(adjusted.yearEventChance).toBeGreaterThanOrEqual(.48)
    expect(adjusted.yearEventChance).toBeLessThanOrEqual(.72)
    expect(annualBalance(state, { ...balance, yearEventChance: 0 }).yearEventChance).toBe(0)
    expect(adjusted.conditionDecay).toBeGreaterThan(0); expect(adjusted.conditionDecay).toBeLessThanOrEqual(1)
    expect(adjusted.yearSeconds).toBe(60)
    expect(adjusted.assetPerTy).toBe(balance.assetPerTy)
  })
})
