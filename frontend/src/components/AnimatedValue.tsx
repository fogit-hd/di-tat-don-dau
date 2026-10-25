import { useEffect, useRef, useState } from 'react'

/** Animates only a confirmed value; new confirmations cancel an unfinished transition. */
export function AnimatedValue({ value, format }: { value: number; format: (n: number) => string }) {
  const displayed = useRef(value)
  const [shown, setShown] = useState(value)
  useEffect(() => {
    if (Object.is(displayed.current,value)) return
    const from = displayed.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    const started = performance.now()
    const draw = (now: number) => {
      const progress = reduced ? 1 : Math.min(1,(now-started)/220)
      displayed.current = from + (value-from)*(1-Math.pow(1-progress,3))
      setShown(displayed.current)
      if (progress<1) frame=requestAnimationFrame(draw)
    }
    frame=requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  },[value])
  return <span className="animated-value" aria-label={format(value)}><span aria-hidden="true">{format(shown)}</span></span>
}
