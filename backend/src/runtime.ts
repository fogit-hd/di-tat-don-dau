import { randomBytes, createHash } from 'crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { catalog, pickFreshTheme } from './game/catalog'
import {
  applyPatch,
  computeEnding,
  computeValue,
  createState,
  closeYearEffects,
  drawEvent,
  drawQuestion,
  drawYearEvents,
  eventCopy,
  fillText,
  invest,
  jitterMs,
  openYearEffects,
  patchFromEvent,
  presentQuestion,
  publicPending,
  runCycle,
  scaleRange,
  stepOf,
} from './game/engine'
import { LINES } from './game/engine'
import { hashString, makeRng } from './game/rng'
import {
  applyTraitRules,
  deathChanceFor,
  deathStartYear,
  heirAssets,
  pickHeirOutcome,
  pickSuccessionReason,
  rollHeirMultiplier,
  successionNotice,
  weightedPick,
  type SuccessionNotice,
} from './game/succession'
import type { CentennialResult, Ending, EventDef, Line, LineDef, SuccessionResult, TeamState, ThemeDef, YearCause } from './game/types'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export type AnswerRec = {
  id: string
  teamId: string
  questionId: string
  prompt: string
  optionId: string
  correct: boolean
}

export type LiveTeam = {
  id: string
  tokenHash: string
  teamName: string
  theme: ThemeDef | null
  state: TeamState | null
  score: number | null
  ending: Ending | null
  connected: boolean
  connectGen: number
}

export type LiveRoom = {
  id: string
  code: string
  hostTokenHash: string
  hostName: string
  status: 'lobby' | 'countdown' | 'playing' | 'paused' | 'ended'
  durationSec: number
  startingCapital: number
  cycleSeconds: number
  yearMinSeconds: number
  step: number
  linePrices: Record<Line, number>
  debugDeathYear: number | null
  debugCentennialYear: number | null
  debugForceDeath: boolean
  seed: string
  startedAt: number | null
  endsAt: number | null
  remainingMs: number | null
  pausedAt: number | null
  cycleStartedAt: number | null
  cycleElapsedMs: number
  countdownEndsAt: number | null
  nextRoomEventAt: number | null
  seenRoomEvents: string[]
  roomRng: number
  answers: AnswerRec[]
  unsavedAnswers: AnswerRec[]
  teams: LiveTeam[]
  lastClockPush: number
}

export type Viewer = { role: 'host'; code: string } | { role: 'player'; code: string; teamId: string }

const rooms = new Map<string, LiveRoom>()
const tails = new Map<string, Promise<unknown>>()
let emit: (code: string) => void = () => undefined
let emitSuccession: (code: string, notice: SuccessionNotice) => void = () => undefined

export type CentennialNotice = {
  teamId: string
  year: number
  bonusMultiplier: number
  assetsBefore: number
  assetsAfter: number
  finished: true
}

export type LongevityNotice = { teamId: string; year: number }

export type { SuccessionNotice }

let emitRoom: (code: string, event: string, payload: unknown) => void = () => undefined

export function setRoomEventEmitter(fn: (code: string, event: string, payload: unknown) => void) {
  emitRoom = fn
}

export function linePricesOf(raw: unknown, fallback: number): Record<Line, number> {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const prices = {} as Record<Line, number>
  for (const id of LINES) {
    const value = row[id]
    prices[id] = typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : Math.round(fallback)
  }
  return prices
}

