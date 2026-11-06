import Phaser from 'phaser'
import type { RacerView } from '../../contracts'
import { BODY_SCALE, GROUND_BASELINE, groundPose, frameFor } from '../presentation'
import { DUCK_ATLAS } from '../assets/atlasAdapter'

/** Body and shadow share one ground anchor. All native frames stay 64×64 at scale 3.2. */
export class DuckActor {
  readonly body: Phaser.GameObjects.Sprite
  readonly shadow: Phaser.GameObjects.Image
  readonly marker?: Phaser.GameObjects.Image
  readonly ground = { x: 0, y: 0 }
  private pose = ''
  private poseAt = 0
  private landingUntil = 0
  private airborne = false
  private clips: Map<string, string[]>
  constructor(scene: Phaser.Scene, clips: Map<string, string[]>, me: boolean) {
    this.clips = clips
    this.body = scene.add.sprite(0, 0, DUCK_ATLAS, 'duckee/yellow/idle/0').setOrigin(.5, GROUND_BASELINE / 64).setScale(BODY_SCALE)
    this.shadow = scene.add.image(0, 0, 'contact-shadow').setDisplaySize(65, 17)
    if (me) this.marker = scene.add.image(0, 0, 'you-marker').setDisplaySize(22, 25).setOrigin(.5, 1)
  }
  update(p: RacerView, now: number, reduced: boolean) {
    this.ground.x = p.x; this.ground.y = p.y
    const air = p.jumpUntil > now || (p.windFallUntil||0)>now
    if (this.airborne && !air) this.landingUntil = now + 160
    this.airborne = air
    const { pose, z } = groundPose(p, now, this.landingUntil)
    const key = `duckee/${p.color}/${pose}`
    if (this.pose !== key) { this.pose = key; this.poseAt = now }
    const frames = this.clips.get(key) || this.clips.get(`duckee/${p.color}/idle`)!
    const index = frameFor(pose, frames.length, reduced ? 0 : now - this.poseAt)
    this.body.setFrame(frames[index], false, false).setPosition(p.x, p.y - z).setDepth(p.y)
      .setFlipX(p.facingX < 0).setVisible(!p.capturedAt)
    if (!reduced && p.stunnedUntil <= now && (p.recoveryUntil || 0) > now && Math.floor(now / 100) % 2 === 0)
      this.body.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL)
    else this.body.clearTint()
    this.shadow.setPosition(p.x, p.y + 2).setDepth(p.y - .5).setAlpha(air ? .55 : 1)
    this.marker?.setPosition(p.x, p.y - z - 72 - (reduced ? 0 : Math.sin(now / 250) * 2)).setDepth(1000)
    return { pose, frame: index, z }
  }
  destroy() { this.body.destroy(); this.shadow.destroy(); this.marker?.destroy() }
}
