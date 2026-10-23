import { shuffle, type Rng } from './rng'
import type {
  Balance,
  Effect,
  EffectPatch,
  EndingRule,
  EventDef,
  Exposure,
  Line,
  LineDef,
  Pending,
  QuestionDef,
  Range,
  TeamState,
  ThemeDef,
} from './types'

export const LINES: Line[] = ['eng', 'mac', 'sup', 'inf', 'grn']

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function stepOf(capital: number, balance: Balance) {
  const raw = Math.round(capital / balance.stepDivisor / balance.stepRound) * balance.stepRound
  return Math.max(balance.stepMin, raw)
}

export function createState(theme: ThemeDef, capital: number, rng: Rng, balance: Balance, now = 0): TeamState {
  const start = theme.start
  const cash = Math.round(capital * start.cashMul)
  return {
    cash,
    engineers: start.engineers,
    machines: start.machines,
    support: 0,
    infra: 0,
    green: 0,
    tech: balance.startTech,
    pollution: start.pollution,
    dependency: start.dependency,
    condition: start.condition,
    cumulativeOutput: 0,
    cumulativeRevenue: 0,
    cycles: 0,
    lastIncome: 0,
    lastOutput: 0,
    effects: [],
    log: [fillText(balance.logs.start, { cash: cash.toLocaleString('vi-VN') })],
    seenQuestions: [],
    seenEvents: [],
    eventBag: [],
    nextYearAt: 0,
    yearLockUntil: 0,
    finished: false,
    succession: null,
    nextPromptAt: now,
    introDone: false,
    factoryName: theme.factoryName,
    pending: null,
    rng: rng.getState(),
    seed: rng.getState(),
  }
}

export function invest(
  state: TeamState,
  line: Line,
  amount: number,
  balance: Balance,
  lines: LineDef[],
): { ok: true; state: TeamState } | { ok: false; error: string } {
  if (!LINES.includes(line)) return { ok: false, error: 'Hướng đầu tư không hợp lệ' }
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Số tiền không hợp lệ' }
  if (state.cash + 1e-6 < amount) return { ok: false, error: 'Không đủ vốn' }
  const next: TeamState = {
    ...state,
    effects: state.effects.slice(),
    log: state.log.slice(),
    seenQuestions: state.seenQuestions.slice(),
    seenEvents: state.seenEvents.slice(),
  }
  const spec = lines.find((item) => item.id === line)
  const hired = Math.round(amount * balance.engPerTy)
  const added = amount / balance.assetPerTy
  const entry = fillText(spec?.log || 'Đầu tư {{line}}.', {
    line,
    hired: hired.toLocaleString('vi-VN'),
    added: added.toFixed(1),
  })
  next.cash -= amount
  if (line === 'eng') {
    next.engineers += hired
    next.dependency = Math.max(0, next.dependency - balance.engDependencyRelief)
  } else if (line === 'mac') {
    next.machines += added
  } else if (line === 'sup') {
    next.support += added
  } else if (line === 'inf') {
    next.infra += added
  } else {
    next.green += added
    next.pollution = Math.max(0, next.pollution - balance.greenPollutionRelief)
  }
  next.log = [entry, ...next.log].slice(0, balance.logLimit)
  return { ok: true, state: next }
}

function effectFactors(effects: Effect[], now: number) {
  let outputMul = 1
  let priceMul = 1
  let inflationMul = 1
  let revenueMul = 1
  let costMul = 1
  let cashPerYear = 0
  for (const effect of effects) {
    if (effect.defer) continue
    if ((effect.yearsLeft ?? 0) <= 0 && effect.endsAt <= now) continue
    outputMul *= effect.outputMul
    priceMul *= effect.priceMul
    inflationMul *= effect.inflationMul
    revenueMul *= effect.revenueMul ?? 1
    costMul *= effect.costMul ?? 1
    cashPerYear += effect.cashPerYear ?? 0
  }
  return { outputMul, priceMul, inflationMul, revenueMul, costMul, cashPerYear }
}

