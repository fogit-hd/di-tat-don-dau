export type Ending = string

export type LineView = {
  id: 'eng' | 'mac' | 'sup' | 'inf' | 'grn'
  label: string
  hint: string
}
export type RoomStatus = 'lobby' | 'countdown' | 'playing' | 'paused' | 'ended'

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

export type LinePrices = Record<'eng' | 'mac' | 'sup' | 'inf' | 'grn', number>

export type ActiveEffectView = { eventId: string; label: string; cashPerYear: number; yearsLeft: number; investmentPct?: number }
export type TraitView = { id: string; label: string; detail: string }
export type EventLogView = { year: number; eventId: string; title: string; body: string; icon: string; good: boolean; effect: string }
export type YearCauseView = { kind: string; label: string; cash: number }
export type YearChangeView = {
  year: number
  cashBefore: number
  cashAfter: number
  assetsBefore: number
  assetsAfter: number
  causes: YearCauseView[]
}
export type CentennialView = { year: number; bonusMultiplier: number; assetsBefore: number; assetsAfter: number }
export type CentennialNotice = CentennialView & { teamId: string; finished: true }
export type LongevityNotice = { teamId: string; year: number }

export type EffectView = {
  id: string
  visual: string
  title: string
  body: string
  severity?: number
  startedAt: number
  endsAt: number
}

export type PendingView = {
  id: string
  kind: 'question' | 'event' | 'choice'
  phase: 'open' | 'resolved'
  title: string
  body: string
  options: { id: string; text: string }[]
  explanation: string
  chosenOptionId: string | null
  correct: boolean | null
  expiresAt: number
  questionId: string | null
  note: string
}

export type SceneView = {
  industryId: string
  factoryName: string
  art: string
  unit: string
  engineers: number
  machines: number
  operating: number
  idle: number
  util: number
  tech: number
  support: number
  infra: number
  green: number
  pollution: number
  output: number
  cash: number
  value: number
  trajectory: 'build' | Ending
  lastIncome: number
  lastOutput: number
  cycles: number
  log: string[]
  dirs: string[]
  lines: LineView[]
  anchors: Anchors | null
  nextYearAt: number
  yearLockUntil: number
  finished: boolean
  succession: SuccessionView | null
  effects: EffectView[]
  pending: PendingView | null
  introDone: boolean
  eventLog?: EventLogView[]
  yearChanges?: YearChangeView[]
  activeEffects?: ActiveEffectView[]
  traits?: TraitView[]
  centennial?: CentennialView | null
  pulseYear?: number
  deathChance?: number
  linePrices?: LinePrices
}

export type ThemeView = {
  id: string
  industryId: string
  industryName: string
  name: string
  unit: string
  role: string
  mission: string
  factoryName: string
  dirs: string[]
  regionName: string
  scaleName: string
  contextName: string
  art: string
}

export type HeirOutcome = 'bankrupt' | 'squander' | 'steady' | 'prosper' | 'double'

export type SuccessionView = {
  causeText: string
  outcome: HeirOutcome
  outcomeLabel: string
  outcomeDetail: string
  assetsBefore: number
  assetsAfter: number
  year: number
}

export type SuccessionNotice = {
  teamId: string
  year: number
  causeText: string
  outcome: HeirOutcome
  assetsBefore: number
  assetsAfter: number
  finished: true
}

export type BoardRow = {
  rank: number
  teamId: string
  teamName: string
  themeName: string
  industryId: string
  value: number
  ending: Ending | null
  endingTitle: string | null
}

export type TeamRow = {
  id: string
  teamName: string
  connected: boolean
  themeName: string
  industryId: string
  factoryName: string
  introDone: boolean
  cycles: number
  cash: number | null
  value: number
  finished: boolean
  succession: SuccessionView | null
  centennial?: CentennialView | null
  traits?: TraitView[]
  ending: Ending | null
  endingTitle: string | null
  score: number | null
  scene: SceneView | null
}

export type Snapshot = {
  serverNow: number
  paused: boolean
  frozenNow: number | null
  room: {
    code: string
    hostName: string
    status: RoomStatus
    durationSec: number
    startingCapital: number
    cycleSeconds: number
    yearMinSeconds: number
    step: number
    linePrices?: LinePrices
    endsAt: number | null
    remainingMs: number | null
    countdownEndsAt: number | null
    cycleStartedAt: number | null
    cycleElapsedMs: number
    questionStats: { questionId: string; prompt: string; correct: number; total: number }[]
  }
  endings: Record<string, { title: string; text: string }>
  teams: TeamRow[]
  leaderboard: BoardRow[]
  you: {
    id: string
    teamName: string
    rank: number
    correct: number
    answered: number
    finished: boolean
    succession: SuccessionView | null
    centennial?: CentennialView | null
    traits?: TraitView[]
    theme: ThemeView | null
    scene: SceneView | null
  } | null
  role: 'host' | 'player'
}

