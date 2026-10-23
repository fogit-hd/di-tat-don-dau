import { describe, expect, it } from 'vitest'
import { balance } from '../../prisma/seed/balance'
import { countThemes, type ThemeBoard } from './catalog'
import { drawYearEvents } from './engine'
import { makeRng } from './rng'
import type { ThemeStart } from './types'

describe('drawYearEvents', () => {
  it('leaves some years quiet and never draws more than the cap', () => {
    const pool = ['a', 'b', 'c', 'd']
    const counts = [0, 0, 0]
    for (let seed = 1; seed <= 400; seed += 1) {
      const drawn = drawYearEvents([], pool, makeRng(seed), balance)
      expect(drawn.ids.length).toBeLessThanOrEqual(balance.yearMaxEvents)
      expect(new Set(drawn.ids).size).toBe(drawn.ids.length)
      if (drawn.ids.length === 0) expect(drawn.classWide).toBe(false)
      counts[Math.min(drawn.ids.length, 2)] += 1
    }
    expect(balance.yearMinEvents).toBe(0)
    expect(balance.yearEventChance).toBeCloseTo(0.6)
    expect(balance.yearExtraChance).toBeLessThan(balance.yearEventChance)
    expect(counts[0]).toBeGreaterThan(80)
    expect(counts[1]).toBeGreaterThan(80)
    expect(counts[2]).toBeGreaterThan(10)
  })

  it('stays quiet when the first roll misses', () => {
    const drawn = drawYearEvents(['a', 'b'], ['a', 'b'], makeRng(1), {
      ...balance,
      yearMinEvents: 0,
      yearEventChance: 0,
      yearExtraChance: 1,
      yearMaxEvents: 2,
    })
    expect(drawn.ids).toEqual([])
    expect(drawn.classWide).toBe(false)
    expect(drawn.bag).toEqual(['a', 'b'])
  })

  it('draws one event when the extra roll misses', () => {
    const drawn = drawYearEvents([], ['a', 'b'], makeRng(3), {
      ...balance,
      yearMinEvents: 0,
      yearEventChance: 1,
      yearExtraChance: 0,
      yearMaxEvents: 2,
    })
    expect(drawn.ids).toHaveLength(1)
  })

  it('refills the bag after the industry events are used', () => {
    const drawn = drawYearEvents(['only'], ['only', 'next'], makeRng(9), { ...balance, yearMinEvents: 2, yearMaxEvents: 2, yearExtraChance: 0 })
    expect(drawn.ids).toHaveLength(2)
    expect(drawn.ids).toContain('only')
  })
})

describe('countThemes', () => {
  it('counts industry × region × scale × context × situation × name', () => {
    const start: ThemeStart = { cashMul: 1, engineers: 1, machines: 0, pollution: 0, dependency: 0, condition: 1 }
    const board: ThemeBoard = {
      industries: [
        {
          id: 'chip-ban-dan',
          name: 'Chip bán dẫn',
          unit: 'sản phẩm',
          art: 'chip-ban-dan',
          sort: 1,
          role: 'Giám đốc',
          mission: 'Làm chip',
          worker: 'kỹ sư',
          product: 'chip',
          leap: 'chip',
          weak: 'máy',
          epl: 1,
          tech: 0,
          support: 0,
          infra: 0,
          emission: 1,
          baseOutput: 1,
          basePrice: 1,
          opex: 1,
          idleCost: 1,
          directions: [],
          patterns: [],
          eventIds: [],
          anchors: null,
        },
      ],
      regions: [
        { id: 'a', name: 'A', sort: 1 },
        { id: 'b', name: 'B', sort: 2 },
      ],
      scales: [{ id: 'nha-may', name: 'Nhà máy', sort: 1, roleTemplate: '{{role}}', capitalFactor: 1 }],
      contexts: [{ id: 'khoi', name: 'Khởi nghiệp', line: 'Mới', sort: 1, start }],
      scenarios: [
        { id: 's1', body: 'Một', industryId: 'chip-ban-dan', regionId: null, scaleId: null, contextId: null, role: null, mission: null, factoryName: null },
        { id: 's2', body: 'Hai', industryId: 'chip-ban-dan', regionId: null, scaleId: null, contextId: null, role: null, mission: null, factoryName: null },
      ],
      nameParts: [
        { id: 'sao', name: 'Sao Việt', sort: 1 },
        { id: 'rong', name: 'Rồng Vàng', sort: 2 },
      ],
      lines: [],
      themeName: '{{industry}}',
      mission: '{{mission}}',
    }
    expect(countThemes(board)).toBe(8)
  })
})
