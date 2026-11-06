import { flightHeight, type RacerView, type HazardView, type WindGust } from '../../contracts'
import { WIND_RULES, windFlightStep, windFallState } from '../../wind'
import { blockingObstacleContact } from '../../motor'
import { ROAD_Y, ROAD_HALF_WIDTH, WORLD, STEP_PX } from '../../track'
import type { MoveIntent, RaceAction, RaceFrame, RaceSource } from './SimulationBridge'

const STEP_MS = 1000 / 60
export const PREVIEW_QUESTIONS = [
  { prompt: 'Nguồn lực nào giúp doanh nghiệp làm chủ công nghệ?', options: ['Nhân lực được đào tạo', 'Chỉ mua máy móc', 'Chỉ mở rộng nhà xưởng', 'Chỉ tăng vốn'], correct: 0, explanation: 'Con người có năng lực vận hành, cải tiến và làm chủ công nghệ.' },
  { prompt: '“Đi tắt, đón đầu” cần gắn với điều kiện nào?', options: ['Bỏ qua mọi nền tảng', 'Năng lực tiếp thu và làm chủ công nghệ', 'Chỉ nhập máy đắt tiền', 'Không cần đào tạo'], correct: 1, explanation: 'Tiếp nhận công nghệ phải gắn với nguồn nhân lực và năng lực làm chủ.' },
  { prompt: 'Cách mạng công nghiệp lần thứ ba gắn với đặc trưng nào?', options: ['Sức kéo động vật', 'Máy hơi nước', 'Điện tử, máy tính và tự động hóa', 'Chỉ phát triển nông nghiệp'], correct: 2, explanation: 'Điện tử và công nghệ thông tin thúc đẩy tự động hóa sản xuất.' },
] as const

function racer(id: string, color: RacerView['color'], x: number, y: number): RacerView {
  return { id, color, name: id === 'you' ? 'ABC' : color, model: 'duckee', points: 500,
    x, y, progress: x / STEP_PX, target: x / STEP_PX, lateral: y - ROAD_Y,
    facingX: 1, facingY: 0, rank: 1, connected: true, correct: 0, answered: 0,
    speed: 0, rolling: false, rollReadyAt: 0, jumpUntil: 0, crouching: false,
    attackingUntil: 0, invulnerableUntil: 0, stunnedUntil: 0, shield: 0, discount: 0, tailwind: 0 }
}

