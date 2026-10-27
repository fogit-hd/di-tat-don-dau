import type { EventLogView } from '../api/types'
import { EventIcon } from './EventIcon'
import { ArtText as T } from './ArtText'
import { DisclosureArrow } from './PaintedIcon'

export function ResultEvents({events}:{events:EventLogView[]}){
 if(!events.length)return <p><T text="Chưa có sự kiện nào."/></p>
 return <div className="result-event-list">{events.map((event,index)=><details key={event.instanceId??`${event.eventId}-${event.year}-${index}`}>
  <summary><EventIcon name={event.icon} eventId={event.eventId} title={event.title} detail={event.body} tone={event.good?'good':'bad'}/><span><b><T text={event.title} bold/></b><small className={event.good?'up':'down'}><T text={event.effect}/></small></span><small><T text={`Năm ${event.year}`}/></small><DisclosureArrow/></summary>
  <p><T text={event.body}/></p>
 </details>)}</div>
}
