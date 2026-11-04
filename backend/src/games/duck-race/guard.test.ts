import {describe,it,expect} from 'vitest'
import {DuckMotor} from './motor'
import {ROAD_Y} from './track'
import {createRace,joinRace,startRace,tickRace,steerRace,buyMove,jumpRace,attackRace} from './engine'

function fixture(){
 const room=createRace(1000),p=joinRace(room,'Guard','yellow','duckee',1000)
 room.hazards=[];startRace(room,1000);tickRace(room,4000)
 p.x=400;p.y=ROAD_Y;p.points=500
 return {room,p,at:4000}
}
describe('rooted directional guard',()=>{
 it('roots both coordinates and preserves purchased distance for every direction and terrain',()=>{
  const motor=new DuckMotor()
  for(const x of [400,1900,6400])for(const dx of [-1,0,1])for(const dy of [-1,0,1]){
   const next=motor.advance({x,y:ROAD_Y,reserve:300,crouching:false,airborne:false,guardHeld:true},{x:dx,y:dy},.2)
   expect(next.x).toBe(x);expect(next.y).toBe(ROAD_Y);expect(next.reserve).toBe(300)
   expect(next.speed).toBe(0);expect(next.boosting).toBe(false)
  }
 })
 it('uses A/D only to turn while held, keeps the parry window, and resumes after release',()=>{
  const {room,p,at}=fixture();buyMove(room,p,'boost',at)
  const reserve=p.rollRemaining
  steerRace(room,p,1,1,at,false,true);tickRace(room,at+100)
  expect(p.x).toBe(400);expect(p.y).toBe(ROAD_Y);expect(p.facingX).toBe(1)
  steerRace(room,p,-1,-1,at+100,true,true);tickRace(room,at+200)
  expect(p.facingX).toBe(-1);expect(p.x).toBe(400);expect(p.y).toBe(ROAD_Y)
  expect(p.crouching).toBe(false);expect(p.rollRemaining).toBe(reserve);expect(p.guardUntil).toBe(at+260)
  steerRace(room,p,1,0,at+200,false,false);tickRace(room,at+300)
  expect(p.x).toBeGreaterThan(400);expect(p.rollRemaining).toBeLessThan(reserve)
 })
 it('does not jump, queue jumps or attack out of a held guard',()=>{
  const {room,p,at}=fixture();steerRace(room,p,0,0,at,false,true)
  jumpRace(room,p,at+100);attackRace(room,p,at+100)
  expect(p.jumpUntil).toBe(0);expect(p.jumpQueued).not.toBe(true);expect(p.attackingUntil).toBe(0)
 })
 it('reflects only when facing the attacker, with a fresh input and a timely guard',()=>{
  for(const facing of [-1,1]){
   const {room,p,at}=fixture(),q=joinRace(createRace(),'Unused','yellow','duckee')
   room.players.push(q);q.x=p.x+30;q.y=p.y;p.facingX=1
   steerRace(room,q,facing,0,at,false,true);attackRace(room,p,at+100)
   expect((facing===-1?p:q).stunnedUntil).toBe(at+1600)
   expect((facing===-1?q:p).stunnedUntil).toBe(0)
  }
 })
 it('does not reopen the parry window merely by turning the guard',()=>{
  const {room,p,at}=fixture(),other=createRace(),q=joinRace(other,'Attacker','yellow','duckee')
  room.players.push(q);q.x=p.x-30;q.y=p.y;q.facingX=1
  steerRace(room,p,1,0,at,false,true)
  steerRace(room,p,-1,0,at+300,false,true);attackRace(room,q,at+310)
  expect(p.stunnedUntil).toBe(at+1810);expect(q.stunnedUntil).toBe(0)
 })
 it('predicts a stationary guard immediately and permits authority correction in either facing',async()=>{
  const path='../../../../frontend/src/games/duck-race/motion'
  const {newIntent,recordIntent,predictLocal,reconcileLocal,jumpPose}=await import(path)
  const {p,at}=fixture(),intent=newIntent()
  recordIntent(intent,{at,x:-1,y:1,crouch:false,guard:true})
  const result=predictLocal({...p,rank:1},at,at+200,intent)
  expect(result).toEqual({x:p.x,y:p.y})
  expect(reconcileLocal({x:p.x-4,y:p.y+4},result,intent,.016,false).x).toBeGreaterThan(p.x-4)
  expect(jumpPose(200)).toBe('air');expect(jumpPose(800)).toBe('fall')
 })
})


