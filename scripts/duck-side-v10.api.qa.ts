import assert from 'node:assert/strict'
import {writeFileSync,mkdirSync} from 'node:fs'
import {io} from 'socket.io-client'
import {QUESTIONS} from '../backend/src/shared/questions/bank'
const origin='http://127.0.0.1:4608',base=origin+'/api/duck-race'
async function api(path:string,body?:unknown,token?:string){
 const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(token?{'x-duck-token':token}:{})},body:body?JSON.stringify(body):undefined})
 const data=await r.json();assert.ok(r.ok,JSON.stringify(data));return data
}
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))
async function run(){
 const room=await api('/rooms',{}),people=[],sockets:ReturnType<typeof io>[]=[]
 try{
  for(let i=0;i<50;i++)people.push(await api(`/rooms/${room.code}/join`,{name:`Vịt kiểm thử ${i}`,color:'yellow',model:'duckee'}))
  for(const p of people){const socket=io(origin+'/duck-race',{path:'/duck-socket',auth:{code:room.code,token:p.token},transports:['websocket']});sockets.push(socket)}
  await Promise.all(sockets.map(s=>new Promise<void>((resolve,reject)=>{s.once('connect',()=>resolve());s.once('connect_error',reject)})))
  await api(`/rooms/${room.code}/action`,{type:'start'},room.token);await sleep(3300)
  const first=await api(`/rooms/${room.code}`,undefined,people[0].token);assert.equal(first.players.length,50)
  assert.ok(first.players.every((p:{x:number;y:number})=>p.x===0&&[444,500,556].includes(p.y)),'all wait at the fixed start and lane centers')
  const course=JSON.stringify(first.hazards.filter((h:{category:string})=>h.category==='obstacle'))
  const q=QUESTIONS.find(q=>q.id===first.question.id)!
  const earned=await api(`/rooms/${room.code}/action`,{type:'answer',questionId:q.id,choice:q.correctOptionId},people[0].token)
  const paid=await api(`/rooms/${room.code}/action`,{type:'buy',kind:'boost'},people[0].token)
  assert.equal(paid.me.points,earned.me.points-150)
  const startX=paid.me.x,startPoints=paid.me.points;await sleep(200)
  const idle=await api(`/rooms/${room.code}`,undefined,people[0].token);assert.equal(idle.me.x,startX)
  const held=setInterval(()=>sockets[0].emit('race:input',{x:1,y:0,crouch:false,guard:false}),80)
  sockets[0].emit('race:input',{x:1,y:0,crouch:false,guard:false});await sleep(600);clearInterval(held)
  const after=await api(`/rooms/${room.code}`,undefined,people[0].token)
  assert.ok(after.me.x-startX>150,'held forward input uses boost');assert.equal(after.me.points,startPoints)
  sockets[0].emit('race:input',{x:0,y:0,crouch:false,guard:false});await sleep(150)
  const released=await api(`/rooms/${room.code}`,undefined,people[0].token);await sleep(200)
  const still=await api(`/rooms/${room.code}`,undefined,people[0].token);assert.equal(still.me.x,released.me.x)
  sockets[0].emit('race:input',{x:0,y:1,crouch:false,guard:false});await sleep(300)
  const dodge=await api(`/rooms/${room.code}`,undefined,people[0].token);assert.ok(dodge.me.y>after.me.y)
  await sleep(500);const stale=await api(`/rooms/${room.code}`,undefined,people[0].token);await sleep(200)
  const free=await api(`/rooms/${room.code}`,undefined,people[0].token);assert.equal(free.me.y,stale.me.y);assert.equal(free.me.x,stale.me.x)
  assert.equal(JSON.stringify(free.hazards.filter((h:{category:string})=>h.category==='obstacle')),course)
  assert.ok(!('token' in free.players[0]));assert.ok(!('deck' in free.players[0]))
  const report={players:50,liveSockets:50,pointsEarned:earned.me.points,pointsAfterBoost:paid.me.points,boostDeltaX:after.me.x-startX,verticalDodge:true,noAutoWalk:true,stopsOnRelease:true,stopsOnStaleInput:true,fixedWorldObstacles:true,errors:[]}
  mkdirSync('design-preview/duck-race-v11',{recursive:true});writeFileSync('design-preview/duck-race-v11/api-verification.json',JSON.stringify(report,null,2));console.log(report)
 }finally{sockets.forEach(s=>s.disconnect());await api(`/rooms/${room.code}/action`,{type:'end'},room.token)}
}
run().catch(e=>{console.error(e);process.exitCode=1})
