import { COMPANY_EVENTS } from './company-events'
import { z } from 'zod'
import { prisma } from '../prisma'
import { effectSchema, readStoredEffect } from './stored-effect'
import { normalizeAnchors } from './anchors'
import { eventApplies, type EventTags } from './event-pool'
import { fillText } from './engine'
import { hashString } from './rng'
import { isHeirOutcome, type HealthWeight, type HeirRow, type OddsPoint, type ReasonRow, type SuccessionGauge, type SuccessionPolicy } from './succession'
import type {
  Anchors,
  Balance,
  EndingRule,
  EventChoice,
  EventDef,
  Exposure,
  Line,
  LineDef,
  QuestionDef,
  ThemeDef,
  ThemeStart,
} from './types'
import type { Rng } from './rng'
import { LINES } from './engine'

const exposureSchema = z.enum(['machines', 'engineers', 'cash', 'pollution', 'any'])
const choicePatchSchema = effectSchema.extend({
  visual: z.string().min(1),
  title: z.string().min(1),
  body: z.string(),
  exposure: exposureSchema,
})

const BALANCE_NUMBERS = [
  'engPerTy',
  'assetPerTy',
  'engDependencyRelief',
  'greenPollutionRelief',
  'logLimit',
  'startTech',
  'techPerOperating',
  'techPerEngineer',
  'emissionScale',
  'greenScrub',
  'infraScrub',
  'pollutionRetain',
  'pollutionPriceStart',
  'pollutionPriceSpan',
  'outputNoiseMin',
  'outputNoiseMax',
  'priceNoiseMin',
  'priceNoiseMax',
  'inflationBase',
  'inflationNoiseMin',
  'inflationNoiseMax',
  'conditionDecay',
  'dependencyEaseOperating',
  'dependencyEaseIdleRatio',
  'dependencyEaseMul',
  'engBook',
  'engTechBook',
  'macBookBase',
  'macBookUtil',
  'supBook',
  'infBook',
  'grnBook',
  'brandShare',
  'pollutionPenalty',
  'dependencyPenalty',
  'machineFloor',
  'quizCash',
  'quizEngineers',
  'questionChance',
  'promptJitterMinMs',
  'promptJitterMaxMs',
  'questionOpenMs',
  'questionResolvedMs',
  'choiceOpenMs',
  'choiceResolvedMs',
  'eventOpenMs',
  'timeoutResolvedMs',
  'idlePromptMs',
  'introLeadMs',
  'introHoldMs',
  'roomEventFirstMinMs',
  'roomEventFirstSpanMs',
  'roomEventEveryMinMs',
  'roomEventEverySpanMs',
  'stepDivisor',
  'stepRound',
  'stepMin',
  'exposureMachinesBase',
  'exposureMachinesDiv',
  'exposureMachinesMin',
  'exposureMachinesMax',
  'exposureEngineersBase',
  'exposureEngineersDiv',
  'exposureEngineersMin',
  'exposureEngineersMax',
  'exposureCashBase',
  'exposureCashDiv',
  'exposureCashMin',
  'exposureCashMax',
  'exposurePollutionBase',
  'exposurePollutionDiv',
  'exposurePollutionMin',
  'exposurePollutionMax',
  'exposureScaleMin',
  'exposureScaleMax',
  'priceCapitalBase',
  'priceRevenueShare',
  'priceOpexShare',
  'defaultIdleCost',
  'yearSeconds',
  'yearMinSeconds',
  'yearEventChance',
  'yearMinEvents',
  'yearMaxEvents',
  'yearExtraChance',
  'classEventChance',
] as const

export type IndustryPart = {
  id: string
  name: string
  unit: string
  art: string
  sort: number
  role: string
  mission: string
  worker: string
  product: string
  leap: string
  weak: string
  epl: number
  tech: number
  support: number
  infra: number
  emission: number
  baseOutput: number
  basePrice: number
  opex: number
  idleCost: number
  group?: string
  groupName?: string
  anchors?: Anchors | null
  eventIds?: string[]
  directions: { line: string; label: string; sort: number }[]
  patterns: { pattern: string; sort: number }[]
}

