import { useMemo, useState, type ReactNode } from 'react'
import type { EventLogView } from '../api/types.ts'
import { currentEventEntries } from '../lib/ongoing-events.ts'

import { Attention } from '../lib/event-attention.ts'

/** Unread markers outlive a short effect, tab switches and the arrival animation. No automatic dialogs. */
export function EventAttention({ events, scope, available, children }: { events: EventLogView[]; scope: string; available: boolean; children: ReactNode }) {
  const keys = useMemo(()=>currentEventEntries(events).map(e=>e.noticeKey!),[events])
  const signature=keys.join('|')
  const [state,setState]=useState(()=>({scope,signature,initialized:available,known:new Set(keys),unread:new Set<string>()}))
  if(state.scope!==scope || (!state.initialized && available)) {
    setState({scope,signature,initialized:available,known:new Set(keys),unread:new Set()})
  } else if(state.signature!==signature) {
    // Expired effects remain unread in history. A record evicted from the server's
    // capped history must not leave an unread count the player can never open.
    const present=new Set(keys)
    const unread=new Set([...state.unread].filter(key=>present.has(key)))
    const known=new Set(state.known)
    for(const key of keys) { if(!known.has(key)&&state.initialized)unread.add(key);known.add(key) }
    setState({...state,signature,known,unread})
  }
  return <Attention.Provider value={{unread:state.unread,markSeen:key=>setState(prev=>{if(!prev.unread.has(key))return prev;const unread=new Set(prev.unread);unread.delete(key);return {...prev,unread}})}}>{children}</Attention.Provider>
}
