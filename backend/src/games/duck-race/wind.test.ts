import { describe, it, expect } from 'vitest'
import { WIND_RULES, windStrength, windFlightStep, windFallState } from './wind'
import { flightHeight, type WindGust } from './contracts'
import { createRace, joinRace, startRace, tickRace, steerRace, jumpRace, snapshot } from './engine'

const gust=(direction:-1|1=1):WindGust=>({id:'wind',direction,startedAt:1000,endsAt:11000,strength:1})
function fixture(direction:-1|1) {
  const room=createRace(0),p=joinRace(room,'Wind test','yellow','duckee',0)
  startRace(room,0);tickRace(room,3000);room.hazards=[]
  p.x=300;p.y=500;p.points=500;room.wind={...gust(direction),startedAt:2000,endsAt:12000}
  return {room,p}
}
describe('Authoritative airborne wind',()=>{
  it('ramps up and fades to exactly zero outside the event',()=>{
    const g=gust();expect(windStrength(g,999)).toBe(0);expect(windStrength(g,1000)).toBe(0)
    expect(windStrength(g,1350)).toBeCloseTo(.5);expect(windStrength(g,5000)).toBe(1)
    expect(windStrength(g,10300)).toBeCloseTo(.5);expect(windStrength(g,11000)).toBe(0)
  })
  it('never adds passive movement or a stun on the ground',()=>{
    expect(windFlightStep({jumpUntil:0,facingX:1},gust(-1),5000,.1,1)).toEqual({dx:0,headwind:false})
    const {room,p}=fixture(-1);steerRace(room,p,0,0,3000);tickRace(room,3100)
    expect(p.x).toBe(300);expect(p.stunnedUntil).toBe(0)
  })
  it('tailwind follows actual direction, both right and left',()=>{
    for(const direction of [-1,1] as const){const e=windFlightStep({jumpUntil:6000,facingX:direction},gust(direction),5000,.1,direction)
      expect(e.dx).toBeCloseTo(direction*11);expect(e.headwind).toBe(false)}
  })
  it('tailwind increases airborne distance, with no reward or reserve inflation',()=>{
    const a=fixture(1),b=fixture(1);b.room.wind=undefined
    for(const f of [a,b]){steerRace(f.room,f.p,1,0,3000);jumpRace(f.room,f.p,3000);tickRace(f.room,3100)}
    expect(a.p.x-b.p.x).toBeCloseTo(11,4);expect(a.p.points).toBe(500);expect(a.p.rollRemaining).toBe(0)
  })
  it('headwind gives a continuous fall, 48px recoil and exactly 300ms grounded stun',()=>{
    const {room,p}=fixture(-1);steerRace(room,p,1,0,3000)
    room.wind=undefined;jumpRace(room,p,3000);tickRace(room,3200)
    const before=flightHeight(p,3250),x=p.x;room.wind={...gust(-1),startedAt:2000,endsAt:12000}
    tickRace(room,3250)
    expect(p.windFallFrom).toBeCloseTo(before);expect(flightHeight(p,3250)).toBeCloseTo(before)
    expect(p.stunnedUntil-(p.windFallUntil||0)).toBe(WIND_RULES.stunMs)
    tickRace(room,3430);expect(flightHeight(p,3430)).toBe(0);expect(p.x).toBeCloseTo(x-48)
    expect(p.stunnedUntil).toBe(3730);expect(p.points).toBe(500)
    steerRace(room,p,1,0,3720);tickRace(room,3725);expect(p.speed).toBe(0)
    tickRace(room,3730);expect(p.stunnedUntil).toBeLessThanOrEqual(3730)
  })
  it('fall curve and tailwind displacement are independent of rendering FPS',()=>{
    const p={jumpUntil:2100,jumpStartedAt:1000,jumpDuration:1100},fall=windFallState(p,1400)
    expect(flightHeight({...p,...fall},1400)).toBeCloseTo(flightHeight(p,1400))
    expect(flightHeight({...p,...fall},1580)).toBe(0)
    const total=(fps:number)=>Array.from({length:fps},()=>windFlightStep({jumpUntil:9000,facingX:1},gust(),5000,1/fps,1).dx).reduce((a,b)=>a+b,0)
    expect(total(30)).toBeCloseTo(total(60));expect(total(60)).toBeCloseTo(total(120))
  })
  it('shares one random direction and timing with every player and host',()=>{
    const {room,p}=fixture(1);room.lastSpawn=3000;tickRace(room,33000)
    expect([-1,1]).toContain(room.wind?.direction);expect(room.wind!.endsAt-room.wind!.startedAt).toBe(10000)
    expect(snapshot(room,p.id,33000).wind).toEqual(snapshot(room,undefined,33000).wind)
  })
  it('wind recoil stops at a solid obstacle behind the duck',()=>{
    const {room,p}=fixture(-1);p.x=500;p.jumpStartedAt=2800;p.jumpDuration=1100;p.jumpUntil=3900
    room.hazards=[{id:'behind',kind:'wall',category:'obstacle',worldX:455,worldY:500,spanY:180,thicknessX:20,position:455/600,offset:0,expiresAt:1e9}]
    steerRace(room,p,1,0,3000);tickRace(room,3050);tickRace(room,3230)
    expect(p.x).toBeGreaterThanOrEqual(479)
  })
})
