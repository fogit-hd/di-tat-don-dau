import { describe, expect, it, vi, afterEach } from 'vitest'
vi.mock('node:crypto', async importOriginal => {
 const original=await importOriginal<typeof import('node:crypto')>()
 return {...original,randomInt:vi.fn(original.randomInt)}
})
import { randomInt } from 'node:crypto'
import { createExperience,joinExperience,startExperience,tickExperience,changePoints,openQuestion,submitAnswer,chooseChest,chooseTarget,snapshotExperience } from './engine'
import { CHEST_EVENTS, targetPrompt } from './events'
import { DUCK_QUESTIONS, MAIN_QUESTIONS, BONUS_QUESTIONS } from './questions'
import { EXPERIENCE_RULES as R } from '../experience-contracts'

const draw=vi.mocked(randomInt as (min:number,max?:number)=>number)
afterEach(()=>draw.mockClear())
function fixture(id:string){
 const room=createExperience(1000)
 for(let i=0;i<3;i++){const p=joinExperience(room,'Nhóm '+i,'green',1000);changePoints(room,p,1000,'fixture',0)}
 const p=room.players[0];startExperience(room,1000);tickExperience(room,4000);openQuestion(room,p,4000)
 const q=DUCK_QUESTIONS.find(q=>snapshotExperience(room,p.id,4000).question!.id.startsWith(q.id+':'))!
 submitAnswer(room,p,snapshotExperience(room,p.id,4000).question!.id,q.correctOptionId,4000)
 chooseChest(room,p,'explosive',4000)
 room.experienceState.turns[p.id].chest!.event=CHEST_EVENTS.explosive.find(e=>e.id===id)!
 return {room,p}
}
describe('independent recipient rewards',()=>{
 it('rolls separately inside the same range and does not repeat after restore',()=>{
  const {room,p}=fixture('storm-all'),before=room.players.map(p=>p.points)
  draw.mockReturnValueOnce(-20).mockReturnValueOnce(-30).mockReturnValueOnce(-40)
  tickExperience(room,4000+R.chestRevealMs)
  expect(room.players.map((p,i)=>p.points-before[i])).toEqual([-20,-30,-40])
  const saved=JSON.parse(JSON.stringify(room));tickExperience(saved,4000+R.chestDoneMs)
  expect(saved.players.map((p:{points:number})=>p.points)).toEqual(room.players.map(p=>p.points))
  expect(snapshotExperience(room,p.id).experience!.chest!.result!.lines).toHaveLength(3)
 })
 it('independently rolls transfers but conserves every point and retains caps',()=>{
  const {room}=fixture('crowd-collection'),before=room.players.map(p=>p.points)
  draw.mockReturnValueOnce(21).mockReturnValueOnce(24)
  tickExperience(room,4000+R.chestRevealMs)
  expect(room.players.map((p,i)=>p.points-before[i])).toEqual([45,-21,-24])
  expect(room.players.reduce((n,p)=>n+p.points,0)).toBe(before.reduce((a,b)=>a+b,0))
 })
 it.each([0,1])('chooses wind direction only after a target is selected (%i)',direction=>{
  const {room,p}=fixture('gust-chosen'),other=room.players[1],before=other.points
  const beforeView=snapshotExperience(room,p.id,4000)
  expect(beforeView.experience!.chest).not.toHaveProperty('targetPrompt')
  tickExperience(room,4000+R.chestDoneMs)
  const view=snapshotExperience(room,p.id,4000+R.chestDoneMs)
  expect(view.experience!.chest!.targetPrompt).toContain('gió xuôi cộng 30–55 điểm, gió ngược trừ 30–55 điểm')
  expect(snapshotExperience(room,other.id).experience!.chest).toBeUndefined()
  draw.mockReturnValueOnce(42).mockReturnValueOnce(direction)
  chooseTarget(room,p,other.id,4000+R.chestDoneMs)
  expect(other.points-before).toBe(direction?42:-42)
  expect(snapshotExperience(room,other.id).me!.scoreEvents!.at(-1)!.fx).toBe('wind')
 })
 it('all selectable events describe their action and bounds',()=>{
  for(const event of Object.values(CHEST_EVENTS).flat().filter(e=>e.scope==='one-chosen'))expect(targetPrompt(event)).toMatch(/^Chọn một con vịt để /)
 })
 it('keeps the 5 reserved originals out of the 40 main questions',()=>{
  expect(MAIN_QUESTIONS).toHaveLength(40);expect(BONUS_QUESTIONS).toHaveLength(5)
  expect(new Set(DUCK_QUESTIONS.map(q=>q.id)).size).toBe(45)
  expect(BONUS_QUESTIONS.map(q=>q.id)).toEqual([31,32,33,34,35].map(n=>`duck-course-${n}`))
  for(const q of DUCK_QUESTIONS){expect(q.options).toHaveLength(4);expect(q.options.some(o=>o.id===q.correctOptionId)).toBe(true);expect(q.explanation.trim()).not.toBe('')}
 })
 it('extends a saved completed 30-question deck without repeating its consumed questions',()=>{
  const {room,p}=fixture('storm-all'),turn=room.experienceState.turns[p.id]
  p.deck=Array.from({length:30},(_,i)=>i);p.cursor=30;turn.phase='complete';turn.chest=undefined
  tickExperience(room,4001)
  expect(turn.phase).toBe('ready')
  openQuestion(room,p,4001)
  const q=snapshotExperience(room,p.id,4001).question!
  expect(p.deck.slice(0,30)).toEqual(Array.from({length:30},(_,i)=>i))
  expect(MAIN_QUESTIONS.slice(30).some(extra=>q.id.startsWith(extra.id+':'))).toBe(true)
  expect(q.number).toBe(31)
 })
})
