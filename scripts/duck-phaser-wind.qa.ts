import assert from 'node:assert/strict'
import { WindManager, WIND_VISUALS } from '../frontend/src/games/duck-race/phaser/fx/WindManager'
import { PreviewSimulation } from '../frontend/src/games/duck-race/phaser/bridge/PreviewSimulation'
import { groundPose } from '../frontend/src/games/duck-race/phaser/presentation'
import { WIND_RULES } from '../frontend/src/games/duck-race/wind'
import type Phaser from 'phaser'

class ImageDouble {
  visible=true; destroyed=false;x=0;y=0;rotation=0;alpha=1
  setVisible(v:boolean){this.visible=v;return this}
  setOrigin(){return this}setDisplaySize(){return this}setTexture(){return this}setFlipX(){return this}setDepth(){return this}setAngle(){return this}
  setRotation(v:number){this.rotation=v;return this}setAlpha(v:number){this.alpha=v;return this}
  setPosition(x:number,y:number){this.x=x;this.y=y;return this}destroy(){this.destroyed=true}
}
const images:ImageDouble[]=[]
const scene={add:{image:()=>{const image=new ImageDouble();images.push(image);return image}}} as unknown as Phaser.Scene
const camera={worldView:{left:0,right:1200,top:0,width:1200,height:800}} as Phaser.Cameras.Scene2D.Camera
const manager=new WindManager(()=>.42).create(scene),created=images.length
for(let i=0;i<1000;i++)manager.triggerSkillWind(500,500,i%2?-1:1)
assert.equal(images.length,created);assert.equal(manager.activeParticles,WIND_VISUALS.maxParticles)
manager.triggerGust({id:'qa',direction:-1,startedAt:1000,endsAt:11000,strength:1})
for(let now=1000;now<20000;now+=100){manager.update(now,100,camera);assert.ok(manager.activeParticles<=96);assert.equal(images.length,created)}
assert.equal(manager.activeParticles,0)
manager.destroy();assert.ok(images.every(i=>i.destroyed));assert.equal(manager.activeParticles,0)
console.log('PASS: fixed particle pool, no per-frame image allocation, fade/expiry and Scene cleanup')

const tick=(s:PreviewSimulation,ms:number)=>{for(let i=0;i<ms;i+=10)s.advance(10)}
const a=new PreviewSimulation(),b=new PreviewSimulation()
a.triggerWind(1);tick(a,800);tick(b,800)
for(const s of [a,b]){s.action('jump');s.move({x:1,y:0,crouch:false,guard:false});tick(s,400)}
assert.ok(a.me.x>b.me.x+35);assert.equal(a.me.points,500);assert.equal(a.me.target,a.me.progress)
const c=new PreviewSimulation();c.triggerWind(-1);tick(c,800);c.action('jump');c.move({x:1,y:0,crouch:false,guard:false});tick(c,20)
assert.equal(groundPose(c.me,c.now).pose,'fall');assert.equal(c.me.stunnedUntil-(c.me.windFallUntil||0),WIND_RULES.stunMs)
tick(c,200);assert.equal(groundPose(c.me,c.now).pose,'knockout')
tick(c,300);assert.notEqual(groundPose(c.me,c.now).pose,'knockout');assert.equal(c.me.points,500)
console.log('PASS: fixture tailwind distance, headwind fall → grounded 300ms stun → recovery, funds unchanged')
