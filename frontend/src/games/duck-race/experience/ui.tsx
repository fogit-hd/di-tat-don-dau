import { useEffect, useRef } from 'react'
export const ART='/assets/duck-race/experience-v4/'
export const clock=(ms:number)=>{const seconds=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`}
export function Glyph({kind}:{kind:'star'|'right'|'back'|'close'|'check'|'people'|'pause'|'play'}){
 const paths={star:'m16 3 4 8 9 1-6 7 1 9-8-4-8 4 1-9-6-7 9-1Z',right:'M6 16h19m-8-8 8 8-8 8',back:'M26 16H7m8-8-8 8 8 8',close:'m8 8 16 16M24 8 8 24',check:'m6 16 7 7L27 8',people:'M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-8 14v-5a8 8 0 0 1 16 0v5m2-14a5 5 0 0 0 0-10m2 15a7 7 0 0 1 5 7v2',pause:'M11 6v20M21 6v20',play:'m11 6 16 10-16 10Z'}
 return <svg viewBox="0 0 32 32" width="24" height="24" fill={kind==='star'?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]}/></svg>
}
export function usePanelMotion(key:string){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{if(!ref.current||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const motion=ref.current.animate([{opacity:.15,transform:'translateX(14px)'},{opacity:1,transform:'translateX(0)'}],{duration:240,easing:'cubic-bezier(.16,1,.3,1)'});return()=>motion.cancel()},[key]);return ref}
export function Hourglass({reduced}:{reduced:boolean}){
 const ref=useRef<HTMLCanvasElement>(null)
 useEffect(()=>{let active=true,handle=0;const im=new Image();im.src='/assets/duck-race/eras-v3/hourglass.webp';const draw=(now:number)=>{if(!active||!ref.current)return;const canvas=ref.current,ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,128,128);const f=reduced?0:Math.floor(now/160)%6;ctx.drawImage(im,f%3*im.width/3,Math.floor(f/3)*im.height/2,im.width/3,im.height/2,0,0,128,128);if(!reduced)handle=requestAnimationFrame(draw)};void im.decode().then(()=>{if(active)handle=requestAnimationFrame(draw)}).catch(()=>{});return()=>{active=false;cancelAnimationFrame(handle)}},[reduced])
 return <canvas ref={ref} width="128" height="128" className="q4-hourglass" aria-hidden="true"/>
}
