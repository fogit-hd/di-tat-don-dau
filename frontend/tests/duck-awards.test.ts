import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {actorPose,awardLayout,awardPad,awardSchedule,phaseAt,resultPlayers,SHEETS,type ResultPlayer} from '../src/games/duck-race/experience/results/motion.ts'
import {bronzeMotion,BRONZE_RIDE_MS,BRONZE_STEP_MS,BRONZE_KICK_MS,BRONZE_BOARD_EXIT_MS} from '../src/games/duck-race/experience/results/bronze-motion.ts'
import {silverMotion,SILVER_SWING_MS,SILVER_RELEASE_MS} from '../src/games/duck-race/experience/results/silver-motion.ts'
const players=(count:number):ResultPlayer[]=>Array.from({length:count},(_,i)=>({id:String(i),name:'Nhóm '+i,color:'blue',rank:i+1,points:100-i}))
test('server ranks remain authoritative, with duplicates and invalid ranks excluded',()=>{
 const a=players(3);a[2].points=10000
 const ordered=resultPlayers([a[2],a[1],a[0],a[0],{...a[1],id:'bad',rank:0}])
 assert.deepEqual(ordered.map(p=>p.rank),[1,2,3]);assert.equal(ordered[0].points,100)
})
test('seven groups preserve the approved solo 3 -> 2 -> 1 timing and coronation',()=>{
 const s=awardSchedule(players(7));assert.deepEqual(s.starts,{1:9200,2:5100,3:700});assert.equal(s.total,20200)
 assert.equal(actorPose(2,3000,s).visible,false);assert.equal(actorPose(1,7000,s).visible,false)
 assert.equal(actorPose(3,1700,s).key,'bronze-skate');assert.equal(actorPose(2,5650,s).key,'silver-swing');assert.equal(actorPose(1,10500,s).key,'winner-parachute')
 assert.equal(actorPose(1,14100,s).key,'winner-coronation');assert.equal(actorPose(1,14100,s).frame,8)
 assert.equal(actorPose(1,s.total,s).key,'winner-crowned-idle');assert.equal(phaseAt(s.total,s),'final')
})
test('small rooms start at their first real finalist instead of waiting for missing ranks',()=>{
 assert.equal(awardSchedule(players(1)).starts[1],700)
 assert.deepEqual(awardSchedule(players(2)).starts,{1:4800,2:700})
 assert.equal(awardSchedule(players(0)).total,0)
 for(let n=1;n<=7;n++){const p=players(n),s=awardSchedule(p);for(const finalist of p.filter(p=>p.rank<=3))assert.ok(actorPose(finalist.rank,s.total,s).landed)}
})
test('all complete actor frames and foot anchors remain registered',()=>{
 const s=awardSchedule(players(7))
 for(let time=0;time<=s.total;time+=10)for(const rank of [1,2,3]){
  const p=actorPose(rank,time,s);assert.ok(Number.isFinite(p.p));assert.ok(p.frame>=0)
  assert.ok(p.frame<(p.key in SHEETS?SHEETS[p.key as keyof typeof SHEETS].frames:p.key==='idle'?4:2))
  if(rank===2||rank===3){assert.equal(p.offset,0);assert.equal(p.cell,128);assert.equal(p.anchorY,118)}
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
  const png=readFileSync(new URL(`${color}/${name}.png`,base));assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),spec.columns*spec.cell);assert.equal(png.readUInt32BE(20),Math.ceil(spec.frames/spec.columns)*spec.cell)
 }
 assert.notDeepEqual(readFileSync(new URL('blue/winner-coronation.png',base)),readFileSync(new URL('red/winner-coronation.png',base)))
 const c=manifest.sheets.find((s:{name:string})=>s.name==='winner-coronation')
 assert.ok(c.cels.slice(12).every((f:{compactWings:boolean;crownBase:number[];width:number;height:number})=>f.compactWings&&f.crownBase[1]>=27&&f.width===12&&f.height===6));assert.deepEqual(c.cels[39].crownBase,[31,31])
})

