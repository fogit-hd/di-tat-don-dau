import { Link } from 'react-router-dom'
import type { AvatarConfig } from '../lib/avatar'
import { CeoAvatar, CeoName } from './CeoAvatar'
import { ArtText as T } from './ArtText'
import { SessionShell } from './SessionUI'

export function CeoJoinPanel({code,name,busy,error,onCode,onName,onSubmit,onClose}:{code:string;name:string;busy:boolean;error:string;onCode?:(s:string)=>void;onName:(s:string)=>void;onSubmit:()=>void;onClose?:()=>void}){
 return <SessionShell title="Vào phòng chơi" className="session-entry session-overlay" dialog action={onClose?<button type="button" className="session-button secondary" onClick={onClose}><T text="Đóng"/></button>:<Link to="/" className="session-button secondary"><T text="Về trang chủ"/></Link>}>
  <form className="session-frame ceo-join-form" onSubmit={event=>{event.preventDefault();if(!busy&&name.trim()&&code.length>=4)onSubmit()}}><h2><T text="Bắt đầu hành trình CEO" bold/></h2><label><T text="Mã phòng" bold/><input value={code} maxLength={8} readOnly={!onCode} onChange={e=>onCode?.(e.target.value.trim().toUpperCase())} autoComplete="off" autoCapitalize="characters" spellCheck={false}/></label><label><T text="Tên CEO" bold/><input value={name} maxLength={24} placeholder="Nhập tên CEO" onChange={e=>onName(e.target.value)} autoComplete="nickname"/><small><T text={`${name.length}/24 ký tự`}/></small></label>{error&&<p className="session-error" role="alert"><T text={error}/></p>}<button type="submit" className="session-button primary" disabled={busy||!name.trim()||code.length<4}><T text="Vào sảnh" bold/></button></form>
 </SessionShell>
}

export function SessionCountdown({code,ends,now,name,avatar}:{code:string;ends:number|null;now:number;name?:string;avatar?:AvatarConfig}){
 const count=Math.max(1,Math.ceil(((ends??now+3000)-now)/1000))
 return <SessionShell title={`Phòng ${code}`} className="session-countdown session-overlay" action={name?<div className="session-identity"><CeoAvatar avatar={avatar} portrait/><CeoName name={name} full/></div>:undefined}>
  <div className="countdown-stage" role="status" aria-live="polite" aria-label={`Bắt đầu sau ${count} giây`}><h2><T text="Chuẩn bị bắt đầu" bold/></h2><div className="countdown-dial" key={count}><T text={String(count)} bold/></div><p><T text="Cùng xuất phát" bold/></p></div>
 </SessionShell>
}