export function runCycle(state: TeamState, theme: ThemeDef, rng: Rng, now: number, balance: Balance): TeamState {
  const s: TeamState = {
    ...state,
    effects: state.effects.filter((effect) => effect.defer || (effect.yearsLeft ?? 0) > 0 || effect.endsAt > now),
    log: state.log.slice(),
    seenQuestions: state.seenQuestions.slice(),
    seenEvents: state.seenEvents.slice(),
    pending: state.pending,
  }
  const epl = theme.coefs.epl
  const operating = Math.min(s.machines, s.engineers / epl)
  const idle = Math.max(0, s.machines - operating)
  const noise = balance.outputNoiseMin + rng.next() * (balance.outputNoiseMax - balance.outputNoiseMin)
  const priceNoise = balance.priceNoiseMin + rng.next() * (balance.priceNoiseMax - balance.priceNoiseMin)
  const { outputMul, priceMul, inflationMul, revenueMul, costMul, cashPerYear } = effectFactors(s.effects, now)
  s.tech += operating * balance.techPerOperating + s.engineers * balance.techPerEngineer
  const techFactor = 1 + s.tech * theme.coefs.tech
  const supFactor = 1 + s.support * theme.coefs.support
  const infFactor = 1 + s.infra * theme.coefs.infra
  const emit = operating * theme.coefs.emission * balance.emissionScale
  const scrub = s.green * balance.greenScrub + s.infra * balance.infraScrub
  s.pollution = clamp(s.pollution * balance.pollutionRetain + emit - scrub, 0, 100)
  const pollFactor = 1 - Math.max(0, s.pollution - balance.pollutionPriceStart) / balance.pollutionPriceSpan
  const output =
    operating *
    theme.coefs.baseOutput *
    techFactor *
    supFactor *
    infFactor *
    pollFactor *
    noise *
    outputMul
  const price = theme.coefs.basePrice * priceNoise * priceMul * pollFactor
  const revenue = Math.max(0, output * price * revenueMul)
  const opex = (operating * theme.coefs.opex + idle * theme.coefs.idleCost) * costMul
  const net = revenue - opex
  const inflRate =
    balance.inflationBase * inflationMul * (balance.inflationNoiseMin + rng.next() * (balance.inflationNoiseMax - balance.inflationNoiseMin))
  const infl = s.cash * inflRate
  s.cash = Math.max(0, s.cash - infl + net + cashPerYear)
  s.cumulativeOutput += output
  s.cumulativeRevenue += revenue
  s.lastIncome = net - infl + cashPerYear
  s.lastOutput = output
  s.cycles += 1
  s.condition *= balance.conditionDecay
  if (operating > balance.dependencyEaseOperating && idle < operating * balance.dependencyEaseIdleRatio) {
    s.dependency = Math.max(0, s.dependency * balance.dependencyEaseMul)
  }
  const line = fillText(balance.logs.cycle, {
    cycle: String(s.cycles),
    operating: operating.toFixed(1),
    idle: idle.toFixed(1),
    output: Math.round(output).toLocaleString('vi-VN'),
    unit: theme.unit,
    income: Math.round(net - infl + cashPerYear).toLocaleString('vi-VN'),
  })
  s.log = [line, ...s.log].slice(0, balance.logLimit)
  s.rng = rng.getState()
  return s
}

export function computeValue(state: TeamState, theme: ThemeDef, balance: Balance): number {
  const epl = theme.coefs.epl
  const util = state.machines > 0 ? clamp(state.engineers / (state.machines * epl), 0, 1) : 0
  const engValue = state.engineers * (1 / balance.engPerTy) * balance.engBook * (1 + state.tech * balance.engTechBook)
  const macValue = state.machines * balance.assetPerTy * (balance.macBookBase + balance.macBookUtil * util) * state.condition
  const supValue = state.support * balance.supBook
  const infValue = state.infra * balance.infBook
  const grnValue = state.green * balance.grnBook
  const brand = state.cumulativeRevenue * balance.brandShare
  const penalty = state.pollution * balance.pollutionPenalty + state.dependency * balance.dependencyPenalty
  return Math.max(0, Math.round(state.cash + engValue + macValue + supValue + infValue + grnValue + brand - penalty))
}

