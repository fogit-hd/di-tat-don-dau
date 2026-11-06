import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PreviewSimulation } from '../frontend/src/games/duck-race/phaser/bridge/PreviewSimulation'
import { blockingObstacleContact, footprintsOverlap, obstacleFootprint, CRAWL_GATE_LAYOUT } from '../frontend/src/games/duck-race/motor'
import { approvedCrawlCourse, crawlGateRegistration, CRAWL_ART, CRAWL_SCALE } from '../frontend/src/games/duck-race/phaser/world/crawlGate'
import { groundPose } from '../frontend/src/games/duck-race/phaser/presentation'
import type { HazardView } from '../frontend/src/games/duck-race/contracts'

const passed: string[] = []
const test = (name: string, fn: () => void) => { fn(); passed.push(name) }
const tick = (sim: PreviewSimulation, duration: number) => { for (let ms=0;ms<duration;ms+=10) sim.advance(10) }
const direction = (x=0,y=0,crouch=false,guard=false) => ({x,y,crouch,guard})
const gate: HazardView = { id:'approved',kind:'underpass',category:'obstacle',worldX:640,worldY:500,
  position:640/600,offset:0,spanY:152,thicknessX:66,heightZ:1000,expiresAt:1e14 }
const simAt = (y=500) => { const s=new PreviewSimulation([gate]); s.me.x=550;s.me.y=y;return s }

test('Mandatory crawl gates meet both banks; fixed world X with no bypass or base overlaps', () => {
  const course=approvedCrawlCourse();assert.deepEqual(course,approvedCrawlCourse());assert.ok(course.length>100)
  assert.ok(course.every(h=>h.kind==='underpass' && h.lane===undefined))
  for(let i=0;i<course.length;i++) {
    const h=course[i], b=obstacleFootprint(h)
    assert.equal(h.worldY,500);assert.equal(h.spanY,CRAWL_GATE_LAYOUT.spanY)
    assert.equal(b.top,410);assert.equal(b.bottom,590)
    const standing={jumpUntil:0,crouching:false,rolling:false}
    // Every reachable ground Y is blocked without the required action, including both edges.
    for(let y=416;y<=584;y++) assert.notEqual(blockingObstacleContact(standing,
      {x:h.worldX!-140,y},{x:h.worldX!+140,y},h,5000,.25),null)
    for(let j=i+1;j<course.length;j++) assert.equal(footprintsOverlap(course[i],course[j]),false)
  }
  assert.ok(new Set(course.map(h=>h.worldX)).size>100)
})
test('Original tapered painting is rendered whole with one uniform scale and both feet on the banks', () => {
  const meta=JSON.parse(fs.readFileSync('frontend/public/assets/duck-race/phaser-v2/crawl-gate-source.json','utf8'))
  assert.deepEqual(meta.size,[CRAWL_ART.width,CRAWL_ART.height])
  for(const h of approvedCrawlCourse()) {
    const r=crawlGateRegistration(h),far=r.topY+CRAWL_ART.farFootY*r.scale,
      near=r.topY+CRAWL_ART.nearFootY*r.scale
    assert.equal(r.scale,CRAWL_SCALE);assert.equal(r.x,h.worldX)
    assert.equal(r.thickness,430*CRAWL_SCALE)
    assert.ok(far>=416&&near<=584) // Planted foot centers remain on the road, caps meet the banks.
    assert.ok(r.topY<416)
    assert.ok(r.topY+CRAWL_ART.height*r.scale>584)
    assert.ok(Math.abs(near-far-((h.spanY||0)-18))<1e-6)
  }
  const long=crawlGateRegistration({...gate,spanY:180,worldY:500})
  for(const worldY of [460,500,540]) {
    const moved=crawlGateRegistration({...gate,spanY:180,worldY})
    assert.equal(moved.scale,long.scale)
  }
  const source=fs.readFileSync('frontend/src/games/duck-race/phaser/world/CrawlGateView.ts','utf8')
  assert.ok(!source.includes('texture.add('));assert.ok(source.includes('.setScale(r.scale)'))
})
test('Holding Shift passes the central cavity without stun or consuming stored boost', () => {
  const s=simAt();s.action('roll');const points=s.me.points
  s.move(direction(1,0,true));tick(s,6000)
  assert.ok(s.me.x>750);assert.equal(s.me.stunnedUntil,0);assert.equal(s.me.points,points)
  assert.equal(groundPose(s.me,s.now).pose,'crawl')
})
test('Running, rolling, first jump and double jump all hit the low lintel and retreat to entry', () => {
  for(const mode of ['run','roll','jump','double']) {
    const s=simAt();if(mode==='roll')s.action('roll')
    if(mode==='jump'||mode==='double')s.action('jump')
    if(mode==='double')s.action('jump')
    s.move(direction(1));tick(s,1100)
    assert.ok(s.me.stunnedUntil>s.now,mode);assert.ok(s.me.x<590,mode)
    assert.equal(groundPose(s.me,s.now).pose,'knockout',mode)
  }
})
test('Two support feet stay solid to crawling, including side entry in continuous ground Y', () => {
  const p={jumpUntil:0,crouching:true,rolling:false}
  assert.equal(blockingObstacleContact(p,{x:540,y:500},{x:740,y:500},gate,5000,.25),null)
  for(const y of [433,567]) assert.notEqual(blockingObstacleContact(p,{x:540,y},{x:740,y},gate,5000,.25),null)
  assert.notEqual(blockingObstacleContact(p,{x:640,y:500},{x:640,y:580},gate,5000,.25),null)
  const s=simAt(567);s.move(direction(1,0,true));tick(s,2000);assert.ok(s.me.stunnedUntil>s.now)
})
test('Standing up inside cannot escape through solid wood; recovery prevents damage, not contact', () => {
  const s=simAt();s.me.x=640;s.move(direction(1));tick(s,100)
  assert.ok(s.me.stunnedUntil>s.now)
  tick(s,1500);s.me.x=580;s.me.recoveryUntil=s.now+2000;s.move(direction(1));tick(s,500)
  assert.ok(s.me.x<593);assert.ok(s.me.stunnedUntil<=s.now)
})
test('Swept detection catches fast crossing and reverse travel; guard roots despite directional intent', () => {
  const p={jumpUntil:0,crouching:false,rolling:true}
  assert.notEqual(blockingObstacleContact(p,{x:400,y:500},{x:900,y:500},gate,5000,.25),null)
  assert.notEqual(blockingObstacleContact(p,{x:900,y:500},{x:400,y:500},gate,5000,.25),null)
  const s=simAt();s.move(direction(-1,1,false,true));tick(s,1000)
  assert.equal(s.me.x,550);assert.equal(s.me.y,500);assert.equal(s.me.facingX,-1)
})
console.log(JSON.stringify({passed:passed.length,tests:passed},null,2))
