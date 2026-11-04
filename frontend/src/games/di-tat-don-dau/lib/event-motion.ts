import { createContext, useSyncExternalStore } from 'react'

export const EventMotionPaused = createContext(false)
let preference: MediaQueryList | undefined
const media=()=>preference ??= window.matchMedia('(prefers-reduced-motion: reduce)')
const listeners=new Set<()=>void>()
const notify=()=>listeners.forEach(listener=>listener())
const allowed=()=>typeof window!=='undefined'&&!document.hidden&&!media().matches
function subscribe(listener:()=>void) {
  if(!listeners.size) {
    document.addEventListener('visibilitychange',notify)
    media().addEventListener('change',notify)
  }
  listeners.add(listener)
  return ()=>{
    listeners.delete(listener)
    if(!listeners.size) {
      document.removeEventListener('visibilitychange',notify)
      media().removeEventListener('change',notify)
    }
  }
}
export const useEventMotionAllowed=()=>useSyncExternalStore(subscribe,allowed,()=>false)

const targets=new Map<Element,(visible:boolean)=>void>()
let observer:IntersectionObserver | undefined
export function observeEventIcon(node:Element,callback:(visible:boolean)=>void) {
  if(typeof IntersectionObserver==='undefined') {
    const frame=requestAnimationFrame(()=>callback(true))
    return ()=>cancelAnimationFrame(frame)
  }
  if(!observer)observer=new IntersectionObserver(entries=>{
    for(const entry of entries) targets.get(entry.target)?.(entry.isIntersecting&&entry.intersectionRect.width>0&&entry.intersectionRect.height>0)
  })
  targets.set(node,callback);observer.observe(node)
  return ()=>{targets.delete(node);observer?.unobserve(node);if(!targets.size){observer?.disconnect();observer=undefined}}
}