export function computeEnding(state: TeamState, theme: ThemeDef, endings: EndingRule[], balance: Balance): string {
  const epl = theme.coefs.epl
  const ratio = state.machines <= balance.machineFloor ? 0 : state.engineers / (state.machines * epl)
  const ordered = endings.slice().sort((a, b) => a.sort - b.sort)
  for (const rule of ordered) {
    if (rule.isDefault) continue
    const produced = state.cumulativeOutput > theme.coefs.baseOutput * rule.productionMul
    if (rule.requiresProduction && !produced) continue
    if (rule.minRatio != null && ratio < rule.minRatio) continue
    if (rule.maxRatio != null && ratio >= rule.maxRatio) continue
    if (rule.minTech != null && state.tech < rule.minTech) continue
    if (rule.maxDependency != null && state.dependency >= rule.maxDependency) continue
    if (rule.minMachines != null && state.machines < rule.minMachines) continue
    return rule.id
  }
  return ordered.find((rule) => rule.isDefault)?.id ?? ordered[ordered.length - 1]?.id ?? 'lag'
}

export function exposureOf(state: TeamState, exposure: Exposure, balance: Balance): number {
  if (exposure === 'machines') {
    return clamp(balance.exposureMachinesBase + state.machines / balance.exposureMachinesDiv, balance.exposureMachinesMin, balance.exposureMachinesMax)
  }
  if (exposure === 'engineers') {
    return clamp(
      balance.exposureEngineersBase + state.engineers / balance.exposureEngineersDiv,
      balance.exposureEngineersMin,
      balance.exposureEngineersMax,
    )
  }
  if (exposure === 'cash') {
    return clamp(balance.exposureCashBase + state.cash / balance.exposureCashDiv, balance.exposureCashMin, balance.exposureCashMax)
  }
  if (exposure === 'pollution') {
    return clamp(
      balance.exposurePollutionBase + state.pollution / balance.exposurePollutionDiv,
      balance.exposurePollutionMin,
      balance.exposurePollutionMax,
    )
  }
  return 1
}

function roll(rng: Rng, range: Range | undefined, fallback: number) {
  if (!range) return fallback
  return rng.range(range[0], range[1])
}

function scaleMul(mul: number, exposure: number, balance: Balance) {
  return 1 + (mul - 1) * clamp(exposure, balance.exposureScaleMin, balance.exposureScaleMax)
}

