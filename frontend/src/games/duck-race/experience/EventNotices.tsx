import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ChestNotice } from '../experience-contracts'
import type { RaceSnapshot } from '../contracts'
import { elapsedTime } from './motion'
import { Glyph } from './ui'
import './event-notices.css'

/** A non-modal FIFO: a chest receipt never steals focus or blocks an answer. */
export function EventNotices({snapshot,now,reduced}:{snapshot:RaceSnapshot;now:number;reduced:boolean}){
 const seen=useRef(new Set<string>()),owner=useRef(''),pending=useRef<ChestNotice[]>([])
 const [current,setCurrent]=useState<ChestNotice|null>(null),card=useRef<HTMLElement>(null)
 const id=snapshot.me?.id||'',notices=snapshot.experience?.notices
 useEffect(()=>{
  if(owner.current!==id){owner.current=id;seen.current.clear();pending.current=[];setCurrent(null)}
  const elapsed=elapsedTime(snapshot,now)
  for(const item of notices||[]){
   if(seen.current.has(item.id))continue
   seen.current.add(item.id)
   // Reconnect recovers recent receipts, without replaying old match history.
   if(elapsed-item.at<=20000)pending.current.push(item)
  }
  if(!current&&pending.current.length)setCurrent(pending.current.shift()!)
 },[notices,id,current,snapshot,now])
 useEffect(()=>{
  if(!current)return
  const el=card.current
  const enter=!reduced?el?.animate([{opacity:.3,transform:'translateY(14px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:280,easing:'cubic-bezier(.16,1,.3,1)'}):undefined
  const timer=setTimeout(()=>{
   if(reduced||!el){setCurrent(null);return}
   const exit=el.animate([{opacity:1},{opacity:0,transform:'translateY(-8px)'}],{duration:160})
   void exit.finished.then(()=>setCurrent(null)).catch(()=>{})
  },Math.min(7500,4000+current.text.length*12))
  return()=>{clearTimeout(timer);enter?.cancel();el?.getAnimations().forEach(a=>a.cancel())}
 },[current,reduced])
 if(!current)return null
 return createPortal(<div className="q5-notice-layer"><section ref={card} className={`q5-notice ${current.delta<0?'is-loss':current.delta>0?'is-gain':''}`} role="status" aria-live="polite" aria-atomic="true">
  <button onClick={()=>setCurrent(null)} aria-label="Đóng sự kiện"><Glyph kind="close"/></button>
  <h2>{current.title}</h2><p className="q5-notice-source" title={current.actorName}>Rương của {current.actorName}</p>
  <p>{current.text}</p><strong>{current.delta>0?'+':''}{current.delta.toLocaleString('vi-VN')} điểm</strong>
 </section></div>,document.body)
}
