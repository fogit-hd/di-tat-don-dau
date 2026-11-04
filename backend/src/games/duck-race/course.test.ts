import {describe,it,expect} from 'vitest'
import {DuckMotor} from './motor'
import {ROAD_Y,STEP_PX} from './track'
import {createRace,joinRace,startRace,tickRace,steerRace,buyMove} from './engine'

describe('manual movement and matching client prediction',()=>{
 const motor=new DuckMotor(),base={x:400,y:ROAD_Y,reserve:100,crouching:false,airborne:false}
 it('does not drift or spend reserve when idle, jumping in place, or only dodging vertically',()=>{
  for(const airborne of [false,true]){
   const idle=motor.advance({...base,airborne,airSpeed:390},{x:0,y:0},.2)
   expect(idle.x).toBe(base.x);expect(idle.y).toBe(base.y);expect(idle.reserve).toBe(100)
   const vertical=motor.advance({...base,airborne},{x:0,y:1},.2)
   expect(vertical.x).toBe(base.x);expect(vertical.y).toBeGreaterThan(base.y);expect(vertical.reserve).toBe(100)
  }
 })
 it('moves backwards when requested and does not consume a forward boost',()=>{
  const result=motor.advance(base,{x:-1,y:0},.2)
  expect(result.x).toBeCloseTo(400-19.2);expect(result.reserve).toBe(100);expect(result.boosting).toBe(false)
 })
 it('retains purchased reserve after release and ignores stale input until a new press',()=>{
  const r=createRace(1000),p=joinRace(r,'QA','yellow','duckee',1000);r.hazards=[]
  startRace(r,1000);tickRace(r,4000);p.points=200;buyMove(r,p,'boost',4000)
  tickRace(r,4100);expect(p.x).toBe(0)
  steerRace(r,p,1,0,4100);tickRace(r,4200);expect(p.x).toBeCloseTo(39)
  const reserve=p.rollRemaining;steerRace(r,p,0,0,4200);tickRace(r,4300);expect(p.x).toBeCloseTo(39);expect(p.rollRemaining).toBe(reserve)
  steerRace(r,p,1,0,4300);tickRace(r,4800);expect(p.x).toBeCloseTo(39);expect(p.rollRemaining).toBe(reserve)
 })
 it('refreshes held-input history, stops prediction on release and reconciles leftward movement',async()=>{
  // Test the browser module without including browser sources in backend's Docker build.
  const clientPath='../../../../frontend/src/games/duck-race/motion'
  const {newIntent,recordIntent,predictLocal,reconcileLocal}=await import(clientPath)
  const r=createRace(1000),p=joinRace(r,'QA','yellow','duckee',1000),intent=newIntent()
  for(let at=4000;at<=5200;at+=80)recordIntent(intent,{at,x:1,y:0,crouch:false})
  const view={...p,rank:1,x:1000,y:ROAD_Y,target:0,progress:0}
  expect(predictLocal(view,5200,5300,intent).x).toBeGreaterThan(1000)
  recordIntent(intent,{at:5300,x:0,y:0,crouch:false})
  expect(predictLocal(view,5300,5400,intent).x).toBe(1000)
  recordIntent(intent,{at:5400,x:-1,y:0,crouch:false})
  const predicted=predictLocal(view,5400,5500,intent)
  expect(predicted.x).toBeLessThan(1000)
  expect(reconcileLocal({x:1000,y:ROAD_Y},predicted,intent,.016,false).x).toBeLessThan(1000)
 })
})


