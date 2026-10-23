export type Line = 'eng' | 'mac' | 'sup' | 'inf' | 'grn'
export type Ending = string
export type Exposure = 'machines' | 'engineers' | 'cash' | 'pollution' | 'any'

export type Range = [number, number]

export type ThemeCoefs = {
  epl: number
  tech: number
  support: number
  infra: number
  emission: number
  baseOutput: number
  basePrice: number
  opex: number
  idleCost: number
}

export type ThemeStart = {
  cashMul: number
  engineers: number
  machines: number
  pollution: number
  dependency: number
  condition: number
}

export type LineDef = {
  id: Line
  label: string
  hint: string
  log: string
}

export type AnchorPoint = { x: number; y: number }

export type Anchors = {
  smoke: AnchorPoint[]
  roof: AnchorPoint[]
  door: AnchorPoint[]
  windows: AnchorPoint[]
  ground: number
  road: [number, number, number, number] | null
  skyBottom: number
}

export type ThemeDef = {
  id: string
  industryId: string
  industryName: string
  name: string
  unit: string
  role: string
  mission: string
  factoryName: string
  dirs: [string, string, string, string]
  lines: LineDef[]
  art: string
  anchors: Anchors | null
  eventIds: string[]
  regionId: string
  regionName: string
  scaleId: string
  scaleName: string
  /** 1 is the medium factory. Ongoing cash is authored for that size. */
  scaleFactor?: number
  contextId: string
  contextName: string
  vars: Record<string, string>
  coefs: ThemeCoefs
  start: ThemeStart
}

export type Effect = {
  id: string
  visual: string
  title: string
  body: string
  severity: number
  startedAt: number
  endsAt: number
  outputMul: number
  priceMul: number
  inflationMul: number
  /** 1 + revenuePct/100. Missing means 1. */
  revenueMul?: number
  /** 1 + costPct/100. Missing means 1. */
  costMul?: number
  /** Cash added on each year this effect is settled. Already scaled to the team. */
  cashPerYear?: number
  /** Game years still to settle. 0 means a wall-clock effect. */
  yearsLeft?: number
  icon?: string
  good?: boolean
  eventId?: string
  summary?: string
  year?: number
  /**
   * Drawn at a year boundary and shown immediately, but settled on a later advance.
   * `bornAt` is the clock of the advance that drew it, so the same tick does not settle it.
   */
  defer?: boolean
  bornAt?: number
}

export type Pending = {
  id: string
  kind: 'question' | 'event' | 'choice'
  phase: 'open' | 'resolved'
  title: string
  body: string
  options: { id: string; text: string }[]
  correctOptionId?: string
  explanation: string
  chosenOptionId?: string
  correct?: boolean
  expiresAt: number
  questionId?: string
  eventId?: string
  note?: string
}

export type SuccessionResult = {
  causeText: string
  outcome: 'bankrupt' | 'squander' | 'steady' | 'prosper' | 'double'
  outcomeLabel: string
  outcomeDetail: string
  assetsBefore: number
  assetsAfter: number
  year: number
}

export type CauseKind = 'production' | 'investment' | 'event' | 'ongoing' | 'interest' | 'centennial' | 'insurance'

export type YearCause = { kind: CauseKind; label: string; cash: number }

export type YearChange = {
  year: number
  cashBefore: number
  cashAfter: number
  assetsBefore: number
  assetsAfter: number
  causes: YearCause[]
}

export type EventLogItem = {
  year: number
  eventId: string
  title: string
  body: string
  icon: string
  good: boolean
  effect: string
}

export type YearParts = { production: number; ongoing: number; interest: number }

export type CentennialResult = {
  year: number
  bonusMultiplier: number
  assetsBefore: number
  assetsAfter: number
}

export const TRAIT_IDS = [
  'longevity',
  'illness',
  'heir_trained',
  'inheritance_dispute',
  'family_fund',
  'life_insurance',
  'heir_abroad',
] as const

export type TraitId = (typeof TRAIT_IDS)[number]

export type TeamState = {
  cash: number
  engineers: number
  machines: number
  support: number
  infra: number
  green: number
  tech: number
  pollution: number
  dependency: number
  condition: number
  cumulativeOutput: number
  cumulativeRevenue: number
  cycles: number
  lastIncome: number
  lastOutput: number
  effects: Effect[]
  log: string[]
  seenQuestions: string[]
  seenEvents: string[]
  eventBag: string[]
  nextYearAt: number
  yearLockUntil: number
  finished: boolean
  succession: SuccessionResult | null
  centennial: CentennialResult | null
  traits: string[]
  eventLog: EventLogItem[]
  yearLedger: YearChange[]
  pendingCauses: YearCause[]
  yearOpenCash: number
  yearOpenAssets: number
  yearParts?: YearParts
  pulseYear: number
  nextPromptAt: number
  introDone: boolean
  factoryName: string
  pending: Pending | null
  rng: number
  seed: number
}