/** Local dry-track fixture only. Never connects to a room or writes live scores. */
export class PreviewSimulation implements RaceSource {
  readonly players = [racer('you', 'yellow', 220, 500), racer('aqua', 'aqua', 316, 455), racer('blue', 'blue', 420, 510), racer('green', 'green', 540, 546)]
  readonly startedAt = Date.now()
  now = this.startedAt
  private remainder = 0
  private input: MoveIntent = { x: 0, y: 0, crouch: false, guard: false }
  private reserve = 0
  private knock?: { from: number; to: number; at: number; until: number }
  wind?: WindGust
  private lastWind = this.now
  readonly hazards: readonly HazardView[]
  constructor(hazards: readonly HazardView[] = []) { this.hazards = hazards }
  questionIndex = 0
  questionAt = this.now
  selection: number | null = null
  answeredAt = 0
  star = false
  starUsed = false
  feedback = ''
  private listeners = new Set<() => void>()
  get me() { return this.players[0] }
  get question() { return PREVIEW_QUESTIONS[this.questionIndex % PREVIEW_QUESTIONS.length] }
  get remaining() { return Math.max(0, 600000 - this.now + this.startedAt) }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  private notify() { this.listeners.forEach(fn => fn()) }
  read(): RaceFrame { return { now: this.now, players: this.players, hazards: this.hazards, wind:this.remaining?this.wind:undefined, me: this.me.id, running: !!this.remaining } }
  triggerWind(direction: -1|1) {
    this.wind={id:`preview-wind-${this.now}-${direction}`,direction,startedAt:this.now,endsAt:this.now+WIND_RULES.durationMs,strength:1}
    this.lastWind=this.now;this.notify()
  }
  move(input: MoveIntent) { this.input = { ...input } }
  action(action: RaceAction) {
    if (!this.remaining) return
    const p = this.me
    if (p.stunnedUntil > this.now) return
    if (action === 'step' || action === 'roll') {
      const price = action === 'step' ? 50 : 150
      if (p.points < price) { this.feedback = 'Chưa đủ điểm. Trả lời câu hỏi để kiếm thêm.'; this.notify(); return }
      if (p.target >= 100) return
      p.points -= price; this.reserve += (action === 'step' ? 1 : 4) * STEP_PX
      p.target = Math.min(100, (p.x + this.reserve) / STEP_PX)
      this.feedback = ''; this.notify(); return
    }
    if (p.guardHeld || p.crouching) return
    if (action === 'jump') {
      const air = p.jumpUntil > this.now
      if (air && (p.jumpCount || 1) >= 2) return
      p.jumpFrom = air ? flightHeight(p, this.now) : 0
      p.jumpCount = air ? 2 : 1; p.jumpStartedAt = this.now; p.jumpDuration = air ? 1000 : 1100
      p.jumpUntil = this.now + p.jumpDuration
    } else {
      p.attackStyle = p.jumpUntil > this.now ? 'air' : p.speed > .1 ? 'run' : 'idle'
      p.attackingUntil = this.now + 400
    }
  }
  answer(index: number) {
    if (this.answeredAt || !this.remaining) return
    this.selection = index; this.answeredAt = this.now; this.me.answered++
    if (index === this.question.correct) {
      this.me.correct++
      this.me.points += Math.max(100, Math.round(200 - (this.now - this.questionAt) / 200)) * (this.star ? 2 : 1)
    } else if (this.star) this.me.points = Math.max(0, this.me.points - 100)
    this.star = false; this.notify()
  }
  armStar() { if (!this.starUsed && !this.answeredAt && this.me.points >= 100) { this.star = true; this.starUsed = true; this.notify() } }
  clearFeedback() { this.feedback = ''; this.notify() }
  advance(deltaMs: number) {
    this.remainder += Math.max(0, Math.min(100, deltaMs))
    while (this.remainder >= STEP_MS) { this.step(STEP_MS); this.remainder -= STEP_MS }
  }
  private step(ms: number) {
    if (!this.remaining) {
      this.me.speed = 0; this.me.rolling = false; this.me.crouching = false; this.me.guardHeld = false
      this.me.jumpUntil = this.now; this.me.attackingUntil = this.now
      return
    }
    this.now += ms
    if(this.now-this.lastWind>=WIND_RULES.intervalMs)this.triggerWind(Math.random()<.5?-1:1)
    if(this.wind&&this.now>=this.wind.endsAt)this.wind=undefined
    this.movePlayer(ms)
    if (!this.answeredAt && this.now - this.questionAt >= 20000) { this.answeredAt = this.now; this.selection = -1; this.me.answered++; this.notify() }
    if (this.answeredAt && this.now - this.answeredAt >= 2600) {
      this.questionIndex++; this.questionAt = this.now; this.answeredAt = 0; this.selection = null; this.notify()
    }
  }
  private movePlayer(ms: number) {
    const p = this.me, { x, y, crouch, guard } = this.input, dt = ms / 1000
    if (p.stunnedUntil > this.now) {
      if (this.knock) {
        const t = Math.min(1, Math.max(0, (this.now - this.knock.at) / (this.knock.until - this.knock.at)))
        p.x = this.knock.from + (this.knock.to - this.knock.from) * (1 - (1 - t) ** 3)
      }
      p.speed = 0; p.rolling = false; p.progress = p.x / STEP_PX
      p.target = Math.min(100, (p.x + this.reserve) / STEP_PX)
      return
    }
    if (x) p.facingX = Math.sign(x)
    p.guardHeld = guard; p.crouching = crouch && p.jumpUntil <= this.now
    if (p.jumpUntil <= this.now) p.jumpCount = 0
    const norm = Math.max(1, Math.hypot(x, y)), nx = x / norm, ny = y / norm
    const boosting = this.reserve > 0 && nx > 0 && !p.crouching
    const base = p.crouching ? 96 * .45 : 96
    const boostedTime = boosting ? Math.min(dt, this.reserve / Math.max(1, 390 * nx)) : 0
    const dx = guard ? 0 : Math.sign(nx) * (boostedTime * 390 + (dt - boostedTime) * base) * Math.abs(nx)
    const beforeX = p.x, beforeY = p.y
    const effect=windFlightStep(p,this.wind,this.now,dt,x)
    if(effect.headwind&&this.wind){
      const target=Math.max(0,Math.min(WORLD,p.x+this.wind.direction*WIND_RULES.headwindPush))
      let first=1
      for(const h of this.hazards){const t=blockingObstacleContact({...p,jumpUntil:0,crouching:false},{x:p.x,y:p.y},{x:target,y:p.y},h,this.now,dt);if(t!==null)first=Math.min(first,Math.max(0,t-.001))}
      this.knock={from:p.x,to:p.x+(target-p.x)*first,at:this.now,until:this.now+WIND_RULES.fallMs}
      Object.assign(p,windFallState(p,this.now));return
    }
    p.x = Math.max(0, Math.min(WORLD, p.x + dx + effect.dx))
    p.y = Math.max(ROAD_Y - ROAD_HALF_WIDTH, Math.min(ROAD_Y + ROAD_HALF_WIDTH, p.y + (guard ? 0 : ny * 130 * dt)))
    p.rolling = boosting && !guard; p.speed = Math.hypot(p.x - beforeX, p.y - beforeY) / dt
    const from = { x: beforeX, y: beforeY }, proposed = { x: p.x, y: p.y }
    const hit = this.hazards.map(h => ({ h, t: blockingObstacleContact(p, from, proposed, h, this.now, dt) }))
      .filter((hit): hit is {h: HazardView;t: number} => hit.t !== null).sort((a,b) => a.t-b.t)[0]
    if (hit) {
      const t = Math.max(0, hit.t - .001)
      p.x = from.x + (proposed.x - from.x) * t; p.y = from.y + (proposed.y - from.y) * t
      p.speed = 0; p.rolling = false
      if ((p.recoveryUntil || 0) <= this.now) {
        const side = beforeX <= hit.h.worldX! ? -1 : 1
        this.knock = { from: p.x, to: Math.max(0, Math.min(WORLD, hit.h.worldX! + side * ((hit.h.thicknessX || 32) / 2 + 62))), at: this.now, until: this.now + 240 }
        p.stunnedUntil = this.now + 1500; p.knockUntil = this.knock.until; p.recoveryUntil = this.now + 2600
        p.jumpUntil = this.now; p.jumpCount = 0; p.attackingUntil = this.now; p.crouching = false; p.guardHeld = false
      }
    }
    if (!guard) this.reserve = Math.max(0, this.reserve - Math.min(Math.max(0, p.x - beforeX), boostedTime * 390 * Math.abs(nx)))
    p.progress = p.x / STEP_PX; p.target = Math.min(100, (p.x + this.reserve) / STEP_PX)
    p.rank = 1 + this.players.slice(1).filter(other => other.x > p.x).length
  }
}
