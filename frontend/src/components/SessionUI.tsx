import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArtText as T, PaintedArt as Art } from './ArtText'
import { PublicArtText as PublicText } from './PublicArtText'
import { PaintedStepper } from './PaintedStepper'
import { parseCapitalBillions } from '../lib/room-settings'
import './session-ui.css'
import './session-flow.css'
import './session-v2.css'

export function SessionShell({title,subtitle,action,navigation,children,className='',dialog=false,publicLettering=false}:{title:string;subtitle?:string;action?:ReactNode;navigation?:ReactNode;children:ReactNode;className?:string;dialog?:boolean;publicLettering?:boolean}){
 const HeadingText=publicLettering?PublicText:T
 return <section className={`session-screen ${className}`} role={dialog?'dialog':undefined} aria-modal={dialog||undefined} aria-label={title} onContextMenu={e=>{if(e.target instanceof Element&&e.target.closest('img,svg'))e.preventDefault()}}>
  <header className="session-header"><Link to="/" className="session-brand" aria-label="Đi Tắt Đón Đầu — Trang chủ"><Art src="/assets/landing-v2/brand-logo.webp"/></Link><div className="session-heading">{navigation||<><h1><HeadingText text={title} bold/></h1>{subtitle&&<p><HeadingText text={subtitle}/></p>}</>}</div><div className="session-header-actions">{action}</div></header>
  <div className="session-body">{children}</div>
 </section>
}
export function SessionSettings({minutes,capital,cycle,yearMin,onMinutes,onCapital,onCycle,onYearMin}:{minutes:number;capital:number;cycle:number;yearMin:number;onMinutes:(n:number)=>void;onCapital:(n:number)=>void;onCycle:(n:number)=>void;onYearMin:(n:number)=>void}){
 return <div className="session-settings">
  <label><span><PublicText text="Thời lượng" bold/></span><span className="session-number-unit"><input aria-label="Thời lượng (phút)" type="number" inputMode="numeric" required min={1} max={45} step={1} defaultValue={minutes} onChange={e=>{if(Number.isFinite(e.target.valueAsNumber))onMinutes(e.target.valueAsNumber)}}/><span aria-hidden="true"><PublicText text="phút"/></span></span></label>
  <label><span><PublicText text="Vốn khởi đầu" bold/></span><span className="session-number-unit"><input aria-label="Vốn khởi đầu (tỷ VNĐ)" type="text" inputMode="decimal" autoComplete="off" required pattern="[0-9]+([.,][0-9])?" defaultValue={(capital/1000).toLocaleString('vi-VN',{useGrouping:false,maximumFractionDigits:1})} onChange={e=>{const amount=parseCapitalBillions(e.target.value);e.target.setCustomValidity(amount===null?'Nhập từ 2 đến 100 tỷ VNĐ, tối đa một chữ số sau dấu phẩy.':'');if(amount!==null)onCapital(amount)}}/><span aria-hidden="true"><PublicText text="tỷ VNĐ"/></span></span></label>
  <details className="session-advanced"><summary><PublicText text="Thiết lập nâng cao" bold/></summary><div><label><span><PublicText text="Giây mỗi năm"/></span><PaintedStepper label="Giây mỗi năm" value={cycle} min={10} max={180} onChange={onCycle}/></label><label><span><PublicText text="Khóa nút (giây)"/></span><PaintedStepper label="Khóa nút (giây)" value={yearMin} min={0} max={120} onChange={onYearMin}/></label></div></details>
 </div>
}
export function SessionTabs({items,value,onChange}:{items:readonly (readonly [string,string])[];value:string;onChange:(id:string)=>void}){
 return <div className="session-tabs" role="tablist">{items.map(([id,label],index)=><button type="button" key={id} role="tab" aria-selected={value===id} tabIndex={value===id?0:-1} onClick={()=>onChange(id)} onKeyDown={e=>{const next=e.key==='ArrowRight'?(index+1)%items.length:e.key==='ArrowLeft'?(index+items.length-1)%items.length:e.key==='Home'?0:e.key==='End'?items.length-1:-1;if(next<0)return;e.preventDefault();onChange(items[next][0]);(e.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus()}}><T text={label} bold/></button>)}</div>
}