export type ScenarioPart = {
  industryId: string
  regionId: string | null
  scaleId: string | null
  contextId: string | null
  role: string | null
  mission: string | null
  factoryName: string | null
}

export type ThemeBoard = {
  industries: IndustryPart[]
  regions: { id: string; name: string; sort: number }[]
  scales: { id: string; name: string; sort: number; roleTemplate: string; capitalFactor: number }[]
  contexts: { id: string; name: string; line: string; sort: number; start: ThemeStart }[]
  scenarios: (ScenarioPart & { id: string; body: string })[]
  nameParts: { id: string; name: string; sort: number }[]
  lines: LineDef[]
  themeName: string
  mission: string
  sharedEvents?: (EventTags & { id: string })[]
}

export type Catalog = {
  board: ThemeBoard
  themeCount: number
  questions: QuestionDef[]
  events: EventDef[]
  endings: EndingRule[]
  balance: Balance
  lines: LineDef[]
  successionOdds: OddsPoint[]
  successionReasons: ReasonRow[]
  heirOutcomes: HeirRow[]
  successionGauge: SuccessionGauge
  heirHealthWeights: HealthWeight[]
  successionPolicy: SuccessionPolicy
  familyEvents: EventDef[]
  traitCopy: { id: string; label: string; detail: string }[]
  loadedAt: number
}

let cache: Catalog | null = null

export function catalog(): Catalog {
  if (!cache) throw new Error('Nội dung chưa được nạp từ cơ sở dữ liệu')
  return cache
}

