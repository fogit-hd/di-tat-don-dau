import { describe, it, expect } from 'vitest'
import { COURSE_LAYOUT, CRAWL_GATE_LAYOUT, clearsObstacle, blockingObstacleContact, footprintsOverlap, obstacleFootprint, obstacleCollision, spawnObstacles } from './motor'
import { ROAD_Y, ROAD_HALF_WIDTH, WORLD, STEP_PX } from './track'
import type { HazardView } from './contracts'
import { createRace, joinRace, startRace, steerRace, tickRace } from './engine'

describe('dense continuous obstacle course', () => {
  it('is deterministic, varied and non-overlapping across 128 room seeds', () => {
    const lengths = new Set<number>(), thicknesses = new Set<number>(), centers = new Set<number>()
    for (let seed = 1; seed <= 128; seed++) {
      const course = spawnObstacles(seed)
      expect(course).toEqual(spawnObstacles(seed))
      expect(course.length).toBeGreaterThan(140)
      const overlaps: string[][] = []
      for (let i = 0; i < course.length; i++) {
        const h = course[i], base = obstacleFootprint(h)
        const inset = h.kind === 'underpass' ? -CRAWL_GATE_LAYOUT.bankOverlap : COURSE_LAYOUT.edgeInset
        expect(base.top).toBeGreaterThanOrEqual(ROAD_Y - ROAD_HALF_WIDTH + inset - 1e-6)
        expect(base.bottom).toBeLessThanOrEqual(ROAD_Y + ROAD_HALF_WIDTH - inset + 1e-6)
        expect(base.left).toBeGreaterThan(0); expect(base.right).toBeLessThan(WORLD)
        expect(h.lane).toBeUndefined(); expect(h.freeLane).toBeUndefined()
        centers.add(h.worldY!); lengths.add(h.spanY!); thicknesses.add(h.thicknessX!)
        for (let j = i + 1; j < course.length; j++) if (footprintsOverlap(h, course[j])) overlaps.push([h.id,course[j].id])
      }
      expect(overlaps).toEqual([])
      const rows = [...new Set(course.map(h => h.worldX!))].sort((a,b) => a-b)
      const gaps = rows.slice(1).map((x,i) => x-rows[i])
      expect(gaps.filter(g => g <= COURSE_LAYOUT.maxSpacing).length / gaps.length).toBeGreaterThan(.65)
    }
    expect(centers.size).toBeGreaterThan(500)
    expect(lengths.size).toBeGreaterThan(500)
    expect(thicknesses.size).toBeGreaterThan(40)
    expect(spawnObstacles(5)).not.toEqual(spawnObstacles(6))
  }, 30000)

  it('keeps one walk-around opening or an isolated valid action at each fixed X', () => {
    for (let seed = 1; seed <= 32; seed++) {
      const rows = new Map<number, HazardView[]>()
      for (const h of spawnObstacles(seed)) rows.set(h.worldX!, [...rows.get(h.worldX!) || [], h])
      const ordered = [...rows.keys()].sort((a,b) => a-b)
      for (let i = 0; i < ordered.length; i++) {
        const x = ordered[i], row = rows.get(x)!
        const opening = Array.from({length:169},(_,j) => ROAD_Y-84+j)
          .some(y => row.every(h => obstacleCollision({x:x-120,y},{x:x+120,y},h,0,.25) === null))
        if (!opening) {
          expect(row.length).toBe(1)
          expect(['hop','double','underpass']).toContain(row[0].kind)
          if (i) expect(x-ordered[i-1]).toBeGreaterThanOrEqual(COURSE_LAYOUT.actionSpacing)
          if (i+1 < ordered.length) expect(ordered[i+1]-x).toBeGreaterThanOrEqual(COURSE_LAYOUT.actionSpacing)
        }
      }
    }
  })

  it('does not replace an active room course while racers are on it', () => {
    const room = createRace(1000); joinRace(room,'Active','yellow','duckee',1000)
    startRace(room,1000); tickRace(room,4000)
    room.courseVersion = 3
    const before = JSON.stringify(room.hazards)
    tickRace(room,4100)
    expect(room.courseVersion).toBe(3); expect(JSON.stringify(room.hazards)).toBe(before)
  })

  it('never spawns a mandatory crawl gate with a walk-around gap at either bank', () => {
    let checked=0
    for(let seed=1;seed<=64;seed++) for(const h of spawnObstacles(seed)) if(h.kind==='underpass') {
      checked++
      expect(h.worldY).toBe(ROAD_Y);expect(h.spanY).toBe(CRAWL_GATE_LAYOUT.spanY)
      for(let y=ROAD_Y-ROAD_HALF_WIDTH;y<=ROAD_Y+ROAD_HALF_WIDTH;y++) {
        expect(blockingObstacleContact({jumpUntil:0,crouching:false,rolling:false},
          {x:h.worldX!-150,y},{x:h.worldX!+150,y},h,5000,.25)).not.toBeNull()
      }
      expect(blockingObstacleContact({jumpUntil:0,crouching:true,rolling:false},
        {x:h.worldX!-150,y:ROAD_Y},{x:h.worldX!+150,y:ROAD_Y},h,5000,.25)).toBeNull()
    }
    expect(checked).toBeGreaterThan(50)
  })
})

