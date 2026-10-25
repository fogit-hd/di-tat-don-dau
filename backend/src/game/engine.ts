import { shuffle, type Rng } from './rng'
import { isBankrupt, productionPlan, supplyBenefits } from './production'
import { money, moneyTemplate } from './money'
import { wholeRate, rollWholeMultiplier, rollWholeRate } from './percent'
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
    log: [moneyTemplate(balance.logs.start, { cash })],
    seenQuestions: [],
    seenEvents: [],
    eventBag: [],
    nextYearAt: 0,
    yearLockUntil: 0,
    finished: false,
    secondLife: 'locked',
    stateAidEligible: false,
    succession: null,
    centennial: null,
    traits: [],
    eventLog: [],
    yearLedger: [],
    pendingCauses: [],
    yearOpenCash: cash,
    yearOpenAssets: 0,
    pulseYear: 0,
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
  investmentValue = amount,
  packages = 1,
  efficiency = 1,
): { ok: true; state: TeamState } | { ok: false; error: string } {
  if (isBankrupt(state) || state.finished) return { ok: false, error: 'Doanh nghiệp đã dừng hoạt động' }
  if (!LINES.includes(line)) return { ok: false, error: 'Hướng đầu tư không hợp lệ' }
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Số tiền không hợp lệ' }
  if (!Number.isFinite(investmentValue) || investmentValue <= 0) return { ok: false, error: 'Giá trị đầu tư không hợp lệ' }
  if (!Number.isSafeInteger(packages) || packages < 1) return { ok: false, error: 'Số gói không hợp lệ' }
  if (!Number.isFinite(efficiency) || efficiency <= 0) return { ok: false, error: 'Hiệu quả đầu tư không hợp lệ' }
  if (state.cash + 1e-6 < amount) return { ok: false, error: 'Không đủ vốn' }
  const next: TeamState = {
    ...state,
    effects: state.effects.slice(),
    log: state.log.slice(),
    seenQuestions: state.seenQuestions.slice(),
    seenEvents: state.seenEvents.slice(),
  }
  const spec = lines.find((item) => item.id === line)
  // Events change the invoice, not the size of the purchased upgrade package.
  const hired = Math.round(investmentValue * balance.engPerTy * efficiency) * packages
  const added = investmentValue / balance.assetPerTy * efficiency * packages
  const entry = fillText(spec?.log || 'Đầu tư {{line}}.', {
    line,
    hired: hired.toLocaleString('vi-VN'),
    added: added.toFixed(1),
  })
  next.cash -= amount
  next.pendingCauses = [
    ...(state.pendingCauses ?? []),
    { kind: 'investment', label: spec?.label || line, cash: -amount, packages, cashBefore: state.cash, cashAfter: next.cash,
      detail: `${packages} gói · hiệu quả ${(efficiency * 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}% · giá gốc ${money(investmentValue * packages)} · thực chi ${money(amount)}`,
    },
  ]
  if (line === 'eng') {
    next.engineers += hired
    next.dependency = Math.max(0, next.dependency - balance.engDependencyRelief * packages * efficiency)
  } else if (line === 'mac') {
    next.machines += added
  } else if (line === 'sup') {
    next.support += added
  } else if (line === 'inf') {
    next.infra += added
  } else {
    next.green += added
    next.pollution = Math.max(0, next.pollution - balance.greenPollutionRelief * packages * efficiency)
  }
  next.log = [entry, ...next.log].slice(0, balance.logLimit)
  return { ok: true, state: next }
}

