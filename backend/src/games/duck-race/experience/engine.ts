import { randomBytes, randomInt, randomUUID } from 'node:crypto'
import { QUESTIONS } from '../../../shared/questions/bank'
import { DUCK_COLORS, type DuckColor, type RaceSnapshot, type RaceLog } from '../contracts'
import { RaceError, joinRace as legacyJoin, type RaceRoom, type Racer } from '../engine'
import { EXPERIENCE_RULES as R, type QuizPhase, type ChestKind, type Cosmetics, type ScoreEvent, type ChestResult, type RoomEntry } from '../experience-contracts'
import { CHEST_EVENTS, type ChestEvent } from './events'

type Turn = { phase: QuizPhase; until: number; reward: number; cycle: number; cosmetics: Cosmetics; nextBonus: number; seq: number; events: ScoreEvent[]; chest?: {kind:ChestKind;chosenAt:number;revealAt:number;doneAt:number;event:ChestEvent;applied:boolean;result?:ChestResult} }
type State = { turns:Record<string,Turn>; pauseAt?:number; pausedMs:number; elapsed:number; grantCount:number; grant?:{at:number;value:number} }
export type ExperienceRoom = RaceRoom & { mode:'quiz-v4'; experienceState:State }
const bank=QUESTIONS.filter(q=>q.options.length===4)
export function isExperience(room:RaceRoom):room is ExperienceRoom{return (room as ExperienceRoom).mode==='quiz-v4'}
const state=(room:RaceRoom)=>{if(!isExperience(room))throw new RaceError('Phòng không dùng luật hiện tại.');return room.experienceState}
const turn=(room:RaceRoom,p:Racer)=>state(room).turns[p.id]
const elapsedAt=(room:RaceRoom,now:number)=>Math.min(R.durationMs,Math.max(0,(state(room).pauseAt??now)-room.startedAt-state(room).pausedMs))
function log(room:RaceRoom,p:Racer|null,text:string,at:number,kind:RaceLog['kind']='system'){
 const entry={id:randomUUID(),at,text,kind};room.logs.unshift(entry);room.logs.length=Math.min(200,room.logs.length)
 if(p){p.logs.unshift(entry);p.logs.length=Math.min(300,p.logs.length)}
}
export function createExperience(now=Date.now()):ExperienceRoom{
 return {code:'D'+randomBytes(3).toString('hex').toUpperCase(),hostToken:randomBytes(24).toString('hex'),phase:'lobby',createdAt:now,startedAt:0,endsAt:0,duration:R.durationMs,lastTick:now,lastSpawn:now,players:[],hazards:[],logs:[],storage:'memory',mode:'quiz-v4',experienceState:{turns:{},pausedMs:0,elapsed:0,grantCount:0}}
}
export function roomEntry(room:RaceRoom):RoomEntry{
 const capacity=isExperience(room)?R.capacity:50,count=room.players.length
 const available=room.phase==='lobby'&&count<capacity
 return {code:room.code,phase:room.phase,count,capacity,available,mode:isExperience(room)?'quiz-v4':undefined,message:available?'Phòng đang nhận người chơi.':room.phase==='finished'?'Phòng đã kết thúc.':room.phase!=='lobby'?'Phòng đã bắt đầu.':`Phòng đã đủ ${capacity} nhóm.`}
}
export function joinExperience(room:RaceRoom,name:string,color:string,now=Date.now()){
 const entry=roomEntry(room);if(!entry.available)throw new RaceError(entry.message,409)
 const p=legacyJoin(room,name,color,'duckee',now)
 p.x=p.y=p.progress=p.target=0;p.gearHead=p.gearBody=undefined
 state(room).turns[p.id]={phase:'ready',until:0,reward:0,cycle:0,cosmetics:{glasses:'',scarf:''},nextBonus:0,seq:0,events:[]}
 return p
}
export function startExperience(room:RaceRoom,now=Date.now()){
 if(room.phase!=='lobby')throw new RaceError('Phòng không còn ở sảnh chờ.')
 if(!room.players.length)throw new RaceError('Cần ít nhất một nhóm.')
 room.phase='countdown';room.startedAt=now+3000;room.endsAt=room.startedAt+R.durationMs;room.lastTick=now
}
function active(room:RaceRoom,now:number){tickExperience(room,now);if(room.phase!=='racing')throw new RaceError('Trận chưa bắt đầu hoặc đã kết thúc.');if(state(room).pauseAt!==undefined)throw new RaceError('Chủ phòng đang tạm dừng trận.')}
export function rankExperience(room:RaceRoom){return [...room.players].sort((a,b)=>b.points-a.points||b.correct-a.correct||a.id.localeCompare(b.id))}
/** Every point mutation passes here. Presentation never awards a point. */
export function changePoints(room:RaceRoom,p:Racer,delta:number,reason:string,at:number,protectedEffect=false){
 const s=turn(room,p);delta=Math.trunc(delta)
 if(delta<0&&protectedEffect&&p.shield){p.shield--;delta=0;reason+=' · bảo hộ đã chặn'}
 const before=p.points;p.points=Math.max(0,p.points+delta);const actual=p.points-before
 p.x=p.points*R.pixelsPerPoint;p.progress=p.target=p.points
 s.events.push({seq:++s.seq,at,before,after:p.points,delta:actual,reason});s.events=s.events.slice(-32)
 log(room,p,`${reason}: ${actual>0?'+':''}${actual} điểm.`,room.startedAt+state(room).pausedMs+at,'card')
 return actual
}
function currentQuestion(p:Racer){return bank[p.deck[p.cursor%p.deck.length]]}
function open(room:RaceRoom,p:Racer,at:number){const s=turn(room,p);s.phase='question';s.until=at+R.questionMs;s.reward=randomInt(50,151);s.cycle++;s.chest=undefined;p.questionAt=at;p.answer=undefined}
export function openQuestion(room:RaceRoom,p:Racer,now=Date.now()){
 active(room,now);if(turn(room,p).phase!=='ready')throw new RaceError('Câu hỏi chưa sẵn sàng.');open(room,p,state(room).elapsed)
}
export function armHope(room:RaceRoom,p:Racer,now=Date.now()){
 active(room,now);if(!['ready','wait','wrong'].includes(turn(room,p).phase)||p.starUsed||p.starArmed)throw new RaceError('Ngôi sao dùng một lần, trước câu hỏi kế tiếp.')
 p.starArmed=p.starUsed=true;log(room,p,'Đã dùng Ngôi sao hi vọng cho câu kế tiếp.',now)
}
function resolveAnswer(room:RaceRoom,p:Racer,choice:string|null,at:number){
 const s=turn(room,p),q=currentQuestion(p),correct=choice===q.correctOptionId&&at<s.until,star=p.starArmed
 let reward=0
 if(correct){reward=changePoints(room,p,s.reward*(star?2:1),'Trả lời đúng'+(star?' · Ngôi sao hi vọng':''),at);if(s.nextBonus){changePoints(room,p,s.nextBonus,'Thưởng khuyến học',at);s.nextBonus=0}p.correct++;s.phase='chests';s.until=0}
 else{if(star)reward=changePoints(room,p,-s.reward,'Ngôi sao hi vọng · chưa đúng',at);s.phase='wrong';s.until=at+R.wrongMs}
 p.starArmed=false;p.answered++
 p.answer={selected:choice,correct:q.correctOptionId,explanation:q.explanation,reward,stake:star?s.reward:0,nextAt:s.until}
 log(room,p,correct?`Trả lời đúng, nhận ${reward} điểm.`:choice===null?'Hết thời gian trả lời.':'Câu trả lời chưa đúng.',room.startedAt+state(room).pausedMs+at,'answer')
}
export function submitAnswer(room:RaceRoom,p:Racer,questionId:string,choice:string,now=Date.now()){
 active(room,now);const s=turn(room,p),q=currentQuestion(p)
 if(s.phase!=='question')throw new RaceError('Câu hỏi đã được chốt hoặc chưa mở.')
 if(questionId!==`${q.id}:${s.cycle}`)throw new RaceError('Câu hỏi đã đổi. Hãy xem câu hiện tại.')
 if(!q.options.some(o=>o.id===choice))throw new RaceError('Đáp án không hợp lệ.')
 resolveAnswer(room,p,choice,state(room).elapsed)
}
export function chooseChest(room:RaceRoom,p:Racer,kind:string,now=Date.now()){
 active(room,now);const s=turn(room,p)
 if(s.phase!=='chests')throw new RaceError('Bạn đã chọn rương hoặc chưa được mở rương.')
 if(!['safe','single','explosive'].includes(kind))throw new RaceError('Rương không hợp lệ.')
 const list=CHEST_EVENTS[kind as ChestKind],at=state(room).elapsed
 s.chest={kind:kind as ChestKind,chosenAt:at,revealAt:at+R.chestRevealMs,doneAt:at+R.chestDoneMs,event:list[randomInt(list.length)],applied:false};s.phase='opening'
}
function candidates(room:RaceRoom,p:Racer,e:ChestEvent){return e.effect==='transfer'?room.players.filter(q=>q.id!==p.id):room.players}
function needsTarget(room:RaceRoom,p:Racer,e:ChestEvent){return e.scope==='one-chosen'&&candidates(room,p,e).length>0}
function targets(room:RaceRoom,p:Racer,e:ChestEvent,targetId?:string){
 const all=candidates(room,p,e)
 if(!all.length)return []
 if(e.scope==='self')return [p]
 if(e.scope==='all')return [...all]
 if(e.scope==='one-chosen'){const found=all.find(x=>x.id===targetId);if(!found)throw new RaceError('Chọn một nhóm còn trong phòng.');return [found]}
 if(e.scope==='leader')return rankExperience(room).filter(q=>all.includes(q)).slice(0,1)
 if(e.scope==='last')return rankExperience(room).filter(q=>all.includes(q)).slice(-1)
 const shuffled=[...all];for(let i=shuffled.length-1;i>0;i--){const j=randomInt(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}
 return shuffled.slice(0,e.scope==='one-random'?1:Math.min(all.length,randomInt(2,4)))
}
function applyChest(room:RaceRoom,p:Racer,at:number,targetId?:string){
 const s=turn(room,p),chest=s.chest;if(!chest||chest.applied)return
 const event=chest.event,affected=targets(room,p,event,targetId),draw=randomInt(event.amount[0],event.amount[1]+1)
 const amount=event.effect==='gamble'?(randomInt(2)?draw:-draw):draw
 const result:ChestResult={id:randomUUID(),title:event.title,at,lines:[]}
 if(event.effect==='transfer'){
  // A transfer is an atomic debit + the exact actual credit. Never mint points
  // from an empty/protected purse, and cap both each debit and the whole event.
  let budget=amount<0?Math.min(160,Math.floor(p.points*.2)):160
  const share=event.scope==='all'&&affected.length?Math.floor(budget/affected.length):Infinity
  const receipts=new Map<string,{player:Racer;delta:number;notes:string[]}>()
  const receipt=(q:Racer,delta:number,note:string)=>{const r=receipts.get(q.id)||{player:q,delta:0,notes:[]};r.delta+=delta;r.notes.push(note);receipts.set(q.id,r)}
  for(const q of affected){
   const donor=amount>0?q:p,receiver=amount>0?p:q
   const wanted=Math.min(Math.abs(amount),80,Math.floor(donor.points*.2),budget,share)
   if(!wanted){receipt(q,0,amount>0?'Không có điểm có thể chuyển':'Quỹ chia sẻ đã hết');continue}
   const shield=donor.shield,paid=-changePoints(room,donor,-wanted,`${event.title} · chuyển cho ${receiver.name}`,at,amount>0)
   if(!paid){const text=donor.shield<shield?'Bảo hộ đã chặn lấy điểm':'Không có điểm có thể chuyển';receipt(donor,0,text);receipt(receiver,0,text);continue}
   changePoints(room,receiver,paid,`${event.title} · nhận từ ${donor.name}`,at)
   budget-=paid;receipt(donor,-paid,`Chuyển ${paid} điểm cho ${receiver.name}`);receipt(receiver,paid,`Nhận ${paid} điểm từ ${donor.name}`)
  }
  if(!receipts.size){receipt(p,0,'Chưa có nhóm khác để chuyển điểm');log(room,p,event.title+' · chưa có nhóm khác để chuyển điểm.',room.startedAt+state(room).pausedMs+at,'card')}
  result.lines=[...receipts.values()].map(r=>({playerId:r.player.id,name:r.player.name,delta:r.delta,text:r.notes.join(' · ')}))
  if(!receipts.has(p.id))log(room,p,event.title+' · '+result.lines.map(l=>l.name+': '+l.text).join('; '),room.startedAt+state(room).pausedMs+at,'card')
  chest.result=result;chest.applied=true
  return
 }
 for(const q of affected){let delta=0,text=''
  if(event.effect==='shield'){const before=q.shield;q.shield=Math.min(3,q.shield+1);text=q.shield>before?'Bảo hộ thêm 1 lần':'Đã có tối đa 3 lần bảo hộ'}
  else if(event.effect==='next-bonus'){const t=turn(room,q),before=t.nextBonus;t.nextBonus=Math.min(150,t.nextBonus+amount);text=t.nextBonus>before?`Câu đúng kế tiếp thêm ${t.nextBonus-before} điểm`:'Thưởng câu kế tiếp đã đạt tối đa 150 điểm'}
  else{const bounded=amount<0?-Math.min(80,Math.abs(amount),Math.floor(q.points*.2)):amount,beforeShield=q.shield;delta=changePoints(room,q,bounded,event.title,at,true);text=q.shield<beforeShield?'Bảo hộ đã chặn':`${delta>0?'+':''}${delta} điểm`}
  result.lines.push({playerId:q.id,name:q.name,delta,text});if(!delta)log(room,q,event.title+' · '+text,room.startedAt+state(room).pausedMs+at,'card')
 }
 chest.result=result;chest.applied=true
 // The opener also receives a receipt when the effect benefits/penalizes someone else.
 if(!affected.includes(p))log(room,p,event.title+' · '+result.lines.map(l=>l.name+': '+l.text).join('; '),room.startedAt+state(room).pausedMs+at,'card')
}
export function chooseTarget(room:RaceRoom,p:Racer,targetId:string,now=Date.now()){
 active(room,now);const s=turn(room,p);if(s.phase!=='target'||!s.chest||!needsTarget(room,p,s.chest.event))throw new RaceError('Không có mục tiêu cần chọn.')
 applyChest(room,p,state(room).elapsed,targetId);s.phase='wait';s.until=state(room).elapsed+R.waitMs
}
export function customizeExperience(room:RaceRoom,p:Racer,data:{color?:string;glasses?:string;scarf?:string}){
 if(room.phase!=='lobby')throw new RaceError('Chỉ đổi diện mạo trong sảnh chờ.')
 if(!DUCK_COLORS.includes(data.color as DuckColor)||!['','brass','dark'].includes(data.glasses??'')||!['','red','teal'].includes(data.scarf??''))throw new RaceError('Diện mạo không hợp lệ.')
 p.color=data.color as DuckColor;p.model='duckee';p.gearHead=p.gearBody=undefined
 turn(room,p).cosmetics={glasses:(data.glasses??'') as Cosmetics['glasses'],scarf:(data.scarf??'') as Cosmetics['scarf']}
}
export function pauseExperience(room:RaceRoom,pause:boolean,now=Date.now()){
 tickExperience(room,now);if(room.phase!=='racing')throw new RaceError('Chỉ tạm dừng khi trận đang diễn ra.')
 const s=state(room)
 if(pause&&s.pauseAt===undefined)s.pauseAt=now
 else if(!pause&&s.pauseAt!==undefined){const duration=Math.max(0,now-s.pauseAt);s.pausedMs+=duration;room.endsAt+=duration;s.pauseAt=undefined}
}
export function endExperience(room:RaceRoom,reason:'time'|'host',now=Date.now()){
 if(room.phase==='finished')return
 const s=state(room)
 for(const p of room.players){const t=turn(room,p);if(t.chest&&!t.chest.applied)applyChest(room,p,s.elapsed,t.chest.event.scope==='one-chosen'?candidates(room,p,t.chest.event).find(q=>q.id===p.id)?.id||candidates(room,p,t.chest.event)[0]?.id:undefined)}
 room.phase='finished';room.finishReason=reason;room.winnerId=rankExperience(room)[0]?.id
 log(room,null,reason==='time'?'Hết 12 phút. Đã chốt điểm và phần thưởng còn chờ.':'Chủ phòng đã kết thúc trận. Đã chốt điểm.',now)
}
export function tickExperience(room:RaceRoom,now=Date.now()){
 if(!isExperience(room))return
 if(room.phase==='countdown'&&now>=room.startedAt)room.phase='racing'
 if(room.phase!=='racing')return
 const s=state(room);if(s.pauseAt!==undefined)return
 const at=Math.max(s.elapsed,elapsedAt(room,now));room.lastTick=now
 // Replay due boundaries in game-time order, including after a process stall/reconnect.
 // A late server tick must not extend a deadline or skip a star penalty at match end.
 let guard=0
 while(guard++<1500){
  let due=(s.grantCount+1)*R.grantMs
  for(const p of room.players){const t=turn(room,p)
   if(['question','wait','wrong'].includes(t.phase))due=Math.min(due,t.until)
   if(t.phase==='opening'&&t.chest)due=Math.min(due,!needsTarget(room,p,t.chest.event)&&!t.chest.applied?t.chest.revealAt:t.chest.doneAt)
  }
  if(due>at||due>R.durationMs)break
  s.elapsed=due
  if((s.grantCount+1)*R.grantMs===due){const value=randomInt(10,51);s.grantCount++;for(const p of room.players)changePoints(room,p,value,'Tiếp sức định kỳ',due);s.grant={at:due,value}}
  for(const p of room.players){const t=turn(room,p)
   if(t.phase==='question'&&due>=t.until)resolveAnswer(room,p,null,t.until)
   else if((t.phase==='wait'||t.phase==='wrong')&&due>=t.until){p.cursor++;open(room,p,due)}
   else if(t.phase==='opening'&&t.chest){
    if(due>=t.chest.revealAt&&!t.chest.applied&&!needsTarget(room,p,t.chest.event))applyChest(room,p,due)
    if(due>=t.chest.doneAt){if(needsTarget(room,p,t.chest.event)&&!t.chest.applied)t.phase='target';else{t.phase='wait';t.until=due+R.waitMs}}
   }
  }
 }
 s.elapsed=at
 if(at>=R.durationMs)endExperience(room,'time',now)
}
export function snapshotExperience(room:RaceRoom,playerId?:string,now=Date.now()):RaceSnapshot{
 const s=state(room),p=room.players.find(p=>p.id===playerId),t=p&&turn(room,p),q=p&&currentQuestion(p)
 const players=rankExperience(room).map((p,i)=>{const t=turn(room,p);return {id:p.id,name:p.name,color:p.color,model:'duckee' as const,points:p.points,progress:p.points,target:p.points,x:p.points*R.pixelsPerPoint,y:room.players.indexOf(p),lateral:0,facingX:1,facingY:0,rank:i+1,connected:p.connected,correct:p.correct,answered:p.answered,stunnedUntil:0,shield:p.shield,discount:0,tailwind:0,speed:room.phase==='racing'&&s.pauseAt===undefined?R.cruiseSpeed:0,rolling:false,rollReadyAt:0,jumpUntil:0,crouching:false,attackingUntil:0,invulnerableUntil:0,cosmetics:t.cosmetics,scoreEvents:t.events.slice(-12)}})
 const chest=t?.chest
 return {mode:'quiz-v4',code:room.code,phase:room.phase,serverTime:now,revision:room.revision||0,startedAt:room.startedAt,endsAt:room.endsAt,duration:room.duration,players,hazards:[],me:players.find(p=>p.id===playerId),
  question:p&&t?.phase==='question'&&q&&room.phase==='racing'?{id:`${q.id}:${t.cycle}`,prompt:q.prompt,options:q.options,deadline:now+Math.max(0,t.until-s.elapsed),number:p.answered+1}:undefined,
  answer:p?.answer,starArmed:p?.starArmed,starUsed:p?.starUsed,logs:(p?p.logs:room.logs).slice(0,room.phase==='finished'?300:12),questionCount:bank.length,winnerId:room.winnerId,finishReason:room.finishReason,storage:room.storage,
  experience:{elapsed:s.elapsed,paused:s.pauseAt!==undefined,era:Math.min(5,Math.floor(s.elapsed/R.eraMs)),capacity:R.capacity,grant:s.grant,quiz:t?{phase:t.phase,until:t.until,reward:t.phase==='question'||t.phase==='chests'||t.phase==='opening'||t.phase==='target'?t.reward:0,number:p!.answered+(t.phase==='question'?1:0)}:undefined,
   chest:chest?{kind:chest.kind,chosenAt:chest.chosenAt,revealAt:chest.revealAt,doneAt:chest.doneAt,result:chest.applied?chest.result:undefined,targetIds:t?.phase==='target'&&p?candidates(room,p,chest.event).map(q=>q.id):undefined}:undefined,nextBonus:t?.nextBonus}}
}
