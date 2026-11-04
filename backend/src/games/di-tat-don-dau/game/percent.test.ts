import { describe, expect, it } from 'vitest'
import { makeRng } from './rng'
import { rollWholeMultiplier, rollWholeRate } from './percent'

describe('whole gameplay percentages', () => {
  it('only draws whole percent increments and respects endpoints', () => {
    const values = new Set<number>()
    for (let seed = 1; seed <= 300; seed++) {
      const value = rollWholeMultiplier(.4, .9, makeRng(seed))
      values.add(value)
      expect(value).toBeGreaterThanOrEqual(.4); expect(value).toBeLessThanOrEqual(.9)
      expect(value * 100).toBeCloseTo(Math.round(value * 100), 8)
    }
    expect(values.size).toBeGreaterThan(45)
  })
  it('retains sub-percent expected values through whole-percent draws instead of silently fixing them to zero', () => {
    const values = Array.from({ length: 1000 }, (_, seed) => rollWholeRate(.006, makeRng(seed + 1)))
    expect(new Set(values)).toEqual(new Set([0, .01]))
    const average = values.reduce((sum, value) => sum + value, 0) / values.length
    expect(average).toBeGreaterThan(.005); expect(average).toBeLessThan(.007)
    expect(rollWholeRate(0, makeRng(1))).toBe(0)
    expect(rollWholeRate(1, makeRng(1))).toBe(1)
  })
})
