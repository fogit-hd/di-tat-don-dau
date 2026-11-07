import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../../../shared/questions/bank'
import { createExperience,joinExperience,startExperience,tickExperience,changePoints,openQuestion,submitAnswer,chooseChest,chooseTarget,snapshotExperience } from './engine'
import { CHEST_EVENTS, type ChestEvent } from './events'
import { EXPERIENCE_RULES as R } from '../experience-contracts'

function fixture(event:ChestEvent,count=7){
 const room=createExperience(1000)
 for(let i=0;i<count;i++){const p=joinExperience(room,`Nhóm ${i+1}`,'green',1000);changePoints(room,p,500,'fixture',0)}
 startExperience(room,1000);tickExperience(room,4000)
 const p=room.players[0];openQuestion(room,p,4000)
 const question=snapshotExperience(room,p.id).question!,q=QUESTIONS.find(q=>question.id.startsWith(q.id+':'))!
 submitAnswer(room,p,question.id,q.correctOptionId,4000);chooseChest(room,p,'explosive',4000)
 room.experienceState.turns[p.id].chest!.event=event
 return {room,p}
}
const notice=(f:ReturnType<typeof fixture>,i:number)=>snapshotExperience(f.room,f.room.players[i].id).experience!.notices||[]

describe('recipient-specific chest receipts and semantic FX',()=>{
 it('notifies each actual victim with actor, percentage and exact conserved amount only at reveal',()=>{
  const event=CHEST_EVENTS.explosive.find(e=>e.id==='all-percent-tax')!,f=fixture(event),before=f.room.players.map(p=>p.points)
  expect(notice(f,1)).toEqual([])
  tickExperience(f.room,4000+R.chestRevealMs)
  for(let i=1;i<7;i++){
   const [n]=notice(f,i);expect(n).toMatchObject({actorId:f.p.id,actorName:'Nhóm 1',eventId:event.id,delta:-25})
   expect(n.text).toContain('Nhóm 1 đã lấy 25 điểm của bạn');expect(n.text).toContain('5%');expect(n.text).not.toContain('Nhóm 3:')
   expect(f.room.players[i].points).toBe(before[i]-25)
  }
  expect(notice(f,0)[0].delta).toBe(150);expect(f.p.points).toBe(before[0]+150)
  expect(f.room.players.reduce((n,p)=>n+p.points,0)).toBe(before.reduce((a,b)=>a+b,0))
  expect(snapshotExperience(f.room).experience?.notices).toBeUndefined()
  tickExperience(f.room,4000+R.chestDoneMs);expect(notice(f,1)).toHaveLength(1)
 })
 it('only notifies opener and affected chosen group; a name does not leak somebody else’s private receipt',()=>{
  const event=CHEST_EVENTS.explosive.find(e=>e.id==='chosen-steal')!,f=fixture(event)
  tickExperience(f.room,4000+R.chestDoneMs);expect(notice(f,1)).toEqual([])
  chooseTarget(f.room,f.p,f.room.players[1].id,4000+R.chestDoneMs)
  expect(notice(f,0)).toHaveLength(1);expect(notice(f,1)).toHaveLength(1);expect(notice(f,2)).toEqual([])
  expect(notice(f,1)[0].delta).toBe(-notice(f,0)[0].delta)
 })
 it('reports shield blocks without a false loss, gain, or damage animation',()=>{
  const f=fixture(CHEST_EVENTS.explosive.find(e=>e.id==='storm-chosen')!)
  f.room.players[1].shield=1;tickExperience(f.room,4000+R.chestDoneMs)
  chooseTarget(f.room,f.p,f.room.players[1].id,4000+R.chestDoneMs)
  const n=notice(f,1)[0];expect(n.delta).toBe(0);expect(n.text).toContain('Bảo hộ');expect(n.fx).toBeUndefined()
  expect(snapshotExperience(f.room,f.room.players[1].id).me!.scoreEvents!.at(-1)!.fx).toBeUndefined()
 })
 it('sends sét/gió frame codes for authored weather events and never for economic transfers',()=>{
  for(const id of ['storm-all','gust-all']){
   const event=CHEST_EVENTS.explosive.find(e=>e.id===id)!,f=fixture(event)
   tickExperience(f.room,4000+R.chestRevealMs)
   for(let i=0;i<7;i++){
    expect(notice(f,i)[0].fx).toBe(event.fx)
    const e=snapshotExperience(f.room,f.room.players[i].id).me!.scoreEvents!.at(-1)!
    expect(e.fx).toBe(event.fx);expect(e.delta).toBeLessThan(0)
   }
  }
  const f=fixture(CHEST_EVENTS.explosive.find(e=>e.id==='crowd-collection')!);tickExperience(f.room,4000+R.chestRevealMs)
  expect(notice(f,1)[0].fx).toBeUndefined()
 })
 it('sends gifts, next-question bonuses and protection to the affected recipient too',()=>{
  for(const id of ['chosen-percent-gift','chosen-coach','chosen-shield']){
   const f=fixture(CHEST_EVENTS.explosive.find(e=>e.id===id)!);tickExperience(f.room,4000+R.chestDoneMs)
   chooseTarget(f.room,f.p,f.room.players[2].id,4000+R.chestDoneMs)
   expect(notice(f,2)[0].actorName).toBe('Nhóm 1');expect(notice(f,2)[0].text).toMatch(/bạn/);expect(notice(f,1)).toEqual([])
  }
 })
 it('survives JSON room persistence without repeating settled notices',()=>{
  const f=fixture(CHEST_EVENTS.explosive.find(e=>e.id==='all-percent-tax')!);tickExperience(f.room,4000+R.chestRevealMs)
  const room=JSON.parse(JSON.stringify(f.room));tickExperience(room,4000+R.chestDoneMs)
  expect(snapshotExperience(room,room.players[1].id).experience!.notices).toHaveLength(1)
 })
})
