import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ChestNotice } from '../experience-contracts'
import type { RaceSnapshot } from '../contracts'
import { elapsedTime } from './motion'
import './event-notices.css'

type VisibleNotice = ChestNotice & { appearedAt: number }
const NOTICE_MS = 3000

function NoticeLine({notice,index,reduced}:{notice:VisibleNotice;index:number;reduced:boolean}) {
 const element=useRef<HTMLDivElement>(null)
 const previousTop=useRef<number|null>(null)
 useLayoutEffect(()=>{
  const row=element.current
  if(!row)return
  const top=row.getBoundingClientRect().top,wasVisible=previousTop.current!==null
  const offset=wasVisible?previousTop.current!-top:-16
  previousTop.current=top
  if(reduced)return
  const motion=row.animate([{opacity:wasVisible?1:.2,transform:`translateY(${offset}px)`},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.16,1,.3,1)'})
  return()=>motion?.cancel()
 },[index,reduced])
 useEffect(()=>{
  const timer=setTimeout(()=>{
   element.current?.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:reduced?'translateX(0)':'translateX(24px)'}],{duration:200,fill:'forwards'})
  },Math.max(0,notice.appearedAt+NOTICE_MS-200-performance.now()))
  return()=>clearTimeout(timer)
 },[notice.appearedAt,reduced])
 const kind=notice.eventId==='knowledge-challenge'?'challenge':notice.fx|| (notice.delta<0?'loss':notice.delta>0?'gain':'shield')
 return <div ref={element} className="q6-notice-line" role="status">
  <img src={`/assets/duck-race/experience-v6/icons/${kind}.svg`} alt=""/>
  <div><p>{notice.text}</p><small>{notice.title} · {notice.actorName}</small></div>
  {notice.delta!==0&&<strong><img src={`/assets/duck-race/experience-v6/icons/${notice.delta<0?'loss':'gain'}.svg`} alt={notice.delta<0?'Mất':'Nhận'}/>{Math.abs(notice.delta).toLocaleString('vi-VN')}</strong>}
 </div>
}

/** Each recipient receipt has its own three-second lifetime; newer rows push older rows down. */
export function EventNotices({snapshot,now,reduced}:{snapshot:RaceSnapshot;now:number;reduced:boolean}){
 const seen=useRef(new Set<string>()),owner=useRef('')
 const [items,setItems]=useState<VisibleNotice[]>([])
 const notices=snapshot.experience?.notices,id=snapshot.me?.id||''
 useEffect(()=>{
  if(owner.current!==id){owner.current=id;seen.current.clear();setItems([])}
  const elapsed=elapsedTime(snapshot,now),appearedAt=performance.now()
  const fresh=(notices||[]).filter(notice=>{
   if(seen.current.has(notice.id))return false
   seen.current.add(notice.id)
   return elapsed-notice.at<=5000
  }).map(notice=>({...notice,appearedAt})).reverse()
  if(fresh.length)setItems(previous=>[...fresh,...previous])
  if(seen.current.size>256)seen.current=new Set([...seen.current].slice(-128))
 },[notices,id,snapshot,now])
 useEffect(()=>{
  if(!items.length)return
  const timer=setTimeout(()=>setItems(previous=>previous.filter(item=>performance.now()-item.appearedAt<NOTICE_MS)),Math.max(1,Math.min(...items.map(item=>item.appearedAt+NOTICE_MS))-performance.now()))
  return()=>clearTimeout(timer)
 },[items])
 if(!items.length)return null
 return createPortal(<div className="q6-notice-layer" aria-live="polite">{items.map((notice,index)=><NoticeLine key={notice.id} notice={notice} index={index} reduced={reduced}/>)}</div>,document.body)
}