function hydrateState(state: TeamState | null): TeamState | null {
  if (!state) return null
  return {
    ...state,
    centennial: state.centennial ?? null,
    traits: state.traits ?? [],
    eventLog: state.eventLog ?? [],
    yearLedger: state.yearLedger ?? [],
    pendingCauses: state.pendingCauses ?? [],
    yearOpenCash: state.yearOpenCash ?? state.cash,
    yearOpenAssets: state.yearOpenAssets ?? 0,
    pulseYear: state.pulseYear ?? 0,
  }
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function rules() {
  return catalog()
}

function endingMap() {
  const map: Record<string, { title: string; text: string }> = {}
  for (const ending of rules().endings) map[ending.id] = { title: ending.title, text: ending.text }
  return map
}

function linesOf(theme: ThemeDef): LineDef[] {
  if (theme.lines?.length) return theme.lines
  return rules().lines.map((line) => {
    const index = ['eng', 'mac', 'sup', 'inf'].indexOf(line.id)
    const label = index >= 0 ? theme.dirs[index] : undefined
    return label ? { ...line, label } : line
  })
}

export function setEmitter(fn: (code: string) => void) {
  emit = fn
}

export function setSuccessionEmitter(fn: (code: string, notice: SuccessionNotice) => void) {
  emitSuccession = fn
}

export function withRoom<T>(code: string, fn: () => Promise<T>): Promise<T> {
  const key = code.toUpperCase()
  const prev = tails.get(key) ?? Promise.resolve()
  const run = prev.then(fn, fn)
  tails.set(
    key,
    run.then(
      () => undefined,
      () => undefined,
    ),
  )
  return run
}

function sha(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function nid(bytes = 9) {
  return randomBytes(bytes).toString('hex')
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function num(value: Date | null | undefined) {
  return value ? value.getTime() : null
}

export function getRoom(code: string) {
  return rooms.get(code.toUpperCase()) ?? null
}

export async function bootRooms() {
  const rows = await prisma.room.findMany({
    where: { status: { in: ['lobby', 'countdown', 'playing', 'paused'] } },
    include: { participants: true, },
  })
  for (const row of rows) {
    const answers = await prisma.answer.findMany({ where: { roomId: row.id } })
    const meta = (row.meta ?? {}) as {
      seenRoomEvents?: string[]
      roomRng?: number
      debugDeathYear?: number | null
      debugCentennialYear?: number | null
      debugForceDeath?: boolean
    }
    const room: LiveRoom = {
      id: row.id,
      code: row.code,
      hostTokenHash: row.hostTokenHash,
      hostName: row.hostName,
      status: row.status as LiveRoom['status'],
      durationSec: row.durationSec,
      startingCapital: row.startingCapital,
      cycleSeconds: row.cycleSeconds,
      yearMinSeconds: row.yearMinSeconds,
      step: row.step,
      linePrices: linePricesOf(row.linePrices, row.step),
      debugDeathYear: meta.debugDeathYear ?? null,
      debugCentennialYear: meta.debugCentennialYear ?? null,
      debugForceDeath: Boolean(meta.debugForceDeath),
      seed: row.seed,
      startedAt: num(row.startedAt),
      endsAt: num(row.endsAt),
      remainingMs: row.remainingMs,
      pausedAt: num(row.pausedAt),
      cycleStartedAt: num(row.cycleStartedAt),
      cycleElapsedMs: row.cycleElapsedMs,
      countdownEndsAt: num(row.countdownEndsAt),
      nextRoomEventAt: num(row.nextRoomEventAt),
      seenRoomEvents: meta.seenRoomEvents ?? [],
      roomRng: meta.roomRng ?? hashString(row.seed + ':room'),
      answers: answers.map((answer) => ({
        id: answer.id,
        teamId: answer.participantId,
        questionId: answer.questionId,
        prompt: answer.prompt,
        optionId: answer.optionId,
        correct: answer.correct,
      })),
      unsavedAnswers: [],
      teams: row.participants.map((participant) => ({
        id: participant.id,
        tokenHash: participant.tokenHash,
        teamName: participant.teamName,
        theme: (participant.theme as ThemeDef | null) ?? null,
        state: hydrateState((participant.state as TeamState | null) ?? null),
        score: participant.score,
        ending: (participant.ending as Ending | null) ?? null,
        connected: participant.connected,
        connectGen: 1,
      })),
      lastClockPush: 0,
    }
    rooms.set(room.code, room)
  }
}

async function persist(room: LiveRoom) {
  await prisma.room.update({
    where: { id: room.id },
    data: {
      hostName: room.hostName,
      status: room.status,
      durationSec: room.durationSec,
      startingCapital: room.startingCapital,
      cycleSeconds: room.cycleSeconds,
      yearMinSeconds: room.yearMinSeconds,
      step: room.step,
      linePrices: room.linePrices,
      startedAt: room.startedAt ? new Date(room.startedAt) : null,
      endsAt: room.endsAt ? new Date(room.endsAt) : null,
      remainingMs: room.remainingMs,
      pausedAt: room.pausedAt ? new Date(room.pausedAt) : null,
      cycleStartedAt: room.cycleStartedAt ? new Date(room.cycleStartedAt) : null,
      cycleElapsedMs: room.cycleElapsedMs,
      countdownEndsAt: room.countdownEndsAt ? new Date(room.countdownEndsAt) : null,
      nextRoomEventAt: room.nextRoomEventAt ? new Date(room.nextRoomEventAt) : null,
      meta: json({
        seenRoomEvents: room.seenRoomEvents,
        roomRng: room.roomRng,
        debugDeathYear: room.debugDeathYear,
        debugCentennialYear: room.debugCentennialYear,
        debugForceDeath: room.debugForceDeath,
      }),
    },
  })
  const ids = room.teams.map((team) => team.id)
  await prisma.participant.deleteMany({ where: { roomId: room.id, id: { notIn: ids.length ? ids : ['__none__'] } } })
  for (const team of room.teams) {
    await prisma.participant.upsert({
      where: { id: team.id },
      update: {
        teamName: team.teamName,
        theme: team.theme ? json(team.theme) : undefined,
        state: team.state ? json(team.state) : undefined,
        score: team.score,
        ending: team.ending,
        connected: team.connected,
      },
      create: {
        id: team.id,
        roomId: room.id,
        tokenHash: team.tokenHash,
        teamName: team.teamName,
        theme: team.theme ? json(team.theme) : undefined,
        state: team.state ? json(team.state) : undefined,
        score: team.score,
        ending: team.ending,
        connected: team.connected,
      },
    })
  }
  if (room.unsavedAnswers.length) {
    const batch = room.unsavedAnswers.splice(0, room.unsavedAnswers.length)
    await prisma.answer.createMany({
      data: batch.map((answer) => ({
        id: answer.id,
        participantId: answer.teamId,
        roomId: room.id,
        questionId: answer.questionId,
        prompt: answer.prompt,
        optionId: answer.optionId,
        correct: answer.correct,
      })),
      skipDuplicates: true,
    })
  }
}

function push(code: string) {
  emit(code)
}

function requireRoom(code: string) {
  const room = getRoom(code)
  if (!room) throw new HttpError(404, 'Không thấy phòng')
  return room
}

function assertHost(room: LiveRoom, token: string) {
  if (!token || sha(token) !== room.hostTokenHash) throw new HttpError(403, 'Không có quyền chủ phòng')
}

function findTeam(room: LiveRoom, token: string) {
  const team = room.teams.find((item) => item.tokenHash === sha(token))
  if (!team) throw new HttpError(403, 'Không có quyền đội này')
  return team
}

function clampYearMin(value: number, cycleSeconds: number) {
  return Math.min(Math.max(0, Math.round(value)), Math.max(0, Math.round(cycleSeconds)))
}

export async function createRoom(input: {
  hostName: string
  durationMin: number
  startingCapital: number
  cycleSeconds?: number
  yearMinSeconds?: number
  linePrices?: Partial<Record<Line, number>>
  debugFast?: boolean
  debugDeathYear?: number
  debugCentennialYear?: number
  debugForceDeath?: boolean
}) {
  const hostToken = nid(18)
  const code = await uniqueCode()
  const seed = nid(8)
  const cycleSeconds = input.cycleSeconds ?? rules().balance.yearSeconds
  const yearMinSeconds = clampYearMin(input.yearMinSeconds ?? rules().balance.yearMinSeconds, cycleSeconds)
  const step = stepOf(input.startingCapital, rules().balance)
  const linePrices = linePricesOf(input.linePrices, step)
  const debug = process.env.GAME_DEBUG === '1' && Boolean(input.debugFast)
  const row = await prisma.room.create({
    data: {
      code,
      hostTokenHash: sha(hostToken),
      hostName: input.hostName.trim(),
      status: 'lobby',
      durationSec: input.durationMin * 60,
      startingCapital: input.startingCapital,
      cycleSeconds,
      yearMinSeconds,
      step,
      linePrices,
      seed,
      meta: json({
        seenRoomEvents: [],
        roomRng: hashString(seed + ':room'),
        debugDeathYear: debug ? (input.debugDeathYear ?? null) : null,
        debugCentennialYear: debug ? (input.debugCentennialYear ?? 3) : null,
        debugForceDeath: debug && Boolean(input.debugForceDeath),
      }),
    },
  })
  const room: LiveRoom = {
    id: row.id,
    code,
    hostTokenHash: sha(hostToken),
    hostName: input.hostName.trim(),
    status: 'lobby',
    durationSec: input.durationMin * 60,
    startingCapital: input.startingCapital,
    cycleSeconds,
    yearMinSeconds,
    step,
    linePrices,
    debugDeathYear: debug ? (input.debugDeathYear ?? null) : null,
    debugCentennialYear: debug ? (input.debugCentennialYear ?? 3) : null,
    debugForceDeath: debug && Boolean(input.debugForceDeath),
    seed,
    startedAt: null,
    endsAt: null,
    remainingMs: null,
    pausedAt: null,
    cycleStartedAt: null,
    cycleElapsedMs: 0,
    countdownEndsAt: null,
    nextRoomEventAt: null,
    seenRoomEvents: [],
    roomRng: hashString(seed + ':room'),
    answers: [],
    unsavedAnswers: [],
    teams: [],
    lastClockPush: 0,
  }
  rooms.set(code, room)
  return { code, hostToken, room: lobbyView(room) }
}

async function uniqueCode() {
  for (let i = 0; i < 8; i++) {
    let code = ''
    const bytes = randomBytes(5)
    for (let n = 0; n < 5; n++) code += CODE_ALPHABET[bytes[n]! % CODE_ALPHABET.length]
    const exists = await prisma.room.findUnique({ where: { code } })
    if (!exists) return code
  }
  throw new HttpError(500, 'Không tạo được mã phòng')
}

export async function updateRoom(
  code: string,
  token: string,
  input: {
    hostName?: string
    durationMin?: number
    startingCapital?: number
    cycleSeconds?: number
    yearMinSeconds?: number
    linePrices?: Partial<Record<Line, number>>
  },
) {
  const room = requireRoom(code)
  assertHost(room, token)
  if (room.status !== 'lobby') throw new HttpError(409, 'Phòng đã bắt đầu')
  if (input.hostName) room.hostName = input.hostName.trim()
  if (input.durationMin) room.durationSec = input.durationMin * 60
  if (input.startingCapital) {
    room.startingCapital = input.startingCapital
    room.step = stepOf(input.startingCapital, rules().balance)
  }
  if (input.linePrices) room.linePrices = linePricesOf({ ...room.linePrices, ...input.linePrices }, room.step)
  else if (input.startingCapital && !input.linePrices) room.linePrices = linePricesOf(room.linePrices, room.step)
  if (input.cycleSeconds) room.cycleSeconds = input.cycleSeconds
  if (input.yearMinSeconds != null) room.yearMinSeconds = input.yearMinSeconds
  room.yearMinSeconds = clampYearMin(room.yearMinSeconds, room.cycleSeconds)
  await persist(room)
  push(room.code)
  return lobbyView(room)
}

export async function joinRoom(code: string, teamName: string) {
  const room = requireRoom(code)
  if (room.status !== 'lobby') throw new HttpError(409, 'Phòng không còn nhận đội')
  const name = teamName.trim()
  if (name.length < 1 || name.length > 24) throw new HttpError(400, 'Tên đội từ 1 đến 24 ký tự')
  if (room.teams.some((team) => team.teamName.toLowerCase() === name.toLowerCase())) {
    throw new HttpError(409, 'Tên đội đã có trong phòng')
  }
  if (room.teams.length >= Math.min(24, Math.max(1, rules().themeCount))) throw new HttpError(409, 'Phòng đã đủ đội')
  const playerToken = nid(18)
  const team: LiveTeam = {
    id: nid(12),
    tokenHash: sha(playerToken),
    teamName: name,
    theme: null,
    state: null,
    score: null,
    ending: null,
    connected: true,
    connectGen: 1,
  }
  room.teams.push(team)
  await persist(room)
  push(room.code)
  return { playerToken, teamId: team.id, teamName: team.teamName }
}

export async function startRoom(code: string, token: string) {
  const room = requireRoom(code)
  assertHost(room, token)
  if (room.status !== 'lobby') throw new HttpError(409, 'Phòng đã bắt đầu')
  if (!room.teams.length) throw new HttpError(409, 'Chưa có đội nào vào phòng')
  const now = Date.now()
  room.status = 'countdown'
  room.countdownEndsAt = now + 3000
  await persist(room)
  push(room.code)
  return { ok: true }
}

export async function pauseRoom(code: string, token: string) {
  const room = requireRoom(code)
  assertHost(room, token)
  if (room.status !== 'playing') throw new HttpError(409, 'Chỉ tạm dừng khi đang chơi')
  const now = Date.now()
  room.status = 'paused'
  room.pausedAt = now
  room.remainingMs = Math.max(0, (room.endsAt ?? now) - now)
  room.cycleElapsedMs = Math.max(0, now - (room.cycleStartedAt ?? now))
  await persist(room)
  push(room.code)
  return { ok: true }
}

export async function resumeRoom(code: string, token: string) {
  const room = requireRoom(code)
  assertHost(room, token)
  if (room.status !== 'paused' || !room.pausedAt) throw new HttpError(409, 'Phòng không đang tạm dừng')
  const now = Date.now()
  const delta = now - room.pausedAt
  room.endsAt = now + (room.remainingMs ?? 0)
  room.cycleStartedAt = now - room.cycleElapsedMs
  if (room.nextRoomEventAt) room.nextRoomEventAt += delta
  for (const team of room.teams) {
    if (!team.state) continue
    team.state.nextPromptAt += delta
    if (team.state.nextYearAt) team.state.nextYearAt += delta
    if (team.state.yearLockUntil) team.state.yearLockUntil += delta
    if (team.state.pending) team.state.pending.expiresAt += delta
    team.state.effects = team.state.effects.map((effect) => ({
      ...effect,
      startedAt: effect.startedAt + delta,
      endsAt: effect.endsAt + delta,
    }))
  }
  room.pausedAt = null
  room.status = 'playing'
  await persist(room)
  push(room.code)
  return { ok: true }
}

export async function endRoom(code: string, token: string) {
  const room = requireRoom(code)
  assertHost(room, token)
  if (room.status === 'ended' || room.status === 'lobby') throw new HttpError(409, 'Không kết thúc được lúc này')
  finish(room, Date.now())
  await persist(room)
  push(room.code)
  return { ok: true }
}

export async function confirmIntro(code: string, token: string, factoryName: string) {
  const room = requireRoom(code)
  const team = findTeam(room, token)
  if (!team.state || !team.theme) throw new HttpError(409, 'Trò chơi chưa bắt đầu')
  if (room.status !== 'playing' && room.status !== 'paused') throw new HttpError(409, 'Không đúng lúc nhập vai')
  const name = factoryName.trim().slice(0, 40) || team.state.factoryName
  team.state.factoryName = name
  team.state.introDone = true
  const yearMs = room.cycleSeconds * 1000
  const base = room.status === 'paused' && room.pausedAt ? room.pausedAt : Date.now()
  team.state.nextYearAt = base + yearMs
  team.theme = { ...team.theme, factoryName: name, vars: { ...team.theme.vars, factory: name } }
  team.state.yearOpenCash = team.state.cash
  team.state.yearOpenAssets = computeValue(team.state, team.theme, rules().balance)
  await persist(room)
  push(room.code)
  return { ok: true }
}

export async function investLine(code: string, token: string, line: Line) {
  const room = requireRoom(code)
  const team = findTeam(room, token)
  if (room.status !== 'playing') throw new HttpError(409, room.status === 'paused' ? 'Đang tạm dừng' : 'Chưa tới lượt đầu tư')
  if (!team.state || !team.theme) throw new HttpError(409, 'Chưa có nhà máy')
  if (!team.state.introDone) throw new HttpError(409, 'Hãy xác nhận phần nhập vai trước')
  if (team.state.finished) throw new HttpError(409, 'Đội đã chốt kết quả')
  const price = room.linePrices?.[line] ?? room.step
  const result = invest(team.state, line, price, rules().balance, linesOf(team.theme))
  if (!result.ok) throw new HttpError(400, result.error)
  team.state = result.state
  await persist(room)
  push(room.code)
  return { ok: true, cash: team.state.cash }
}

export async function answerPrompt(code: string, token: string, optionId: string) {
  const room = requireRoom(code)
  const team = findTeam(room, token)
  if (!team.state || !team.theme) throw new HttpError(409, 'Chưa chơi')
  const pending = team.state.pending
  if (!pending || pending.phase !== 'open') throw new HttpError(409, 'Không có câu hỏi đang mở')
  if (pending.kind !== 'question' && pending.kind !== 'choice') throw new HttpError(409, 'Sự kiện này chỉ cần đóng')
  const now = Date.now()
  if (pending.kind === 'question') {
    const correct = optionId === pending.correctOptionId
    pending.phase = 'resolved'
    pending.chosenOptionId = optionId
    pending.correct = correct
    const balance = rules().balance
    pending.expiresAt = now + balance.questionResolvedMs
    if (correct) {
      team.state.cash += balance.quizCash
      team.state.engineers += balance.quizEngineers
      pending.note = fillText(balance.logs.quizCorrect, {
        cash: String(balance.quizCash),
        engineers: String(balance.quizEngineers),
      })
    } else {
      pending.note = balance.logs.quizWrong
    }
    team.state.log = [pending.note, ...team.state.log].slice(0, balance.logLimit)
    const rec: AnswerRec = {
      id: nid(10),
      teamId: team.id,
      questionId: pending.questionId || pending.id,
      prompt: pending.body,
      optionId,
      correct,
    }
    room.answers.push(rec)
    room.unsavedAnswers.push(rec)
  } else {
    resolveChoice(team, optionId, now)
  }
  await persist(room)
  push(room.code)
  return { ok: true }
}

export async function dismissPrompt(code: string, token: string) {
  const room = requireRoom(code)
  const team = findTeam(room, token)
  if (!team.state?.pending) return { ok: true }
  const pending = team.state.pending
  if (pending.kind === 'question' && pending.phase === 'open') throw new HttpError(409, 'Hãy chọn một đáp án')
  if (pending.kind === 'choice' && pending.phase === 'open') throw new HttpError(409, 'Hãy chọn một phương án')
  team.state.pending = null
  await persist(room)
  push(room.code)
  return { ok: true }
}

export function noteDisconnect(code: string, teamId: string, gen: number) {
  void withRoom(code, async () => {
    const room = getRoom(code)
    const team = room?.teams.find((item) => item.id === teamId)
    if (!room || !team || team.connectGen !== gen) return
    team.connected = false
    await persist(room)
    push(room.code)
  })
}

export function notifyRoom(code: string) {
  const room = getRoom(code)
  if (room) push(room.code)
}

export function touchTeam(code: string, teamId: string) {
  const room = getRoom(code)
  const team = room?.teams.find((item) => item.id === teamId)
  if (!team) return 0
  team.connected = true
  team.connectGen += 1
  return team.connectGen
}

function beginPlay(room: LiveRoom, now: number) {
  const balance = rules().balance
  const rng = makeRng(room.roomRng || 1)
  const used = new Set<string>()
  room.teams.forEach((team) => {
    const theme = pickFreshTheme(rules().board, rng, used)
    used.add(theme.id)
    const teamRng = makeRng(hashString(`${room.seed}:${team.id}`))
    const state = createState(theme, room.startingCapital, teamRng, balance, now)
    state.eventBag = shuffleIds(theme.eventIds, teamRng)
    state.yearOpenCash = state.cash
    state.yearOpenAssets = computeValue(state, theme, balance)
    state.nextYearAt = 0
    state.rng = teamRng.getState()
    state.seed = hashString(`${room.seed}:${team.id}`)
    team.theme = theme
    team.state = state
    team.score = null
    team.ending = null
  })
  room.roomRng = rng.getState()
  room.status = 'playing'
  room.startedAt = now
  room.endsAt = now + room.durationSec * 1000
  room.cycleStartedAt = now
  room.cycleElapsedMs = 0
  room.pausedAt = null
  room.countdownEndsAt = null
  room.nextRoomEventAt = now + balance.roomEventFirstMinMs + Math.floor(rng.next() * balance.roomEventFirstSpanMs)
}

function shuffleIds(ids: string[], rng: ReturnType<typeof makeRng>) {
  const copy = ids.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    const tmp = copy[i]!
    copy[i] = copy[j]!
    copy[j] = tmp
  }
  return copy
}

export async function advanceTeamYear(code: string, token: string) {
  const room = requireRoom(code)
  const team = findTeam(room, token)
  if (room.status !== 'playing') throw new HttpError(409, room.status === 'paused' ? 'Đang tạm dừng' : 'Chưa tới lúc sang năm')
  if (!team.state || !team.theme) throw new HttpError(409, 'Chưa có nhà máy')
  if (!team.state.introDone) throw new HttpError(409, 'Hãy xác nhận phần nhập vai trước')
  if (team.state.finished) throw new HttpError(409, 'Đội đã chốt kết quả')
  const now = Date.now()
  if (team.state.yearLockUntil && now < team.state.yearLockUntil) throw new HttpError(409, 'Năm này chưa diễn xong')
  advanceYear(room, team, now)
  await persist(room)
  push(room.code)
  return { ok: true, cycles: team.state.cycles }
}

function centennialAt(room: LiveRoom) {
  if (room.debugCentennialYear && room.debugCentennialYear > 0) return room.debugCentennialYear
  return rules().balance.centennialYear || 100
}

function advanceYear(room: LiveRoom, team: LiveTeam, now: number) {
  if (!team.state || !team.theme || team.state.finished) return
  settlePending(room, team, now)
  const balance = rules().balance
  const rng = teamRngOf(team)
  const cashBefore = team.state.yearOpenCash ?? team.state.cash
  const assetsBefore = team.state.yearOpenAssets || computeValue(team.state, team.theme, balance)
  const investCauses = [...(team.state.pendingCauses ?? [])]
  team.state.pendingCauses = []
  team.state = openYearEffects(team.state, now)
  team.state = runCycle(team.state, team.theme, rng, now, balance)
  const parts = team.state.yearParts ?? { production: 0, ongoing: 0, interest: 0 }
  team.state = closeYearEffects(team.state, now)
  const eventCauses: YearCause[] = []
  const drawn = drawYearEvents(team.state.eventBag ?? [], team.theme.eventIds, rng, balance)
  team.state.eventBag = drawn.bag
  for (const id of drawn.ids) {
    const event = rules().events.find((item) => item.id === id)
    if (!event || event.trait) continue
    const title = eventCopy(event, team.theme).title
    eventCauses.push({ kind: 'event', label: title, cash: applyEvent(team, event, rng, now) })
  }
  team.state.rng = rng.getState()
  const sharedId = drawn.classWide ? drawn.ids[0] : undefined
  const shared = sharedId ? rules().events.find((item) => item.id === sharedId) : undefined
  if (shared && !shared.trait) {
    for (const other of room.teams) {
      if (other.id === team.id || !other.state || !other.theme || other.state.finished) continue
      const otherRng = teamRngOf(other)
      applyEvent(other, shared, otherRng, now)
      other.state.rng = otherRng.getState()
      other.state.log = [`Cả lớp: ${shared.title}`, ...other.state.log].slice(0, balance.logLimit)
    }
  }
  const celebrate = team.state.cycles >= centennialAt(room) ? grantCentennial(team) : null
  if (celebrate) emitRoom(room.code, 'team:centennial', celebrate)
  if (!team.state.finished) {
    const family = rollFamily(room, team, now)
    if (family.cause) eventCauses.push(family.cause)
    if (!family.retired && !team.state.finished) {
      const notice = rollSuccession(room, team, now)
      if (notice) emitSuccession(room.code, notice)
    }
  }
  if (!team.state.finished) presentYearQuestion(team, now)
  const cashAfter = team.state.cash
  const assetsAfter = team.state.finished ? (team.score ?? computeValue(team.state, team.theme, balance)) : computeValue(team.state, team.theme, balance)
  const extra = team.state.pendingCauses ?? []
  team.state.pendingCauses = []
  const causes: YearCause[] = [
    ...investCauses,
    ...(parts.interest ? [{ kind: 'interest' as const, label: 'Lãi nợ', cash: parts.interest }] : []),
    { kind: 'production', label: 'Sản xuất', cash: parts.production },
    ...(parts.ongoing ? [{ kind: 'ongoing' as const, label: 'Khoản kéo dài', cash: parts.ongoing }] : []),
    ...eventCauses,
    ...extra,
    ...(celebrate ? [{ kind: 'centennial' as const, label: 'Doanh nghiệp trăm năm', cash: 0 }] : []),
  ]
  team.state.yearLedger = [
    { year: team.state.cycles, cashBefore, cashAfter, assetsBefore, assetsAfter, causes },
    ...(team.state.yearLedger ?? []),
  ].slice(0, 120)
  team.state.yearOpenCash = team.state.cash
  team.state.yearOpenAssets = assetsAfter
  team.state.pulseYear = parts.ongoing < 0 || parts.interest < 0 ? team.state.cycles : 0
  if (team.state.finished) {
    team.state.nextYearAt = 0
    team.state.yearLockUntil = 0
    team.state.pending = null
  } else {
    team.state.nextYearAt = now + room.cycleSeconds * 1000
    team.state.yearLockUntil = now + room.yearMinSeconds * 1000
  }
}

function rollSuccession(room: LiveRoom, team: LiveTeam, now: number, forced?: { causeText: string }): SuccessionNotice | null {
  if (!team.state || !team.theme || team.state.finished) return null
  const rng = teamRngOf(team)
  const policy = rules().successionPolicy
  const start = room.debugDeathYear ?? deathStartYear(room.durationSec, room.cycleSeconds)
  let chance = deathChanceFor(team.state.cycles, start, policy, team.state.traits ?? [])
  if (room.debugForceDeath && team.state.cycles >= start) chance = 1
  const hit = Boolean(forced) || rng.next() < chance
  if (!hit) {
    team.state.rng = rng.getState()
    return null
  }
  const reason = pickSuccessionReason(rules().successionReasons, team.theme.industryId, team.theme.contextId, rng)
  const assetsBefore = computeValue(team.state, team.theme, rules().balance)
  const heirs = applyTraitRules(rules().heirOutcomes, team.state.traits ?? [], policy.traitRules)
  const heir = pickHeirOutcome(heirs, team.theme.industryId, team.theme.contextId, rng, null, [])
  if (!heir || (!reason && !forced)) {
    team.state.rng = rng.getState()
    return null
  }
  const multiplier = rollHeirMultiplier(heir, rng)
  let assetsAfter = heirAssets(assetsBefore, multiplier)
  const balance = rules().balance
  if ((team.state.traits ?? []).includes('life_insurance')) {
    const payout = Math.round((balance.lifeInsuranceCash || 0) * (team.theme.scaleFactor || 1))
    assetsAfter += payout
    team.state.pendingCauses = [...(team.state.pendingCauses ?? []), { kind: 'insurance', label: 'Bảo hiểm nhân thọ', cash: payout }]
  }
  team.state.rng = rng.getState()
  const stored: SuccessionResult = {
    causeText: forced?.causeText || fillText(reason?.text || 'Chủ xưởng qua đời', team.theme.vars),
    outcome: heir.outcomeType,
    outcomeLabel: fillText(heir.label, team.theme.vars),
    outcomeDetail: fillText(heir.detail, team.theme.vars),
    assetsBefore,
    assetsAfter,
    year: team.state.cycles,
  }
  team.state.finished = true
  team.state.succession = stored
  team.state.nextYearAt = 0
  team.state.yearLockUntil = 0
  team.state.pending = null
  team.state.log = [stored.causeText, ...team.state.log].slice(0, balance.logLimit)
  team.score = assetsAfter
  team.ending = heir.outcomeType
  void now
  return successionNotice({
    teamId: team.id,
    year: stored.year,
    causeText: stored.causeText,
    outcome: stored.outcome,
    assetsBefore,
    assetsAfter,
  })
}

function grantCentennial(team: LiveTeam): CentennialNotice | null {
  if (!team.state || !team.theme || team.state.finished || team.state.centennial) return null
  const balance = rules().balance
  const before = computeValue(team.state, team.theme, balance)
  const bonusMultiplier = balance.centennialMultiplier || 1.5
  const after = Math.round(before * bonusMultiplier)
  const stored: CentennialResult = { year: team.state.cycles, bonusMultiplier, assetsBefore: before, assetsAfter: after }
  team.state.centennial = stored
  team.state.finished = true
  team.state.pending = null
  team.state.nextYearAt = 0
  team.state.yearLockUntil = 0
  team.state.log = [`Doanh nghiệp trăm năm · tài sản ×${bonusMultiplier}`, ...team.state.log].slice(0, balance.logLimit)
  team.score = after
  team.ending = 'centennial'
  return {
    teamId: team.id,
    year: stored.year,
    bonusMultiplier,
    assetsBefore: before,
    assetsAfter: after,
    finished: true,
  }
}

function rollFamily(room: LiveRoom, team: LiveTeam, now: number): { retired: boolean; cause: YearCause | null } {
  if (!team.state || !team.theme || team.state.finished) return { retired: false, cause: null }
  const rng = teamRngOf(team)
  const chance = rules().balance.familyEventChance ?? 0
  if (rng.next() >= chance) {
    team.state.rng = rng.getState()
    return { retired: false, cause: null }
  }
  const owned = new Set(team.state.traits ?? [])
  const pool = rules().familyEvents.filter((event) => event.trait === 'early_retirement' || (event.trait && !owned.has(event.trait)))
  const event = weightedPick(pool, rng)
  team.state.rng = rng.getState()
  if (!event?.trait) return { retired: false, cause: null }
  const copy = eventCopy(event, team.theme)
  if (event.trait === 'early_retirement') {
    rememberEvent(team, event, copy.title, copy.body, 'Nghỉ hưu, chuyển giao ngay')
    const notice = rollSuccession(room, team, now, { causeText: copy.title })
    if (notice) emitSuccession(room.code, notice)
    return { retired: Boolean(notice), cause: { kind: 'event', label: copy.title, cash: 0 } }
  }
  const before = team.state.cash
  team.state.traits = [...owned, event.trait]
  if (event.trait === 'longevity') emitRoom(room.code, 'team:longevity', { teamId: team.id, year: team.state.cycles })
  applyEvent(team, event, teamRngOf(team), now)
  return { retired: false, cause: { kind: 'event', label: copy.title, cash: team.state.cash - before } }
}

function presentYearQuestion(team: LiveTeam, now: number) {
  if (!team.state || !team.theme || team.state.finished) return
  const rng = teamRngOf(team)
  let question = drawQuestion(team.state, rules().questions, rng)
  if (!question && team.state.seenQuestions.length) {
    team.state.seenQuestions = []
    question = drawQuestion(team.state, rules().questions, rng)
  }
  if (!question) {
    team.state.rng = rng.getState()
    return
  }
  team.state.seenQuestions = [...team.state.seenQuestions, question.id]
  const pending = presentQuestion(question, team.theme, rng, now, rules().balance.questionOpenMs)
  pending.title = 'Câu hỏi đề tài thuyết trình'
  team.state.pending = pending
  team.state.rng = rng.getState()
}

function rememberEvent(team: LiveTeam, event: EventDef, title: string, body: string, effect: string) {
  if (!team.state) return
  team.state.eventLog = [
    { year: team.state.cycles, eventId: event.id, title, body, icon: event.icon || event.visual, good: event.good, effect },
    ...(team.state.eventLog ?? []),
  ].slice(0, 200)
}

function applyEvent(team: LiveTeam, event: EventDef, rng: ReturnType<typeof makeRng>, now: number) {
  if (!team.state || !team.theme || team.state.finished) return 0
  const before = team.state.cash
  const copy = eventCopy(event, team.theme)
  const factor = team.theme.scaleFactor || 1
  const patch = patchFromEvent(event, copy.title, copy.body)
  if (patch.cashPerYear) patch.cashPerYear = scaleRange(patch.cashPerYear, factor)
  team.state = applyPatch(team.state, patch, rng, now, `${event.id}-${team.id}-${now}`, rules().balance)
  const latest = team.state.effects[0]
  if (latest) {
    latest.severity = event.severity || 1
    latest.icon = event.icon || event.visual
    latest.good = event.good
    latest.eventId = event.id
    latest.year = team.state.cycles
  }
  rememberEvent(team, event, copy.title, copy.body, latest?.summary || copy.title)
  return team.state.cash - before
}

function finish(room: LiveRoom, now: number) {
  for (const team of room.teams) {
    if (!team.state || !team.theme) continue
    team.state.pending = null
    if (team.state.finished && team.score != null) continue
    team.score = computeValue(team.state, team.theme, rules().balance)
    team.ending = computeEnding(team.state, team.theme, rules().endings, rules().balance)
  }
  room.status = 'ended'
  room.endsAt = now
  room.pausedAt = null
}

function teamRngOf(team: LiveTeam) {
  const rng = makeRng(1)
  rng.setState(team.state?.rng || 1)
  return rng
}

function openTeamPrompt(room: LiveRoom, team: LiveTeam, now: number) {
  if (!team.state || !team.theme || team.state.pending) return false
  const rng = teamRngOf(team)
  const opening = team.state.seenQuestions.length === 0 && team.state.seenEvents.length === 0
  const balance = rules().balance
  const wantQuestion = opening || rng.next() < balance.questionChance
  const question = wantQuestion ? drawQuestion(team.state, rules().questions, rng) : null
  const event = question ? null : drawEvent(team.state.seenEvents, rules().events, rng, 'team')
  const fallbackQuestion = !question && !event ? drawQuestion(team.state, rules().questions, rng) : question
  if (fallbackQuestion) {
    team.state.seenQuestions = [...team.state.seenQuestions, fallbackQuestion.id]
    team.state.pending = presentQuestion(fallbackQuestion, team.theme, rng, now, balance.questionOpenMs)
  } else if (event) {
    openEvent(team, event, rng, now, false)
  } else {
    team.state.nextPromptAt = now + rules().balance.idlePromptMs
    team.state.rng = rng.getState()
    return false
  }
  team.state.nextPromptAt = now + jitterMs(rng, rules().balance)
  team.state.rng = rng.getState()
  return true
}

function openEvent(team: LiveTeam, event: EventDef, rng: ReturnType<typeof makeRng>, now: number, roomWide: boolean) {
  if (!team.state || !team.theme) return
  const copy = eventCopy(event, team.theme)
  team.state.seenEvents = [...team.state.seenEvents, event.id]
  if (event.choice && !roomWide) {
    team.state.pending = {
      id: `c-${event.id}-${now}`,
      kind: 'choice',
      phase: 'open',
      title: copy.title,
      body: copy.body,
      options: event.choice.options.map((option) => ({
        id: option.id,
        text: fillText(option.text, team.theme!.vars),
      })),
      explanation: '',
      expiresAt: now + rules().balance.choiceOpenMs,
      eventId: event.id,
    }
    return
  }
  team.state = applyPatch(team.state, patchFromEvent(event, copy.title, copy.body), rng, now, `${event.id}-${team.id}-${now}`, rules().balance)
  if (!team.state.pending) {
    team.state.pending = {
      id: `e-${event.id}-${team.id}-${now}`,
      kind: 'event',
      phase: 'open',
      title: copy.title,
      body: copy.body,
      options: [],
      explanation: '',
      expiresAt: now + rules().balance.eventOpenMs,
      eventId: event.id,
    }
  }
}

function resolveChoice(team: LiveTeam, optionId: string, now: number) {
  if (!team.state || !team.theme || !team.state.pending) return
  const pending = team.state.pending
  const event = rules().events.find((item) => item.id === pending.eventId)
  const option = event?.choice?.options.find((item) => item.id === optionId) ?? event?.choice?.options[event.choice.timeoutIndex]
  if (!option) {
    team.state.pending = null
    return
  }
  const rng = teamRngOf(team)
  const patch = {
    ...option.patch,
    title: fillText(option.patch.title, team.theme.vars),
    body: fillText(option.patch.body, team.theme.vars),
  }
  team.state = applyPatch(team.state, patch, rng, now, `choice-${option.id}-${now}`, rules().balance)
  team.state.rng = rng.getState()
  team.state.pending = {
    ...pending,
    phase: 'resolved',
    chosenOptionId: option.id,
    correct: true,
    explanation: patch.body,
    expiresAt: now + rules().balance.choiceResolvedMs,
  }
}

function timeoutPending(team: LiveTeam, now: number) {
  if (!team.state?.pending || team.state.pending.phase !== 'open') return
  const pending = team.state.pending
  if (pending.kind === 'question') {
    pending.phase = 'resolved'
    pending.correct = false
    const balance = rules().balance
    pending.expiresAt = now + balance.timeoutResolvedMs
    pending.note = balance.logs.quizTimeout
    team.state.log = [balance.logs.quizTimeout, ...team.state.log].slice(0, balance.logLimit)
    const rec: AnswerRec = {
      id: nid(10),
      teamId: team.id,
      questionId: pending.questionId || pending.id,
      prompt: pending.body,
      optionId: '',
      correct: false,
    }
    return rec
  }
  if (pending.kind === 'choice') {
    const event = rules().events.find((item) => item.id === pending.eventId)
    const option = event?.choice?.options[event.choice.timeoutIndex]
    if (option) resolveChoice(team, option.id, now)
    return null
  }
  team.state.pending = null
  return null
}

function fireRoomEvent(room: LiveRoom, now: number) {
  const rng = makeRng(room.roomRng || 1)
  const balance = rules().balance
  const event = drawEvent(room.seenRoomEvents, rules().events, rng, 'room')
  room.roomRng = rng.getState()
  room.nextRoomEventAt = now + balance.roomEventEveryMinMs + Math.floor(rng.next() * balance.roomEventEverySpanMs)
  if (!event) return
  room.seenRoomEvents.push(event.id)
  for (const team of room.teams) {
    if (!team.state || !team.theme) continue
    const teamRng = teamRngOf(team)
    const hadPending = Boolean(team.state.pending)
    openEvent(team, event, teamRng, now, true)
    if (hadPending && team.state.pending && team.state.pending.eventId === event.id && team.state.pending.kind === 'event') {
      team.state.pending = null
    }
    team.state.rng = teamRng.getState()
  }
}

function serviceTeam(room: LiveRoom, team: LiveTeam, now: number) {
  if (!team.state) return false
  if (!team.state.introDone) {
    const balance = rules().balance
    if (team.state.nextPromptAt < now + balance.introLeadMs) {
      team.state.nextPromptAt = now + balance.introHoldMs
      return true
    }
    return false
  }
  let changed = false
  const pending = team.state.pending
  if (pending && now >= pending.expiresAt) {
    if (pending.phase === 'open') {
      const rec = timeoutPending(team, now)
      if (rec) {
        room.answers.push(rec)
        room.unsavedAnswers.push(rec)
      }
      changed = true
    } else {
      team.state.pending = null
      changed = true
    }
  }
  if (!team.state.pending && now >= team.state.nextPromptAt) {
    if (openTeamPrompt(room, team, now)) changed = true
  }
  return changed
}

function settlePending(room: LiveRoom, team: LiveTeam, now: number) {
  const pending = team.state?.pending
  if (!pending) return
  if (pending.phase === 'open') {
    const rec = timeoutPending(team, now)
    if (rec) {
      room.answers.push(rec)
      room.unsavedAnswers.push(rec)
    }
  }
  if (team.state) team.state.pending = null
}

function expirePrompt(room: LiveRoom, team: LiveTeam, now: number) {
  const pending = team.state?.pending
  if (!pending || now < pending.expiresAt) return false
  if (pending.phase === 'open') {
    const rec = timeoutPending(team, now)
    if (rec) {
      room.answers.push(rec)
      room.unsavedAnswers.push(rec)
    }
  } else team.state!.pending = null
  return true
}

function tick(room: LiveRoom, now: number): 'none' | 'clock' | 'dirty' {
  if (room.status === 'countdown' && room.countdownEndsAt && now >= room.countdownEndsAt) {
    beginPlay(room, now)
    return 'dirty'
  }
  if (room.status === 'playing' && room.endsAt && now >= room.endsAt) {
    finish(room, now)
    return 'dirty'
  }
  if (room.status !== 'playing') return 'none'
  let dirty = false
  for (const team of room.teams) {
    if (!team.state?.introDone || !team.theme) continue
    if (!team.state.finished && team.state.nextYearAt && now >= team.state.nextYearAt) {
      advanceYear(room, team, now)
      dirty = true
    }
    if (expirePrompt(room, team, now)) dirty = true
  }
  if (dirty) return 'dirty'
  if (now - room.lastClockPush >= 1000) {
    room.lastClockPush = now
    return 'clock'
  }
  return 'none'
}

let loopStarted = false
export function startLoop() {
  if (loopStarted) return
  loopStarted = true
  setInterval(() => {
    const now = Date.now()
    for (const code of [...rooms.keys()]) {
      void withRoom(code, async () => {
        const room = rooms.get(code)
        if (!room) return
        const result = tick(room, now)
        if (result === 'dirty') await persist(room)
        if (result !== 'none') push(code)
      })
    }
  }, 400)
}

function valueOf(team: LiveTeam) {
  if (team.score != null) return team.score
  if (team.state && team.theme) return computeValue(team.state, team.theme, rules().balance)
  return 0
}

function questionStats(room: LiveRoom) {
  const grouped = new Map<string, { prompt: string; correct: number; total: number }>()
  for (const answer of room.answers) {
    const row = grouped.get(answer.questionId) ?? { prompt: answer.prompt, correct: 0, total: 0 }
    row.total += 1
    if (answer.correct) row.correct += 1
    grouped.set(answer.questionId, row)
  }
  return [...grouped.entries()].map(([questionId, row]) => ({ questionId, ...row }))
}

export function buildSnapshot(room: LiveRoom, viewer: Viewer, now = Date.now()) {
  const ranked = room.teams
    .slice()
    .sort((a, b) => valueOf(b) - valueOf(a) || a.teamName.localeCompare(b.teamName, 'vi'))
  const leaderboard = ranked.map((team, index) => ({
    rank: index + 1,
    teamId: team.id,
    teamName: team.teamName,
    themeName: team.theme?.name ?? 'Chờ chủ đề',
    industryId: team.theme?.industryId ?? '',
    value: valueOf(team),
    ending: team.state?.centennial ? 'centennial' : (team.state?.succession?.outcome ?? team.ending),
    endingTitle: outcomeTitle(team),
  }))
  const self = viewer.role === 'player' ? room.teams.find((team) => team.id === viewer.teamId) ?? null : null
  const youCorrect = self ? room.answers.filter((answer) => answer.teamId === self.id && answer.correct).length : 0
  const youAnswered = self ? room.answers.filter((answer) => answer.teamId === self.id && answer.optionId).length : 0
  return {
    serverNow: now,
    paused: room.status === 'paused',
    frozenNow: room.pausedAt,
    room: {
      code: room.code,
      hostName: room.hostName,
      status: room.status,
      durationSec: room.durationSec,
      startingCapital: room.startingCapital,
      cycleSeconds: room.cycleSeconds,
      yearMinSeconds: room.yearMinSeconds,
      step: room.step,
      linePrices: room.linePrices,
      endsAt: room.endsAt,
      remainingMs: room.remainingMs,
      countdownEndsAt: room.countdownEndsAt,
      cycleStartedAt: room.cycleStartedAt,
      cycleElapsedMs: room.cycleElapsedMs,
      questionStats: questionStats(room),
    },
    endings: endingMap(),
    teams: ranked.map((team) => ({
      id: team.id,
      teamName: team.teamName,
      connected: team.connected,
      themeName: team.theme?.name ?? '',
      industryId: team.theme?.industryId ?? '',
      factoryName: team.state?.factoryName ?? team.theme?.factoryName ?? '',
      introDone: Boolean(team.state?.introDone),
      cycles: team.state?.cycles ?? 0,
      cash: viewer.role === 'host' || team.id === self?.id ? Math.round(team.state?.cash ?? 0) : null,
      value: valueOf(team),
      finished: Boolean(team.state?.finished),
      succession: team.state?.succession ?? null,
      ending: team.state?.centennial ? 'centennial' : (team.state?.succession?.outcome ?? team.ending),
      endingTitle: outcomeTitle(team),
      centennial: team.state?.centennial ?? null,
      traits: traitViews(team.state?.traits ?? []),
      score: team.score,
      scene: viewer.role === 'host' && team.state && team.theme ? sceneOf(team) : null,
    })),
    leaderboard,
    you: self
      ? {
          id: self.id,
          teamName: self.teamName,
          rank: leaderboard.find((row) => row.teamId === self.id)?.rank ?? room.teams.length,
          correct: youCorrect,
          answered: youAnswered,
          finished: Boolean(self.state?.finished),
          succession: self.state?.succession ?? null,
          centennial: self.state?.centennial ?? null,
          traits: traitViews(self.state?.traits ?? []),
          theme: self.theme
            ? {
                id: self.theme.id,
                industryId: self.theme.industryId,
                industryName: self.theme.industryName,
                name: self.theme.name,
                unit: self.theme.unit,
                role: self.theme.role,
                mission: self.theme.mission,
                factoryName: self.state?.factoryName ?? self.theme.factoryName,
                dirs: self.theme.dirs,
                regionName: self.theme.regionName,
                scaleName: self.theme.scaleName,
                contextName: self.theme.contextName,
                art: self.theme.art,
              }
            : null,
          scene: self.state && self.theme ? sceneOf(self) : null,
        }
      : null,
    role: viewer.role,
  }
}

function sceneOf(team: LiveTeam) {
  const state = team.state!
  const theme = team.theme!
  const epl = theme.coefs.epl
  const operating = Math.min(state.machines, state.engineers / Math.max(1, epl))
  const idle = Math.max(0, state.machines - operating)
  return {
    industryId: theme.industryId,
    factoryName: state.factoryName,
    art: theme.art,
    unit: theme.unit,
    engineers: Math.round(state.engineers),
    machines: state.machines,
    operating,
    idle,
    util: state.machines > 0 ? operating / state.machines : 0,
    tech: state.tech,
    support: state.support,
    infra: state.infra,
    green: state.green,
    pollution: state.pollution,
    output: state.cumulativeOutput,
    cash: state.cash,
    value: valueOf(team),
    trajectory: state.cycles < 2 ? 'build' : computeEnding(state, theme, rules().endings, rules().balance),
    lastIncome: state.lastIncome,
    lastOutput: state.lastOutput,
    cycles: state.cycles,
    log: state.log,
    dirs: theme.dirs,
    lines: linesOf(theme),
    anchors: theme.anchors,
    nextYearAt: state.nextYearAt,
    yearLockUntil: state.yearLockUntil ?? 0,
    finished: Boolean(state.finished),
    succession: state.succession ?? null,
    effects: state.effects.map((effect) => ({
      id: effect.id,
      visual: effect.visual,
      title: effect.title,
      body: effect.body,
      severity: effect.severity || 1,
      startedAt: effect.startedAt,
      endsAt: effect.endsAt,
    })),
    pending: publicPending(state.pending),
    introDone: state.introDone,
    eventLog: state.eventLog ?? [],
    yearChanges: state.yearLedger ?? [],
    activeEffects: (state.effects ?? [])
      .filter((effect) => !effect.defer && (effect.cashPerYear ?? 0) !== 0 && (effect.yearsLeft ?? 0) > 0)
      .map((effect) => ({
        eventId: effect.eventId || effect.id,
        label: effect.title,
        cashPerYear: Math.round(effect.cashPerYear || 0),
        yearsLeft: effect.yearsLeft || 0,
      })),
    traits: traitViews(state.traits ?? []),
    centennial: state.centennial ?? null,
    pulseYear: state.pulseYear ?? 0,
  }
}

function traitViews(ids: string[]) {
  return ids.map((id) => {
    const copy = rules().traitCopy.find((row) => row.id === id)
    return { id, label: copy?.label || id, detail: copy?.detail || '' }
  })
}

function outcomeTitle(team: LiveTeam) {
  if (team.state?.centennial || team.ending === 'centennial') return 'Doanh nghiệp trăm năm'
  if (team.state?.succession) return team.state.succession.outcomeLabel
  if (team.ending && endingMap()[team.ending]) return endingMap()[team.ending]!.title
  return null
}

export function lobbyView(room: LiveRoom) {
  return {
    code: room.code,
    hostName: room.hostName,
    status: room.status,
    durationSec: room.durationSec,
    startingCapital: room.startingCapital,
    cycleSeconds: room.cycleSeconds,
    yearMinSeconds: room.yearMinSeconds,
    step: room.step,
    linePrices: room.linePrices,
    teams: room.teams.map((team) => ({ id: team.id, teamName: team.teamName, connected: team.connected })),
  }
}

export async function globalBoard(theme?: string) {
  const rows = await prisma.participant.findMany({
    where: { score: { not: null } },
    orderBy: { score: 'desc' },
    take: 40,
    include: { room: { select: { code: true } } },
  })
  const mapped = rows
    .map((row) => {
      const payload = (row.theme ?? {}) as { industryName?: string; name?: string }
      return {
        teamName: row.teamName,
        score: Math.round(row.score ?? 0),
        ending: row.ending,
        theme: payload.industryName || payload.name || 'Ngành',
        roomCode: row.room.code,
      }
    })
    .filter((row) => (theme ? row.theme.toLowerCase().includes(theme.toLowerCase()) : true))
    .slice(0, 10)
  return mapped
}

export function publicSetup() {
  const balance = rules().balance
  return {
    yearSeconds: balance.yearSeconds,
    yearMinSeconds: balance.yearMinSeconds,
    stepDivisor: balance.stepDivisor,
    stepRound: balance.stepRound,
    stepMin: balance.stepMin,
    lines: rules().lines.map((line) => ({ id: line.id, label: line.label, hint: line.hint })),
  }
}

export function listThemes() {
  const board = rules().board
  return {
    count: rules().themeCount,
    industries: board.industries.map((industry) => ({
      id: industry.id,
      name: industry.name,
      group: industry.group ?? '',
      groupName: industry.groupName ?? '',
      anchors: industry.anchors,
    })),
  }
}
