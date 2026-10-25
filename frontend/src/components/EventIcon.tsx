import { memo, useContext, useEffect, useRef, useState } from 'react'
import { iconKind } from './icon-kind.ts'
import { EventMotionPaused, observeEventIcon, useEventMotionAllowed } from '../lib/event-motion.ts'
import { eventArtwork } from '../lib/event-art.ts'

/** Local GIF artwork; the browser keeps the same URL/DOM node across clock updates. */
export const EventIcon = memo(function EventIcon({ name, animated = true, tone, eventId, title, detail }: { name: string; animated?: boolean; tone?: 'good' | 'bad'; eventId?: string; title?: string; detail?: string }) {
  const mapped=iconKind(name||'spark')
  const kind=mapped==='coinsUp'&&tone==='bad'&&['coins','banknote','circle-dollar-sign','dollar-sign','euro','money'].includes(name.toLowerCase())?'coinsDown':mapped
  const node=useRef<HTMLSpanElement>(null)
  const [visible,setVisible]=useState(false)
  const [failed,setFailed]=useState<Set<string>>(()=>new Set())
  const allowed=useEventMotionAllowed()
  const paused=useContext(EventMotionPaused)
  useEffect(()=>{const element=node.current;if(!element)return;return observeEventIcon(element,setVisible)},[])
  const artwork=eventArtwork(eventId,title,detail)
  const fallback=`/assets/ui/event-loops-v1/${kind}`
  const base=artwork&&!failed.has(`${artwork.base}-poster.webp`)?artwork.base:fallback
  const playing=animated&&visible&&allowed&&!paused&&!failed.has(`${base}.gif`)
  const src=`${base}${playing?'.gif':'-poster.webp'}`
  const context=artwork?.context
  const contextSrc=context?`${context}${animated&&visible&&allowed&&!paused&&!failed.has(`${context}.gif`)?'.gif':'-poster.webp'}`:undefined
  const fail=(url:string)=>setFailed(prev=>new Set(prev).add(url))
  return <span ref={node} className={`ev-icon event-loop kind-${kind}${artwork?' event-specific':''}`} aria-hidden="true" data-event-kind={kind} data-event-art={artwork?.id} data-playing={playing}>
    <img src={src} alt="" width="96" height="96" decoding="async" loading="lazy" draggable={false} onError={()=>fail(src)} />
    {contextSrc&&!failed.has(`${context}-poster.webp`)&&<img className="event-context-art" src={contextSrc} alt="" width="96" height="96" decoding="async" loading="lazy" draggable={false} onError={()=>fail(contextSrc)} />}
  </span>
})
