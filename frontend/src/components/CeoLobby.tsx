import { useEffect, useMemo, useRef, useState } from 'react'
import type { Snapshot } from '../api/types'
import { avatarOf, type AvatarConfig } from '../lib/avatar'
import { buttonMotion, riseIn } from '../lib/lobby-motion'
import { CeoName } from './CeoAvatar'
import { PublicArtText as T } from './PublicArtText'
import { SessionShell } from './SessionUI'
import { IdentityDrawer } from './IdentityDrawer'
import { LobbyAvatar, LobbyFacts, LobbyRoster } from './LobbyParts'
import './lobby-v4.css'

export function CeoLobby({snap,onSave}:{snap:Snapshot;onSave:(avatar:AvatarConfig)=>Promise<{avatar:AvatarConfig}>}){
 const saved=avatarOf(snap.you?.avatar),[open,setOpen]=useState(false),stage=useRef<HTMLDivElement>(null)
 const others=useMemo(()=>snap.teams.filter(t=>t.id!==snap.you?.id),[snap.teams,snap.you?.id])
 useEffect(()=>{const animations=[riseIn(stage.current?.querySelector('.lobby-personal')??null),riseIn(stage.current?.querySelector('.lobby-roster-panel')??null,80)];return()=>animations.forEach(a=>a?.cancel())},[])
 return <SessionShell publicLettering title="Phòng chờ" className="session-lobby lobby-v4 lobby-player-v4" action={<div className="lobby-header-code"><T text="Mã phòng"/><strong><T text={snap.room.code} bold/></strong></div>}>
  <div ref={stage} className="lobby-player-grid">
   <section className="session-frame lobby-personal" aria-label="Nhân vật của bạn"><h2><CeoName name={snap.you?.teamName??'CEO'} full publicLettering/></h2><p className="lobby-personal-status"><i/>Đã kết nối</p><LobbyAvatar avatar={saved}/><button type="button" className="session-button primary" onClick={()=>setOpen(true)} onPointerEnter={e=>buttonMotion(e.currentTarget,'over')} onPointerLeave={e=>buttonMotion(e.currentTarget,'out')} onPointerDown={e=>buttonMotion(e.currentTarget,'down')} onPointerUp={e=>buttonMotion(e.currentTarget,'up')}><T text="Thay đổi nhận diện" bold/></button></section>
   <LobbyRoster teams={others} total={snap.teams.length} you={snap.you?.id}/>
  </div>
  <footer className="lobby-footer"><LobbyFacts room={snap.room}/><p role="status"><span className="lobby-wait-dot"/><T text="Chờ chủ phòng bắt đầu" bold/></p></footer>
  {open&&<IdentityDrawer saved={saved} onSave={onSave} onClose={()=>setOpen(false)}/>}
 </SessionShell>
}