export async function loadCatalog(): Promise<Catalog> {
  const [industries, regions, scales, contexts, scenarios, nameParts, templates, lines, types, questions, events, endings, balanceRow, successionOdds, successionReasons, heirOutcomes, successionGauge, heirHealthWeights, successionPolicy, traitRows] =
    await Promise.all([
      prisma.industry.findMany({
        where: { active: true },
        orderBy: { sort: 'asc' },
        include: {
          directions: { orderBy: { sort: 'asc' } },
          patterns: { orderBy: { sort: 'asc' } },
        },
      }),
      prisma.region.findMany({ where: { active: true }, orderBy: { sort: 'asc' } }),
      prisma.scale.findMany({ where: { active: true }, orderBy: { sort: 'asc' } }),
      prisma.context.findMany({ where: { active: true }, orderBy: { sort: 'asc' } }),
      prisma.scenario.findMany({ where: { active: true } }),
      prisma.factoryNamePart.findMany({ orderBy: { sort: 'asc' } }),
      prisma.copyTemplate.findMany(),
      prisma.investmentLine.findMany({ orderBy: { sort: 'asc' } }),
      prisma.questionType.findMany(),
      prisma.question.findMany({
        where: { active: true },
        include: { type: true, options: { orderBy: { sort: 'asc' } } },
      }),
      prisma.gameEvent.findMany({
        where: { active: true },
        orderBy: { sort: 'asc' },
        include: {
          variants: true,
          choices: { orderBy: { sort: 'asc' } },
          industryTags: true,
          contextTags: true,
          narrations: true,
        },
      }),
      prisma.ending.findMany({ orderBy: { sort: 'asc' } }),
      prisma.balanceConfig.findUnique({ where: { id: 'default' } }),
      prisma.successionOdds.findMany({ orderBy: { minYear: 'asc' } }),
      prisma.successionReason.findMany({ orderBy: { sort: 'asc' } }),
      prisma.heirOutcome.findMany({ orderBy: { sort: 'asc' } }),
      prisma.successionGauge.findUnique({ where: { id: 'default' } }),
      prisma.heirHealthWeight.findMany({ orderBy: { id: 'asc' } }),
      prisma.successionPolicy.findUnique({ where: { id: 'default' } }),
      prisma.traitCopy.findMany({ orderBy: { sort: 'asc' } }),
    ])

  if (!industries.length) throw new Error('Chưa có ngành trong cơ sở dữ liệu. Hãy chạy prisma db seed.')
  if (!regions.length || !scales.length || !contexts.length) throw new Error('Thiếu vùng, quy mô hoặc bối cảnh')
  if (!questions.length) throw new Error('Chưa có câu hỏi')
  if (!events.length) throw new Error('Chưa có sự kiện')
  if (!endings.length) throw new Error('Chưa có kết cục')
  if (!successionOdds.length || !successionReasons.length || !heirOutcomes.length || !successionGauge || !heirHealthWeights.length || !successionPolicy) {
    throw new Error('Chưa có nội dung chuyển giao')
  }
  if (!balanceRow) throw new Error('Chưa có bảng cân bằng')

  const templateMap = new Map(templates.map((row) => [row.key, row.value]))
  const themeName = templateMap.get('themeName')
  const mission = templateMap.get('mission')
  if (!themeName || !mission) throw new Error('Thiếu mẫu chủ đề themeName hoặc mission')

  const lineDefs = lines.map((row) => {
    if (!LINES.includes(row.id as Line)) throw new Error(`Hướng đầu tư ${row.id} chưa có cơ chế trong máy chơi`)
    return { id: row.id as Line, label: row.label, hint: row.hint, log: row.log }
  })
  for (const id of LINES) {
    if (!lineDefs.some((line) => line.id === id)) throw new Error(`Thiếu hướng đầu tư ${id}`)
  }

  const eventIds = new Map<string, string[]>()
  const sharedEvents: { id: string; industryIds: string[]; contextIds: string[] }[] = []
  for (const event of events) {
    if (event.industryId) {
      const list = eventIds.get(event.industryId) ?? []
      list.push(event.id)
      eventIds.set(event.industryId, list)
    } else if (!event.trait) {
      sharedEvents.push({
        id: event.id,
        industryIds: event.industryTags.map((tag) => tag.industryId),
        contextIds: event.contextTags.map((tag) => tag.contextId),
      })
    }
  }

  for(const event of COMPANY_EVENTS)if(!sharedEvents.some(row=>row.id===event.id))sharedEvents.push({id:event.id,industryIds:[],contextIds:[]})

  const board: ThemeBoard = {
    industries: industries.map((row) => ({
      id: row.id,
      name: row.name,
      unit: row.unit,
      art: row.art,
      sort: row.sort,
      role: row.role,
      mission: row.mission,
      worker: row.worker,
      product: row.product,
      leap: row.leap,
      weak: row.weak,
      epl: row.epl,
      tech: row.tech,
      support: row.support,
      infra: row.infra,
      emission: row.emission,
      baseOutput: row.baseOutput,
      basePrice: row.basePrice,
      opex: row.opex,
      idleCost: row.idleCost,
      group: row.group,
      groupName: row.groupName,
      anchors: parseAnchors(row.anchors),
      eventIds: eventIds.get(row.id) ?? [],
      directions: row.directions.map((item) => ({ line: item.line, label: item.label, sort: item.sort })),
      patterns: row.patterns.map((item) => ({ pattern: item.pattern, sort: item.sort })),
    })),
    regions,
    scales: scales.map((row) => ({
      id: row.id,
      name: row.name,
      sort: row.sort,
      roleTemplate: row.roleTemplate,
      capitalFactor: row.capitalFactor,
    })),
    contexts: contexts.map((row) => ({
      id: row.id,
      name: row.name,
      line: row.line,
      sort: row.sort,
      start: {
        cashMul: row.cashMul,
        engineers: row.engineers,
        machines: row.machines,
        pollution: row.pollution,
        dependency: row.dependency,
        condition: row.condition,
      },
    })),
    scenarios: scenarios.map((row) => ({
      id: row.id,
      body: row.body,
      industryId: row.industryId,
      regionId: row.regionId,
      scaleId: row.scaleId,
      contextId: row.contextId,
      role: row.role,
      mission: row.mission,
      factoryName: row.factoryName,
    })),
    nameParts,
    lines: lineDefs,
    themeName,
    mission,
    sharedEvents,
  }

  const questionDefs: QuestionDef[] = questions.map((row) => ({
    id: row.id,
    topic: row.topic,
    section: row.section,
    difficulty: row.difficulty,
    type: row.typeId,
    typeTitle: row.type?.title || types.find((item) => item.id === row.typeId)?.title || row.typeId,
    prompt: row.prompt,
    explanation: row.explanation,
    correctOptionId: row.correctOptionId,
    options: row.options.map((option) => ({ id: option.key, text: option.text })),
  }))

  const eventDefs: EventDef[] = events.map((row) => {
    const effect = readStoredEffect(row.effect, row.id)
    const exposure = exposureSchema.safeParse(row.exposure)
    if (!exposure.success) throw new Error(`Sự kiện ${row.id} có exposure không hợp lệ`)
    const variants: Record<string, { title: string; body: string }> = {}
    for (const variant of row.variants) variants[variant.industryId] = { title: variant.title, body: variant.body }
    let choice: EventDef['choice']
    if (row.choices.length) {
      const options: EventChoice[] = row.choices.map((option) => {
        const patch = choicePatchSchema.safeParse(option.patch)
        if (!patch.success) throw new Error(`Lựa chọn ${row.id}/${option.key} không hợp lệ`)
        return { id: option.key, text: option.text, patch: patch.data }
      })
      choice = { timeoutIndex: row.timeoutChoice ?? 0, options }
    }
    return {
      id: row.id,
      industryId: row.industryId,
      scope: row.scope === 'room' || row.scope === 'team' ? row.scope : missingScope(row.id),
      weight: row.weight,
      visual: row.visual || row.effectCode,
      effectCode: row.visual || row.effectCode,
      severity: row.severity,
      good: row.good,
      icon: row.icon || '',
      trait: row.trait || '',
      title: row.title,
      body: row.body,
      narrations: row.narrations.map((item) => ({
        regionId: item.regionId,
        contextId: item.contextId,
        title: item.title,
        body: item.body,
      })),
      variants: Object.keys(variants).length ? variants : undefined,
      exposure: exposure.data,
      ...effect,
      choice,
    }
  })

  cache = {
    board,
    themeCount: countThemes(board),
    questions: questionDefs,
    events: [...eventDefs,...COMPANY_EVENTS.filter(event=>!eventDefs.some(row=>row.id===event.id))],
    endings: endings.map(toEnding),
    balance: parseBalance(balanceRow.payload),
    lines: lineDefs,
    successionOdds: successionOdds.map((row) => ({ minYear: row.minYear, chance: row.chance })),
    successionReasons: successionReasons.map((row) => ({
      id: row.id,
      industryId: row.industryId,
      contextId: row.contextId,
      text: row.text,
      weight: row.weight,
      sort: row.sort,
    })),
    heirOutcomes: heirOutcomes.map((row) => {
      if (!isHeirOutcome(row.outcomeType)) throw new Error(`Kết cục thừa kế ${row.id} không thuộc hợp đồng`)
      return {
        id: row.id,
        outcomeType: row.outcomeType,
        industryId: row.industryId,
        contextId: row.contextId,
        label: row.label,
        detail: row.detail,
        weight: row.weight,
        multiplier: row.multiplier,
        multiplierMin: row.multiplierMin,
        multiplierMax: row.multiplierMax,
        sort: row.sort,
      }
    }),
    successionGauge: {
      debtDependencyWeight: successionGauge.debtDependencyWeight,
      debtLeverageWeight: successionGauge.debtLeverageWeight,
      debtCap: successionGauge.debtCap,
      valueFloor: successionGauge.valueFloor,
    },
    heirHealthWeights: heirHealthWeights.map((row) => {
      if (!isHeirOutcome(row.outcome)) throw new Error(`Trọng số sức khỏe ${row.id} không thuộc hợp đồng`)
      return {
        id: row.id,
        outcome: row.outcome,
        minReserveRatio: row.minReserveRatio,
        maxReserveRatio: row.maxReserveRatio,
        minDebtRatio: row.minDebtRatio,
        maxDebtRatio: row.maxDebtRatio,
        weightAdd: row.weightAdd,
      }
    }),
    successionPolicy: readPolicy(successionPolicy),
    familyEvents: eventDefs.filter((event) => Boolean(event.trait)),
    traitCopy: traitRows.length ? traitRows.map((row) => ({ id: row.id, label: row.label, detail: row.detail })) : TRAIT_FALLBACK,
    loadedAt: Date.now(),
  }
  return cache
}

