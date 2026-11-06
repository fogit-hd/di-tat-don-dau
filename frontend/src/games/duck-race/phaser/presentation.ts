import { flightHeight, type RacerView } from '../contracts'
import { ROAD_Y, WORLD } from '../track'

export const NATIVE_SIZE = 64
export const GROUND_BASELINE = 48
export const BODY_SCALE = 3.2
export type NativePose = 'idle' | 'walk_run' | 'jump' | 'air' | 'double_jump' | 'fall' | 'land' | 'crouch' | 'crawl' | 'roll' | 'guard' | 'attack_idle' | 'attack_run' | 'attack_air' | 'knockout'

/** Ground depth and elevation are independent; never scale a body to simulate a jump. */
export function groundPose(p: RacerView, now: number, landingUntil = 0): { pose: NativePose; z: number } {
  const z = flightHeight(p, now), airborne = p.jumpUntil > now
  const elapsed = now - (p.jumpStartedAt ?? now)
  const pose: NativePose = (p.windFallUntil||0)>now ? 'fall' : p.stunnedUntil > now ? 'knockout'
    : p.guardHeld ? 'guard'
    : p.attackingUntil > now ? `attack_${p.attackStyle || 'idle'}`
    : airborne ? (p.jumpCount || 1) > 1 ? 'double_jump' : elapsed < 160 ? 'jump' : elapsed < 550 ? 'air' : 'fall'
    : p.crouching ? p.speed > .1 ? 'crawl' : 'crouch'
    : landingUntil > now ? 'land'
    : p.speed > .1 ? p.rolling ? 'roll' : 'walk_run' : 'idle'
  return { pose, z }
}

export function frameFor(pose: NativePose, count: number, elapsedMs: number): number {
  const fps = pose === 'idle' ? 6 : pose === 'roll' ? 14 : pose === 'air' ? 7 : 10
  const index = Math.max(0, Math.floor(elapsedMs / 1000 * fps))
  return pose.startsWith('attack_') || pose === 'land' || pose === 'knockout'
    ? Math.min(count - 1, index) : index % Math.max(1, count)
}

export function viewportLayout(width: number, height: number) {
  const zoom = Math.max(.78, Math.min(1.5, height / 760))
  // Road bottom (584) is above the foreground controls on all aspect ratios.
  const roadScreenY = height * (width < 600 ? .52 : .58)
  return { zoom, centerY: ROAD_Y + (height / 2 - roadScreenY) / zoom,
    lookAhead: width * .16 / zoom, worldWidth: WORLD }
}