export function applyPatch(
  state: TeamState,
  patch: EffectPatch,
  rng: Rng,
  now: number,
  id: string,
  balance: Balance,
): TeamState {
  const exposure = exposureOf(state, patch.exposure, balance)
  const next: TeamState = {
    ...state,
    effects: state.effects.slice(),
    log: state.log.slice(),
    seenQuestions: state.seenQuestions.slice(),
    seenEvents: state.seenEvents.slice(),
  }
  const cash = roll(rng, patch.cash, 0) * exposure
  const cashPct = roll(rng, patch.cashPct, 0) * exposure
  const engineersAdd = roll(rng, patch.engineersAdd, 0) * exposure
  const engineersPct = roll(rng, patch.engineersPct, 0) * exposure
  const machinesAdd = roll(rng, patch.machinesAdd, 0) * exposure
  const machinesPct = roll(rng, patch.machinesPct, 0) * exposure
  const tech = roll(rng, patch.tech, 0) * exposure
  const support = roll(rng, patch.support, 0) * exposure
  const pollution = roll(rng, patch.pollution, 0) * exposure
  const dependency = roll(rng, patch.dependency, 0) * exposure
  next.cash = Math.max(0, next.cash + cash + next.cash * cashPct)
  next.engineers = Math.max(0, next.engineers * (1 + engineersPct) + engineersAdd)
  next.machines = Math.max(0, next.machines * (1 + machinesPct) + machinesAdd)
  next.tech = Math.max(0, next.tech + tech)
  next.support = Math.max(0, next.support + support)
  next.pollution = clamp(next.pollution + pollution, 0, 100)
  next.dependency = Math.max(0, next.dependency + dependency)
  const assetsPct = patch.assetsPct ? roll(rng, patch.assetsPct, 0) : 0
  if (assetsPct) {
    const factor = 1 + assetsPct / 100
    next.cash = Math.max(0, next.cash * factor)
    next.engineers = Math.max(0, next.engineers * factor)
    next.machines = Math.max(0, next.machines * factor)
    next.support = Math.max(0, next.support * factor)
    next.infra = Math.max(0, next.infra * factor)
    next.green = Math.max(0, next.green * factor)
  }
  const revenuePct = patch.revenuePct ? roll(rng, patch.revenuePct, 0) : 0
  const costPct = patch.costPct ? roll(rng, patch.costPct, 0) : 0
  const perYear = patch.cashPerYear ? roll(rng, patch.cashPerYear, 0) : 0
  const yearSpan = Math.max(0, Math.round(patch.yearSpan ?? 0))
  const duration = Math.round(roll(rng, patch.durationSec, 60))
  const shownFor = Math.max(duration, yearSpan * 180)
  const effect: Effect = {
    id,
    visual: patch.visual,
    title: patch.title,
    body: patch.body,
    severity: 1,
    startedAt: now,
    endsAt: now + shownFor * 1000,
    outputMul: scaleMul(roll(rng, patch.outputMul, 1), exposure, balance),
    priceMul: scaleMul(roll(rng, patch.priceMul, 1), exposure, balance),
    inflationMul: scaleMul(roll(rng, patch.inflationMul, 1), exposure, balance),
    revenueMul: 1 + revenuePct / 100,
    costMul: 1 + costPct / 100,
    cashPerYear: perYear,
    yearsLeft: yearSpan,
    defer: yearSpan > 0,
    bornAt: now,
  }
  next.effects = [effect, ...next.effects].slice(0, 12)
  const bits = [fillText(balance.logs.event, { title: patch.title })]
  if (Math.abs(engineersAdd) > 1) bits.push(`kỹ sư ${engineersAdd > 0 ? '+' : ''}${Math.round(engineersAdd)}`)
  if (Math.abs(engineersPct) > 0.01) bits.push(`kỹ sư ${Math.round(engineersPct * 100)}%`)
  if (Math.abs(machinesAdd) > 0.05) bits.push(`dây chuyền ${machinesAdd > 0 ? '+' : ''}${machinesAdd.toFixed(1)}`)
  if (Math.abs(machinesPct) > 0.01) bits.push(`dây chuyền ${Math.round(machinesPct * 100)}%`)
  if (Math.abs(cash) > 20) bits.push(`vốn ${Math.round(cash).toLocaleString('vi-VN')} tỷ`)
  if (revenuePct) bits.push(`doanh thu ${Math.round(revenuePct)}%`)
  if (costPct) bits.push(`chi phí ${Math.round(costPct)}%`)
  if (assetsPct) bits.push(`tài sản ${Math.round(assetsPct)}%`)
  if (perYear) bits.push(`mỗi năm ${Math.round(perYear).toLocaleString('vi-VN')} tỷ`)
  next.log = [bits.join(' · '), ...next.log].slice(0, balance.logLimit)
  next.rng = rng.getState()
  return next
}

export function patchFromEvent(event: EventDef, title: string, body: string): EffectPatch {
  return {
    visual: event.visual,
    title,
    body,
    exposure: event.exposure,
    durationSec: event.durationSec,
    outputMul: event.outputMul,
    priceMul: event.priceMul,
    inflationMul: event.inflationMul,
    cash: event.cash,
    cashPct: event.cashPct,
    revenuePct: event.revenuePct,
    costPct: event.costPct,
    assetsPct: event.assetsPct,
    cashPerYear: event.cashPerYear,
    yearSpan: event.yearSpan,
    engineersAdd: event.engineersAdd,
    engineersPct: event.engineersPct,
    machinesAdd: event.machinesAdd,
    machinesPct: event.machinesPct,
    tech: event.tech,
    support: event.support,
    pollution: event.pollution,
    dependency: event.dependency,
  }
}

/** Effects drawn earlier become due. Effects drawn at `now` stay on screen until a later advance. */
export function openYearEffects(state: TeamState, now: number): TeamState {
  let changed = false
  const effects = state.effects.map((effect) => {
    if (!effect.defer || (effect.bornAt ?? 0) >= now) return effect
    changed = true
    return { ...effect, defer: false }
  })
  return changed ? { ...state, effects } : state
}

/** One settlement consumed. Deferred effects stay at full length. Wall-clock effects stay until they expire. */
export function closeYearEffects(state: TeamState, now: number): TeamState {
  const effects = state.effects.flatMap((effect) => {
    if (effect.defer) return [effect]
    const left = effect.yearsLeft ?? 0
    if (left > 0) {
      const next = left - 1
      return next > 0 ? [{ ...effect, yearsLeft: next }] : []
    }
    return effect.endsAt > now ? [effect] : []
  })
  return { ...state, effects }
}

