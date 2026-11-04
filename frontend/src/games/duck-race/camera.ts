import { gsap } from 'gsap'
import type { Container } from 'pixi.js'
import { WORLD, ROAD_Y } from './track'

export type CameraTarget = { id: string; x: number; y: number; boosting: boolean }
/** Each canvas owns one camera. No global camera, ticker or mutable shared target. */
export class FollowCamera {
  private x: gsap.QuickToFunc
  private y: gsap.QuickToFunc
  private initialized = false
  private targetId = ''
  private world: Container
  private reduced: boolean
  constructor(world: Container, reduced: boolean) {
    this.world = world; this.reduced = reduced
    this.x = gsap.quickTo(world.position, 'x', { duration: .24, ease: 'power2.out' })
    this.y = gsap.quickTo(world.position, 'y', { duration: .24, ease: 'power2.out' })
  }
  updateCamera(duck: CameraTarget, width: number, height: number, scale: number) {
    const x = Math.min(width*.28, Math.max(width - WORLD * scale - 90, width * .35 - duck.x * scale))
    // Vertical dodges/jumps move the duck, never the horizon or the camera.
    const y = height*.68-ROAD_Y*scale
    if (!this.initialized || this.reduced) { this.x.tween.pause(); this.y.tween.pause(); this.world.position.set(x, y); this.initialized = true }
    else {
      const duration = duck.id !== this.targetId ? .65 : duck.boosting ? .16 : .24
      this.x.tween.duration(duration); this.y.tween.duration(duration)
      this.x(x); this.y(y)
    }
    this.targetId = duck.id
  }
  destroy() { this.x.tween.kill(); this.y.tween.kill() }
}