export async function reloadCatalog() {
  cache = null
  return loadCatalog()
}

export function parseBalance(value: unknown): Balance {
  if (!value || typeof value !== 'object') throw new Error('Thiếu bảng cân bằng')
  const row = value as Record<string, unknown>
  for (const key of BALANCE_NUMBERS) {
    if (typeof row[key] !== 'number' || !Number.isFinite(row[key] as number)) throw new Error(`Cân bằng thiếu số ${key}`)
  }
  const logs = row.logs
  if (!logs || typeof logs !== 'object') throw new Error('Cân bằng thiếu mẫu câu')
  for (const key of ['start', 'cycle', 'quizCorrect', 'quizWrong', 'quizTimeout', 'event'] as const) {
    if (typeof (logs as Record<string, unknown>)[key] !== 'string') throw new Error(`Cân bằng thiếu mẫu ${key}`)
  }
  return { ...BALANCE_DEFAULTS, ...(value as object) } as Balance
}

const BALANCE_DEFAULTS = {
  debtInterest: 0.08,
  centennialYear: 100,
  centennialMultiplier: 1.5,
  familyEventChance: 0.05,
  lifeInsuranceCash: 2000,
}

const TRAIT_FALLBACK = [
  { id: 'longevity', label: 'Trường thọ', detail: 'Chủ xưởng sống lâu. Nguy cơ qua đời cố định 1% mỗi năm.' },
  { id: 'illness', label: 'Bạo bệnh', detail: 'Chủ xưởng mang bệnh nặng. Nguy cơ qua đời tăng thêm 10 điểm phần trăm mỗi năm.' },
  { id: 'heir_trained', label: 'Người kế nghiệp được đào tạo', detail: 'Đời sau dễ phát đạt hơn khi nhận xưởng.' },
  { id: 'inheritance_dispute', label: 'Tranh chấp thừa kế', detail: 'Con cháu dễ phá gia chi tử khi chia xưởng.' },
  { id: 'family_fund', label: 'Quỹ gia tộc', detail: 'Gia đình có quỹ dự phòng, nên chuyển giao không còn phá sản.' },
  { id: 'life_insurance', label: 'Bảo hiểm nhân thọ', detail: 'Khi chủ qua đời, xưởng nhận thêm một khoản tiền.' },
  { id: 'heir_abroad', label: 'Con du học về nước', detail: 'Người thừa kế có thêm cơ hội nhân đôi tài sản.' },
]

