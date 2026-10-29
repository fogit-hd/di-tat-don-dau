import type { EventLogView } from '../api/types'
import { EventIcon } from './EventIcon'
import { ArtText as T } from './ArtText'
import { DisclosureArrow } from './PaintedIcon'
import { useState } from 'react'
import { PAGE_SIZE } from '../lib/pagination'
import { PageControls } from './PageControls'

export function ResultEvents({events}:{events:EventLogView[]}){
 const [page,setPage]=useState(0),current=Math.min(page,Math.max(0,Math.ceil(events.length/PAGE_SIZE)-1))
 if(!events.length)return <p><T text="Chưa có sự kiện nào."/></p>
 return <div className="result-event-list">{events.slice(current*PAGE_SIZE,(current+1)*PAGE_SIZE).map((event,index)=><details key={event.instanceId??`${event.eventId}-${event.year}-${index}`}>
  <summary><EventIcon name={event.icon} eventId={event.eventId} title={event.title} detail={event.body} tone={event.good?'good':'bad'}/><span><b><T text={event.title} bold/></b><small className={event.good?'up':'down'}><T text={event.effect}/></small></span><small><T text={`Năm ${event.year}`}/></small><DisclosureArrow/></summary>
  <p><T text={event.body}/></p><p className="result-event-receipt"><T text={event.effect}/></p>
 </details>)}<PageControls page={current} count={events.length} onChange={setPage} label="Trang lịch sử sự kiện"/></div>
}
