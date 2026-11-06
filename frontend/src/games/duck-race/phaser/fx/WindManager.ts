import type Phaser from 'phaser'
import type { WindGust } from '../../contracts'
import { windStrength } from '../../wind'

type Mote = { image: Phaser.GameObjects.Image; age: number; life: number; x: number; y: number;
  speed: number; phase: number; rotation: number; spin: number; direction: number; opacity: number; kind: number }
type GustInput = WindGust
export const WIND_VISUALS = { maxParticles: 96, emitPerSecond: 18, baseSpeed: 170, gustSpeed: 260,
  waveHz: .7, waveSpeed: 28, lifespanMs: 4200, grassDegrees: 12 } as const

/** Phaser 4 presentation only. Never mutates a racer, funds, collider, or a server clock.
 * All moving particles are preallocated; expired images are hidden and reused.
 * create → triggerGust/triggerSkillWind → update → destroy.
 */
export class WindManager {
  private scene?: Phaser.Scene
  private motes: Mote[] = []
  private grass: Phaser.GameObjects.Image[] = []
  private gust?: GustInput
  private spawnDebt = 0
  private fresh = false
  private random: () => number
  constructor(random: () => number = Math.random) { this.random=random }
  create(scene: Phaser.Scene) {
    if(this.scene)throw new Error('WindManager.create must run once per Scene instance')
    this.scene=scene
    for(let i=0;i<WIND_VISUALS.maxParticles;i++)this.motes.push({image:scene.add.image(0,0,'wind-leaf-green').setVisible(false),
      age:0,life:0,x:0,y:0,speed:0,phase:0,rotation:0,spin:0,direction:1,opacity:0,kind:0})
    for(let i=0;i<20;i++)this.grass.push(scene.add.image(0,0,'wind-grass').setOrigin(.5,.73).setDisplaySize(55,49))
    return this
  }
  triggerGust(gust: GustInput | undefined) {
    if(gust?.id!==this.gust?.id){this.fresh=!!gust;this.spawnDebt=0}
    this.gust=gust
  }
  /** A local cosmetic burst: dash/roll/slash visuals do not create free global wind. */
  triggerSkillWind(x: number, y: number, direction: -1|1, kind: 'dash'|'slash' = 'dash') {
    if(!this.scene)return
    this.emit(x,y-18,direction,kind==='slash'?4:3,450)
    for(let i=0;i<5;i++)this.emit(x-direction*this.random()*24,y-this.random()*12,direction,2,500+this.random()*350)
  }
  private emit(x: number,y: number,direction: number,kind: number,life=WIND_VISUALS.lifespanMs as number) {
    const p=this.motes.find(p=>!p.image.visible)
    if(!p)return
    const names=['leaf-green','leaf-amber','dust','ribbon','slash']
    p.age=0;p.life=life;p.x=x;p.y=y;p.direction=direction;p.kind=kind
    p.phase=this.random()*Math.PI*2;p.rotation=kind<2?this.random()*6:0
    p.spin=kind<2?(this.random()-.5)*3.2:0;p.speed=WIND_VISUALS.baseSpeed+this.random()*110
    const width=kind<2?24+this.random()*12:kind===2?70+this.random()*40:kind===3?170:90
    p.opacity=kind<2?.75:kind===2?.22:.38
    p.image.setTexture(`wind-${names[kind]}`).setDisplaySize(width,width).setFlipX(direction<0)
      .setRotation(p.rotation).setAlpha(0).setVisible(true).setDepth(850)
  }
  update(now: number, deltaMs: number, camera: Phaser.Cameras.Scene2D.Camera, reduced=false) {
    if(!this.scene)return
    const dt=Math.max(0,Math.min(100,deltaMs))/1000
    const power=windStrength(this.gust,now),direction=this.gust?.direction||1
    const view=camera.worldView
    // Rooted grass is anchored to fixed world grid points, not dragged with the camera.
    for(let i=0;i<this.grass.length;i++){
      const side=i%2,index=Math.floor(i/2),x=(Math.floor(view.left/180)+index)*180+60+side*50,y=side?596:411
      const angle=reduced?0:direction*power*(WIND_VISUALS.grassDegrees+Math.sin(now*.004+x*.03)*3)
      this.grass[i].setPosition(x,y).setDepth(y+1).setAngle(angle).setAlpha(.8)
    }
    if(this.fresh&&power>0){
      this.fresh=false
      for(let i=0;i<(reduced?3:14);i++)this.emit(view.left+this.random()*view.width,
        Math.max(view.top+40,310)+this.random()*150,direction,i%4)
    }
    if(power>0){
      this.spawnDebt+=dt*WIND_VISUALS.emitPerSecond*(reduced?.16:1)*power
      while(this.spawnDebt>=1){
        this.spawnDebt--
        this.emit(direction>0?view.left-80:view.right+80,Math.max(view.top+40,290)+this.random()*210,
          direction,Math.floor(this.random()*4))
      }
    }
    for(const p of this.motes){
      if(!p.image.visible)continue
      p.age+=dt*1000
      if(p.age>=p.life){p.image.setVisible(false);continue}
      const t=p.age/p.life
      p.x+=p.direction*(p.speed+power*WIND_VISUALS.gustSpeed)*dt
      p.y+=Math.sin(p.age/1000*Math.PI*2*WIND_VISUALS.waveHz+p.phase)*WIND_VISUALS.waveSpeed*dt
      p.rotation+=p.spin*dt
      // Fade both ends of the lifespan; a recycled particle never snaps back onscreen.
      const fade=Math.min(1,t*7,(1-t)*4)
      p.image.setPosition(p.x,p.y).setRotation(p.rotation).setAlpha(p.opacity*fade)
    }
  }
  get activeParticles() { let count=0;for(const p of this.motes)if(p.image.visible)count++;return count }
  destroy() {
    for(const p of this.motes)p.image.destroy()
    for(const g of this.grass)g.destroy()
    this.motes=[];this.grass=[];this.scene=undefined;this.gust=undefined
  }
}
