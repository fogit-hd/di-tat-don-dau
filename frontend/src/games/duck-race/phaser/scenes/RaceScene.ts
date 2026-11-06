import Phaser from 'phaser'
import { WORLD } from '../../track'
import { registerNativeClips } from '../assets/atlasAdapter'
import { DuckActor } from '../actors/DuckActor'
import { InputController } from '../bridge/InputController'
import { SimulationBridge } from '../bridge/SimulationBridge'
import { BODY_SCALE, viewportLayout } from '../presentation'
import { WorldLayers } from '../world/WorldLayers'
import { CrawlGateView } from '../world/CrawlGateView'
import { WindManager } from '../fx/WindManager'

export class RaceScene extends Phaser.Scene {
  private actors = new Map<string, DuckActor>()
  private gates = new Map<string, CrawlGateView>()
  private wind = new WindManager()
  private skillState = new Map<string,{rolling:boolean;attack:number}>()
  private clips!: Map<string, string[]>
  private layers!: WorldLayers
  private follow = { x: 0, y: 500 }
  private lookAhead = 0
  private inputController?: InputController
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  private bridge: SimulationBridge
  private ready: (input: InputController) => void
  constructor(bridge: SimulationBridge, ready: (input: InputController) => void) { super('Race'); this.bridge = bridge; this.ready = ready }
  create() {
    this.clips = registerNativeClips(this)
    this.layers = new WorldLayers(this)
    this.wind.create(this)
    this.physics.world.setBounds(0, 416, WORLD, 168)
    this.cameras.main.setBounds(-350, -350, WORLD + 1050, 1500)
    this.resize()
    const frame = this.bridge.read(), p = frame.players.find(p => p.id === frame.me) || frame.players[0]
    if (p) this.follow.x = p.x + this.lookAhead
    this.cameras.main.startFollow(this.follow, false, this.reduced ? 1 : .12, 1)
    this.inputController = new InputController(this, this.bridge)
    this.ready(this.inputController)
    this.scale.on('resize', this.resize, this)
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.resize, this)
      this.inputController?.destroy()
      this.actors.clear()
      this.gates.forEach(g => g.destroy()); this.gates.clear()
      this.wind.destroy();this.skillState.clear()
    })
    this.game.canvas.dataset.engine = 'phaser-4.2.1'
  }
  private resize = () => {
    const layout = viewportLayout(this.scale.width, this.scale.height)
    this.cameras.main.setZoom(layout.zoom)
    this.follow.y = layout.centerY
    this.lookAhead = layout.lookAhead
  }
  update(_time: number, delta: number) {
    this.bridge.tick(Math.min(100, delta))
    const frame = this.bridge.read(), ids = new Set(frame.players.map(p => p.id))
    const focus = frame.players.find(p => p.id === frame.me) || frame.players[0]
    for (const p of frame.players) {
      let actor = this.actors.get(p.id)
      if (!actor) { actor = new DuckActor(this, this.clips, p.id === frame.me); this.actors.set(p.id, actor) }
      const view = actor.update(p, frame.now, this.reduced)
      const before=this.skillState.get(p.id)
      if(!this.reduced){
        if(p.rolling&&!before?.rolling)this.wind.triggerSkillWind(p.x,p.y-view.z,p.facingX<0?-1:1)
        if(p.attackingUntil>frame.now&&p.attackingUntil!==before?.attack)this.wind.triggerSkillWind(p.x,p.y-view.z,p.facingX<0?-1:1,'slash')
      }
      this.skillState.set(p.id,{rolling:p.rolling,attack:p.attackingUntil})
      if (p.id === frame.me) Object.assign(this.game.canvas.dataset, {
        localX: String(p.x), localY: String(p.y), jumpHeight: String(view.z), pose: view.pose,
        poseFrame: String(view.frame), bodyScaleY: String(BODY_SCALE), facing: String(p.facingX),
        groundShadowY: String(actor.shadow.y), bodyY: String(actor.body.y), bodyAtlas: 'v12',
        windFallStartedAt:String(p.windFallStartedAt||0),windLastFallMs:String((p.windFallUntil||0)-(p.windFallStartedAt||0)),
        windLastStunMs:p.windFallUntil?String(p.stunnedUntil-p.windFallUntil):'0',
      })
    }
    for (const [id, actor] of this.actors) if (!ids.has(id)) { actor.destroy(); this.actors.delete(id) }
    if (focus) this.follow.x = focus.x + this.lookAhead
    const cam = this.cameras.main
    const gateIds = new Set<string>()
    for (const h of frame.hazards || []) {
      if (h.kind !== 'underpass') continue // Only this model has the user's approval.
      const x = h.worldX!, visible = Math.abs(x - this.follow.x) < cam.width / cam.zoom + 300
      if (!visible) continue
      gateIds.add(h.id)
      if (!this.gates.has(h.id)) this.gates.set(h.id, new CrawlGateView(this, h))
    }
    for (const [id, gate] of this.gates) if (!gateIds.has(id)) { gate.destroy(); this.gates.delete(id) }
    this.layers.update(cam)
    this.wind.triggerGust(frame.running?frame.wind:undefined)
    this.wind.update(frame.now,delta,cam,this.reduced)
    Object.assign(this.game.canvas.dataset, { cameraTarget: frame.me || focus?.id || 'start',
      cameraX: String(cam.scrollX), cameraY: String(cam.scrollY), cameraZoom: String(cam.zoom),
      worldWidth: String(WORLD), visibleWorldWidth: String(cam.width / cam.zoom),
      nameLabels: '0', playerMarkers: frame.me ? '1' : '0', actorCount: String(this.actors.size),
      obstacleModels: 'approved-crawl-only', obstacleCount: String(this.gates.size),
      stunned: String((focus?.stunnedUntil || 0) > frame.now), windDirection:String(frame.wind?.direction||0),
      windParticles:String(this.wind.activeParticles), windFalling:String((focus?.windFallUntil||0)>frame.now) })
  }
}
