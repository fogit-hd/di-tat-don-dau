import { useRef, useState, type ReactNode } from 'react'
import type { Snapshot } from '../api/types'
import { money } from '../lib/format'
import { ArtText as T, PaintedArt as Art } from './ArtText'
import { SessionShell } from './SessionUI'
import { CeoAvatar, CeoName } from './CeoAvatar'

export function HostLobby({snap,qr,joinUrl,settings,busy,note,onStart}:{snap:Snapshot;qr:string;joinUrl:string;settings:ReactNode;busy:boolean;note:string;onStart:()=>void}){
 const [copyStatus,setCopyStatus]=useState(''),url=useRef<HTMLInputElement>(null)
 async function copy(){try{await navigator.clipboard.writeText(joinUrl);setCopyStatus('Đã sao chép liên kết')}catch{url.current?.focus();url.current?.select();setCopyStatus('Chọn và sao chép liên kết bên trên')}}
 return <SessionShell title="Phòng chờ" subtitle={snap.room.hostName} className="session-lobby" action={<span className="session-auth"><T text="Chủ phòng"/></span>}>
  <div className="session-lobby-columns">
   <section className="session-frame session-join-card"><h2 className="session-ribbon"><T text="Mời CEO vào phòng" bold/></h2><p><T text="Chia sẻ mã phòng hoặc quét mã QR"/></p><strong className="session-room-code"><T text={snap.room.code} bold/></strong><div className="session-qr">{qr?<Art src={qr} alt={`Mã QR vào phòng ${snap.room.code}`} eager/>:<span role="status"><T text="Đang tạo mã QR…"/></span>}</div><p><T text="Quét mã hoặc nhập mã phòng" bold/></p><input ref={url} aria-label="Liên kết vào phòng" value={joinUrl} readOnly onFocus={e=>e.target.select()}/><button type="button" className="session-button secondary" onClick={()=>void copy()}><T text="Sao chép liên kết" bold/></button>{copyStatus&&<small role="status"><T text={copyStatus}/></small>}</section>
   <section className="session-frame session-roster"><h2 className="session-ribbon"><T text={`CEO đã vào (${snap.teams.length})`} bold/></h2><ul>{snap.teams.map(team=><li key={team.id}><CeoAvatar avatar={team.avatar} portrait/><b><CeoName name={team.teamName} full/></b><span className={team.connected?'connected':'disconnected'}><T text={team.connected?'Đã kết nối':'Mất kết nối'}/></span></li>)}</ul>{!snap.teams.length&&<p className="session-empty"><T text="Chưa có CEO nào. Chia sẻ mã phòng để mời tham gia."/></p>}
    <div className="session-room-facts"><div><T text={`${Math.round(snap.room.durationSec/60)} phút`} bold/><small><T text="Thời lượng phiên chơi"/></small></div><div><T text={`Vốn tham chiếu ${money(snap.room.startingCapital)}`} bold/><small><T text="Điều chỉnh theo quy mô doanh nghiệp"/></small></div></div>
    <details className="session-advanced session-lobby-settings"><summary><T text="Thiết lập phiên chơi" bold/></summary>{settings}</details>
    {note&&<p className="session-error" role="alert"><T text={note}/></p>}
    <button type="button" className="session-button primary session-start" disabled={busy||!snap.teams.length} onClick={onStart}><T text={snap.teams.length?'Bắt đầu':'Chờ ít nhất một CEO'} bold/></button>
   </section>
  </div>
 </SessionShell>
}

