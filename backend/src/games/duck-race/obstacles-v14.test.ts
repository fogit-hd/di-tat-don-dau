import { describe,it,expect } from 'vitest'
import { spawnObstacles,obstacleCollision,clearsObstacle,CRAWL_GATE_LAYOUT } from './motor'
import { ROAD_Y,ROAD_HALF_WIDTH,STEP_PX,obstaclePoint } from './track'
import { OBSTACLE_RULES,type HazardView } from './contracts'
import { createRace,joinRace,startRace,tickRace,steerRace,jumpRace,attackRace,buyMove,armStar,playCard,answerRace,snapshot } from './engine'

describe('continuous, fixed world obstacle grammar',()=>{
 it('migrates persisted old courses once without changing player funds or coordinates',()=>{
  const r=createRace(1000),p=joinRace(r,'Old room','yellow','duckee',1000)
  r.courseVersion=2;r.hazards=[];p.points=456;p.x=100;p.y=520
  tickRace(r,1100);expect(r.courseVersion).toBe(5);expect(p.points).toBe(456);expect(p.x).toBe(100);expect(p.y).toBe(520)
  const course=JSON.stringify(r.hazards);tickRace(r,1200);expect(JSON.stringify(r.hazards)).toBe(course)
 })
 it('varies depth and center with no lanes, preserving a walkable gap or an actionable barrier',()=>{
  const centers=new Set<number>(),spans=new Set<number>(),kinds=new Set<string>()
  for(let seed=1;seed<=64;seed++){
   const course=spawnObstacles(seed),rows=new Map<string,HazardView[]>()
   expect(course).toEqual(spawnObstacles(seed))
   for(const h of course){
    expect(h.lane).toBeUndefined();expect(h.freeLane).toBeUndefined()
    const bankOverlap=h.kind==='underpass'?CRAWL_GATE_LAYOUT.bankOverlap:0
    expect(h.worldX).toBeCloseTo(h.position*STEP_PX);expect(h.worldY!-(h.spanY??0)/2).toBeGreaterThanOrEqual(ROAD_Y-ROAD_HALF_WIDTH-bankOverlap-.001)
    expect(h.worldY!+(h.spanY??0)/2).toBeLessThanOrEqual(ROAD_Y+ROAD_HALF_WIDTH+bankOverlap+.001)
    centers.add(h.worldY!);spans.add(h.spanY!);kinds.add(h.kind)
    rows.set(h.rowId!,[...rows.get(h.rowId!)||[],h])
   }
   for(const row of rows.values()){
    const x=row[0].worldX!
    const open=Array.from({length:169},(_,i)=>ROAD_Y-84+i).some(y=>row.every(h=>obstacleCollision({x:x-200,y},{x:x+200,y},h,0,.25)===null))
    expect(open||row.every(h=>['hop','double','underpass','roots'].includes(h.kind))).toBe(true)
   }
  }
  expect(centers.size).toBeGreaterThan(200);expect(spans.size).toBeGreaterThan(200)
  expect([...kinds].sort()).toEqual(Object.keys(OBSTACLE_RULES).sort())
 },20000)
 it('uses a swept footprint, never camera coordinates or an X tied to a racer',()=>{
  const h:HazardView={id:'wall',kind:'wall',position:1,offset:0,worldX:1200,worldY:500,spanY:40,thicknessX:30,expiresAt:1e14}
  expect(obstaclePoint(h,0)).toEqual(obstaclePoint(h,90000))
  expect(obstacleCollision({x:800,y:500},{x:1800,y:500},h,0,.25)).not.toBeNull()
  expect(obstacleCollision({x:800,y:560},{x:1800,y:560},h,0,.25)).toBeNull()
 })
 it('distinguishes hop, double, underpass and unjumpable wall even with boost',()=>{
  const p={jumpUntil:2100,jumpStartedAt:1000,jumpDuration:1100,jumpCount:1,crouching:false,rolling:false}
  const hazard=(kind:HazardView['kind']):HazardView=>({id:kind,kind,position:0,offset:0,expiresAt:1e14})
  expect(clearsObstacle(p,hazard('hop'),1550)).toBe(true)
  expect(clearsObstacle(p,hazard('double'),1550)).toBe(false)
  expect(clearsObstacle({...p,jumpCount:2,jumpFrom:45},hazard('double'),1550)).toBe(true)
  expect(clearsObstacle({...p,jumpUntil:0,crouching:true},hazard('underpass'),1550)).toBe(true)
  expect(clearsObstacle(p,hazard('underpass'),1550)).toBe(false)
  for(const kind of ['wall','cart','catcher'] as const)expect(clearsObstacle({...p,jumpCount:2,jumpFrom:200,rolling:true},hazard(kind),1550)).toBe(false)
 })
})

describe('net capture is an individual final settlement',()=>{
 it('freezes points, movement, question rewards and card transfers without ending other racers',()=>{
  const r=createRace(1000),p=joinRace(r,'Caught','blue','duckee',1000),q=joinRace(r,'Still racing','green','duckee',1000)
  startRace(r,1000);tickRace(r,4000);p.x=880;p.y=500;p.points=321;q.points=20;q.x=0
  r.hazards=[{id:'net',kind:'catcher',category:'obstacle',position:900/STEP_PX,offset:0,worldX:900,worldY:500,spanY:42,thicknessX:38,expiresAt:1e14}]
  steerRace(r,p,1,0,4000);tickRace(r,4100)
  expect(p.capturedAt).toBe(4100);expect(r.phase).toBe('racing');expect(r.hazards[0].caughtRacerId).toBe(p.id)
  const pos=p.x;p.cards=['grant'];q.cards=['steal']
  for(const fn of [()=>buyMove(r,p,'step',4100),()=>jumpRace(r,p,4100),()=>attackRace(r,p,4100),()=>armStar(r,p,4100),()=>playCard(r,p,0,4100),()=>answerRace(r,p,'any','A',4100)])expect(fn).toThrow(/đã bị bắt/)
  playCard(r,q,0,4100);steerRace(r,p,1,1,4100);steerRace(r,q,1,0,4100);tickRace(r,4200)
  expect(p.x).toBe(pos);expect(p.points).toBe(321);expect(q.x).toBeGreaterThan(0)
  expect(snapshot(r,p.id,4200).question).toBeUndefined()
  tickRace(r,25000);expect(p.points).toBe(321);expect(p.answered).toBe(0)
 })
 it('consumes a shield instead of capturing; a busy catcher cannot capture a second duck',()=>{
  const r=createRace(1000),p=joinRace(r,'Shield','yellow','duckee',1000),q=joinRace(r,'Other','red','duckee',1000)
  startRace(r,1000);tickRace(r,4000);p.x=q.x=880;p.y=q.y=500;p.shield=1
  r.hazards=[{id:'net',kind:'catcher',category:'obstacle',position:900/STEP_PX,offset:0,worldX:900,worldY:500,spanY:42,expiresAt:1e14}]
  tickRace(r,4100);expect(p.capturedAt).toBeUndefined();expect(p.shield).toBe(0);expect(q.capturedAt).toBe(4100)
  tickRace(r,4800);expect(p.capturedAt).toBeUndefined()
 })
})
