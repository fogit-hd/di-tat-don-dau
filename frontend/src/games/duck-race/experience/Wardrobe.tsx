import { useEffect, useRef, useState } from 'react'
import { DUCK_COLORS, type RacerView } from '../contracts'
import { HEAD_COSMETICS, BODY_COSMETICS, OUTFIT_COSMETICS, selectCosmetic, type Cosmetics } from '../experience-contracts'
import { PhaserView } from './PhaserView'
import { Glyph } from './ui'
import { WardrobePortrait } from './WardrobePortrait'
import { COSMETIC_LABELS } from './wardrobe-art'

export function Wardrobe({me,onClose,onSave,reduced}:{me:RacerView;onClose:()=>void;onSave:(data:Record<string,unknown>)=>Promise<void>;reduced:boolean}){
 const [color,setColor]=useState(me.color),[cosmetics,setCosmetics]=useState<Cosmetics>(me.cosmetics||{glasses:'',scarf:''}),[saving,setSaving]=useState(false),[closing,setClosing]=useState(false)
 const dialog=useRef<HTMLElement>(null),closeRef=useRef<HTMLButtonElement>(null)
 function close(){if(closing||saving)return;setClosing(true);if(reduced){onClose();return}const a=dialog.current?.animate([{transform:'translateX(0)',opacity:1},{transform:'translateX(100%)',opacity:.4}],{duration:220,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});if(a)a.onfinish=onClose;else onClose()}
 useEffect(()=>{const prev=document.activeElement as HTMLElement;closeRef.current?.focus();const a=!reduced?dialog.current?.animate([{transform:'translateX(100%)',opacity:.4},{transform:'translateX(0)',opacity:1}],{duration:320,easing:'cubic-bezier(.16,1,.3,1)'}):undefined;return()=>{a?.cancel();prev?.focus()}},[reduced])
 const now=0,portrait={...me,color,cosmetics}
 return <div className="q4-scrim" onPointerDown={e=>{if(e.target===e.currentTarget)close()}} onKeyDown={e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const items=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled)');if(!items?.length)return;if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items[items.length-1].focus()}else if(!e.shiftKey&&document.activeElement===items[items.length-1]){e.preventDefault();items[0].focus()}}}}>
  <section ref={dialog} className="q4-wardrobe q4-paper" role="dialog" aria-modal="true" aria-labelledby="q4-wardrobe-title"><header><h2 id="q4-wardrobe-title">Diện mạo vịt</h2><button ref={closeRef} onClick={close} disabled={saving} className="q4-icon-button" aria-label="Đóng diện mạo sang phải"><Glyph kind="right"/></button></header>
  <div className="q4-portrait"><PhaserView kind="portrait" input={{portrait,now,host:false,reduced}}/></div><p className="q4-cosmetic-note">Chỉ thay đổi diện mạo</p>
  <fieldset><legend>Màu thân</legend><div className="q4-colors">{DUCK_COLORS.map(c=><button key={c} aria-label={`Chọn màu ${c}`} aria-pressed={c===color} onClick={()=>setColor(c)}><img src={`/assets/duck-race/portraits-v6/duckee/${c}.webp`} alt="" draggable={false}/></button>)}</div></fieldset>
  <fieldset><legend>Trang sức trên đầu</legend><div className="q4-gear-options q4-gear-labelled">{HEAD_COSMETICS.map(value=><button key={value} aria-label={value?COSMETIC_LABELS[value]:'Không dùng trang sức trên đầu'} aria-pressed={cosmetics.glasses===value} onClick={()=>setCosmetics(p=>selectCosmetic(p,'glasses',value))}>{value&&<WardrobePortrait player={{color,cosmetics:{glasses:value,scarf:''}}}/>}<span>{value?COSMETIC_LABELS[value]:'Không dùng'}</span></button>)}</div></fieldset>
  <fieldset><legend>Trang sức trên thân</legend><div className="q4-gear-options q4-gear-labelled">{BODY_COSMETICS.map(value=><button key={value} aria-label={value?COSMETIC_LABELS[value]:'Không dùng trang sức trên thân'} aria-pressed={cosmetics.scarf===value} onClick={()=>setCosmetics(p=>selectCosmetic(p,'scarf',value))}>{value&&<WardrobePortrait player={{color,cosmetics:{glasses:'',scarf:value}}}/>}<span>{value?COSMETIC_LABELS[value]:'Không dùng'}</span></button>)}</div></fieldset>
  <fieldset><legend>Bộ liền</legend><div className="q4-gear-options q4-gear-labelled">{OUTFIT_COSMETICS.map(value=><button key={value} aria-label={value?COSMETIC_LABELS[value]:'Không dùng bộ liền'} aria-pressed={(cosmetics.outfit||'')===value} onClick={()=>setCosmetics(p=>selectCosmetic(p,'outfit',value))}>{value&&<WardrobePortrait player={{color,cosmetics:{glasses:'',scarf:'',outfit:value}}}/>}<span>{value?COSMETIC_LABELS[value]:'Không dùng'}</span></button>)}</div><p className="q4-outfit-rule">Bộ liền dùng riêng. Chọn trang sức rời sẽ tự tháo bộ liền.</p></fieldset>
  <button className="q4-action q4-green q4-wide" disabled={saving||closing} onClick={async()=>{setSaving(true);try{await onSave({color,...cosmetics});onClose()}catch{/* Room displays the error without discarding the draft. */}finally{setSaving(false)}}}>{saving?'Đang lưu…':'Lưu diện mạo'}</button></section>
 </div>
}
