import { describe, expect, it } from 'vitest'
import { balance } from '../../prisma/seed/balance'
import { ENDINGS, LINES } from '../../prisma/seed/rules'
import {
  applyPatch,
  closeYearEffects,
  computeEnding,
  computeValue,
  createState,
  drawQuestion,
  eventCopy,
  invest,
  openYearEffects,
  patchFromEvent,
  runCycle,
} from './engine'
import { makeRng } from './rng'
import type { EventDef, LineDef, QuestionDef, ThemeDef } from './types'

const lines: LineDef[] = LINES.map(({ id, label, hint, log }) => ({ id, label, hint, log }))
const capital = balance.priceCapitalBase + 1400 / balance.engPerTy
const target = capital * balance.priceRevenueShare

const theme: ThemeDef = {
  id: 'chip-ban-dan.ha-noi.nha-may.khoi-nghiep',
  industryId: 'chip-ban-dan',
  industryName: 'Chip bán dẫn',
  name: 'Nhà máy Chip bán dẫn · Hà Nội',
  unit: 'lô chip',
  role: 'Giám đốc',
  mission: 'Tham gia chuỗi chip.',
  factoryName: 'Nhà máy Chip Sao Việt',
  dirs: ['Đào tạo kỹ sư bán dẫn', 'Máy quang khắc', 'Vật liệu', 'Hạ tầng điện'],
  lines,
  art: 'cleanroom',
  anchors: null,
  eventIds: [],
  regionId: 'ha-noi',
  regionName: 'Hà Nội',
  scaleId: 'nha-may',
  scaleName: 'Nhà máy',
  contextId: 'khoi-nghiep',
  contextName: 'Khởi nghiệp',
  vars: { factory: 'Nhà máy Chip Sao Việt', worker: 'kỹ sư bán dẫn', industry: 'Chip bán dẫn' },
  coefs: {
    epl: 1400,
    tech: 0.16,
    support: 0.08,
    infra: 0.09,
    emission: 1.05,
    baseOutput: 78,
    basePrice: target / 78,
    opex: target * balance.priceOpexShare,
    idleCost: balance.defaultIdleCost,
  },
  start: { cashMul: 1, engineers: 180, machines: 0, pollution: 8, dependency: 0, condition: 1 },
}

const questions: QuestionDef[] = [
  {
    id: 'q1',
    topic: 'a',
    section: '6.1.1',
    difficulty: 1,
    type: 'mc',
    typeTitle: 'Câu hỏi',
    prompt: 'Một',
    options: [{ id: 'a', text: 'A' }],
    correctOptionId: 'a',
    explanation: '',
  },
  {
    id: 'q2',
    topic: 'b',
    section: '6.1.1',
    difficulty: 1,
    type: 'mc',
    typeTitle: 'Câu hỏi',
    prompt: 'Hai',
    options: [{ id: 'a', text: 'A' }],
    correctOptionId: 'a',
    explanation: '',
  },
]

const flood: EventDef = {
  id: 'flood',
  industryId: 'chip-ban-dan',
  scope: 'team',
  weight: 1,
  visual: 'flood',
  effectCode: 'flood',
  severity: 2,
  good: false,
  title: 'Ngập',
  body: 'Nước vào {{factory}}',
  exposure: 'machines',
  durationSec: [50, 90],
  outputMul: [0.55, 0.8],
  priceMul: [0.92, 1],
  inflationMul: [1, 1],
  machinesPct: [-0.18, -0.08],
}

function fresh(capital = 10000, seed = 7) {
  return createState(theme, capital, makeRng(seed), balance)
}

