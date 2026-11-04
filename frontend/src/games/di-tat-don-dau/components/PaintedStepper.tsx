import { useEffect, useRef } from 'react'
import './painted-stepper.css'

function PaintedArrow({direction,label,disabled,onClick}:{direction:'up'|'down';label:string;disabled:boolean;onClick:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),images=useRef<HTMLImageElement[]>([]),raf=useRef(0),index=useRef(0)
 const draw=(frame:number)=>{index.current=frame;const context=canvas.current?.getContext('2d'),img=images.current[frame];if(context&&img?.complete){context.clearRect(0,0,88,88);context.drawImage(img,0,0,88,88)}}
 const play=(frames:number[],duration:number)=>{
  cancelAnimationFrame(raf.current)
  if(disabled)return
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){draw(frames[0]);return}
  const start=performance.now();const loop=(now:number)=>{const progress=Math.min(1,(now-start)/duration);draw(frames[Math.min(frames.length-1,Math.floor(progress*frames.length))]);if(progress<1)raf.current=requestAnimationFrame(loop)};raf.current=requestAnimationFrame(loop)
 }
 useEffect(()=>{
  let cancelled=false
  images.current=Array.from({length:8},(_,frame)=>{const img=new Image();img.src=`/assets/session-v2/painted-stepper/${direction}-${frame}.svg`;return img})
  void Promise.all(images.current.map(img=>img.decode())).then(()=>{if(!cancelled)draw(disabled?7:0)}).catch(()=>{})
  return()=>{cancelled=true;cancelAnimationFrame(raf.current)}
 },[direction,disabled])
 return <button type="button" className="painted-stepper-arrow" aria-label={label} disabled={disabled} data-direction={direction} onClick={()=>{play([5,6,0],160);onClick()}} onPointerEnter={()=>play([1,2,3,4,0],180)} onPointerLeave={()=>{cancelAnimationFrame(raf.current);draw(disabled?7:0)}} onPointerDown={()=>{cancelAnimationFrame(raf.current);draw(5)}} onPointerCancel={()=>draw(disabled?7:0)} onKeyDown={e=>{if(e.key===' '||e.key==='Enter')draw(5)}} onKeyUp={()=>draw(disabled?7:0)}><canvas ref={canvas} width={88} height={88} aria-hidden="true"/></button>
}

export function PaintedStepper({label,value,min,max,onChange}:{label:string;value:number;min:number;max:number;onChange:(n:number)=>void}){
 const input=useRef<HTMLInputElement>(null)
 useEffect(()=>{if(input.current&&input.current.value!==String(value))input.current.value=String(value)},[value])
 return <span className="painted-stepper"><input ref={input} aria-label={label} type="number" inputMode="numeric" required min={min} max={max} step={1} defaultValue={value} onChange={e=>{if(Number.isFinite(e.target.valueAsNumber))onChange(e.target.valueAsNumber)}}/><PaintedArrow direction="up" label={`Tăng ${label.toLowerCase()}`} disabled={value>=max} onClick={()=>onChange(Math.min(max,Math.max(min,Math.round(value)+1)))}/><PaintedArrow direction="down" label={`Giảm ${label.toLowerCase()}`} disabled={value<=min} onClick={()=>onChange(Math.max(min,Math.min(max,Math.round(value)-1)))}/></span>
}
