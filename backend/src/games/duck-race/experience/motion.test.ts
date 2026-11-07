import { describe, expect, it } from 'vitest'
import { ScoreMotion,damagePose,WIND_IMPACT_MS } from '../score-motion'
import type { RacerView } from '../contracts'
const player=(points=500,seq=0,delta=0)=>({id:'one',points,scoreEvents:seq?[{seq,at:0,before:points-delta,after:points,delta,reason:'test'}]:[]}) as RacerView
describe('native score-coordinate movement',()=>{
 it('waits for an incoming wind to touch the duck before starting its exact-distance recoil',()=>{
  const m=new ScoreMotion();m.update([player()],0,'one',960,1)
  const hurt=player(450,1,-50);hurt.scoreEvents![0].fx='wind'
  m.update([hurt],16,'one',960,1)
  for(let t=32;t<16+WIND_IMPACT_MS;t+=16){m.update([hurt],t,'one',960,1);expect(m.actors.get('one')!.pose).toBe('walk_run');expect(m.actors.get('one')!.offset).toBe(1600)}
  m.update([hurt],16+WIND_IMPACT_MS,'one',960,1);expect(m.actors.get('one')!.pose).toBe('knockout')
  m.update([hurt],16+WIND_IMPACT_MS+700,'one',960,1);expect(m.actors.get('one')!.offset).toBe(1440)
 })
 it('uses exact 3.2px point offsets and a common cruise without consuming score',()=>{const m=new ScoreMotion();m.update([player()],0,'one',960,1);expect(m.actors.get('one')!.offset).toBe(1600);m.update([player()],1000,'one',960,1);expect(m.actors.get('one')!.offset).toBe(1600);expect(m.actors.get('one')!.worldX).toBe(1990)})
 it('animates a gain continuously instead of teleporting',()=>{const m=new ScoreMotion();m.update([player()],0,'one',960,1);m.update([player(600,1,100)],16,'one',960,1);expect(m.actors.get('one')!.offset).toBe(1600);for(let t=32;t<4000;t+=16)m.update([player(600,1,100)],t,'one',960,1);expect(m.actors.get('one')!.offset).toBe(1920)})
 it('slides the selected lying pose backwards by the exact loss with no airborne phase',()=>{
  const m=new ScoreMotion();m.update([player()],0,'one',960,1);const start=m.actors.get('one')!.worldX
  m.update([player(350,1,-150)],16,'one',960,1)
  for(let t=32;t<=616;t+=8){m.update([player(350,1,-150)],t,'one',960,1);const a=m.actors.get('one')!;expect(a.pose).toBe('knockout');expect(a.frame).toBe(0);expect(a.z).toBe(0)}
  expect(m.actors.get('one')!.offset).toBe(1120);expect(start-m.actors.get('one')!.worldX).toBe(480)
  m.update([player(350,1,-150)],800,'one',960,1);expect(m.actors.get('one')!.frame).toBe(1)
  m.update([player(350,1,-150)],1000,'one',960,1);expect(m.actors.get('one')!.damage).toBeUndefined();expect(m.actors.get('one')!.offset).toBe(1120)
 })
 it('extends an interrupted slide by the new loss without dropping the unfinished distance',()=>{
  const m=new ScoreMotion();m.update([player()],0,'one',960,1);const start=m.actors.get('one')!.worldX
  m.update([player(400,1,-100)],16,'one',960,1);m.update([player(400,1,-100)],200,'one',960,1);const before=m.actors.get('one')!.worldX
  m.update([player(350,2,-50)],200,'one',960,1);expect(m.actors.get('one')!.worldX).toBe(before)
  m.update([player(350,2,-50)],1300,'one',960,1);expect(start-m.actors.get('one')!.worldX).toBe(480);expect(m.actors.get('one')!.offset).toBe(1120)
 })
 it('still moves backwards for a one-point deduction instead of cruising forwards',()=>{
  const m=new ScoreMotion();m.update([player()],0,'one',960,1);const start=m.actors.get('one')!.worldX
  m.update([player(499,1,-1)],16,'one',960,1);m.update([player(499,1,-1)],366,'one',960,1);expect(start-m.actors.get('one')!.worldX).toBeCloseTo(3.2)
 })
 it('does not replay old recoil on reconnect and respects reduced motion',()=>{const m=new ScoreMotion();m.update([player(350,1,-150)],1000,'one',390,.66);expect(m.actors.get('one')!.damage).toBeUndefined();m.update([player(300,2,-50)],1100,'one',390,.66,true);expect(m.actors.get('one')!.offset).toBe(960);expect(damagePose(1360).pose).toBe('walk_run')})
})
