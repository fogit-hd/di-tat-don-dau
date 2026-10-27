import { useState } from 'react'
import type { Snapshot } from '../api/types'
import { avatarOf, BODY_OPTIONS, DEFAULT_AVATAR, OUTFIT_OPTIONS, sameAvatar, SKIN_OPTIONS, type AvatarConfig } from '../lib/avatar'
import { money } from '../lib/format'
import { CeoAvatar, CeoName } from './CeoAvatar'
import { ArtText as T } from './ArtText'
import { SessionShell, SessionTabs } from './SessionUI'

export function CeoLobby({snap,onSave}:{snap:Snapshot;onSave:(avatar:AvatarConfig)=>Promise<{avatar:AvatarConfig}>}){
 const saved=avatarOf(snap.you?.avatar),[draft,setDraft]=useState(()=>avatarOf(snap.you?.avatar)),[tab,setTab]=useState('character'),[busy,setBusy]=useState(false),[note,setNote]=useState(''),[error,setError]=useState('')
 const dirty=!sameAvatar(draft,saved)
 async function save(){setBusy(true);setError('');setNote('');try{await onSave(draft);setNote('Đã lưu diện mạo')}catch(error){setError(error instanceof Error?error.message:'Không lưu được diện mạo')}finally{setBusy(false)}}
 return <SessionShell title="Chờ chủ phòng bắt đầu" className="session-lobby ceo-lobby" action={<div className="session-identity"><CeoAvatar avatar={saved} portrait/><CeoName name={snap.you?.teamName??'CEO'} full/></div>}>
  <div className="ceo-lobby-mobile-code"><T text={`Mã phòng ${snap.room.code}`} bold/></div>
  <div className="ceo-lobby-mobile-tabs"><SessionTabs items={[["character","Nhân vật"],["roster",`Trong phòng (${snap.teams.length})`]]} value={tab} onChange={setTab}/></div>
  <div className="ceo-lobby-layout" data-mobile-tab={tab}>
   <section className="session-frame avatar-workshop" aria-label="Tạo nhân vật CEO của bạn"><h2><T text="Tạo nhân vật CEO của bạn" bold/></h2>
    <div className="avatar-workshop-main"><div className="avatar-stage"><CeoAvatar avatar={draft}/></div><div className="avatar-controls">
     <fieldset disabled={busy}><legend><T text="Dáng người" bold/></legend><div className="avatar-body-options">{BODY_OPTIONS.map(([body,label])=><button type="button" key={body} aria-label={label} aria-pressed={draft.body===body} onClick={()=>{setDraft({...draft,body});setNote('')}}><CeoAvatar avatar={{...DEFAULT_AVATAR,body}}/><span><T text={label}/></span></button>)}</div></fieldset>
     <fieldset disabled={busy}><legend><T text="Màu da" bold/></legend><div className="avatar-skin-options">{SKIN_OPTIONS.map(([skin,color],index)=><button type="button" key={skin} aria-label={`Màu da ${index+1}`} title={`Màu da ${index+1}`} aria-pressed={draft.skin===skin} style={{backgroundColor:color}} onClick={()=>{setDraft({...draft,skin});setNote('')}}/>)}</div></fieldset>
     <fieldset disabled={busy}><legend><T text="Bộ đồ" bold/></legend><div className="avatar-outfit-options">{OUTFIT_OPTIONS.map(([outfit,label])=><button type="button" key={outfit} aria-label={label} aria-pressed={draft.outfit===outfit} onClick={()=>{setDraft({...draft,outfit});setNote('')}}><CeoAvatar portrait avatar={{...draft,outfit}}/><span><T text={label}/></span></button>)}</div></fieldset>
     <button type="button" className="session-button primary avatar-save" disabled={busy||!dirty} onClick={()=>void save()}><T text="Lưu diện mạo" bold/></button>
     <p className={error?'session-error':'avatar-save-note'} role={error?'alert':'status'}><T text={error||note||(dirty?'Chưa lưu thay đổi':'Diện mạo hiện tại đã được lưu')}/></p>
    </div></div>
   </section>
   <section className="session-frame session-roster ceo-lobby-roster"><h2 className="session-ribbon"><T text={`Trong phòng (${snap.teams.length})`} bold/></h2><strong className="session-room-code"><T text={snap.room.code} bold/></strong><p className="ceo-joined-name"><CeoName name={snap.you?.teamName??'CEO'} full/><T text="đã vào phòng"/></p><ul>{snap.teams.map(team=><li key={team.id}><CeoAvatar avatar={team.avatar} portrait/><b><CeoName name={team.teamName} full/></b><span className={team.connected?'connected':'disconnected'}><T text={team.connected?'Đã kết nối':'Mất kết nối'}/></span></li>)}</ul><div className="session-room-facts"><div><T text={`${Math.round(snap.room.durationSec/60)} phút`} bold/><small><T text="Thời lượng phiên chơi"/></small></div><div><T text={`Vốn tham chiếu ${money(snap.room.startingCapital)}`} bold/><small><T text="Theo quy mô doanh nghiệp"/></small></div></div></section>
  </div>
 </SessionShell>
}