describe('economy', () => {
  it('lets cash go negative and charges the database interest rate', () => {
    const state = fresh()
    state.cash = -1000
    state.engineers = 0
    state.machines = 0
    const next = runCycle(state, theme, makeRng(2), 10_000, balance)
    expect(next.cash).toBeLessThan(-1000)
    expect(next.yearParts?.interest).toBeCloseTo(-80, 5)
  })

  it('rejects spending more cash than the team holds', () => {
    const state = fresh()
    const result = invest(state, 'mac', state.cash + 500, balance, lines)
    expect(result.ok).toBe(false)
  })

  it('turns cash into engineers and machines', () => {
    const spent = invest(fresh(), 'eng', 1000, balance, lines)
    expect(spent.ok).toBe(true)
    if (!spent.ok) return
    expect(spent.state.engineers).toBeGreaterThan(fresh().engineers)
    expect(spent.state.cash).toBe(fresh().cash - 1000)
    expect(spent.state.log[0]).toContain('kỹ sư')
  })

  it('idle machines cost money and do not produce', () => {
    const state = fresh()
    state.machines = 3
    state.engineers = 0
    state.cash = 5000
    const next = runCycle(state, theme, makeRng(3), 10_000, balance)
    expect(next.cumulativeOutput).toBe(0)
    expect(next.cash).toBeLessThan(5000)
  })

  it('shrinks idle cash through inflation and ends behind', () => {
    const state = fresh()
    state.engineers = 0
    state.machines = 0
    state.cash = 10000
    let cursor = state
    const rng = makeRng(9)
    for (let i = 0; i < 12; i++) cursor = runCycle(cursor, theme, rng, 20_000 + i, balance)
    expect(cursor.cash).toBeLessThan(9600)
    expect(computeEnding(cursor, theme, ENDINGS, balance)).toBe('lag')
    expect(computeValue(cursor, theme, balance)).toBeGreaterThan(7000)
  })

  it('calls a machine-heavy factory dependent', () => {
    let state = fresh()
    for (let i = 0; i < 4; i++) {
      const step = invest(state, 'mac', 1000, balance, lines)
      expect(step.ok).toBe(true)
      if (step.ok) state = step.state
    }
    state = runCycle(state, theme, makeRng(4), 30_000, balance)
    expect(computeEnding(state, theme, ENDINGS, balance)).toBe('depend')
  })

  it('lets a staffed factory reach leapfrog', () => {
    let state = fresh(20000)
    for (let i = 0; i < 6; i++) {
      const step = invest(state, 'eng', 1000, balance, lines)
      if (step.ok) state = step.state
    }
    for (let i = 0; i < 3; i++) {
      const step = invest(state, 'mac', 1000, balance, lines)
      if (step.ok) state = step.state
    }
    const rng = makeRng(11)
    for (let i = 0; i < 16; i++) state = runCycle(state, theme, rng, 40_000 + i * 1000, balance)
    expect(computeEnding(state, theme, ENDINGS, balance)).toBe('leap')
    expect(computeValue(state, theme, balance)).toBeGreaterThan(8000)
  })

  it('does not repeat a question for the same team', () => {
    const state = fresh()
    const rng = makeRng(21)
    const ids: string[] = []
    for (let i = 0; i < 2; i++) {
      const drawn = drawQuestion(state, questions, rng)
      expect(drawn).not.toBeNull()
      if (!drawn) return
      ids.push(drawn.id)
      state.seenQuestions.push(drawn.id)
    }
    expect(new Set(ids).size).toBe(ids.length)
    expect(drawQuestion(state, questions, rng)).toBeNull()
  })

  it('scales a flood harder when the team owns more machines', () => {
    const bare = fresh()
    bare.machines = 0.2
    const busy = fresh()
    busy.machines = 6
    const copy = eventCopy(flood, theme)
    const patch = patchFromEvent(flood, copy.title, copy.body)
    const low = applyPatch(bare, patch, makeRng(1), 50_000, 'a', balance)
    const high = applyPatch(busy, patch, makeRng(1), 50_000, 'b', balance)
    expect(busy.machines - high.machines).toBeGreaterThan(bare.machines - low.machines)
  })

  it('settles an authored revenue cut by game years even after its animation timer expires', () => {
    const base = () => {
      const state = fresh()
      state.machines = 2
      state.engineers = 4000
      state.cash = 10000
      return state
    }
    const calm = runCycle(base(), theme, makeRng(5), 10_000, balance)
    const drawn = applyPatch(
      base(),
      {
        visual: 'market_crash',
        title: 'Cấm xuất',
        body: 'Doanh thu giảm',
        exposure: 'any',
        durationSec: [180, 180],
        outputMul: [1, 1],
        priceMul: [1, 1],
        inflationMul: [1, 1],
        revenuePct: [-50, -50],
        yearSpan: 2,
      },
      makeRng(1),
      10_000,
      'ban',
      balance,
    )
    const sameYear = runCycle(drawn, theme, makeRng(5), 10_000, balance)
    expect(sameYear.cumulativeRevenue).toBeCloseTo(calm.cumulativeRevenue, 5)
    expect(drawn.cash).toBeCloseTo(10000, 5)
    expect(drawn.effects[0]).toMatchObject({ yearsLeft: 2, defer: true })
    const opened = openYearEffects(sameYear, 600_000)
    const hit = runCycle(opened, theme, makeRng(5), 600_000, balance)
    const calmSecond = runCycle(calm, theme, makeRng(5), 600_000, balance)
    const hitDelta = hit.cumulativeRevenue - sameYear.cumulativeRevenue
    const calmDelta = calmSecond.cumulativeRevenue - calm.cumulativeRevenue
    expect(hitDelta).toBeLessThan(calmDelta * 0.6)
    const still = closeYearEffects(hit, 600_000)
    expect(still.effects[0]?.yearsLeft).toBe(1)
    expect(still.effects[0]?.defer).toBe(false)
    const again = runCycle(openYearEffects(still, 1_200_000), theme, makeRng(5), 1_200_000, balance)
    expect(closeYearEffects(again, 1_200_000).effects).toHaveLength(0)
  })

  it('cuts assets once when the event is drawn', () => {
    const state = fresh()
    state.cash = 10000
    state.engineers = 200
    const next = applyPatch(
      state,
      {
        visual: 'flood',
        title: 'Lụt',
        body: 'Kho ngập',
        exposure: 'any',
        durationSec: [180, 180],
        outputMul: [1, 1],
        priceMul: [1, 1],
        inflationMul: [1, 1],
        assetsPct: [-20, -20],
        yearSpan: 1,
      },
      makeRng(2),
      10_000,
      'flood',
      balance,
    )
    expect(next.cash).toBeCloseTo(8000, 5)
    expect(next.engineers).toBeCloseTo(160, 5)
  })
})
