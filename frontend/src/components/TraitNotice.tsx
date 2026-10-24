import { useEffect, useRef } from 'react'
import type { TraitView } from '../api/types.ts'
import { EventIcon } from './EventIcon.tsx'
import { traitDetail, traitIsBad } from '../lib/special-status.ts'

/** Stable keys animate only arriving statuses, without moving focus or blocking play. */
export function TraitNotice({ traits }: { traits: TraitView[] }) {
  const strip = useRef<HTMLDivElement>(null)
  const observed = useRef(new Set<string>())
  useEffect(() => {
    const fresh = traits.some(trait => !observed.current.has(trait.id))
    observed.current = new Set(traits.map(trait => trait.id))
    if (fresh && strip.current) strip.current.scrollLeft = 0
  }, [traits])
  const ordered = [...traits].reverse().sort((a, b) => (b.acquiredYear ?? Number.MAX_SAFE_INTEGER) - (a.acquiredYear ?? Number.MAX_SAFE_INTEGER))
  return <div ref={strip} className="trait-status-strip" role="status" aria-live="polite" aria-atomic="false" aria-label="Trạng thái đặc biệt" tabIndex={0}>
    {!traits.length && <span className="trait-status-empty">Trạng thái đặc biệt: chưa có</span>}
    {ordered.map(trait => <span key={trait.id} className={`trait-status-item${traitIsBad(trait) ? ' is-bad' : ''}`} title={traitDetail(trait)}>
      <EventIcon name={trait.icon ?? (traitIsBad(trait) ? 'storm' : 'sun')} />
      <b>{trait.label}</b>
      <small>{trait.acquiredYear == null ? 'Đang có hiệu lực' : `Từ năm ${trait.acquiredYear}`}</small>
    </span>)}
  </div>
}
