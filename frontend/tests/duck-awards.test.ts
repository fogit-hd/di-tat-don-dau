import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {actorPose,awardLayout,awardPad,awardSchedule,phaseAt,resultPlayers,SHEETS,type ResultPlayer} from '../src/games/duck-race/experience/results/motion.ts'
const players=(count:number):ResultPlayer[]=>Array.from({length:count},(_,i)=>({id:String(i),name:'Nhóm '+i,color:'blue',rank:i+1,points:100-i}))
test('server ranks remain authoritative, with duplicates and invalid ranks excluded',()=>{
 const a=players(3);a[2].points=10000
 const ordered=resultPlayers([a[2],a[1],a[0],a[0],{...a[1],id:'bad',rank:0}])
 assert.deepEqual(ordered.map(p=>p.rank),[1,2,3]);assert.equal(ordered[0].points,100)
})
test('seven groups preserve the approved solo 3 -> 2 -> 1 timing and coronation',()=>{
 const s=awardSchedule(players(7));assert.deepEqual(s.starts,{1:8500,2:4400,3:700});assert.equal(s.total,19500)
 assert.equal(actorPose(2,3000,s).visible,false);assert.equal(actorPose(1,7000,s).visible,false)
 assert.equal(actorPose(3,1700,s).key,'bronze-climb');assert.equal(actorPose(2,5650,s).key,'silver-gift');assert.equal(actorPose(1,10500,s).key,'winner-parachute')
 assert.equal(actorPose(1,13400,s).key,'winner-coronation');assert.equal(actorPose(1,13400,s).frame,8)
 assert.equal(actorPose(1,s.total,s).key,'winner-crowned-idle');assert.equal(phaseAt(s.total,s),'final')
})
test('small rooms start at their first real finalist instead of waiting for missing ranks',()=>{
 assert.equal(awardSchedule(players(1)).starts[1],700)
 assert.deepEqual(awardSchedule(players(2)).starts,{1:4800,2:700})
 assert.equal(awardSchedule(players(0)).total,0)
 for(let n=1;n<=7;n++){const p=players(n),s=awardSchedule(p);for(const finalist of p.filter(p=>p.rank<=3))assert.ok(actorPose(finalist.rank,s.total,s).landed)}
})
test('all actor frames are valid; silver feet stay registered through arrival and celebration',()=>{
 const s=awardSchedule(players(7))
 for(let time=0;time<=s.total;time+=10)for(const rank of [1,2,3]){
  const p=actorPose(rank,time,s);assert.ok(Number.isFinite(p.p));assert.ok(p.frame>=0)
  assert.ok(p.frame<(p.key in SHEETS?SHEETS[p.key as keyof typeof SHEETS].frames:p.key==='idle'?4:2))
  if(rank===2)assert.equal(p.offset,0)
 }
})
test('responsive pads and labels remain inside the view at phone, tablet and desktop sizes',()=>{
 for(const [w,h] of [[360,480],[390,550],[768,730],[1440,650],[1366,510]]){
  const l=awardLayout(w,h);for(const rank of [1,2,3]){const p=awardPad(rank,l);assert.ok(p.x>0&&p.x<w);assert.ok(p.y>0&&p.y<h);assert.ok(p.labelY+64<h)}
 }
})
test('every native duck colour has complete, correctly sized award sheets',()=>{
 const base=new URL('../public/assets/duck-race/results-v1/',import.meta.url)
 const manifest=JSON.parse(readFileSync(new URL('manifest.json',base),'utf8'))
 assert.equal(manifest.colors.length,8)
 for(const color of manifest.colors)for(const [name,spec] of Object.entries(SHEETS)){
  const png=readFileSync(new URL(`${color}/${name}.png`,base));assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),spec.frames*spec.cell);assert.equal(png.readUInt32BE(20),spec.cell)
 }
 assert.notDeepEqual(readFileSync(new URL('blue/winner-coronation.png',base)),readFileSync(new URL('red/winner-coronation.png',base)))
 const c=manifest.sheets.find((s:{name:string})=>s.name==='winner-coronation')
 assert.ok(c.cels.slice(12).every((f:{compactWings:boolean;crownBase:number[]})=>f.compactWings&&f.crownBase[1]>=27));assert.deepEqual(c.cels[39].crownBase,[31.5,31])
})
