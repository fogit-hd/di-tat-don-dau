import { memo, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { Snapshot, TeamRow } from '../api/types'
import type { AvatarConfig } from '../lib/avatar'
import { avatarArt } from '../lib/avatar'
import { money } from '../lib/format'
import { buttonMotion, lobbyMotion, riseIn } from '../lib/lobby-motion'
import { PublicArtText as T } from './PublicArtText'
import { CeoAvatar, CeoName } from './CeoAvatar'

const subscribe=(callback:()=>void)=>{window.addEventListener('resize',callback);return()=>window.removeEventListener('resize',callback)}
const viewport=()=>`${innerWidth}:${innerHeight}`
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase()

export function LobbyFacts({room}:{room:Snapshot['room']}){
 return <dl className="lobby-facts" aria-label="Thông số phiên chơi cố định">{[
  ['Thời lượng',`${room.durationSec/60} phút`],['Vốn tham chiếu',money(room.startingCapital)],['Giây mỗi năm',`${room.cycleSeconds} giây / năm`],['Khóa nút',`${room.yearMinSeconds} giây`],
 ].map(([label,value])=><div key={label}><dt><T text={label}/></dt><dd><T text={value} bold/></dd></div>)}</dl>
}

/** Full-body images share one immutable stage; late image loads cannot replace a newer choice. */
export function LobbyAvatar({avatar}:{avatar:AvatarConfig}){
 const src=avatarArt(avatar),[displayed,setDisplayed]=useState(src),[failed,setFailed]=useState('')
 const incoming=useRef<HTMLImageElement>(null)
 useEffect(()=>{
  if(src===displayed)return
  let cancelled=false,animation:Animation|null=null
  const loader=new Image();loader.src=src
  void loader.decode().then(async()=>{
   if(cancelled)return
   if(incoming.current){incoming.current.src=src;animation=lobbyMotion(incoming.current,[{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:220,fill:'forwards'});await animation?.finished.catch(()=>{})}
   if(!cancelled){setDisplayed(src);setFailed('')}
  }).catch(()=>{if(!cancelled)setFailed(src)})
  return()=>{cancelled=true;animation?.cancel()}
 },[src,displayed])
 return <div className="lobby-avatar-stage" aria-busy={src!==displayed&&failed!==src}>
  <img src={displayed} alt="Nhân vật CEO toàn thân" draggable={false}/>
  <img ref={incoming} src={src} alt="" aria-hidden="true" draggable={false} style={{opacity:0}} key={displayed}/>
  {failed===src&&<span className="lobby-art-error" role="alert">Không tải được diện mạo. Vui lòng chọn lại.</span>}
 </div>
}

export const LobbyRoster=memo(function LobbyRoster({teams,host=false,you,total=teams.length}:{teams:TeamRow[];host?:boolean;you?:string;total?:number}){
 const size=useSyncExternalStore(subscribe,viewport,()=> '1440:900'),[width]=size.split(':').map(Number)
 const pageSize=width<600?(host?8:4):10
 const [query,setQuery]=useState(''),[page,setPage]=useState(0),[expanded,setExpanded]=useState<string|null>(null)
 const root=useRef<HTMLUListElement>(null),previous=useRef(new Map<string,{rect:DOMRect;connected:boolean;name:string}>())
 const filtered=teams.filter(t=>normalize(t.teamName).includes(normalize(query)))
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize)),current=Math.min(page,pages-1),visible=filtered.slice(current*pageSize,(current+1)*pageSize)
 const signature=visible.map(t=>`${t.id}:${t.connected}:${t.teamName}:${JSON.stringify(t.avatar)}`).join('|')
 useLayoutEffect(()=>{
  const list=root.current;if(!list)return
  const next=new Map<string,{rect:DOMRect;connected:boolean;name:string}>(),animations:(Animation|null)[]=[]
  Array.from(list.children).forEach((child,index)=>{
   if(!(child instanceof HTMLElement)||!child.dataset.ceoId)return
   const id=child.dataset.ceoId,old=previous.current.get(id),rect=child.getBoundingClientRect(),connected=child.dataset.connected==='true',name=child.dataset.name??''
   next.set(id,{rect,connected,name})
   if(!old)animations.push(riseIn(child,Math.min(index,7)*25))
   else{
    const dx=old.rect.x-rect.x,dy=old.rect.y-rect.y
    if(Math.abs(dx)>1||Math.abs(dy)>1)animations.push(lobbyMotion(child,[{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],300))
    if(old.connected!==connected)animations.push(lobbyMotion(child,[{backgroundColor:connected?'#dce8bd':'#f2d4af'},{backgroundColor:'#fff6deaa'}],650))
   }
  })
  // Exit ghosts are visual only and never enter the accessible roster or affect its grid.
  for(const [id,old]of previous.current)if(!next.has(id)&&list.getBoundingClientRect().width){
   const ghost=document.createElement('span');ghost.className='lobby-exit-ghost';ghost.setAttribute('aria-hidden','true');ghost.textContent=old.name
   const box=list.getBoundingClientRect();ghost.style.cssText=`left:${old.rect.x-box.x}px;top:${old.rect.y-box.y}px;width:${old.rect.width}px;height:${old.rect.height}px`
   list.append(ghost);const animation=lobbyMotion(ghost,[{opacity:.7,transform:'scale(1)'},{opacity:0,transform:'scale(.92)'}],180);animation?.finished.finally(()=>ghost.remove()).catch(()=>{});animations.push(animation)
  }
  previous.current=next
  return()=>{animations.forEach(a=>a?.cancel());list.querySelectorAll('.lobby-exit-ghost').forEach(n=>n.remove())}
 },[signature,current,pageSize])
 return <section className={`lobby-roster-panel session-frame${host?' host-roster-v4':''}`} aria-label="CEO trong phòng">
  <header className="lobby-roster-heading"><h2><T text={`CEO trong phòng · ${total}`} bold/></h2><input type="search" aria-label="Tìm CEO" placeholder="Tìm CEO…" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);setExpanded(null)}}/></header>
  {host&&<div className="lobby-connection-summary"><span><i/>Đã kết nối ({teams.filter(t=>t.connected).length})</span><span><i/>Mất kết nối ({teams.filter(t=>!t.connected).length})</span></div>}
  <ul ref={root} className="lobby-ceo-grid" data-page-size={pageSize}>
   {visible.map((team,index)=><li key={team.id} data-ceo-id={team.id} data-connected={team.connected} data-name={team.teamName}>
    <button type="button" className="lobby-ceo-card" aria-label={`${team.teamName}${team.id===you?' · Bạn':''} · ${team.connected?'Đã kết nối':'Mất kết nối'}`} aria-expanded={expanded===team.id} onClick={()=>setExpanded(expanded===team.id?null:team.id)} onBlur={e=>{setExpanded(null);buttonMotion(e.currentTarget,'out')}} onPointerEnter={e=>buttonMotion(e.currentTarget,'over')} onPointerLeave={e=>buttonMotion(e.currentTarget,'out')} onPointerDown={e=>buttonMotion(e.currentTarget,'down')} onPointerUp={e=>buttonMotion(e.currentTarget,'up')}>
     {host&&<small className="lobby-ceo-number">{current*pageSize+index+1}</small>}<i className={`lobby-connection-dot ${team.connected?'online':'offline'}`} aria-hidden="true"/>
     <CeoAvatar avatar={team.avatar} portrait/><CeoName name={team.teamName} publicLettering/>{team.id===you&&<small className="lobby-you">Bạn</small>}
    </button>
    <span role="tooltip" className="lobby-name-detail" data-open={expanded===team.id}>{team.teamName} · {team.connected?'Đã kết nối':'Mất kết nối'}</span>
   </li>)}
  </ul>
  {!visible.length&&<p className="lobby-empty" role="status"><T text={query?'Không tìm thấy CEO phù hợp.':you?'Chờ các CEO khác vào phòng.':'Chưa có CEO nào. Chia sẻ mã phòng để mời tham gia.'}/></p>}
  {pages>1&&<nav className="lobby-pagination" aria-label="Trang CEO"><button type="button" className="session-button secondary" aria-label="Trang CEO trước" disabled={!current} onClick={()=>{setPage(current-1);setExpanded(null)}}>‹</button><span role="status"><T text={`Trang ${current+1} / ${pages}`}/></span><button type="button" className="session-button secondary" aria-label="Trang CEO sau" disabled={current===pages-1} onClick={()=>{setPage(current+1);setExpanded(null)}}>›</button></nav>}
 </section>
})