/** The server is authoritative: event discounts/surcharges are calculated here before every purchase. */
export function investmentPrice(state: TeamState, base: number, now: number) {
  const mul = state.effects.reduce((value, effect) => {
    if (effect.defer || ((effect.yearsLeft ?? 0) <= 0 && effect.endsAt <= now)) return value
    return value * (effect.investmentMul ?? 1)
  }, 1)
  return Math.max(1, Math.round(base * mul))
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
  if (state.finished || isBankrupt(state)) return state
  const s: TeamState = {
    ...state,
    effects: state.effects.filter((effect) => effect.defer || (effect.yearsLeft ?? 0) > 0 || effect.endsAt > now),
    log: state.log.slice(),
    seenQuestions: state.seenQuestions.slice(),
    seenEvents: state.seenEvents.slice(),
    pending: state.pending,
  }
  const noise = rollWholeMultiplier(balance.outputNoiseMin, balance.outputNoiseMax, rng)
  const priceNoise = rollWholeMultiplier(balance.priceNoiseMin, balance.priceNoiseMax, rng)
  const { inflationMul, cashPerYear } = effectFactors(s.effects, now)
  const plan = productionPlan(s, theme, balance, now, noise, priceNoise)
  const { operating, idle, output, revenue, net } = plan
  s.tech = plan.tech
  s.pollution = plan.pollution
  let interest = 0
  if (s.cash < 0 && balance.debtInterest) {
    interest = s.cash * balance.debtInterest
    s.cash += interest
  }
  const inflRate = rollWholeRate(
    balance.inflationBase * inflationMul * rollWholeMultiplier(balance.inflationNoiseMin, balance.inflationNoiseMax, rng), rng)
  const infl = Math.max(0, s.cash) * inflRate
  const production = net - infl
  s.cash = s.cash + production + cashPerYear
  s.yearParts = { production, ongoing: cashPerYear, interest }
  s.cycleReport = { ...plan, year: s.cycles + 1, unit: theme.unit, inflation: infl, inflationRate: inflRate, interest, ongoing: cashPerYear }
  s.cumulativeOutput += output
  s.cumulativeRevenue += revenue
  s.lastIncome = net - infl + cashPerYear
  s.lastOutput = output
  s.cycles += 1
  s.condition *= balance.conditionDecay
  if (operating > balance.dependencyEaseOperating && idle < operating * balance.dependencyEaseIdleRatio) {
    s.dependency = Math.max(0, s.dependency * balance.dependencyEaseMul)
  }
  const line = fillText(moneyTemplate(balance.logs.cycle, { income: Math.round(net - infl + cashPerYear) }), {
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

export function companyBooks(state: TeamState, theme: ThemeDef, balance: Balance) {
  const epl = theme.coefs.epl
  const util = state.machines > 0 ? clamp(state.engineers / (state.machines * epl), 0, 1) : 0
  const engValue = state.engineers * (1 / balance.engPerTy) * balance.engBook * (1 + state.tech * balance.engTechBook)
  const macValue = state.machines * balance.assetPerTy * (balance.macBookBase + balance.macBookUtil * util) * state.condition
  const supValue = state.support * balance.supBook
  const infValue = state.infra * balance.infBook
  const grnValue = state.green * balance.grnBook
  const brand = state.cumulativeRevenue * balance.brandShare
  const penalty = state.pollution * balance.pollutionPenalty + state.dependency * balance.dependencyPenalty
  const total = isBankrupt(state) ? 0 : Math.max(0, Math.round(state.cash + engValue + macValue + supValue + infValue + grnValue + brand - penalty))
  return { cash: state.cash, workforce: engValue, machines: macValue, support: supValue, infra: infValue, green: grnValue,
    brand, pollutionPenalty: state.pollution * balance.pollutionPenalty, dependencyPenalty: state.dependency * balance.dependencyPenalty, total }
}

export function computeValue(state: TeamState, theme: ThemeDef, balance: Balance): number {
  return companyBooks(state,theme,balance).total
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
  const [min, max] = range
  if (min !== max) return rng.range(min, max)
  // A point range in legacy event data is a baseline, not a fixed outcome.
  if (min === fallback) return min
  return fallback + (min - fallback) * rng.range(.8, 1.2)
}

const roundImpact = (value: number) => Math.round(value)
const percentText = (value: number) => Math.round(value).toLocaleString('vi-VN')

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
  const protection = patch.supplyShock ? supplyBenefits(state.support).disruptionProtection : 0
  const operatingProtection = patch.supplyShock === 'investment' ? 0 : protection
  const exposure = exposureOf(state, patch.exposure, balance)
  const next: TeamState = {
    ...state,
    effects: state.effects.slice(),
    log: state.log.slice(),
    seenQuestions: state.seenQuestions.slice(),
    seenEvents: state.seenEvents.slice(),
  }
  const cash = roll(rng, patch.cash, 0) * exposure
  const cashPct = Math.max(-1, wholeRate(roll(rng, patch.cashPct, 0) * exposure))
  const engineersAdd = roll(rng, patch.engineersAdd, 0) * exposure
  const engineersPct = Math.max(-1, wholeRate(roll(rng, patch.engineersPct, 0) * exposure))
  const machinesAdd = roll(rng, patch.machinesAdd, 0) * exposure
  const machinesPct = Math.max(-1, wholeRate(roll(rng, patch.machinesPct, 0) * exposure))
  const tech = roll(rng, patch.tech, 0) * exposure
  const support = roll(rng, patch.support, 0) * exposure
  const pollution = roll(rng, patch.pollution, 0) * exposure
  const dependency = roll(rng, patch.dependency, 0) * exposure
  next.cash = next.cash + cash + next.cash * cashPct
  next.engineers = Math.max(0, next.engineers * (1 + engineersPct) + engineersAdd)
  next.machines = Math.max(0, next.machines * (1 + machinesPct) + machinesAdd)
  next.tech = Math.max(0, next.tech + tech)
  next.support = Math.max(0, next.support + support)
  next.pollution = clamp(next.pollution + pollution, 0, 100)
  next.dependency = Math.max(0, next.dependency + dependency)
  const assetsPct = Math.max(-100, roundImpact(patch.assetsPct ? roll(rng, patch.assetsPct, 0) : 0))
  if (assetsPct) {
    const factor = 1 + assetsPct / 100
    next.cash = next.cash * factor
    next.engineers = Math.max(0, next.engineers * factor)
    next.machines = Math.max(0, next.machines * factor)
    next.support = Math.max(0, next.support * factor)
    next.infra = Math.max(0, next.infra * factor)
    next.green = Math.max(0, next.green * factor)
  }
  const revenueDraw = patch.revenuePct ? roll(rng, patch.revenuePct, 0) : 0
  const revenuePct = Math.max(-95, roundImpact(revenueDraw * (revenueDraw < 0 ? 1 - operatingProtection : 1)))
  const costDraw = patch.costPct ? roll(rng, patch.costPct, 0) : 0
  const costPct = Math.max(-95, roundImpact(costDraw * (costDraw > 0 ? 1 - operatingProtection : 1)))
  const perYear = roundImpact(patch.cashPerYear ? roll(rng, patch.cashPerYear, 0) : 0)
  const investmentDraw = patch.investmentPct ? roll(rng, patch.investmentPct, 0) : 0
  const investmentPct = Math.max(-95, roundImpact(investmentDraw * (investmentDraw > 0 ? 1 - protection : 1)))
  const factor = (value: number) => Math.max(0, wholeRate(value))
  const outputDraw = scaleMul(roll(rng, patch.outputMul, 1), exposure, balance)
  const outputMul = factor(1 + (outputDraw - 1) * (outputDraw < 1 ? 1 - operatingProtection : 1))
  const priceMul = factor(scaleMul(roll(rng, patch.priceMul, 1), exposure, balance))
  const inflationMul = factor(scaleMul(roll(rng, patch.inflationMul, 1), exposure, balance))
  const authoredYears = Math.max(0, Math.round(patch.yearSpan ?? 0))
  const yearSpan = authoredYears ? rng.int(Math.max(1, Math.floor(authoredYears * .8)), Math.ceil(authoredYears * 1.2)) : 0
  const duration = Math.max(1, Math.round(patch.durationSec ? rng.range(...patch.durationSec) : 60))
  const shownFor = Math.max(duration, yearSpan * 180)
  const bits = [fillText(balance.logs.event, { title: patch.title })]
  if (Math.abs(engineersAdd) > 1) bits.push(`kỹ sư ${engineersAdd > 0 ? '+' : ''}${Math.round(engineersAdd)}`)
  if (engineersPct) bits.push(`kỹ sư ${percentText(engineersPct * 100)}%`)
  if (Math.abs(machinesAdd) > 0.05) bits.push(`dây chuyền ${machinesAdd > 0 ? '+' : ''}${machinesAdd.toFixed(1)}`)
  if (machinesPct) bits.push(`dây chuyền ${percentText(machinesPct * 100)}%`)
  if (cashPct) bits.push(`tiền mặt ${percentText(cashPct * 100)}%`)
  if (Math.abs(cash) > 20) bits.push(`vốn ${money(cash)}`)
  if (revenuePct) bits.push(`doanh thu ${percentText(revenuePct)}%`)
  if (costPct) bits.push(`chi phí ${percentText(costPct)}%`)
  if (assetsPct) bits.push(`tài sản ${percentText(assetsPct)}%`)
  if (perYear) bits.push(`mỗi năm ${money(perYear)}`)
  if (investmentPct) bits.push(`giá đầu tư ${investmentPct > 0 ? '+' : ''}${percentText(investmentPct)}%`)
  if (outputMul !== 1) bits.push(`sản lượng ${outputMul >= 1 ? '+' : ''}${percentText((outputMul - 1) * 100)}%`)
  if (priceMul !== 1) bits.push(`giá bán ${priceMul >= 1 ? '+' : ''}${percentText((priceMul - 1) * 100)}%`)
  if (inflationMul !== 1) bits.push(`lạm phát ${inflationMul >= 1 ? '+' : ''}${percentText((inflationMul - 1) * 100)}%`)
  if (tech) bits.push(`công nghệ ${tech > 0 ? '+' : ''}${Math.round(tech)}`)
  if (support) bits.push(`hỗ trợ ${support > 0 ? '+' : ''}${Math.round(support)}`)
  if (pollution) bits.push(`ô nhiễm ${pollution > 0 ? '+' : ''}${Math.round(pollution)}`)
  if (protection) bits.push(`phụ trợ giảm ${Math.round(protection * 100)}% mức bất lợi của cú sốc đầu vào`)
  if (dependency) bits.push(`phụ thuộc ${dependency > 0 ? '+' : ''}${Math.round(dependency)}`)
  const effect: Effect = {
    id,
    visual: patch.visual,
    title: patch.title,
    body: patch.body,
    severity: 1,
    startedAt: now,
    endsAt: now + shownFor * 1000,
    outputMul,
    priceMul,
    inflationMul,
    revenueMul: 1 + revenuePct / 100,
    costMul: 1 + costPct / 100,
    cashPerYear: perYear,
    investmentMul: 1 + investmentPct / 100,
    yearsLeft: yearSpan,
    defer: yearSpan > 0,
    bornAt: now,
    summary: bits.slice(1).join(' · ') || patch.title,
  }
  next.effects = [effect, ...next.effects].slice(0, 12)
  next.log = [bits.join(' · '), ...next.log].slice(0, balance.logLimit)
  next.rng = rng.getState()
  return next
}

export function scaleRange(range: Range | undefined, factor: number): Range | undefined {
  if (!range || factor === 1) return range
  return [range[0] * factor, range[1] * factor]
}

export function patchFromEvent(event: EventDef, title: string, body: string): EffectPatch {
  return {
    visual: event.visual,
    title,
    body,
    exposure: event.exposure,
    // Composite variants add an input-price shock to another event (e.g. rain).
    // Do not shield unrelated weather damage from that base event.
    supplyShock: /(?:^|[.-])input-shortage$/.test(event.id) ? 'investment' : event.visual === 'supply_shock' ? true : undefined,
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
    investmentPct: event.investmentPct,
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
  let body = fillText(variant?.body ?? event.body, theme.vars)
  if (event.trait === 'longevity') body = 'Trường thọ giữ rủi ro ở mức thấp, không tăng theo năm. Xem tỷ lệ cụ thể trong tab Rủi ro.'
  if (event.trait === 'illness') body = 'Bạo bệnh làm tăng rủi ro. Mức ảnh hưởng được bốc một lần cho đội, xem số cụ thể trong tab Rủi ro.'
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
