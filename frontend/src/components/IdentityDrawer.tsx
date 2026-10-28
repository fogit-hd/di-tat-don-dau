import { useEffect, useRef, useState } from 'react'
import { avatarOf, BODY_OPTIONS, OUTFIT_OPTIONS, sameAvatar, SKIN_OPTIONS, type AvatarConfig } from '../lib/avatar'
import { buttonMotion, lobbyMotion, riseIn } from '../lib/lobby-motion'
import { CeoAvatar } from './CeoAvatar'
import { LobbyAvatar } from './LobbyParts'
import { PublicArtText as T } from './PublicArtText'

export function IdentityDrawer({saved,onSave,onClose}:{saved:AvatarConfig;onSave:(avatar:AvatarConfig)=>Promise<{avatar:AvatarConfig}>;onClose:()=>void}){
 const [draft,setDraft]=useState(()=>avatarOf(saved)),[panel,setPanel]=useState('outfit'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false)
 const shade=useRef<HTMLDivElement>(null),drawer=useRef<HTMLDivElement>(null),alive=useRef(true),closing=useRef(false),saving=useRef(false),closeCallback=useRef(onClose)
 useEffect(()=>{closeCallback.current=onClose},[onClose])
 async function close(){
  if(closing.current)return;closing.current=true
  const slide=lobbyMotion(drawer.current,[{transform:'translateX(0)'},{transform:'translateX(105%)'}],{duration:290,fill:'forwards'})
  lobbyMotion(shade.current,[{opacity:1},{opacity:0}],{duration:260,fill:'forwards'})
  await slide?.finished.catch(()=>{});if(alive.current)closeCallback.current()
 }
 const closeRef=useRef(close);useEffect(()=>{closeRef.current=close})
 useEffect(()=>{
  alive.current=true
  const focus=document.activeElement,overflow=document.body.style.overflow
  const others=Array.from(drawer.current?.closest('.session-screen')?.querySelectorAll<HTMLElement>('.session-header,.lobby-player-grid,.lobby-footer')??[])
  const inert=others.map(node=>node.inert);others.forEach(node=>{node.inert=true});document.body.style.overflow='hidden'
  const animations=[lobbyMotion(drawer.current,[{transform:'translateX(105%)'},{transform:'none'}],{duration:360}),lobbyMotion(shade.current,[{opacity:0},{opacity:1}],220)]
  drawer.current?.querySelector<HTMLButtonElement>('.wardrobe-close')?.focus()
  const keydown=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();void closeRef.current();return}
   if(event.key!=='Tab')return
   const nodes=Array.from(drawer.current?.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')??[]).filter(node=>node.getClientRects().length>0)
   const first=nodes[0],last=nodes.at(-1)
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
  }
  document.addEventListener('keydown',keydown)
  return()=>{alive.current=false;animations.forEach(a=>a?.cancel());document.removeEventListener('keydown',keydown);document.body.style.overflow=overflow;others.forEach((node,i)=>{node.inert=inert[i]});if(focus instanceof HTMLElement&&focus.isConnected)focus.focus()}
 },[])
 const dirty=!sameAvatar(draft,saved)
 function choose(next:AvatarConfig,button:HTMLButtonElement){
  if(busy||closing.current)return
  setDraft(next);setError('');setSuccess(false)
  lobbyMotion(button,[{boxShadow:'inset 0 0 0 0 #dca247'},{boxShadow:'inset 0 0 0 4px #efb743'},{boxShadow:'inset 0 0 0 0 #dca247'}],320)
 }
 async function save(){
  if(saving.current||!dirty)return;saving.current=true;setBusy(true);setError('')
  try{
   await onSave({...draft})
   if(!alive.current||closing.current)return
   setSuccess(true)
   const celebration=lobbyMotion(drawer.current?.querySelector('.lobby-avatar-stage')??null,[{outlineColor:'transparent'},{outlineColor:'#d4a13a'},{outlineColor:'transparent'}],{duration:450})
   await celebration?.finished.catch(()=>{});if(alive.current)await close()
  }catch(cause){if(alive.current&&!closing.current){setError(cause instanceof Error?cause.message:'Không lưu được diện mạo. Vui lòng thử lại.');lobbyMotion(drawer.current,[{transform:'translateX(0)'},{transform:'translateX(4px)'},{transform:'translateX(-4px)'},{transform:'translateX(0)'}],240)}}
  finally{saving.current=false;if(alive.current)setBusy(false)}
 }
 return <div className="wardrobe-overlay">
  <div ref={shade} className="wardrobe-shade" aria-hidden="true" onClick={()=>void close()}/>
  <div ref={drawer} className="wardrobe-drawer session-frame" role="dialog" aria-modal="true" aria-labelledby="wardrobe-title">
   <header className="wardrobe-heading"><h2 id="wardrobe-title"><T text="Thay đổi nhận diện" bold/></h2><button type="button" className="wardrobe-close" aria-label="Đóng thay đổi nhận diện" onClick={()=>void close()} onPointerEnter={e=>buttonMotion(e.currentTarget,'over')} onPointerLeave={e=>buttonMotion(e.currentTarget,'out')} onPointerDown={e=>buttonMotion(e.currentTarget,'down')} onPointerUp={e=>buttonMotion(e.currentTarget,'up')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7M4 12h12"/></svg></button></header>
   <div className="wardrobe-main"><LobbyAvatar avatar={draft}/><div className="wardrobe-controls" data-active={panel}>
    <div className="wardrobe-tabs" role="tablist" aria-label="Tùy chỉnh nhận diện">{[['body','Dáng người'],['skin','Màu da'],['outfit','Bộ đồ']].map(([id,label])=><button type="button" role="tab" key={id} aria-selected={panel===id} onClick={()=>{setPanel(id);requestAnimationFrame(()=>riseIn(drawer.current?.querySelector(`.wardrobe-${id}`)??null))}}><T text={label}/></button>)}</div>
    <fieldset className="wardrobe-body" disabled={busy}><legend><T text="Dáng người" bold/></legend><div className="wardrobe-body-grid">{BODY_OPTIONS.map(([body,label])=><button type="button" key={body} aria-label={label} aria-pressed={draft.body===body} onClick={e=>choose({...draft,body},e.currentTarget)}><CeoAvatar avatar={{...draft,body}}/><span><T text={label}/></span></button>)}</div></fieldset>
    <fieldset className="wardrobe-skin" disabled={busy}><legend><T text="Màu da" bold/></legend><div className="wardrobe-skin-grid">{SKIN_OPTIONS.map(([skin,color],i)=><button type="button" key={skin} aria-label={`Màu da ${i+1}`} aria-pressed={draft.skin===skin} style={{backgroundColor:color}} onClick={e=>choose({...draft,skin},e.currentTarget)}/>)}</div></fieldset>
    <fieldset className="wardrobe-outfit" disabled={busy}><legend><T text="Bộ đồ" bold/></legend><div className="wardrobe-outfit-grid">{OUTFIT_OPTIONS.map(([outfit,label])=><button type="button" key={outfit} aria-label={label} aria-pressed={draft.outfit===outfit} onClick={e=>choose({...draft,outfit},e.currentTarget)}><CeoAvatar avatar={{...draft,outfit}}/><span><T text={label}/></span></button>)}</div></fieldset>
   </div></div>
   <footer className="wardrobe-footer"><p className={error?'wardrobe-error':'wardrobe-note'} role={error?'alert':'status'}><T text={error||(success?'Đã lưu diện mạo':busy?'Đang lưu diện mạo…':dirty?'Chưa lưu thay đổi':'Diện mạo hiện tại đã được lưu')}/></p><button type="button" className="session-button primary" disabled={busy||!dirty} onClick={()=>void save()} onPointerEnter={e=>buttonMotion(e.currentTarget,'over')} onPointerLeave={e=>buttonMotion(e.currentTarget,'out')} onPointerDown={e=>buttonMotion(e.currentTarget,'down')} onPointerUp={e=>buttonMotion(e.currentTarget,'up')}><T text={busy?'Đang lưu…':'Lưu diện mạo'} bold/></button></footer>
  </div>
 </div>
}