export function fillText(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '')
}

export function eventCopy(event: EventDef, theme: ThemeDef) {
  const variant = narrationFor(event, theme) ?? event.variants?.[theme.industryId]
  const title = fillText(variant?.title ?? event.title, theme.vars)
  const body = fillText(variant?.body ?? event.body, theme.vars)
  return { title, body }
}

function narrationFor(event: EventDef, theme: ThemeDef) {
  const rows = event.narrations ?? []
  return (
    rows.find((row) => row.regionId === theme.regionId && row.contextId === theme.contextId) ??
    rows.find((row) => row.regionId === '' && row.contextId === theme.contextId) ??
    rows.find((row) => row.regionId === theme.regionId && row.contextId === '')
  )
}

export function drawQuestion(state: TeamState, questions: QuestionDef[], rng: Rng): QuestionDef | null {
  const unseen = questions.filter((question) => !state.seenQuestions.includes(question.id))
  if (!unseen.length) return null
  const topics = [...new Set(unseen.map((question) => question.topic))]
  const topic = rng.pick(topics)
  const pool = unseen.filter((question) => question.topic === topic)
  return rng.pick(pool)
}

export function drawYearEvents(bag: string[], poolIds: string[], rng: Rng, balance: Balance) {
  let deck = bag.filter((id) => poolIds.includes(id))
  const drawn: string[] = []
  const min = Math.max(0, Math.round(balance.yearMinEvents))
  const max = Math.max(min, Math.round(balance.yearMaxEvents))
  const take = () => {
    if (!deck.length) deck = shuffle(poolIds, rng)
    const id = deck.shift()
    if (id) drawn.push(id)
  }
  if (!poolIds.length || max < 1) return { ids: drawn, bag: deck, classWide: false }
  for (let i = 0; i < min && drawn.length < max; i += 1) take()
  if (drawn.length === 0 && rng.next() < balance.yearEventChance) take()
  while (drawn.length > 0 && drawn.length < max && rng.next() < balance.yearExtraChance) take()
  return { ids: drawn, bag: deck, classWide: drawn.length > 0 && rng.next() < balance.classEventChance }
}

export function drawEvent(seen: string[], events: EventDef[], rng: Rng, scope: 'team' | 'room'): EventDef | null {
  const pool = events.filter((event) => event.scope === scope && !seen.includes(event.id))
  if (!pool.length) return null
  const total = pool.reduce((sum, event) => sum + event.weight, 0)
  let cursor = rng.next() * total
  for (const event of pool) {
    cursor -= event.weight
    if (cursor <= 0) return event
  }
  return pool[pool.length - 1] ?? null
}

export function presentQuestion(question: QuestionDef, theme: ThemeDef, rng: Rng, now: number, openMs: number): Pending {
  const options = shuffle(
    question.options.map((option) => ({
      id: option.id,
      text: fillText(option.text, theme.vars),
    })),
    rng,
  )
  return {
    id: `q-${question.id}-${now}`,
    kind: 'question' as const,
    phase: 'open' as const,
    title: question.typeTitle || question.type,
    body: fillText(question.prompt, theme.vars),
    options,
    correctOptionId: question.correctOptionId,
    explanation: fillText(question.explanation, theme.vars),
    expiresAt: now + openMs,
    questionId: question.id,
  }
}

export function jitterMs(rng: Rng, balance: Balance) {
  const span = balance.promptJitterMaxMs - balance.promptJitterMinMs
  return balance.promptJitterMinMs + Math.floor(rng.next() * (span + 1))
}

export function publicPending(pending: Pending | null) {
  if (!pending) return null
  return {
    id: pending.id,
    kind: pending.kind,
    phase: pending.phase,
    title: pending.title,
    body: pending.body,
    options: pending.options.map((option) => ({ id: option.id, text: option.text })),
    explanation: pending.phase === 'resolved' ? pending.explanation : '',
    chosenOptionId: pending.chosenOptionId ?? null,
    correct: pending.phase === 'resolved' ? Boolean(pending.correct) : null,
    expiresAt: pending.expiresAt,
    questionId: pending.questionId ?? null,
    note: pending.note ?? '',
  }
}