function readPolicy(row: { baseChance: number; stepPerYear: number; maxChance: number; longevityChance: number; illnessAdd: number; traitRules: unknown }): SuccessionPolicy {
  const rules = row.traitRules && typeof row.traitRules === 'object' ? (row.traitRules as SuccessionPolicy['traitRules']) : {}
  return {
    baseChance: row.baseChance,
    stepPerYear: row.stepPerYear,
    maxChance: row.maxChance,
    longevityChance: row.longevityChance,
    illnessAdd: row.illnessAdd,
    traitRules: rules,
  }
}

export function buildThemes(input: {
  industries: IndustryPart[]
  regions: { id: string; name: string; sort: number }[]
  scales: { id: string; name: string; sort: number; roleTemplate: string; capitalFactor?: number }[]
  contexts: { id: string; name: string; line: string; sort: number; start: ThemeStart }[]
  scenarios: ScenarioPart[]
  lines: LineDef[]
  themeName: string
  mission: string
  sharedEvents?: ThemeBoard['sharedEvents']
}): ThemeDef[] {
  const themes: ThemeDef[] = []
  const seen = new Set<string>()
  const industries = input.industries.slice().sort((a, b) => a.sort - b.sort)
  const regions = input.regions.slice().sort((a, b) => a.sort - b.sort)
  const scales = input.scales.slice().sort((a, b) => a.sort - b.sort)
  const contexts = input.contexts.slice().sort((a, b) => a.sort - b.sort)
  for (const industry of industries) {
    for (const region of regions) {
      for (const scale of scales) {
        for (const context of contexts) {
          const id = `${industry.id}.${region.id}.${scale.id}.${context.id}`
          if (seen.has(id)) throw new Error(`Trùng chủ đề ${id}`)
          seen.add(id)
          const scenario = pickScenario(input.scenarios, industry.id, region.id, scale.id, context.id)
          const varsBase: Record<string, string> = {
            industry: industry.name,
            industryLower: industry.name.toLowerCase(),
            industryId: industry.id,
            product: industry.product,
            worker: industry.worker,
            region: region.name,
            regionId: region.id,
            scale: scale.name,
            scaleLower: scale.name.toLowerCase(),
            scaleId: scale.id,
            context: context.name,
            contextId: context.id,
            contextLine: context.line,
            role: industry.role,
            mission: industry.mission,
            leap: industry.leap,
            weak: industry.weak,
          }
          const patterns = industry.patterns.slice().sort((a, b) => a.sort - b.sort)
          const pattern = patterns[hashString(`${id}:name`) % Math.max(1, patterns.length)]?.pattern || '{{industry}}'
          const factoryName = fillText(scenario?.factoryName || pattern, varsBase)
          const vars = { ...varsBase, factory: factoryName }
          const lines = mergeLines(industry, input.lines)
          const core = (['eng', 'mac', 'sup', 'inf'] as const).map((key) => lines.find((line) => line.id === key)?.label || key)
          themes.push({
            id,
            industryId: industry.id,
            industryName: industry.name,
            name: fillText(input.themeName, vars),
            unit: industry.unit,
            role: fillText(scenario?.role || scale.roleTemplate, vars),
            mission: fillText(scenario?.mission || input.mission, vars),
            factoryName,
            dirs: [core[0]!, core[1]!, core[2]!, core[3]!],
            lines,
            art: industry.art,
            anchors: industry.anchors ?? null,
            eventIds: eventsForTheme(industry, context.id, input.sharedEvents),
            regionId: region.id,
            regionName: region.name,
            scaleId: scale.id,
            scaleName: scale.name,
            contextId: context.id,
            contextName: context.name,
            scaleFactor: scale.capitalFactor || 1,
            vars,
            coefs: {
              epl: industry.epl,
              tech: industry.tech,
              support: industry.support,
              infra: industry.infra,
              emission: industry.emission,
              baseOutput: industry.baseOutput,
              basePrice: industry.basePrice,
              opex: industry.opex,
              idleCost: industry.idleCost,
            },
            start: context.start,
          })
        }
      }
    }
  }
  return themes
}

