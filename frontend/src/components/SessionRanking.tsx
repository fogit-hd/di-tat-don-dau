import { useEffect, useRef, useState } from 'react'
import type { BoardRow, TeamRow } from '../api/types'
import { money, vnd } from '../lib/format'
import { CeoAvatar, CeoName } from './CeoAvatar'
import { ArtText as T } from './ArtText'

export function SessionRanking({rows,teams=[],meId,onSelect,live=false,ceremony=false}:{rows:BoardRow[];teams?:TeamRow[];meId?:string;onSelect?:(id:string)=>void;live?:boolean;ceremony?:boolean}){
 const [detail,setDetail]=useState<BoardRow|null>(null)
 const [revealing,setRevealing]=useState(ceremony)
 useEffect(()=>{if(!ceremony)return;const timer=setTimeout(()=>setRevealing(false),4200);return()=>clearTimeout(timer)},[ceremony])
 function choose(row:BoardRow){if(onSelect)onSelect(row.teamId);else setDetail(row)}
 const top=rows.slice(0,3),rest=rows.slice(3)
 return <div className={`session-ranking${ceremony?' awards-reveal':''}`} aria-busy={revealing} inert={revealing}>
  {top.length>0&&<section className="session-podium" aria-label="Top 3 CEO">
   {[top[1],top[0],top[2]].map((row,index)=>row?<article className={`podium-slot place-${row.rank}${row.teamId===meId?' is-me':''}`} key={row.teamId} data-rank={row.rank}>
    <button type="button" aria-label={`Hạng ${row.rank}, CEO ${row.teamName}, ${vnd(row.value)}. Xem chi tiết`} onClick={()=>choose(row)}>
     <div className="podium-character"><CeoAvatar avatar={row.avatar} portrait/><img className="podium-medal" src={`/assets/session-v1/medal-${row.rank}.webp`} alt="" draggable={false}/></div>
     <div className="podium-plinth"><span className="podium-rank"><T text={`Hạng ${row.rank}`} bold/></span><CeoName name={row.teamName}/><b className="podium-value"><T text={money(row.value)} bold/></b>{live?<small><T text={`Năm ${teams.find(t=>t.id===row.teamId)?.cycles??0}`}/></small>:<small><T text="VNĐ"/></small>}</div>
    </button>
   </article>:<div className="podium-vacancy" key={`empty-${index}`} aria-hidden="true"/>)}
  </section>}
  {rest.length>0&&<section className="session-frame ranking-list" aria-label="Bảng xếp hạng từ hạng 4"><div className="ranking-columns" aria-hidden="true"><span>Hạng</span><span>CEO / Ngành</span><span>{live?'Giá trị':'Giá trị cuối'}</span><span>{live?'Năm':'Kết quả'}</span></div><ol start={4}>{rest.map(row=><li key={row.teamId} className={row.teamId===meId?'is-me':''} data-rank={row.rank}><button type="button" aria-label={`Hạng ${row.rank}, CEO ${row.teamName}, ${vnd(row.value)}. Xem chi tiết`} onClick={()=>choose(row)}><b className="ranking-position"><T text={String(row.rank)} bold/></b><CeoAvatar avatar={row.avatar} portrait/><span className="ranking-person"><CeoName name={row.teamName}/><small><T text={row.themeName}/></small></span><b className="ranking-value"><T text={money(row.value)} bold/></b><span className="ranking-outcome"><T text={live?'Năm '+String(teams.find(t=>t.id===row.teamId)?.cycles??0):row.endingTitle||'—'}/></span></button></li>)}</ol></section>}
  {!rows.length&&<p className="session-frame session-empty"><T text="Chưa có CEO nào."/></p>}
  {detail&&<RankingIdentity row={detail} onClose={()=>setDetail(null)}/>}
 </div>
}

function RankingIdentity({row,onClose}:{row:BoardRow;onClose:()=>void}){
 const close=useRef<HTMLButtonElement>(null)
 useEffect(()=>{const prev=document.activeElement;close.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();onClose()}else if(e.key==='Tab'){e.preventDefault();close.current?.focus()}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);if(prev instanceof HTMLElement)prev.focus()}},[onClose])
 return <div className="session-identity-backdrop" onClick={onClose}><section className="session-frame ranking-identity" role="dialog" aria-modal="true" aria-label={`CEO ${row.teamName}`} onClick={e=>e.stopPropagation()}><CeoAvatar avatar={row.avatar} portrait/><h2><CeoName name={row.teamName} full/></h2><p><T text={row.themeName}/></p><p><T text={`Hạng ${row.rank} · ${vnd(row.value)}`} bold/></p>{row.endingTitle&&<p><T text={row.endingTitle}/></p>}<button type="button" ref={close} className="session-button secondary" onClick={onClose}><T text="Đóng"/></button></section></div>
}

