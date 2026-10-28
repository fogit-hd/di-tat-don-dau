import { useEffect, useRef, useState } from 'react'
import type { Snapshot } from '../api/types'
import { PaintedArt as Art } from './ArtText'
import { PublicArtText as T } from './PublicArtText'
import { buttonMotion, riseIn } from '../lib/lobby-motion'
import { SessionShell } from './SessionUI'
import { LobbyFacts, LobbyRoster } from './LobbyParts'
import './lobby-v4.css'

export function HostLobby({snap,qr,joinUrl,busy,note,onStart}:{snap:Snapshot;qr:string;joinUrl:string;busy:boolean;note:string;onStart:()=>void}){
 const [copyStatus,setCopyStatus]=useState(''),url=useRef<HTMLInputElement>(null),root=useRef<HTMLDivElement>(null),status=useRef<HTMLParagraphElement>(null)
 useEffect(()=>{const animations=Array.from(root.current?.children??[]).map((node,i)=>riseIn(node,i*70));return()=>animations.forEach(a=>a?.cancel())},[])
 async function copy(){try{await navigator.clipboard.writeText(joinUrl);setCopyStatus('Đã sao chép liên kết')}catch{url.current?.focus();url.current?.select();setCopyStatus('Chọn và sao chép liên kết bên trên')}riseIn(status.current)}
 return <SessionShell publicLettering title="Phòng chờ" subtitle={snap.room.hostName} className="session-lobby lobby-v4 lobby-host-v4" action={<span className="session-auth"><T text="Chủ phòng"/></span>}>
  <div ref={root} className="lobby-host-grid">
   <section className="session-frame lobby-invite"><h2 className="session-ribbon"><T text="Mời CEO" bold/></h2><p><T text="Chia sẻ mã phòng hoặc quét mã QR"/></p><strong className="lobby-invite-code"><T text={snap.room.code} bold/></strong><div className="lobby-qr">{qr?<Art src={qr} alt={`Mã QR vào phòng ${snap.room.code}`} eager/>:<span role="status"><T text="Đang tạo mã QR…"/></span>}</div><input ref={url} aria-label="Liên kết vào phòng" value={joinUrl} readOnly onFocus={e=>e.target.select()}/><button type="button" className="session-button secondary" onClick={()=>void copy()}><T text="Sao chép liên kết" bold/></button><p ref={status} className="lobby-copy-status" role="status"><T text={copyStatus}/></p></section>
   <LobbyRoster teams={snap.teams} host/>
  </div>
  <footer className="lobby-footer"><LobbyFacts room={snap.room}/><button type="button" className="session-button primary session-start" disabled={busy||!snap.teams.length} onClick={onStart} onPointerEnter={e=>buttonMotion(e.currentTarget,'over')} onPointerLeave={e=>buttonMotion(e.currentTarget,'out')} onPointerDown={e=>buttonMotion(e.currentTarget,'down')} onPointerUp={e=>buttonMotion(e.currentTarget,'up')}><T text={busy?'Đang bắt đầu…':snap.teams.length?'Bắt đầu':'Chờ ít nhất một CEO'} bold/></button></footer>
  {note&&<p className="session-error" role="alert"><T text={note}/></p>}
 </SessionShell>
}
