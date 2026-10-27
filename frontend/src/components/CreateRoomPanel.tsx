import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArtText as T } from './ArtText'
import { SessionShell, SessionSettings } from './SessionUI'

export function CreateRoomPanel(p:{hostName:string;minutes:number;capital:number;cycle:number;yearMin:number;busy:boolean;error:string;onHostName:(name:string)=>void;onMinutes:(n:number)=>void;onCapital:(n:number)=>void;onCycle:(n:number)=>void;onYearMin:(n:number)=>void;onSubmit:()=>void;onClose:()=>void;onLogout:()=>void}){
 const form = useRef<HTMLFormElement>(null)
 const close = useRef(p.onClose)
 useEffect(()=>{close.current=p.onClose},[p.onClose])
 useEffect(()=>{
  const oldOverflow=document.body.style.overflow,oldFocus=document.activeElement
  document.body.style.overflow='hidden'
  form.current?.querySelector('input')?.focus()
  const keydown=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();close.current();return}
   if(e.key!=='Tab')return
   const dialog=form.current?.closest('[role="dialog"]')
   const buttons=Array.from(dialog?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),summary')??[]).filter(el=>el.getClientRects().length>0)
   const first=buttons[0],last=buttons.at(-1)
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
   if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
  }
  document.addEventListener('keydown',keydown)
  return()=>{document.body.style.overflow=oldOverflow;document.removeEventListener('keydown',keydown);if(oldFocus instanceof HTMLElement)oldFocus.focus()}
 },[])
 return <SessionShell title="Tạo phòng" className="session-overlay session-create" dialog navigation={<nav className="session-navigation" aria-label="Điều hướng"><a href="/wiki?section=start" onClick={p.onClose}><T text="Cách chơi"/></a><a href="/wiki?section=events" onClick={p.onClose}><T text="Sự kiện"/></a><Link to="/wiki" onClick={p.onClose}><T text="Wiki"/></Link></nav>} action={<><span className="session-auth"><T text="Đã đăng nhập Google"/></span><button type="button" className="session-button secondary" onClick={p.onLogout}><T text="Đăng xuất"/></button></>}>
  <div className="session-create-stack">
  <h1 className="session-create-title session-ribbon"><T text="Tạo phòng" bold/></h1>
  <form ref={form} className="session-frame session-create-form" onSubmit={e=>{e.preventDefault();if(!p.busy)p.onSubmit()}}>
   <h2><T text="Thiết lập phiên chơi" bold/></h2><p><T text="Tạo phòng để mời bạn bè cùng tham gia và bắt đầu hành trình phát triển doanh nghiệp."/></p>
   <label className="session-name-field"><span><T text="Tên chủ phòng" bold/></span><input value={p.hostName} maxLength={40} onBlur={e=>p.onHostName(e.currentTarget.value.normalize('NFC'))} onChange={e=>p.onHostName(e.target.value)}/><small><T text={`${p.hostName.length}/40 ký tự`}/></small></label>
   <SessionSettings {...p}/>
   <p className="session-small"><T text="Giá đầu tư thay đổi theo ngành và quy mô."/></p>
   {p.error&&<p className="session-error" role="alert"><T text={p.error}/></p>}
   <div className="session-form-actions"><button type="submit" className="session-button primary" disabled={p.busy||p.hostName.trim().length<1}><T text="Mở phòng" bold/></button><button type="button" className="session-button secondary" onClick={p.onClose}><T text="Đóng"/></button></div>
  </form>
  </div>
 </SessionShell>
}