function eventsForTheme(industry: IndustryPart, contextId: string, shared: ThemeBoard['sharedEvents']) {
  const extra = (shared ?? []).filter((row) => eventApplies(row, industry.id, contextId)).map((row) => row.id)
  return [...(industry.eventIds ?? []), ...extra]
}

function mergeLines(industry: IndustryPart, lines: LineDef[]): LineDef[] {
  return lines.map((line) => {
    const custom = industry.directions.find((item) => item.line === line.id)
    return custom ? { ...line, label: custom.label } : line
  })
}

function pickScenario(scenarios: ScenarioPart[], industryId: string, regionId: string, scaleId: string, contextId: string) {
  const hits = scenarios.filter(
    (row) =>
      row.industryId === industryId &&
      (row.regionId == null || row.regionId === regionId) &&
      (row.scaleId == null || row.scaleId === scaleId) &&
      (row.contextId == null || row.contextId === contextId),
  )
  hits.sort((a, b) => specificity(b) - specificity(a))
  return hits[0]
}

function specificity(row: ScenarioPart) {
  return (row.regionId ? 4 : 0) + (row.scaleId ? 2 : 0) + (row.contextId ? 2 : 0)
}

export function countThemes(board: ThemeBoard) {
  let total = 0
  for (const industry of board.industries) {
    const situations = Math.max(1, board.scenarios.filter((row) => row.industryId === industry.id).length)
    const names = Math.max(1, board.nameParts.length)
    total += board.regions.length * board.scales.length * board.contexts.length * situations * names
  }
  return total
}

