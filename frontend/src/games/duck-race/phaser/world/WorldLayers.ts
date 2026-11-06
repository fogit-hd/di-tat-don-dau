import Phaser from 'phaser'
import { WORLD } from '../../track'

/** Tile actual painted ground at native dimensions, including the soil beneath the controls. */
export class WorldLayers {
  private tiles: Phaser.GameObjects.Image[]
  constructor(scene: Phaser.Scene) {
    this.tiles = Array.from({ length: 6 }, () => scene.add.image(0, 0, 'countryside').setOrigin(0, 0).setDepth(-1000))
    for (const [x, key] of [[0, 'start-label'], [WORLD, 'finish-label']] as const)
      scene.add.image(x, 388, key).setOrigin(.5, 1).setScale(.3).setDepth(0)
  }
  update(camera: Phaser.Cameras.Scene2D.Camera) {
    const width = camera.width / camera.zoom
    const left = camera.midPoint.x - width / 2
    const first = Math.floor(left / 1600) - 1
    this.tiles.forEach((tile, i) => {
      const index = first + i, flip = Math.abs(index % 2) === 1
      tile.setFlipX(flip).setPosition(index * 1600, 0)
    })
  }
}
