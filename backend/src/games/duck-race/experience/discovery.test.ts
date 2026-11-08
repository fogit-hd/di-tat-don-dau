import { describe, expect, it, vi, afterEach } from 'vitest'
vi.mock('node:crypto',async importOriginal=>{
 const original=await importOriginal<typeof import('node:crypto')>()
 return {...original,randomInt:vi.fn(original.randomInt)}
})
import { randomInt } from 'node:crypto'
import { createExperience,joinExperience,startExperience,tickExperience,snapshotExperience,openQuestion,submitAnswer,chooseChest } from './engine'
import { DUCK_QUESTIONS } from './questions'
import { EXPERIENCE_RULES as R } from '../experience-contracts'

const draw=vi.mocked(randomInt as (min:number,max?:number)=>number)
afterEach(()=>draw.mockReset())

function fixture(){
 draw.mockImplementation((min,max)=>max===undefined?0:min)
 const room=createExperience(1000),player=joinExperience(room,'Nhóm thử','green',1000)
 startExperience(room,1000);tickExperience(room,4000)
 return {room,player}
}
function correct(f:ReturnType<typeof fixture>,at:number){
 const question=snapshotExperience(f.room,f.player.id,at).question!
 const stored=DUCK_QUESTIONS.find(item=>question.id.startsWith(item.id+':'))!
 submitAnswer(f.room,f.player,question.id,stored.correctOptionId,at)
}

describe('visible periodic support and challenge discovery',()=>{
 it.each([1,50])('settles %i support points once at 30 seconds with a personal receipt',value=>{
  const f=fixture()
  tickExperience(f.room,33999)
  expect(f.player.points).toBe(0)
  draw.mockReturnValueOnce(value)
  tickExperience(f.room,34000)
  expect(f.player.points).toBe(value)
  expect(snapshotExperience(f.room,f.player.id,34000).experience!.notices).toMatchObject([{eventId:'periodic-grant',at:30000,delta:value}])
  const saved:typeof f.room=JSON.parse(JSON.stringify(f.room))
  tickExperience(saved,34000)
  expect(saved.players[0].points).toBe(value)
  expect(snapshotExperience(saved,saved.players[0].id,34000).experience!.notices).toHaveLength(1)
 })
 it('offers a challenge by the fourth safe chest and persists the miss counter',()=>{
  const f=fixture();let at=4000
  openQuestion(f.room,f.player,at)
  for(let index=0;index<4;index++){
   correct(f,at)
   if(index<3)draw.mockReturnValueOnce(1).mockReturnValueOnce(0)
   chooseChest(f.room,f.player,'safe',at)
   const turn=f.room.experienceState.turns[f.player.id]
   expect(turn.chest!.event.effect==='bonus-question').toBe(index===3)
   if(index<3){
    const saved:typeof f.room=JSON.parse(JSON.stringify(f.room))
    expect(saved.experienceState.turns[f.player.id].safeMisses).toBe(index+1)
   }
   at+=R.chestDoneMs+R.waitMs
   tickExperience(f.room,at)
  }
  const view=snapshotExperience(f.room,f.player.id,at)
  expect(view.experience!.quiz!.bonus).toBe(true)
  expect(view.question!.number).toBeGreaterThan(40)
  expect(view.experience!.notices!.some(n=>n.eventId==='knowledge-challenge')).toBe(true)
  correct(f,at);tickExperience(f.room,at+R.waitMs)
  expect(snapshotExperience(f.room,f.player.id,at+R.waitMs).question!.number).toBe(5)
 })
})
