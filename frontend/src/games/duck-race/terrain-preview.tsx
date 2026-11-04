/** Development-only visual test entry; excluded from the production app's routes. */
import {createRoot} from 'react-dom/client'
import {useEffect,useState} from 'react'
import {RaceTrack} from './RaceTrack'
import {TERRAIN_ZONES,terrainAt,projectToTrack,ROAD_Y} from './track'
import type {RacerView,HazardView} from './contracts'

export function Preview(){
 const [mode,setMode]=useState('water'),[time,setTime]=useState(()=>Date.now()),[epoch,setEpoch]=useState(()=>Date.now()),[jump,setJump]=useState(0),[diagnostic,setDiagnostic]=useState('Đang tải…')
 useEffect(()=>{const t=setInterval(()=>{setTime(Date.now());const c=document.querySelector<HTMLCanvasElement>('.dq-track canvas');if(c)setDiagnostic(`Trạng thái: ${c.dataset.pose} · Frame nước: ${c.dataset.waterFrame} · Hiệu ứng đang phát: ${c.dataset.vfxActive} · Nhịp quạt cánh: ${c.dataset.paddleStrokes} · Bước bùn: ${c.dataset.mudSteps}`)},50);return()=>clearInterval(t)},[])
 const zone=TERRAIN_ZONES[mode==='mud'?1:0],t=((time-epoch)%10000)/1000,width=zone.end-zone.start
 let x=zone.start-110+t*(width+220)/10,y=zone.centerY
 if(!['water','mud'].includes(mode)){x=1200+Math.sin(t/3)*80;y=500}
 const dx=1,dy=0,speed=96
 const wet=terrainAt(x,y),point=projectToTrack(x,y)
 const player:RacerView={id:'preview',name:'Vịt model gốc',model:'duckee',color:'yellow',points:150,progress:point.progress,target:point.progress,x,y,lateral:y-500,facingX:dx<-.1?-1:1,facingY:dy,speed,rolling:false,rollReadyAt:0,jumpUntil:jump?jump+1100:0,jumpStartedAt:jump,jumpDuration:1100,jumpCount:1,airSpeed:96,crouching:false,attackingUntil:0,invulnerableUntil:0,rank:1,connected:true,correct:0,answered:0,stunnedUntil:0,shield:0,discount:0,tailwind:0,mode:wet}
 const hazards:HazardView[]=['rain','wind','whirlwind'].includes(mode)?[{id:'preview-weather',kind:mode==='wind'?'tailwind':mode as 'rain'|'whirlwind',position:projectToTrack(1310,500).progress,offset:0,expiresAt:time+10000,category:'environment'}]:[]
 return <main style={{height:'100svh',display:'flex',flexDirection:'column',background:'#123b2e',color:'#fff0cb',fontFamily:'Arial,sans-serif'}}><header style={{padding:'12px 18px',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}><strong style={{marginRight:'auto'}}>Preview animation thực tế — PixiJS</strong>{[['water','Nước'],['mud','Bùn'],['rain','Mưa'],['wind','Gió'],['whirlwind','Lốc']].map(([id,label])=><button key={id} onClick={()=>{setMode(id);setEpoch(time)}} aria-pressed={mode===id} style={{padding:'10px 16px',fontSize:16}}>{label}</button>)}<button onClick={()=>setJump(time)} style={{padding:10,fontSize:16}}>Nhảy</button><button onClick={()=>setEpoch(time)} style={{padding:10,fontSize:16}}>Chạy lại</button></header><section style={{flex:1,minHeight:0}}><RaceTrack players={[player]} hazards={hazards} now={time} serverTime={time} running me="preview"/></section><output style={{padding:'10px 18px',fontSize:13}}>{diagnostic}</output><p style={{padding:'0 18px 10px',margin:0,fontSize:13}}>Bản kiểm thử hoạt ảnh: chạy ngang từ trái sang phải, vùng né giới hạn quanh Y={ROAD_Y}. Nước và hiệu ứng tiếp xúc phát từng frame đã vẽ.</p></main>
}
createRoot(document.getElementById('terrain-preview')!).render(<Preview/> )