export function pickFreshTheme(board: ThemeBoard, rng: Rng, used: Set<string>): ThemeDef {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const industry = rng.pick(board.industries)
    const region = rng.pick(board.regions)
    const scale = rng.pick(board.scales)
    const context = rng.pick(board.contexts)
    const situations = board.scenarios.filter((row) => row.industryId === industry.id)
    const situation = situations.length ? rng.pick(situations) : null
    const part = board.nameParts.length ? rng.pick(board.nameParts) : null
    const theme = composeTheme(board, industry, region, scale, context, situation, part)
    if (!used.has(theme.id)) return theme
  }
  throw new Error('Hết chủ đề khác nhau trong phòng')
}

function composeTheme(
  board: ThemeBoard,
  industry: IndustryPart,
  region: ThemeBoard['regions'][number],
  scale: ThemeBoard['scales'][number],
  context: ThemeBoard['contexts'][number],
  situation: ThemeBoard['scenarios'][number] | null,
  part: ThemeBoard['nameParts'][number] | null,
): ThemeDef {
  const id = `${industry.id}.${region.id}.${scale.id}.${context.id}.${situation?.id ?? 'base'}.${part?.id ?? 'ten'}`
  const varsBase: Record<string, string> = {
    industry: industry.name,
    industryLower: industry.name.toLowerCase(),
    industryId: industry.id,
    product: industry.product,
    worker: industry.worker,
    region: region.name,
    regionId: region.id,
    scale: scale.name,
    scaleLower: scale.name.toLowerCase(),
    scaleId: scale.id,
    context: context.name,
    contextId: context.id,
    contextLine: context.line,
    role: industry.role,
    mission: situation?.body || industry.mission,
    leap: industry.leap,
    weak: industry.weak,
    part: part?.name ?? '',
  }
  const factoryName = part ? `${part.name} ${industry.name}` : fillText('{{industry}} {{region}}', varsBase)
  const vars = { ...varsBase, factory: factoryName }
  const lines = mergeLines(industry, board.lines)
  const core = (['eng', 'mac', 'sup', 'inf'] as const).map((key) => lines.find((line) => line.id === key)?.label || key)
  return {
    id,
    industryId: industry.id,
    industryName: industry.name,
    name: fillText(board.themeName, vars),
    unit: industry.unit,
    role: fillText(situation?.role || scale.roleTemplate, vars),
    mission: fillText(situation?.mission || board.mission, vars),
    factoryName,
    dirs: [core[0]!, core[1]!, core[2]!, core[3]!],
    lines,
    art: industry.art,
    anchors: industry.anchors ?? null,
    eventIds: eventsForTheme(industry, context.id, board.sharedEvents),
    regionId: region.id,
    regionName: region.name,
    scaleId: scale.id,
    scaleName: scale.name,
    contextId: context.id,
    contextName: context.name,
    scaleFactor: scale.capitalFactor || 1,
    vars,
    coefs: {
      epl: industry.epl,
      tech: industry.tech,
      support: industry.support,
      infra: industry.infra,
      emission: industry.emission,
      baseOutput: industry.baseOutput,
      basePrice: industry.basePrice,
      opex: industry.opex,
      idleCost: industry.idleCost,
    },
    start: { ...context.start, cashMul: context.start.cashMul * (scale.capitalFactor || 1) },
  }
}

function parseAnchors(value: unknown): Anchors | null {
  return normalizeAnchors(value)
}

function missingScope(id: string): never {
  throw new Error(`Sự kiện ${id} cần scope team hoặc room`)
}

function toEnding(row: {
  id: string
  title: string
  text: string
  sort: number
  isDefault: boolean
  requiresProduction: boolean
  productionMul: number
  minRatio: number | null
  maxRatio: number | null
  minTech: number | null
  maxDependency: number | null
  minMachines: number | null
}): EndingRule {
  return row
}

export function isExposure(value: string): value is Exposure {
  return exposureSchema.safeParse(value).success
}
