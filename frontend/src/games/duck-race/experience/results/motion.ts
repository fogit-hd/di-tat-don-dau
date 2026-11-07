import type { RacerView } from '../../contracts'

export type AwardPhase='intro'|'third'|'second'|'first'|'stow'|'retrieve'|'raise'|'hold'|'wear'|'final'
export type ResultPlayer=Pick<RacerView,'id'|'name'|'color'|'points'|'rank'>
export const SHEETS={
 'bronze-climb':{frames:8,cell:96},'silver-gift':{frames:32,cell:96},
 'winner-parachute':{frames:12,cell:96},'winner-stow':{frames:10,cell:96},
 'winner-coronation':{frames:40,cell:96},'winner-crowned-idle':{frames:4,cell:96},
 'silver-cheer':{frames:6,cell:64},
} as const
export type Sheet=keyof typeof SHEETS
const clamp=(n:number,a=0,b=1)=>Math.max(a,Math.min(b,n))
export function resultPlayers(players:readonly ResultPlayer[]){
 const ids=new Set<string>()
 return [...players].filter(p=>{if(p.rank<=0||!Number.isInteger(p.rank)||ids.has(p.id))return false;ids.add(p.id);return true}).sort((a,b)=>a.rank-b.rank)
}
export function awardSchedule(players:readonly ResultPlayer[]){
 const starts:Record<number,number>={};let cursor=700
 for(const rank of [3,2,1])if(players.some(p=>p.rank===rank)){starts[rank]=cursor;cursor+=rank===3?3700:rank===2?4100:11000}
 const first=starts[1]??cursor,stow=first+2800
 return{starts,stow,stowEnd:stow+1100,retrieve:stow+1300,raise:stow+2500,hold:stow+3700,wear:stow+4300,crowned:stow+6100,total:players.length?first+11000:0}
}
export type Schedule=ReturnType<typeof awardSchedule>
export function phaseAt(time:number,s:Schedule):AwardPhase{
 if(!s.total)return'final'
 if(time<700)return'intro'
 if(s.starts[3]!==undefined&&time<(s.starts[2]??s.starts[1]??s.total))return'third'
 if(s.starts[2]!==undefined&&time<(s.starts[1]??s.total))return'second'
 if(time<s.stow)return'first'
 if(time<s.retrieve)return'stow'
 if(time<s.raise)return'retrieve'
 if(time<s.hold)return'raise'
 if(time<s.wear)return'hold'
 return time<s.crowned?'wear':'final'
}
export function awardLayout(w:number,h:number){
 const mobile=w<769,iw=Math.max(1,Math.min(w*(mobile?.98:.88),Math.max(80,h-205)*1.5)),ih=iw/1.5
 return{iw,ih,ix:(w-iw)/2,iy:mobile?Math.max(105,(h-ih)*.48):h-80-ih,scale:clamp(iw/190,mobile?2.7:3.3,5.8)}
}
export function awardPad(rank:number,l:ReturnType<typeof awardLayout>){
 const anchor=rank===1?.5:rank===2?.179:.817,pad=rank===1?.303:rank===2?.43:.49
 return{x:l.ix+l.iw*anchor,y:l.iy+l.ih*pad,labelY:l.iy+l.ih*.98+8,labelWidth:Math.max(95,l.iw*.28)}
}
export function actorPose(rank:number,time:number,s:Schedule){
 const start=s.starts[rank],duration=rank===1?2800:rank===2?2000:1600
 const age=time-start,p=clamp(age/duration),landed=age>=duration
 let key:Sheet|'idle'|'land'|'crouch'='idle',frame=0,offset=0
 if(!landed){
  key=rank===1?'winner-parachute':rank===2?'silver-gift':'bronze-climb'
  frame=rank===1?Math.floor(time/120)%12:Math.min(SHEETS[key].frames-1,Math.floor(p*SHEETS[key].frames))
  if(rank===3)offset=(1-p*p*(3-2*p))*22
 }else if(rank===1){
  if(time<s.stowEnd){key='winner-stow';frame=Math.min(9,Math.floor((time-s.stow)/1100*10))}
  else if(time<s.retrieve){key='idle';frame=0}
  else if(time<s.raise){key='winner-coronation';frame=Math.min(11,Math.floor((time-s.retrieve)/1200*12))}
  else if(time<s.hold){key='winner-coronation';frame=12+Math.min(11,Math.floor((time-s.raise)/1200*12))}
  else if(time<s.wear){key='winner-coronation';frame=23}
  else if(time<s.crowned){key='winner-coronation';frame=24+Math.min(15,Math.floor((time-s.wear)/1800*16))}
  else{key='winner-crowned-idle';frame=Math.floor(time/220)%4}
 }else{
  const since=age-duration
  if(rank===3&&since<150){key='land';frame=since<70?0:1}
  else if(rank===3&&since>=200&&since<1700){key='crouch';const u=(since-200)/1600;frame=u<.15||u>.85?0:1}
  else if(rank===2&&since>=200&&since<1600){key='silver-cheer';frame=Math.min(5,Math.floor(((since-200)%700)/700*6))}
  else{key='idle';frame=Math.floor(time/200)%4}
 }
 return{visible:start!==undefined&&age>=0,landed,p,key,frame,offset,cell:key in SHEETS?SHEETS[key as Sheet].cell:64}
}
