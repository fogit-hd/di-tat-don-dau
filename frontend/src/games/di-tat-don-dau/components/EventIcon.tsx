import { memo, useState } from 'react'
import { iconKind } from './icon-kind.ts'
import { eventArtwork, fallbackEventArt } from '../lib/event-art.ts'

/** Approved, static alpha artwork. No playback, composited context symbols or clock-driven src changes. */
export const EventIcon = memo(function EventIcon({ name, tone, eventId, title, detail }: { name: string; animated?: boolean; tone?: 'good' | 'bad'; eventId?: string; title?: string; detail?: string }) {
  const mapped=iconKind(name||'spark')
  const kind=mapped==='coinsUp'&&tone==='bad'&&['coins','banknote','circle-dollar-sign','dollar-sign','euro','money'].includes(name.toLowerCase())?'coinsDown':mapped
  const [failed,setFailed]=useState<string | null>(null)
  const artwork=eventArtwork(eventId,title,detail)
  const preferred=`${artwork?.base ?? fallbackEventArt(kind,title)}.${artwork?.extension??'webp'}`
  const fallback=`${fallbackEventArt(kind,title)}.webp`
  const src=failed===preferred?fallback:preferred
  return <span className={`ev-icon event-static kind-${kind}`} aria-hidden="true" data-event-kind={kind} data-event-art={artwork?.id}>
    <img src={src} alt="" width="256" height="256" decoding="async" loading="lazy" draggable={false} onError={()=>{if(src!==fallback)setFailed(preferred)}} />
  </span>
})
