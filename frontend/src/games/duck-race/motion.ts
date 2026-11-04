import type { RacerView } from './contracts'
import { STEP_PX } from './track'
import { DuckMotor } from './motor'
const motor = new DuckMotor()

type Point = { x: number; y: number }
type Input = { at: number; x: number; y: number; crouch: boolean; guard?: boolean }
export type LocalIntent = Input & { history: Input[]; jumpUntil: number }
export const newIntent = (): LocalIntent => ({ at: 0, x: 0, y: 0, crouch: false, history: [], jumpUntil: 0 })
export function recordIntent(intent: LocalIntent, input: Input) {
  if (input.x !== intent.x || input.y !== intent.y || input.crouch !== intent.crouch || input.guard !== intent.guard || !intent.history.length || input.at-intent.history.at(-1)!.at>=80) {
    intent.history.push(input)
    if (intent.history.length > 40) intent.history.splice(0, intent.history.length - 40)
  }
  Object.assign(intent, input)
}

/** Ordered authority samples. Never extrapolate remote speed across jump/roll changes. */
export class MotionBuffer {
  private samples: (Point & { at: number })[] = []
  push(at: number, point: Point) {
    const last = this.samples.at(-1)
    if (last && at < last.at) return
    if (last?.at === at) { last.x = point.x; last.y = point.y; return }
    this.samples.push({ at, x: point.x, y: point.y })
    if (this.samples.length > 16) this.samples.shift()
  }
  sample(at: number): Point {
    const first = this.samples[0]
    if (!first) return { x: 0, y: 0 }
    if (at <= first.at) return first
    for (let i = 1; i < this.samples.length; i++) {
      const a = this.samples[i - 1], b = this.samples[i]
      if (at <= b.at) {
        const t = (at - a.at) / Math.max(1, b.at - a.at)
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
      }
    }
    return this.samples.at(-1)!
  }
}

/** Replay local intent over only the unacknowledged tail; server still owns collisions. */
export function predictLocal(p: RacerView, authorityAt: number, now: number, intent: LocalIntent, wind=1): Point {
  let point = { x: p.x, y: p.y }
  let reserve = Math.max(0,(p.target-p.progress)*STEP_PX)
  const end = Math.min(now, authorityAt + 250)
  let at = authorityAt
  const events = intent.history.filter(e => e.at > at && e.at < end)
  let active = [...intent.history].reverse().find(e => e.at <= at) || { at, x: 0, y: 0, crouch: false }
  for (const change of [...events, { ...intent, at: end }]) {
    const start = Math.max(at, p.stunnedUntil)
    const dt = Math.max(0, change.at - start) / 1000
    if (dt && !p.finishedAt && !p.capturedAt) {
      const airborne = p.jumpUntil > start
      const crouch = active.crouch && !airborne
      const fresh=start-active.at<400
      const next=motor.advance({...p,...point,reserve,crouching:crouch,airborne,guardHeld:fresh&&!!active.guard},fresh?active:{x:0,y:0},dt,wind)
      reserve=next.reserve
      point = { x: next.x, y: next.y }
    }
    at = change.at; active = change
  }
  return point
}

/** A forward-moving player never gets visually rewound by a stale velocity forecast. */
export function reconcileLocal(current: Point, target: Point, intent: LocalIntent, dt: number, collision: boolean): Point {
  const t = 1 - Math.exp(-30 * dt)
  let dx = (target.x - current.x) * t, dy = (target.y - current.y) * t
  if (!collision && !intent.guard) {
    if (intent.x && dx * intent.x < 0) dx = 0
    if (intent.y && dy * intent.y < 0) dy = 0
  }
  return { x: current.x + dx, y: current.y + dy }
}

export type Pose = 'idle' | 'walk_run' | 'roll' | 'take_damage' | 'attack' | 'crouch' | 'crawl' | 'jump' | 'air' | 'fall' | 'land'
export function jumpPose(elapsed: number): Pose {
  if (elapsed < 160) return 'jump'
  if (elapsed < 550) return 'air'
  return 'fall'
}

