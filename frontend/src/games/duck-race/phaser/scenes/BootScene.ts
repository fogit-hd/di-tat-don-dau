import Phaser from 'phaser'
import { DUCK_ATLAS } from '../assets/atlasAdapter'

export class BootScene extends Phaser.Scene {
  private failed = false
  private onProgress: (progress: number) => void
  private onError: (message: string) => void
  constructor(onProgress: (progress: number) => void, onError: (message: string) => void) { super('Boot'); this.onProgress = onProgress; this.onError = onError }
  preload() {
    const root = '/assets/duck-race/'
    this.load.on('progress', this.onProgress)
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      this.failed = true
      this.onError(`Không tải được ${file.key}. Kiểm tra kết nối rồi thử lại.`)
    })
    this.load.atlas(DUCK_ATLAS, root + 'ducks-v12.png', root + 'ducks-v12.json')
    this.load.json('native-clip-data', root + 'ducks-v12.json')
    this.load.image('countryside', root + 'side-v10/countryside.webp')
    this.load.image('approved-crawl-gate', root + 'phaser-v2/crawl-gate.webp')
    for (const name of ['leaf-green','leaf-amber','dust','ribbon','grass','slash'])
      this.load.image(`wind-${name}`, root + `wind-v1/${name}.webp`)
    this.load.svg('contact-shadow', root + 'svg/shadow.svg')
    this.load.svg('you-marker', root + 'ui-v6/you-marker.svg')
    this.load.svg('start-label', root + 'lettering-v4/start-label.svg')
    this.load.svg('finish-label', root + 'lettering-v4/finish-label.svg')
  }
  create() { if (!this.failed) this.scene.start('Race') }
}
