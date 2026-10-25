import { useEffect, useRef, useState } from 'react'
import type { EventEntry, EventGroup } from '../lib/ongoing-events.ts'
import { useEventAttention } from '../lib/event-attention.ts'
import { EventIcon } from './EventIcon.tsx'

/** Only explicit row clicks open detail; new events never take focus from play. */
export function EventRows({ entries, empty = 'Chưa có sự kiện nào.', compact = false }: { entries: EventEntry[]; empty?: string; compact?: boolean }) {
  const attention=useEventAttention()
  const signature=entries.map(e=>e.key).join('|')
  const [presence,setPresence]=useState(()=>({signature,rows:entries.map(entry=>({entry,arriving:false,exiting:false}))}))
  if(presence.signature!==signature) {
    const oldKeys=new Set(presence.rows.map(row=>row.entry.key))
    const newKeys=new Set(entries.map(entry=>entry.key))
    setPresence({signature,rows:[...entries.map(entry=>({entry,arriving:!oldKeys.has(entry.key),exiting:false})),...presence.rows.filter(row=>!newKeys.has(row.entry.key)).map(row=>({...row,arriving:false,exiting:true}))]})
  }
  const hasExits=presence.rows.some(row=>row.exiting)
  useEffect(()=>{
    if(!hasExits)return
    const timer=window.setTimeout(()=>setPresence(prev=>({...prev,rows:prev.rows.filter(row=>!row.exiting)})),180)
    return ()=>window.clearTimeout(timer)
  },[hasExits,signature])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const selected = entries.find(entry => entry.key === selectedKey)
  useEffect(() => {
    const node = dialog.current
    if (selected && !node?.open) node?.showModal()
    else if (!selected && node?.open) node.close()
  }, [selected])
  return <>
    <div className="event-rows">
      {!entries.length && <p className="quiet">{empty}</p>}
      {presence.rows.map(row => {
        const entry=entries.find(item=>item.key===row.entry.key)??row.entry
        const unread=Boolean(entry.noticeKey&&attention.unread.has(entry.noticeKey))
        return <button type="button" key={entry.key} className={`event-row${entry.bad ? ' bad' : ' good'}${row.exiting?' event-exiting':row.arriving?' event-arriving':''}`} disabled={row.exiting} aria-hidden={row.exiting || undefined} aria-haspopup="dialog" onClick={() => {if(entry.noticeKey)attention.markSeen(entry.noticeKey);setSelectedKey(entry.key)}}>
          <EventIcon name={entry.icon} tone={entry.bad?'bad':'good'} eventId={entry.eventId} title={entry.label} detail={`${entry.detail} ${entry.impact}`} />
          <span className="event-row-copy"><b title={entry.label}>{entry.label}{unread&&!row.exiting&&<em className="event-new-badge">Mới</em>}</b><span className={entry.bad ? 'down' : 'up'}>{entry.impact}</span></span>
          <small title={entry.remaining}>{row.exiting?(/^Còn |^Áp dụng /.test(entry.remaining)?'Hết hiệu lực':'Đã vào lịch sử'):compact ? entry.remaining.replace('Áp dụng từ năm kế tiếp · kéo dài ', 'Chờ · ').replace(/^.*Hiệu lực lâu dài$/, 'Lâu dài').replace(/^.*Chưa sử dụng · một lần$/, 'Chưa dùng') : entry.remaining}</small>
          <svg className="event-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
        </button>
      })}
    </div>
    <dialog ref={dialog} className="event-detail-dialog" aria-label="Chi tiết sự kiện" onClose={() => setSelectedKey(null)}>
      {selected && <div><EventIcon name={selected.icon} tone={selected.bad?'bad':'good'} eventId={selected.eventId} title={selected.label} detail={`${selected.detail} ${selected.impact}`} /><h2>{selected.label}</h2><p>{selected.detail}</p><p className={selected.bad ? 'down' : 'up'}>{selected.impact}</p><small>{selected.remaining}</small></div>}
      <button type="button" className="btn" onClick={() => dialog.current?.close()}>Đóng</button>
    </dialog>
  </>
}

export function EventOverview({ current, ongoing, onShowAll }: { current: EventEntry[]; ongoing: EventEntry[]; onShowAll: (group: EventGroup) => void }) {
  const attention=useEventAttention()
  const [group, setGroup] = useState<'current' | 'ongoing' | null>(null)
  const activeGroup = group ?? (current.length ? 'current' : 'ongoing')
  const entries = activeGroup === 'current' ? current : ongoing
  return <section className="event-overview" aria-label="Tóm tắt sự kiện">
    <div className="event-overview-heading">
      <h2>Sự kiện</h2>
      <button type="button" aria-pressed={activeGroup === 'current'} onClick={() => setGroup('current')}>Năm nay <b>{current.length}</b></button>
      <button type="button" aria-pressed={activeGroup === 'ongoing'} onClick={() => setGroup('ongoing')}>Còn hiệu lực <b>{ongoing.length}</b></button>
    </div>
    <EventRows key={activeGroup} compact entries={entries.slice(0, 2)} empty={activeGroup === 'current' ? 'Năm nay chưa có sự kiện.' : 'Chưa có sự kiện nào đang diễn ra.'} />
    <button type="button" className="event-show-all" onClick={() => onShowAll(activeGroup)}>Xem tất cả ({current.length + ongoing.length}){attention.unread.size>0&&<span className="event-unread-count"> · {attention.unread.size} chưa xem</span>}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg></button>
  </section>
}
