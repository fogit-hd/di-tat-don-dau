import { useEffect, useState } from 'react'
import type { SuccessionNotice } from '../api/types.ts'
import { factoryArt } from '../lib/art.ts'
import { vnd } from '../lib/format.ts'

export function SuccessionReveal({
  notice,
  industryId,
  label,
  detail,
  onDone,
}: {
  notice: SuccessionNotice
  industryId: string
  label: string
  detail: string
  onDone: () => void
}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [flipped, setFlipped] = useState(reduced)
  const shown = useCount(notice.assetsBefore, notice.assetsAfter, flipped)

  useEffect(() => {
    if (reduced) return
    const flip = window.setTimeout(() => setFlipped(true), 1400)
    return () => window.clearTimeout(flip)
  }, [reduced])

  return (
    <section className="succession">
      <img src={factoryArt(industryId)} alt="" className="succession-photo" />
      <div className="card succession-card">
        <p className="situation">{notice.causeText}</p>
        <div className="flip">
          <div className={`flip-inner${flipped ? ' on' : ''}`}>
            <div className="flip-face">Người thừa kế</div>
            <div className="flip-face back">
              <b>{label}</b>
              <span>{detail}</span>
            </div>
          </div>
        </div>
        <p className="asset-count">
          {vnd(notice.assetsBefore)} → <b>{vnd(shown)}</b>
        </p>
        <button type="button" className="btn big" onClick={onDone}>
          Xem kết quả đã chốt
        </button>
      </div>
    </section>
  )
}

function useCount(from: number, to: number, play: boolean) {
  const [value, setValue] = useState(from)
  useEffect(() => {
    if (!play) {
      setValue(from)
      return
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setValue(to)
      return
    }
    const start = performance.now()
    const duration = 1600
    let frame = 0
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(from + (to - from) * eased))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [from, to, play])
  return value
}
