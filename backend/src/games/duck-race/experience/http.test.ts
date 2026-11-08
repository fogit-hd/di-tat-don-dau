import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import express from 'express'
import { createServer } from 'node:http'
import { HttpError } from '../../../shared/http-error'
vi.mock('../../../shared/auth',()=>({requireHostUser:vi.fn(async(token:string)=>{if(token!=='local-fixture')throw new HttpError(401,'Đăng nhập trước');return {id:'local',name:'Local test',email:'test@example.invalid'}}),signInGoogle:vi.fn(),revokeHostSession:vi.fn()}))
import { createDuckGame } from '../server'
import { createExperience,joinExperience,changePoints,startExperience,tickExperience,openQuestion,submitAnswer,chooseChest,chooseTarget } from './engine'
import { CHEST_EVENTS } from './events'
import { createRace } from '../engine'
import { DUCK_QUESTIONS as QUESTIONS } from './questions'

const app=express(),server=createServer(app),game=createDuckGame(server);app.use(game.app)
let base=''
async function request(path:string,body?:unknown,token?:string,host?:string){const r=await fetch(base+'/api/duck-race'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{'x-duck-token':token}:{}),...(host?{'x-host-session':host}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()}}
beforeAll(async()=>{await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${(server.address() as {port:number}).port}`})
afterAll(async()=>{game.stop();await new Promise<void>(resolve=>game.io.close(()=>server.close(()=>resolve())))})
describe('V4 public HTTP flow with test-only identity',()=>{
 it('protects room creation, checks entry and atomically caps concurrent joins at seven',async()=>{
  expect((await request('/rooms',{})).status).toBe(401)
  const created=await request('/rooms',{},undefined,'local-fixture');expect(created.status).toBe(200);const {code,token}=created.data
  const entry=await request(`/rooms/${code}/entry`);expect(entry.data).toMatchObject({available:true,capacity:7,mode:'quiz-v4'});expect(JSON.stringify(entry.data)).not.toContain(token)
  const joins=await Promise.all(Array.from({length:10},(_,i)=>request(`/rooms/${code}/join`,{name:'Nhóm '+i,color:'green',model:'duckee'})))
  expect(joins.filter(j=>j.status===200)).toHaveLength(7);expect(joins.filter(j=>j.status===409)).toHaveLength(3)
  const player=joins.find(j=>j.status===200)!.data
  expect((await request(`/rooms/${code}`)).status).toBe(403)
  expect((await request(`/rooms/${code}/action`,{type:'start'},player.token)).status).toBe(403)
  const snap=await request(`/rooms/${code}`,undefined,player.token);expect(snap.data.me.name).toMatch(/^Nhóm /);expect(JSON.stringify(snap.data)).not.toContain(token);expect(snap.data.players.every((p:object)=>!('token'in p))).toBe(true)
  expect((await request(`/rooms/${code}/action`,{type:'start'},token)).status).toBe(200);expect((await request(`/rooms/${code}/entry`)).data.available).toBe(false)
 })
 it('coalesces simultaneous browser retries, rejects name takeover, and resumes a full/started room',async()=>{
  const {code,token}= (await request('/rooms',{},undefined,'local-fixture')).data
  const joinId=crypto.randomUUID(),body={name:'CẦN THÁCH ĐẤU',color:'green',model:'duckee',joinId}
  const retries=await Promise.all(Array.from({length:5},()=>request(`/rooms/${code}/join`,body)))
  expect(retries.every(r=>r.status===200)).toBe(true);expect(new Set(retries.map(r=>r.data.id)).size).toBe(1);expect(new Set(retries.map(r=>r.data.token)).size).toBe(1)
  expect((await request(`/rooms/${code}/join`,{...body,name:'  cần   thách đấu ',joinId:crypto.randomUUID()})).status).toBe(409)
  expect((await request(`/rooms/${code}/join`,{name:body.name,color:'green',model:'duckee'})).status).toBe(409)
  for(let i=0;i<6;i++)expect((await request(`/rooms/${code}/join`,{name:'Khác '+i,color:'green',model:'duckee',joinId:crypto.randomUUID()})).status).toBe(200)
  expect((await request(`/rooms/${code}/entry`)).data.count).toBe(7)
  expect((await request(`/rooms/${code}/join`,body)).data.token).toBe(retries[0].data.token)
  await request(`/rooms/${code}/action`,{type:'start'},token)
  expect((await request(`/rooms/${code}/join`,body)).data.token).toBe(retries[0].data.token)
  const snap=await request(`/rooms/${code}`,undefined,retries[0].data.token);expect(JSON.stringify(snap.data)).not.toContain(joinId)
  const other=(await request('/rooms',{},undefined,'local-fixture')).data
  expect((await request(`/rooms/${other.code}/join`,body)).status).toBe(200)
 })
 it('keeps the legacy room engine for existing sessions',async()=>{const r=createRace();game.rooms.set(r.code,r);const entry=await request(`/rooms/${r.code}/entry`);expect(entry.data.capacity).toBe(50);expect(entry.data.mode).toBeUndefined();const snap=await request(`/rooms/${r.code}`,undefined,r.hostToken);expect(snap.status).toBe(200);expect(snap.data.mode).toBeUndefined()})
})

// Explicit opt-in loopback-only visual fixture. No fixture route/auth bypass is
// mounted in production. Open its HTML control panel through Vite's /api proxy.
if(process.env.DUCK_V4_QA==='1'){
 it('serves local browser fixtures until stopped',async()=>{
  const qa=express(),http=createServer(qa),runtime=createDuckGame(http);qa.use(express.urlencoded({extended:false}));
  const room=createExperience();room.code='DABC123';for(const [i,name] of ['Nhóm tên rất dài kiểm tra bố cục','Gió mới','Bứt phá','Nhịp cầu','Ánh dương','Bền vững'].entries()){const p=joinExperience(room,name,['green','red','blue','purple','aqua','yellow'][i]);changePoints(room,p,500-i*20,'Điểm kiểm thử',0)}
  runtime.rooms.set(room.code,room)
  qa.get('/api/duck-race/__qa',(_req,res)=>res.type('html').send(`<!doctype html><meta charset="utf-8"><title>Local V4 fixture</title><style>body{font:18px system-ui;padding:30px}a,button{display:block;padding:12px;margin:10px}</style><h1>Local fixture — no Google login test</h1><p>Phòng ${room.code}. Chỉ dữ liệu giả lập trên loopback.</p><a href="/duck-race">Landing</a><a href="/duck-race/join/${room.code}">Đặt tên nhóm thứ bảy</a><button id="player">Mở người chơi kiểm thử</button><button id="host">Mở host kiểm thử</button><form method="post" action="/api/duck-race/__qa/state"><button name="mode" value="lobby">Sảnh chờ</button><button name="mode" value="race">Đường đua</button><button name="mode" value="periodic">Tiếp sức sau 1 giây</button><button name="mode" value="chest-challenge">Rương thử thách</button><button name="mode" value="loss">Trừ 100 điểm</button><button name="mode" value="fx-lightning">Sét từ rương của Gió mới</button><button name="mode" value="fx-wind">Gió từ rương của Gió mới</button><button name="mode" value="fx-transfer">Gió mới lấy điểm của bạn</button><button name="mode" value="fx-percent">Rương thu 1–5% nhiều nhóm</button><button name="mode" value="target-lightning">Chọn mục tiêu giật điện</button><button name="mode" value="target-wind">Chọn mục tiêu gió đổi chiều</button><button name="mode" value="chest-safe">Mở rương gỗ</button><button name="mode" value="chest-single">Mở rương xích</button><button name="mode" value="chest-explosive">Mở rương đầu lâu</button>${[0,1,2,3,4,5].map(i=>`<button name="mode" value="era${i}">Thời đại ${i+1}</button>`).join('')}</form><script>const code=${JSON.stringify(room.code)};document.getElementById('player').onclick=()=>{localStorage.setItem('quiz-duck-race:v1:'+code,JSON.stringify({role:'player',token:${JSON.stringify(room.players[0].token)}}));location.href='/duck-race/play/'+code};document.getElementById('host').onclick=()=>{localStorage.setItem('quiz-duck-race:v1:'+code,JSON.stringify({role:'host',token:${JSON.stringify(room.hostToken)}}));location.href='/duck-race/host/'+code}</script>`))
  qa.post('/api/duck-race/__qa/state',(req,res)=>{const mode=req.body.mode;room.createdAt=Date.now();runtime.rooms.set(room.code,room);
   if(mode.startsWith('fx-')||mode.startsWith('chest-')||mode.startsWith('target-')){
    const now=Date.now();if(room.phase!=='racing'){room.phase='lobby';startExperience(room,now-3000);tickExperience(room,now)}
    const opener=room.players[mode.startsWith('fx-')?1:0],t=room.experienceState.turns[opener.id];t.phase='ready';t.chest=undefined
    openQuestion(room,opener,now);const view=runtime.rooms.get(room.code)!,q=QUESTIONS[opener.deck[opener.cursor%opener.deck.length]]
    submitAnswer(room,opener,`${q.id}:${t.cycle}`,q.correctOptionId,now)
    const kind=mode==='chest-challenge'?'safe':mode.startsWith('chest-')?mode.slice(6):'explosive';chooseChest(room,opener,kind,now)
    if(mode==='chest-challenge')t.chest!.event=CHEST_EVENTS.safe.find(e=>e.effect==='bonus-question')!
    if(mode.startsWith('fx-')||mode.startsWith('target-')){
     const eventId=({'target-lightning':'storm-chosen','target-wind':'gust-chosen','fx-lightning':'storm-chosen','fx-wind':'gust-chosen','fx-transfer':'chosen-steal','fx-percent':'all-percent-tax'} as Record<string,string>)[mode]
     t.chest!.event=CHEST_EVENTS.explosive.find(e=>e.id===eventId)!;t.chest!.revealAt=t.chest!.doneAt=room.experienceState.elapsed
     tickExperience(view,now);if(mode.startsWith('fx-')&&(t.phase as string)==='target')chooseTarget(room,opener,room.players[0].id,now)
    }
    res.redirect('/api/duck-race/__qa');return
   }
if(mode!=='loss'){room.experienceState.pauseAt=undefined;room.experienceState.pausedMs=0}if(mode!=='loss')for(const t of Object.values(room.experienceState.turns)){t.phase='ready';t.until=0;t.chest=undefined}if(mode==='lobby'){room.phase='lobby';room.startedAt=0;room.experienceState.elapsed=0}else if(mode==='loss')changePoints(room,room.players[0],-100,'Cú trừ điểm kiểm thử',room.experienceState.elapsed);else{room.phase='lobby';startExperience(room,Date.now()-3000-(mode==='periodic'?29000:mode.startsWith('era')?Number(mode.slice(3))*120000:0));room.experienceState.elapsed=0;room.experienceState.grantCount=mode.startsWith('era')?Number(mode.slice(3))*4:0;tickExperience(room)}res.redirect('/api/duck-race/__qa')})
  qa.get('/api/duck-race/__qa/answer',(_req,res)=>{const p=room.players[0],id=room.experienceState.turns[p.id].cycle,q=QUESTIONS[p.deck[p.cursor%p.deck.length]];res.json({id,answer:q.correctOptionId})})
  qa.use(runtime.app);await runtime.start();await new Promise<void>(resolve=>http.listen(Number(process.env.DUCK_QA_PORT||4610),'127.0.0.1',resolve));console.log('Local V4 QA at /api/duck-race/__qa');await new Promise<void>(resolve=>{const done=()=>{runtime.stop();runtime.io.close();http.close();resolve()};process.once('SIGINT',done);process.once('SIGTERM',done)})
 },86400000)
}
