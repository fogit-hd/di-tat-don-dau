import type { RacerView, HazardView, WindGust } from '../../contracts'
import { MotionBuffer } from '../../motion'

export type RaceFrame = { now: number; players: RacerView[]; hazards?: readonly HazardView[]; wind?: WindGust; me?: string; running: boolean }
export type MoveIntent = { x: number; y: number; crouch: boolean; guard: boolean }
export type RaceAction = 'jump' | 'roll' | 'step' | 'attack'
export interface RaceSource {
  read(): RaceFrame
  move(input: MoveIntent): void
  action(action: RaceAction): void
  advance?(deltaMs: number): void
}

/** Scene-facing transport boundary. It owns no socket, purchases or live-room scores. */
export class SimulationBridge {
  readonly source: RaceSource
  constructor(source: RaceSource) { this.source = source }
  read() { return this.source.read() }
  tick(delta: number) { this.source.advance?.(delta) }
  move(input: MoveIntent) { this.source.move(input) }
  action(action: RaceAction) { this.source.action(action) }
  release() { this.move({ x: 0, y: 0, crouch: false, guard: false }) }
}

/** Adapter for a future live React snapshot stream; server remains authoritative. */
export class SnapshotSource implements RaceSource {
  private buffers = new Map<string, MotionBuffer>()
  private latest: RaceFrame = { now: 0, players: [], running: false }
  private receivedAt = 0
  private sendInput: (input: MoveIntent) => void
  private sendAction: (action: RaceAction) => void
  constructor(sendInput: (input: MoveIntent) => void, sendAction: (action: RaceAction) => void) { this.sendInput = sendInput; this.sendAction = sendAction }
  push(frame: RaceFrame) {
    this.latest = frame
    this.receivedAt = performance.now()
    for (const p of frame.players) {
      if (!this.buffers.has(p.id)) this.buffers.set(p.id, new MotionBuffer())
      this.buffers.get(p.id)!.push(frame.now, p)
    }
    for (const id of this.buffers.keys()) if (!frame.players.some(p => p.id === id)) this.buffers.delete(id)
  }
  read(): RaceFrame {
    const now = this.latest.now + Math.max(0, performance.now() - this.receivedAt)
    return { ...this.latest, now, players: this.latest.players.map(p => ({ ...p,
      ...this.buffers.get(p.id)!.sample(this.latest.running ? now - 110 : this.latest.now) })) }
  }
  move(input: MoveIntent) { this.sendInput(input) }
  action(action: RaceAction) { this.sendAction(action) }
}