describe('Shift-only crawl gate', () => {
  const h: HazardView = {id:'low',kind:'underpass',category:'obstacle',worldX:1000,worldY:500,
    position:1000/STEP_PX,offset:0,spanY:140,thicknessX:55,expiresAt:1e14}
  const base = { jumpUntil:0, crouching:false, rolling:false }
  it('accepts only grounded crouching, never roll, running, standing or either jump', () => {
    expect(clearsObstacle({...base,crouching:true},h,5000)).toBe(true)
    for (const state of [base,{...base,rolling:true},{...base,crouching:true,rolling:true},
      {...base,jumpUntil:6000,jumpCount:1}, {...base,jumpUntil:6000,jumpCount:2},
      {...base,crouching:true,jumpUntil:6000}, {...base,crouching:true,guardHeld:true},
      {...base,crouching:true,attackingUntil:6000}]) expect(clearsObstacle(state,h,5000)).toBe(false)
  })
  it('keeps the planted supports solid even with Shift, in both X and Y approaches', () => {
    const crawl={...base,crouching:true}
    expect(blockingObstacleContact(crawl,{x:900,y:500},{x:1100,y:500},h,5000,.25)).toBeNull()
    for(const y of [439,561]) expect(blockingObstacleContact(crawl,{x:900,y},{x:1100,y},h,5000,.25)).not.toBeNull()
    expect(blockingObstacleContact(crawl,{x:1000,y:500},{x:1000,y:580},h,5000,.25)).not.toBeNull()
    const room=createRace(1000),p=joinRace(room,'Foot contact','yellow','duckee',1000)
    startRace(room,1000);tickRace(room,4000);room.hazards=[h]
    p.x=965;p.y=561;steerRace(room,p,1,0,4000,true);tickRace(room,4250)
    expect(p.stunnedUntil).toBe(5750)
  })
  it('server permits Shift traversal but stuns a rolling duck and rolls it back to the entry side', () => {
    for (const crawl of [false,true]) {
      const r=createRace(1000),p=joinRace(r,'Gate','yellow','duckee',1000)
      startRace(r,1000); tickRace(r,4000); r.hazards=[h]
      p.x=935;p.y=500;p.rollRemaining=500
      steerRace(r,p,1,0,4000,crawl); tickRace(r,4250)
      if(crawl) { expect(p.stunnedUntil).toBe(0); expect(p.rollRemaining).toBe(500) }
      else {
        expect(p.stunnedUntil).toBe(5750)
        expect(p.knockToX).toBeLessThan(h.worldX!-(h.thicknessX??0)/2-14)
        expect(p.knockToX).toBeGreaterThan(h.worldX!-COURSE_LAYOUT.minSpacing+50)
      }
    }
  })
  it('shield and white recovery frames do not allow a rolling duck through the crawl-only gap', () => {
    for (const shield of [false,true]) {
      const r=createRace(1000),p=joinRace(r,'Solid gate','yellow','duckee',1000)
      startRace(r,1000);tickRace(r,4000);r.hazards=[h]
      p.x=935;p.y=500;p.rollRemaining=500
      if(shield)p.shield=1;else p.recoveryUntil=6000
      steerRace(r,p,1,0,4000);tickRace(r,4250)
      expect(p.x).toBeLessThan(1000-55/2-14)
      expect(p.stunnedUntil).toBe(0)
      expect(p.logs.filter(l=>l.kind==='collision')).toHaveLength(0)
    }
  })
})
