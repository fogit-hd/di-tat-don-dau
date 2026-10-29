import { useLayoutEffect, useRef, useState } from 'react'
import type { BoardRow, TeamRow } from '../api/types'
import { money } from '../lib/format'
import { ArtText as T } from './ArtText'
import { CeoAvatar, CeoName } from './CeoAvatar'
import { PAGE_SIZE } from '../lib/pagination'
import { PageControls } from './PageControls'

export function AnimatedValue({value}:{value:number}) {
 const [shown,setShown]=useState(value),current=useRef(value)
 useLayoutEffect(()=>{
  const from=current.current
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden){current.current=value;const frame=requestAnimationFrame(()=>setShown(value));return()=>cancelAnimationFrame(frame)}
  let frame=0,start:number|undefined
  const tick=(now:number)=>{start??=now;const p=Math.min(1,(now-start)/300);current.current=from+(value-from)*(1-(1-p)**3);setShown(current.current);if(p<1)frame=requestAnimationFrame(tick)}
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)
 },[value])
 return <T text={money(shown)} bold/>
}

const labels:Record<string,string>={operating:'Đang điều hành',transferred:'Đã chuyển giao',deceased:'Đã chuyển kiếp',retired:'Đã nghỉ hưu',restructuring:'Chờ tái cơ cấu',bankrupt:'Đã phá sản',centennial:'Doanh nghiệp trăm năm',finished:'Đã chốt kết quả',joining:'Đang vào game'}
function StatusIcon({status}:{status:string}){
 const paths:Record<string,string>={operating:'M4 12l5 5L20 6',transferred:'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-3a6 6 0 0 1 12 0v3M17 4a4 4 0 0 1 0 8m1 3a5 5 0 0 1 4 5v1',deceased:'M6 17v-3a8 8 0 1 1 12 0v3h-3v4H9v-4ZM8 10h1m6 0h1m-4 4v2',retired:'M5 13V8a5 5 0 0 1 10 0v5M4 13H2v6h18v-6h-3M5 19v3m12-3v3',restructuring:'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.2 2.2m8.4 8.4 2.2 2.2M5.6 18.4l2.2-2.2m8.4-8.4 2.2-2.2M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',bankrupt:'M12 4v10m0 4v1M3 3h18v18H3Z',finished:'M5 3h14v18H5ZM8 8h8m-8 4h8m-8 4h5'}
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[status]??paths.finished}/></svg>
}
export function LiveRanking({rows,teams}:{rows:BoardRow[];teams:TeamRow[]}){
 const [page,setPage]=useState(0),current=Math.min(page,Math.max(0,Math.ceil(rows.length/PAGE_SIZE)-1))
 const list=useRef<HTMLOListElement>(null),announce=useRef<HTMLParagraphElement>(null)
 const prior=useRef(new Map<string,{top:number;rank:number}>())
 const signature=rows.map(row=>`${row.teamId}:${row.rank}`).join('|')
 useLayoutEffect(()=>{
  const root=list.current,next=new Map<string,{top:number;rank:number}>(),timers:number[]=[]
  const moved:string[]=[]
  for(const node of root?.querySelectorAll<HTMLElement>('[data-ceo-id]')??[]){
   const id=node.dataset.ceoId!,rank=Number(node.dataset.rank),old=prior.current.get(id),top=node.offsetTop
   next.set(id,{top,rank})
   if(old&&old.rank!==rank){
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden
    const transform=getComputedStyle(node).transform
    const offset=transform==='none'?0:new DOMMatrixReadOnly(transform).m42
    node.getAnimations().forEach(a=>a.cancel())
    node.dataset.movement=rank<old.rank?'up':'down'
    node.animate(reduced?[{opacity:.65},{opacity:1}]:[{transform:`translateY(${old.top+offset-top}px)`},{transform:'translateY(0)'}],{duration:reduced?160:540,easing:'cubic-bezier(.22,.7,.2,1)'})
    timers.push(window.setTimeout(()=>delete node.dataset.movement,1800))
    moved.push(`${node.dataset.ceoName}: hạng ${old.rank} sang hạng ${rank}`)
   }
  }
  prior.current=next
  if(announce.current)announce.current.textContent=moved.join('. ')
  // Keep running transforms across snapshots; cancel only when this list unmounts.
  return()=>{timers.forEach(clearTimeout);for(const node of root?.querySelectorAll<HTMLElement>('[data-movement]')??[])delete node.dataset.movement}
 },[signature,current])
 return <section className="session-frame live-ranking" aria-label="Bảng xếp hạng trực tiếp">
  <h2 className="session-ribbon"><T text="Bảng xếp hạng trực tiếp" bold/></h2>
  <div className="live-ranking-head" aria-hidden="true">{['Hạng','CEO · Ngành','Giá trị','Năm','Trạng thái'].map(text=><span key={text}><T text={text} bold/></span>)}</div>
  <ol ref={list} start={current*PAGE_SIZE+1}>{rows.slice(current*PAGE_SIZE,(current+1)*PAGE_SIZE).map(row=>{const team=teams.find(t=>t.id===row.teamId),status=team?.playerStatus??row.playerStatus??(team?.finished?'finished':team?.introDone===false?'joining':'operating');return <li key={row.teamId} data-ceo-id={row.teamId} data-ceo-name={row.teamName} data-rank={row.rank}>
   <b className="live-rank"><T text={String(row.rank)} bold/></b><div className="live-person"><CeoAvatar avatar={row.avatar} portrait/><div><CeoName name={row.teamName}/><small><T text={row.themeName}/></small></div></div>
   <b className="live-value"><AnimatedValue value={row.value}/></b><span className="live-year"><T text={String(team?.cycles??0)}/></span><span className={`ceo-status status-${status}`}><StatusIcon status={status}/><T text={labels[status]??labels.finished}/></span>
  </li>})}</ol>{!rows.length&&<p className="session-empty"><T text="Chưa có CEO nào."/></p>}
  <p ref={announce} className="sr-only" aria-live="polite"/>
  <PageControls page={current} count={rows.length} onChange={next=>{prior.current.clear();setPage(next)}} label="Trang bảng xếp hạng trực tiếp"/>
 </section>
}
