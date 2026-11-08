import { describe, expect, it } from 'vitest'
import { DUCK_QUESTIONS as QUESTIONS } from './questions'
import { createExperience, joinExperience, startExperience, tickExperience, snapshotExperience, openQuestion, armHope, submitAnswer, chooseChest, chooseTarget, customizeExperience, pauseExperience, endExperience, roomEntry, changePoints } from './engine'
import { EXPERIENCE_RULES as R } from '../experience-contracts'
import { CHEST_EVENTS } from './events'
function fixture(count=1){const room=createExperience(1000);for(let i=0;i<count;i++)joinExperience(room,'Nhóm '+i,'green',1000);startExperience(room,1000);tickExperience(room,4000);return {room,p:room.players[0],at:4000}}
function answer(f:ReturnType<typeof fixture>,correct=true,at=f.at){const s=snapshotExperience(f.room,f.p.id,at);const q=QUESTIONS.find(q=>s.question?.id.startsWith(q.id+':'))!;submitAnswer(f.room,f.p,s.question!.id,correct?q.correctOptionId:q.options.find(o=>o.id!==q.correctOptionId)!.id,at)}
describe('V4 points-only rooms',()=>{
 it('uses exactly 40 unique main questions then stops instead of cycling into bonus questions',()=>{
  const f=fixture(),seen=new Set<string>();openQuestion(f.room,f.p,f.at)
  for(let i=0;i<40;i++){
   const at=f.at+i*R.wrongMs,view=snapshotExperience(f.room,f.p.id,at),id=view.question!.id.split(':')[0]
   expect([31,32,33,34,35]).not.toContain(Number(id.split('-').at(-1))); expect(seen.has(id)).toBe(false);seen.add(id)
   answer(f,false,at);tickExperience(f.room,at+R.wrongMs)
  }
  const view=snapshotExperience(f.room,f.p.id,f.at+40*R.wrongMs)
  expect(view.questionCount).toBe(40);expect(view.question).toBeUndefined();expect(view.experience!.quiz!.phase).toBe('complete')
 })
 it('opens a reserved question only through the chest challenge and resumes the main deck afterwards',()=>{
  const f=fixture();openQuestion(f.room,f.p,f.at);answer(f);chooseChest(f.room,f.p,'safe',f.at)
  f.room.experienceState.turns[f.p.id].chest!.event=CHEST_EVENTS.safe.find(e=>e.id==='knowledge-challenge')!
  const bonusAt=f.at+R.chestDoneMs+R.waitMs;tickExperience(f.room,bonusAt)
  const view=snapshotExperience(f.room,f.p.id,bonusAt)
  expect(view.experience!.quiz!.bonus).toBe(true);expect(view.question!.number).toBeGreaterThanOrEqual(41);expect(view.question!.number).toBeLessThanOrEqual(45)
  answer(f,true,bonusAt);expect(snapshotExperience(f.room,f.p.id,bonusAt).experience!.quiz!.phase).toBe('wait')
  tickExperience(f.room,bonusAt+R.waitMs)
  expect(snapshotExperience(f.room,f.p.id,bonusAt+R.waitMs).question!.number).toBe(2)
 })
 it('keeps the saved wardrobe in both host and recipient terminal snapshots',()=>{
  const room=createExperience(1000)
  for(let index=0;index<3;index++)joinExperience(room,'Nhóm '+index,'green',1000)
  const f={room,at:4000}
  for(const [index,p] of f.room.players.entries())customizeExperience(f.room,p,{color:p.color,glasses:index%2?'dark':'brass',scarf:index%2?'teal':'red'})
  startExperience(room,1000);tickExperience(room,4000)
  endExperience(f.room,'host',f.at+100)
  const host=snapshotExperience(f.room,undefined,f.at+100)
  for(const [index,p] of f.room.players.entries()){
   const expected={glasses:index%2?'dark':'brass',scarf:index%2?'teal':'red'}
   expect(host.players.find(item=>item.id===p.id)!.cosmetics).toEqual(expected)
   expect(snapshotExperience(f.room,p.id,f.at+100).me!.cosmetics).toEqual(expected)
  }
 })
 it('advances through exactly four two-minute eras and finishes at 8:00',()=>{
  const f=fixture()
  for(const [ms,era] of [[0,0],[119999,0],[120000,1],[239999,1],[240000,2],[359999,2],[360000,3],[479999,3]]){
   tickExperience(f.room,f.at+ms)
   const s=snapshotExperience(f.room,f.p.id,f.at+ms)
   expect(s.experience!.era).toBe(era);expect(s.duration).toBe(480000);expect(s.phase).toBe('racing')
  }
  tickExperience(f.room,f.at+480000)
  const s=snapshotExperience(f.room,f.p.id,f.at+480000)
  expect(s.phase).toBe('finished');expect(s.experience!.era).toBe(3);expect(s.experience!.elapsed).toBe(480000)
 })
 it('creates an isolated 8-minute room without obstacles and caps entry at seven',()=>{
  const r=createExperience(1000);expect(r.duration).toBe(480000);expect(r.hazards).toEqual([])
  for(let i=0;i<7;i++)joinExperience(r,'Nhóm '+i,'green',1000)
  expect(roomEntry(r).available).toBe(false);expect(()=>joinExperience(r,'Nhóm 8','green')).toThrow('7')
  const other=createExperience();expect(()=>joinExperience(other,'Trùng tên','green')).not.toThrow()
  expect(()=>joinExperience(createExperience(),'a'.repeat(33),'green')).toThrow('32')
  // A persisted lobby from the previous release must start with the new rule.
  r.duration=720000;startExperience(r,1000)
  expect(r.duration).toBe(480000);expect(snapshotExperience(r).endsAt-r.startedAt).toBe(480000)
 })
 it('does not open or time out a question before the player presses the question button',()=>{
  const f=fixture();tickExperience(f.room,f.at+19000);expect(snapshotExperience(f.room,f.p.id).experience?.quiz?.phase).toBe('ready');expect(f.p.answered).toBe(0)
  openQuestion(f.room,f.p,f.at+19000);const s=snapshotExperience(f.room,f.p.id,f.at+19000);expect(s.question?.deadline).toBe(f.at+29000)
  expect(s.question).not.toHaveProperty('correctOptionId');expect(s.players[0]).not.toHaveProperty('token');expect(s.players[0]).not.toHaveProperty('deck')
  expect(snapshotExperience(f.room).experience?.quiz).toBeUndefined()
 })
 it('awards an integer 50–150 once and preserves score ratios with no spending',()=>{
  const f=fixture(3);openQuestion(f.room,f.p,f.at);const reward=snapshotExperience(f.room,f.p.id).experience!.quiz!.reward;answer(f)
  expect(Number.isInteger(reward)).toBe(true);expect(reward).toBeGreaterThanOrEqual(50);expect(reward).toBeLessThanOrEqual(150);expect(f.p.points).toBe(reward)
  expect(()=>answer(f)).toThrow();expect(f.p.points).toBe(reward)
  f.room.players.forEach((p,i)=>changePoints(f.room,p,[2000,1500,1000][i]-p.points,'fixture',0))
  const s=snapshotExperience(f.room);expect(s.players[0].x/s.players[1].x).toBeCloseTo(4/3);expect(s.players[0].x/s.players[2].x).toBe(2)
  tickExperience(f.room,f.at+1000);expect(f.room.players.map(p=>p.points)).toEqual([2000,1500,1000])
 })
 it('locks wrong answers for ten seconds, then exposes only one fresh timed question',()=>{
  const f=fixture();openQuestion(f.room,f.p,f.at);const first=snapshotExperience(f.room,f.p.id).question!.id;answer(f,false)
  expect(snapshotExperience(f.room,f.p.id).question).toBeUndefined();expect(()=>openQuestion(f.room,f.p,f.at+9999)).toThrow()
  tickExperience(f.room,f.at+10000);const second=snapshotExperience(f.room,f.p.id,f.at+10000);expect(second.question!.id).not.toBe(first);expect(second.question!.deadline).toBe(f.at+20000)
  expect(()=>submitAnswer(f.room,f.p,first,'a',f.at+10001)).toThrow('đã đổi')
 })
 it('arms a single star before the next question, doubles its reward, and never charges a stake',()=>{
  const f=fixture();armHope(f.room,f.p,f.at);expect(f.p.points).toBe(0);openQuestion(f.room,f.p,f.at);const reward=snapshotExperience(f.room,f.p.id).experience!.quiz!.reward
  expect(()=>armHope(f.room,f.p,f.at)).toThrow();answer(f);expect(f.p.points).toBe(reward*2);expect(f.p.starUsed).toBe(true);expect(f.p.starArmed).toBe(false)
 })
 it('deducts the prospective reward on a star failure, floors points and emits the actual recoil',()=>{
  const f=fixture();changePoints(f.room,f.p,25,'fixture',0);armHope(f.room,f.p,f.at);openQuestion(f.room,f.p,f.at);answer(f,false)
  expect(f.p.points).toBe(0);const event=snapshotExperience(f.room,f.p.id).me!.scoreEvents!.at(-1)!;expect(event.delta).toBe(-25);expect(event.before-event.after).toBe(25)
 })
 it('allows an unused star during wrong lock and applies it to the next question',()=>{
  const f=fixture();openQuestion(f.room,f.p,f.at);answer(f,false);armHope(f.room,f.p,f.at+1);tickExperience(f.room,f.at+10000);expect(f.p.starArmed).toBe(true)
 })
 it('selects exactly one chest; hides its draw until reveal; starts wait only after opening',()=>{
  const f=fixture();openQuestion(f.room,f.p,f.at);answer(f);chooseChest(f.room,f.p,'safe',f.at)
  expect(()=>chooseChest(f.room,f.p,'explosive',f.at)).toThrow();expect(snapshotExperience(f.room,f.p.id).experience?.chest?.result).toBeUndefined()
  tickExperience(f.room,f.at+R.chestRevealMs);expect(snapshotExperience(f.room,f.p.id).experience?.chest?.result).toBeDefined()
  tickExperience(f.room,f.at+R.chestDoneMs);expect(snapshotExperience(f.room,f.p.id).experience?.quiz?.phase).toBe('wait')
  tickExperience(f.room,f.at+R.chestDoneMs+4999);expect(snapshotExperience(f.room,f.p.id).question).toBeUndefined()
  tickExperience(f.room,f.at+R.chestDoneMs+5000);expect(snapshotExperience(f.room,f.p.id).question).toBeDefined()
 })
 it('uses the same periodic integer reward for all, replays due boundaries once and ends at eight minutes',()=>{
  const f=fixture(7);tickExperience(f.room,f.at+60000);const points=f.p.points;expect(points).toBeGreaterThanOrEqual(2);expect(points).toBeLessThanOrEqual(100);expect(new Set(f.room.players.map(p=>p.points)).size).toBe(1)
  tickExperience(f.room,f.at+60000);expect(f.p.points).toBe(points);tickExperience(f.room,f.room.endsAt);expect(f.room.phase).toBe('finished');expect(f.room.experienceState.grantCount).toBe(16)
 })
 it('pauses question and periodic timers together without giving repeated pause rewards',()=>{
  const f=fixture();openQuestion(f.room,f.p,f.at);pauseExperience(f.room,true,f.at+1000);tickExperience(f.room,f.at+61000);expect(snapshotExperience(f.room,f.p.id).experience?.elapsed).toBe(1000)
  expect(()=>submitAnswer(f.room,f.p,'fake','a',f.at+61000)).toThrow('tạm dừng');pauseExperience(f.room,false,f.at+61000);expect(f.room.endsAt).toBe(f.at+R.durationMs+60000)
  tickExperience(f.room,f.at+70000);expect(snapshotExperience(f.room,f.p.id).experience?.quiz?.phase).toBe('wrong');expect(f.p.points).toBe(0)
 })
 it('settles a selected but unopened chest once at finish and logs it for the affected player',()=>{
  const f=fixture();openQuestion(f.room,f.p,f.at);answer(f);chooseChest(f.room,f.p,'safe',f.at);endExperience(f.room,'host',f.at+1)
  expect(snapshotExperience(f.room,f.p.id).experience?.chest?.result).toBeDefined();const points=f.p.points;endExperience(f.room,'host',f.at+2);expect(f.p.points).toBe(points)
 })
 it('validates chosen targets, bounds harmful chest effects and keeps cosmetic changes neutral',()=>{
  const f=fixture(2);expect(()=>chooseTarget(f.room,f.p,'fake',f.at)).toThrow();expect(()=>customizeExperience(f.room,f.p,{color:'green',glasses:'brass',scarf:'red'})).toThrow('sảnh')
  const r=createExperience(),p=joinExperience(r,'Khăn đẹp','green');customizeExperience(r,p,{color:'blue',glasses:'dark',scarf:'teal'});expect(p.points).toBe(0);expect(snapshotExperience(r,p.id).me?.cosmetics).toEqual({glasses:'dark',scarf:'teal'});expect(()=>customizeExperience(r,p,{color:'green',glasses:'crown'})).toThrow()
  expect(()=>chooseChest(f.room,f.p,'hack',f.at)).toThrow()
 })
 it('keeps chosen effects private, rejects unknown targets, caps losses and settles the chosen result only once',()=>{
  const f=fixture(2);openQuestion(f.room,f.p,f.at);answer(f);chooseChest(f.room,f.p,'explosive',f.at)
  const t=f.room.experienceState.turns[f.p.id];t.chest!.event=CHEST_EVENTS.explosive.find(e=>e.id==='chosen-fee')!
  const victim=f.room.players[1];changePoints(f.room,victim,10,'fixture',0)
  tickExperience(f.room,f.at+R.chestDoneMs);expect(t.phase).toBe('target');expect(snapshotExperience(f.room,f.p.id).experience?.chest?.result).toBeUndefined()
  expect(()=>chooseTarget(f.room,f.p,'unknown',f.at+R.chestDoneMs)).toThrow();expect(t.phase).toBe('target');expect(victim.points).toBe(10)
  chooseTarget(f.room,f.p,victim.id,f.at+R.chestDoneMs);expect(victim.points).toBe(8);expect(t.chest!.result!.lines[0].delta).toBe(-2)
  expect(victim.logs.some(e=>e.text.includes('Phí chỉ định'))).toBe(true);expect(()=>chooseTarget(f.room,f.p,victim.id,f.at+R.chestDoneMs)).toThrow();expect(victim.points).toBe(8)
 })
 it('consumes a protection once and does not expose private reward state to another player',()=>{
  const f=fixture(2);openQuestion(f.room,f.p,f.at);answer(f);chooseChest(f.room,f.p,'explosive',f.at)
  const t=f.room.experienceState.turns[f.p.id];t.chest!.event=CHEST_EVENTS.explosive.find(e=>e.id==='public-fee')!;f.p.shield=1;const before=f.p.points
  tickExperience(f.room,f.at+R.chestRevealMs);expect(f.p.points).toBe(before);expect(f.p.shield).toBe(0);expect(snapshotExperience(f.room,f.room.players[1].id).experience?.chest).toBeUndefined()
 })
 it('replays an expired star question before final settlement after a long server stall',()=>{
  const f=fixture();changePoints(f.room,f.p,500,'fixture',0);armHope(f.room,f.p,f.at);openQuestion(f.room,f.p,f.at)
  tickExperience(f.room,f.room.endsAt);expect(f.room.phase).toBe('finished');expect(f.p.answered).toBeGreaterThan(1)
  expect(snapshotExperience(f.room,f.p.id).me!.scoreEvents?.some(e=>e.reason.includes('chưa đúng')&&e.delta<0)).toBe(false) // bounded public history contains only the latest events
  expect(f.p.logs.some(e=>e.text.includes('Ngôi sao hi vọng · chưa đúng'))).toBe(true);expect(f.room.experienceState.grantCount).toBe(16)
 })
})

