import Phaser from 'phaser'
import type { HazardView } from '../../contracts'
import { CRAWL_ART, crawlGateRegistration } from './crawlGate'

/** Exact original tapered painting, rendered whole. No slicing, skew or local stretching. */
export class CrawlGateView {
  private model: Phaser.GameObjects.Image
  private shadows: Phaser.GameObjects.Image[]
  readonly x: number
  constructor(scene: Phaser.Scene, h: HazardView) {
    const r = crawlGateRegistration(h), span = h.spanY ?? 152
    this.x = r.x
    this.shadows = [-1, 1].map(side => scene.add.image(r.x + 2,
      h.worldY! + side * (span - Math.min(18, span * .2)) / 2 + 2, 'contact-shadow')
      .setDisplaySize(r.thickness * .75, 13).setAlpha(.65).setDepth(-10))
    this.model = scene.add.image(r.x, r.topY, 'approved-crawl-gate')
      .setOrigin(CRAWL_ART.axisX / CRAWL_ART.width, 0).setScale(r.scale).setDepth(r.depth)
  }
  setVisible(visible: boolean) { this.model.setVisible(visible); this.shadows.forEach(s => s.setVisible(visible)) }
  destroy() { this.model.destroy(); this.shadows.forEach(s => s.destroy()) }
}
