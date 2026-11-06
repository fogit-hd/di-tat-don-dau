import { useEffect, useRef, useState } from 'react'
import { PhaserView } from './PhaserView'

/** Decorative native Phaser feedback; no second rectangle over the painted field. */
export function FieldFeedback({reduced}:{reduced:boolean}){
 const root=useRef<HTMLSpanElement>(null),[focused,setFocused]=useState(false),[ready,setReady]=useState(false)
 useEffect(()=>{
  const field=root.current!.parentElement!
  const update=()=>setFocused(field.contains(document.activeElement))
  field.addEventListener('focusin',update);field.addEventListener('focusout',update);update()
  return()=>{field.removeEventListener('focusin',update);field.removeEventListener('focusout',update)}
 },[])
 return <span ref={root} className="q4-field-feedback" data-ready={ready} aria-hidden="true">{focused&&<><img src="/assets/duck-race/ui-v6/focus-feather.svg" alt=""/><PhaserView kind="field" input={{now:0,host:false,reduced}} onReady={setReady}/></>}</span>
}
