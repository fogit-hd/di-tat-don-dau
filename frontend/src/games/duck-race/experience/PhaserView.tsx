import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type Phaser from 'phaser'
import type { RaceSnapshot, RacerView } from '../contracts'
import type { ChestKind } from '../experience-contracts'

export type SceneInput={snapshot?:RaceSnapshot;now:number;host:boolean;portrait?:RacerView;landing?:boolean;landingPaused?:boolean;reduced:boolean}
export function PhaserView({input,kind='race',onReady,onChest,onError}:{input:SceneInput;kind?:'race'|'chests'|'portrait'|'landing'|'field';onReady?:(ready:boolean)=>void;onChest?:(kind:ChestKind)=>void;onError?:(message:string)=>void}){
 const mount=useRef<HTMLDivElement>(null),current=useRef(input),callbacks=useRef({onReady,onChest,onError})
 useEffect(()=>{current.current=input;callbacks.current={onReady,onChest,onError}},[input,onReady,onChest,onError])
 const [error,setError]=useState(''),[ready,setReady]=useState(false),[attempt,setAttempt]=useState(0)
 useEffect(()=>{
  let stopped=false,game:Phaser.Game|undefined,observer:ResizeObserver|undefined
  setReady(false);callbacks.current.onReady?.(false)
  void import('./createExperienceGame').then(({createExperienceGame})=>{
   if(stopped||!mount.current)return
   game=createExperienceGame(mount.current,kind,()=>current.current,{ready:()=>{if(!stopped){setReady(true);callbacks.current.onReady?.(true)}},error:message=>{if(!stopped){setError(message);callbacks.current.onError?.(message)}},chest:kind=>callbacks.current.onChest?.(kind)})
   observer=new ResizeObserver(([entry])=>{if(game?.isBooted&&entry.contentRect.width>0&&entry.contentRect.height>0)game.scale.resize(Math.round(entry.contentRect.width),Math.round(entry.contentRect.height))});observer.observe(mount.current)
  }).catch(()=>{if(!stopped){setError('Không mở được đường đua. Vui lòng thử lại.');callbacks.current.onError?.('Không mở được đường đua. Vui lòng thử lại.')}})
  return()=>{stopped=true;observer?.disconnect();callbacks.current.onReady?.(false);game?.destroy(true,false)}
 },[kind,attempt])
 return <><div className={`q4-phaser q4-phaser-${kind}`} aria-label={kind==='race'?'Đường đua theo điểm':kind==='chests'?'Rương phần thưởng':kind==='portrait'?'Vịt gốc và diện mạo đã chọn':'Đường đua chuyển động nền'} role="img"><div ref={mount} className="q4-phaser-mount"/>
  {(!ready||error)&&kind!=='chests'&&kind!=='field'&&<div className="q4-render-status" role="status">{error||'Đang mở đường đua…'}{error&&<button onClick={()=>{setError('');setAttempt(n=>n+1)}}>Thử lại</button>}</div>}
 </div>{error&&kind==='chests'&&createPortal(<div className="q4-toast" role="alert"><span>{error}</span><button onClick={()=>location.reload()}>Tải lại</button></div>,document.body)}</>
}