test('silver releases the grip after contact and stays planted while presenting its medal',()=>{
 for(const [w,h] of [[390,550],[768,730],[1440,650]]){
  const l=awardLayout(w,h),pad=awardPad(2,l),s=awardSchedule(players(7));
  for(let age=0;age<SILVER_SWING_MS;age+=10){
   const m=silverMotion(age,pad.x,pad.y,l.scale,h);
   assert.ok(m.attached);assert.ok(Math.abs(m.x-m.endX)<1e-8);assert.ok(Math.abs(m.y-24*l.scale-m.endY)<1e-8);
  }
  const land=silverMotion(SILVER_SWING_MS,pad.x,pad.y,l.scale,h);
  assert.equal(land.y,pad.y);assert.equal(land.x,pad.x);assert.ok(land.attached);
  assert.equal(actorPose(2,s.starts[2]+1499,s).landed,false);assert.equal(actorPose(2,s.starts[2]+1500,s).landed,true);
  for(let age=SILVER_RELEASE_MS;age<4100;age+=10){const m=silverMotion(age,pad.x,pad.y,l.scale,h);assert.equal(m.x,pad.x);assert.equal(m.y,pad.y)}
  assert.equal(actorPose(2,s.starts[2]+4000,s).frame,95);
 }
})

test('bronze dismounts before displaying the card and holds its complete dressed final cel',()=>{
 const s=awardSchedule(players(7)),start=s.starts[3];
 assert.equal(actorPose(3,start+BRONZE_STEP_MS-1,s).landed,false);
 assert.equal(actorPose(3,start+BRONZE_STEP_MS,s).landed,true);
 for(const age of [0,100,1200,2000,3999]) assert.equal(actorPose(3,start+age,s).alpha,1);
 assert.equal(actorPose(3,start+4000,s).frame,95);assert.equal(actorPose(3,s.total,s).frame,95);
 const manifest=JSON.parse(readFileSync(new URL('../public/assets/duck-race/results-v1/manifest.json',import.meta.url),'utf8'));
 const sheet=manifest.sheets.find((sheet:{name:string})=>sheet.name==='bronze-skate');
 assert.deepEqual([...new Set(sheet.cels.map((cel:{state:string})=>cel.state))],
  ['ride-in','step-off','push-board','retrieve-card','turn-card','present-card']);
 for(const cel of sheet.cels.slice(33)) assert.deepEqual(cel.foot,[64,118]);
 for(const cel of sheet.cels.slice(67)){
  assert.deepEqual(cel.cardCentre,[64,112]);assert.ok(cel.cardFace);assert.equal(cel.numeral,'3');assert.equal(cel.numeralMirrored,false);
 }
 for(const item of ['red','teal','brass','dark']){
  const png=readFileSync(new URL(`../public/assets/duck-race/results-v1/cosmetics/${item}/bronze-skate.png`,import.meta.url));
  assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1536);
 }
})

test('bronze stays supported by its board and runway before stepping onto the cup at every viewport',()=>{
 for(const [w,h] of [[390,550],[768,730],[1440,650]]){
  const l=awardLayout(w,h),pad=awardPad(3,l),scale=l.scale;
  for(let age=0;age<BRONZE_BOARD_EXIT_MS;age+=5){
   const m=bronzeMotion(age,pad.x,pad.y,scale,w);
   const groundY=m.nearY+(m.boardX-m.nearX)*Math.tan(m.angle);
   assert.ok(Math.abs(m.boardY-groundY)<1e-8);
   if(age>=200) assert.ok(m.boardX>=m.rampX);
   if(age<21/24*1000){
    assert.ok(Math.abs(m.bodyX+12*scale-m.boardX)<1e-8);
    assert.equal(m.bodyY,m.boardY);assert.equal(m.bodyAngle,m.angle);
   }
  }
  const landed=bronzeMotion(BRONZE_STEP_MS,pad.x,pad.y,scale,w);
  assert.equal(landed.bodyX,pad.x);assert.equal(landed.bodyY,pad.y);assert.equal(landed.bodyAngle,0);
  for(const age of [BRONZE_RIDE_MS,BRONZE_KICK_MS]){
   const m=bronzeMotion(age,pad.x,pad.y,scale,w);assert.ok(Math.abs(m.boardX-m.nearX)<1e-8);
  }
  const exit=bronzeMotion(BRONZE_BOARD_EXIT_MS,pad.x,pad.y,scale,w);
  assert.ok(exit.boardX>w+32*scale);assert.ok(exit.rampVisible);
  const end=bronzeMotion(4000,pad.x,pad.y,scale,w);
  assert.equal(end.boardVisible,false);assert.equal(end.rampVisible,false);
 }
})
