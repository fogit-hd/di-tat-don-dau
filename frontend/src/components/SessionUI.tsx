import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArtText as T, PaintedArt as Art } from './ArtText'
import { money } from '../lib/format'
import './session-ui.css'
import './session-flow.css'

export function SessionShell({title,subtitle,action,navigation,children,className='',dialog=false}:{title:string;subtitle?:string;action?:ReactNode;navigation?:ReactNode;children:ReactNode;className?:string;dialog?:boolean}){
 return <section className={`session-screen ${className}`} role={dialog?'dialog':undefined} aria-modal={dialog||undefined} aria-label={title} onContextMenu={e=>{if(e.target instanceof Element&&e.target.closest('img,svg'))e.preventDefault()}}>
  <header className="session-header"><Link to="/" className="session-brand" aria-label="Đi Tắt Đón Đầu — Trang chủ"><Art src="/assets/landing-v2/brand-logo.webp"/></Link><div className="session-heading">{navigation||<><h1><T text={title} bold/></h1>{subtitle&&<p><T text={subtitle}/></p>}</>}</div><div className="session-header-actions">{action}</div></header>
  <div className="session-body">{children}</div>
 </section>
}
export function SessionSettings({minutes,capital,cycle,yearMin,onMinutes,onCapital,onCycle,onYearMin}:{minutes:number;capital:number;cycle:number;yearMin:number;onMinutes:(n:number)=>void;onCapital:(n:number)=>void;onCycle:(n:number)=>void;onYearMin:(n:number)=>void}){
 return <div className="session-settings">
  <label><span><T text="Thời lượng" bold/></span><select value={minutes} onChange={e=>onMinutes(Number(e.target.value))}>{Array.from({length:45},(_,i)=><option key={i+1} value={i+1}>{i+1} phút</option>)}</select></label>
  <label><span><T text="Vốn khởi đầu" bold/></span><select value={capital} onChange={e=>onCapital(Number(e.target.value))}>{![...Array(99)].some((_,i)=>(i+2)*1000===capital)&&<option value={capital}>{money(capital)} VNĐ</option>}{Array.from({length:99},(_,i)=><option key={i+2} value={(i+2)*1000}>{money((i+2)*1000)} VNĐ</option>)}</select></label>
  <details className="session-advanced"><summary><T text="Thiết lập nâng cao" bold/></summary><div><label><span><T text="Giây mỗi năm"/></span><input type="number" min={10} max={180} value={cycle} onChange={e=>onCycle(Number(e.target.value))}/></label><label><span><T text="Khóa nút (giây)"/></span><input type="number" min={0} max={120} value={yearMin} onChange={e=>onYearMin(Number(e.target.value))}/></label></div></details>
 </div>
}
export function SessionTabs({items,value,onChange}:{items:readonly (readonly [string,string])[];value:string;onChange:(id:string)=>void}){
 return <div className="session-tabs" role="tablist">{items.map(([id,label],index)=><button type="button" key={id} role="tab" aria-selected={value===id} tabIndex={value===id?0:-1} onClick={()=>onChange(id)} onKeyDown={e=>{const next=e.key==='ArrowRight'?(index+1)%items.length:e.key==='ArrowLeft'?(index+items.length-1)%items.length:e.key==='Home'?0:e.key==='End'?items.length-1:-1;if(next<0)return;e.preventDefault();onChange(items[next][0]);(e.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus()}}><T text={label} bold/></button>)}</div>
}