// Exercise all authored events, not just the first random draw in each chest.
describe('chest catalogue and conserved transfers',()=>{
 const total=(f:ReturnType<typeof fixture>)=>f.room.players.reduce((n,p)=>n+p.points,0)
 function eventFixture(id:string,count=3){
  const f=fixture(count);for(const p of f.room.players)changePoints(f.room,p,500,'fixture',0)
  openQuestion(f.room,f.p,f.at);answer(f)
  const found=Object.entries(CHEST_EVENTS).flatMap(([kind,list])=>list.map(event=>({kind,event}))).find(x=>x.event.id===id)!
  chooseChest(f.room,f.p,found.kind,f.at);f.room.experienceState.turns[f.p.id].chest!.event=found.event
  return f
 }
 function settle(f:ReturnType<typeof fixture>){tickExperience(f.room,f.at+R.chestDoneMs);const s=snapshotExperience(f.room,f.p.id);if(s.experience?.quiz?.phase==='target')chooseTarget(f.room,f.p,s.experience.chest!.targetIds![0],f.at+R.chestDoneMs)}
 it('has 122 valid selectable events; safe effects never subtract or transfer',()=>{
  expect(Object.values(CHEST_EVENTS).flat()).toHaveLength(122)
  for(const list of Object.values(CHEST_EVENTS)){expect(new Set(list.map(e=>e.id)).size).toBe(list.length);for(const e of list){expect(e.amount.every(Number.isInteger)).toBe(true);expect(e.amount[0]).toBeLessThanOrEqual(e.amount[1])}}
  expect(CHEST_EVENTS.safe.every(e=>e.scope==='self'&&e.amount[0]>0&&e.effect!=='transfer'&&e.effect!=='gamble')).toBe(true)
 })
 it('settles every catalogue entry with integers, nonnegative scores and unique receipt rows',()=>{
  for(const e of Object.values(CHEST_EVENTS).flat()){
   const f=eventFixture(e.id,7); // Duplicate IDs across different chest types are resolved below.
   f.room.experienceState.turns[f.p.id].chest!.event=e
   const before=total(f);settle(f)
   expect(f.room.players.every(p=>Number.isInteger(p.points)&&p.points>=0)).toBe(true)
   const lines=snapshotExperience(f.room,f.p.id).experience!.chest!.result!.lines
   expect(new Set(lines.map(l=>l.playerId)).size).toBe(lines.length)
   if(e.effect==='transfer')expect(total(f)).toBe(before)
   const after=total(f);tickExperience(f.room,f.at+R.chestDoneMs);expect(total(f)).toBe(after)
  }
 })
 it('credits exactly what the victim loses, caps at 20%, and logs both sides',()=>{
  const f=eventFixture('chosen-steal'),victim=f.room.players[1];changePoints(f.room,victim,10-victim.points,'fixture',0)
  const before=f.p.points,sum=total(f);tickExperience(f.room,f.at+R.chestDoneMs)
  const ids=snapshotExperience(f.room,f.p.id).experience!.chest!.targetIds!;expect(ids).not.toContain(f.p.id)
  expect(()=>chooseTarget(f.room,f.p,f.p.id,f.at+R.chestDoneMs)).toThrow()
  chooseTarget(f.room,f.p,victim.id,f.at+R.chestDoneMs)
  expect(victim.points).toBe(8);expect(f.p.points).toBe(before+2);expect(total(f)).toBe(sum)
  expect(victim.logs.some(l=>l.text.includes(f.p.name))).toBe(true);expect(f.p.logs.some(l=>l.text.includes(victim.name))).toBe(true)
  expect(()=>chooseTarget(f.room,f.p,victim.id,f.at+R.chestDoneMs)).toThrow()
 })
 it('consumes a shield once without paying the thief from nowhere',()=>{
  const f=eventFixture('chosen-steal'),victim=f.room.players[1];victim.shield=1;const before=f.room.players.map(p=>p.points)
  tickExperience(f.room,f.at+R.chestDoneMs);chooseTarget(f.room,f.p,victim.id,f.at+R.chestDoneMs)
  expect(f.room.players.map(p=>p.points)).toEqual(before);expect(victim.shield).toBe(0)
  expect(snapshotExperience(f.room,f.p.id).experience!.chest!.result!.lines.some(l=>l.text.includes('Bảo hộ'))).toBe(true)
 })
 it('caps a whole multi-recipient transfer and preserves total score',()=>{
  for(const id of ['crowd-collection','public-share']){const f=eventFixture(id,7),before=f.p.points,sum=total(f);settle(f);expect(total(f)).toBe(sum);expect(Math.abs(f.p.points-before)).toBeLessThanOrEqual(160);expect(Math.abs(f.p.points-before)).toBeGreaterThan(0);expect(f.room.players.every(p=>Number.isInteger(p.points)&&p.points>=0)).toBe(true)}
 })
 it('does not get stuck choosing a transfer target in a solo room, or mint points from an empty purse',()=>{
  const solo=eventFixture('chosen-steal',1),sum=total(solo);settle(solo);expect(snapshotExperience(solo.room,solo.p.id).experience!.quiz!.phase).toBe('wait');expect(total(solo)).toBe(sum)
  const f=eventFixture('chosen-steal');for(const p of f.room.players.slice(1))changePoints(f.room,p,-p.points,'fixture',0);const before=total(f);settle(f);expect(total(f)).toBe(before)
 })
 it('settles a pending chosen theft once at finish with a valid other-group fallback',()=>{
  const f=eventFixture('chosen-steal'),sum=total(f),before=f.p.points;endExperience(f.room,'host',f.at+1);expect(total(f)).toBe(sum);expect(f.p.points).toBeGreaterThan(before);const after=f.p.points;endExperience(f.room,'host',f.at+2);expect(f.p.points).toBe(after)
 })
})