export type QuestionDef = {
  id: string
  topic: string
  section: string
  difficulty: number
  type: string
  typeTitle: string
  prompt: string
  options: { id: string; text: string }[]
  correctOptionId: string
  explanation: string
}

export type EffectPatch = {
  visual: string
  title: string
  body: string
  exposure: Exposure
  durationSec: Range
  outputMul: Range
  priceMul: Range
  inflationMul: Range
  cash?: Range
  cashPct?: Range
  engineersAdd?: Range
  engineersPct?: Range
  machinesAdd?: Range
  machinesPct?: Range
  tech?: Range
  support?: Range
  pollution?: Range
  dependency?: Range
  /** Exact percent points from the seed file, not exposure-scaled. */
  revenuePct?: Range
  costPct?: Range
  assetsPct?: Range
  cashPerYear?: Range
  /** How many future year settlements this patch covers. 0 settles only by the wall clock. */
  yearSpan?: number
}

export type EndingRule = {
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
}

export type BalanceLogs = {
  start: string
  cycle: string
  quizCorrect: string
  quizWrong: string
  quizTimeout: string
  event: string
}

export type Balance = {
  engPerTy: number
  assetPerTy: number
  engDependencyRelief: number
  greenPollutionRelief: number
  logLimit: number
  startTech: number
  techPerOperating: number
  techPerEngineer: number
  emissionScale: number
  greenScrub: number
  infraScrub: number
  pollutionRetain: number
  pollutionPriceStart: number
  pollutionPriceSpan: number
  outputNoiseMin: number
  outputNoiseMax: number
  priceNoiseMin: number
  priceNoiseMax: number
  inflationBase: number
  inflationNoiseMin: number
  inflationNoiseMax: number
  conditionDecay: number
  dependencyEaseOperating: number
  dependencyEaseIdleRatio: number
  dependencyEaseMul: number
  engBook: number
  engTechBook: number
  macBookBase: number
  macBookUtil: number
  supBook: number
  infBook: number
  grnBook: number
  brandShare: number
  pollutionPenalty: number
  dependencyPenalty: number
  machineFloor: number
  quizCash: number
  quizEngineers: number
  questionChance: number
  promptJitterMinMs: number
  promptJitterMaxMs: number
  questionOpenMs: number
  questionResolvedMs: number
  choiceOpenMs: number
  choiceResolvedMs: number
  eventOpenMs: number
  timeoutResolvedMs: number
  idlePromptMs: number
  introLeadMs: number
  introHoldMs: number
  roomEventFirstMinMs: number
  roomEventFirstSpanMs: number
  roomEventEveryMinMs: number
  roomEventEverySpanMs: number
  stepDivisor: number
  stepRound: number
  stepMin: number
  exposureMachinesBase: number
  exposureMachinesDiv: number
  exposureMachinesMin: number
  exposureMachinesMax: number
  exposureEngineersBase: number
  exposureEngineersDiv: number
  exposureEngineersMin: number
  exposureEngineersMax: number
  exposureCashBase: number
  exposureCashDiv: number
  exposureCashMin: number
  exposureCashMax: number
  exposurePollutionBase: number
  exposurePollutionDiv: number
  exposurePollutionMin: number
  exposurePollutionMax: number
  exposureScaleMin: number
  exposureScaleMax: number
  priceCapitalBase: number
  priceRevenueShare: number
  priceOpexShare: number
  defaultIdleCost: number
  yearSeconds: number
  yearMinSeconds: number
  debtInterest: number
  centennialYear: number
  centennialMultiplier: number
  familyEventChance: number
  lifeInsuranceCash: number
  yearEventChance: number
  yearMinEvents: number
  yearMaxEvents: number
  yearExtraChance: number
  classEventChance: number
  logs: BalanceLogs
}

export type EventDef = {
  id: string
  industryId: string | null
  scope: 'team' | 'room'
  weight: number
  visual: string
  effectCode: string
  severity: number
  good: boolean
  icon?: string
  /** Family trait this event grants. `early_retirement` hands the factory over immediately. */
  trait?: string
  title: string
  body: string
  variants?: Record<string, { title: string; body: string }>
  narrations?: { regionId: string; contextId: string; title: string; body: string }[]
  exposure: Exposure
  durationSec: Range
  outputMul: Range
  priceMul: Range
  inflationMul: Range
  cash?: Range
  cashPct?: Range
  engineersAdd?: Range
  engineersPct?: Range
  machinesAdd?: Range
  machinesPct?: Range
  tech?: Range
  support?: Range
  pollution?: Range
  dependency?: Range
  revenuePct?: Range
  costPct?: Range
  assetsPct?: Range
  cashPerYear?: Range
  /** Game years the authored effect stays in force. Engine-shaped rows default to 1 when loaded. */
  yearSpan?: number
  choice?: { timeoutIndex: number; options: EventChoice[] }
}

export type EventChoice = {
  id: string
  text: string
  patch: EffectPatch
}
