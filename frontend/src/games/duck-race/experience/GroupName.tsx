import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** Keep the full name in the data; reveal clipped labels without moving the layout. */
export function GroupName({ name }: { name: string }) {
  const text = useRef<HTMLSpanElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLSpanElement>(null)
  const pinned = useRef(false)
  const [truncated, setTruncated] = useState(false)
  const [expanded, setOpen] = useState(false)
  const open = expanded && truncated
  const [position, setPosition] = useState({ left: 12, top: 12 })
  const id = useId()

  useLayoutEffect(() => {
    const element = text.current
    if (!element) return
    let active = true
    const measure = () => {
      if (active) setTruncated(element.scrollWidth > element.clientWidth + 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    void document.fonts.ready.then(measure)
    return () => { active = false; observer.disconnect() }
  }, [name])

  useLayoutEffect(() => {
    if (!open || !trigger.current || !popup.current) return
    const anchor = trigger.current.getBoundingClientRect()
    const box = popup.current.getBoundingClientRect()
    const left = Math.max(12, Math.min(anchor.left + (anchor.width - box.width) / 2, window.innerWidth - box.width - 12))
    const top = anchor.top >= box.height + 20 ? anchor.top - box.height - 8 : anchor.bottom + 8
    setPosition({ left, top: Math.max(12, Math.min(top, window.innerHeight - box.height - 12)) })
  }, [open, name])

  useEffect(() => {
    if (!open) return
    const close = () => { pinned.current = false; setOpen(false) }
    const outside = (event: PointerEvent) => {
      if (!trigger.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) close()
    }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    const scroll = (event: Event) => { if (!popup.current?.contains(event.target as Node)) close() }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    document.addEventListener('scroll', scroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
      document.removeEventListener('scroll', scroll, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return <span className="q4-group-name">
    <span ref={text} className="q4-group-name__text" dir="auto" aria-hidden={truncated || undefined}>{name}</span>
    {truncated && <button ref={trigger} type="button" className="q4-group-name__reveal"
      aria-label={name} aria-expanded={open} aria-controls={open ? id : undefined}
      onFocus={() => setOpen(true)}
      onBlur={() => { pinned.current = false; setOpen(false) }}
      onPointerEnter={event => { if (event.pointerType === 'mouse') setOpen(true) }}
      onPointerLeave={() => { if (!pinned.current && document.activeElement !== trigger.current) setOpen(false) }}
      onClick={() => { pinned.current = true; setOpen(true) }} />}
    {open && truncated && createPortal(
      <span ref={popup} id={id} role="tooltip" dir="auto" className="q4-group-name-popup" style={position}>{name}</span>, document.body,
    )}
  </span>
}
