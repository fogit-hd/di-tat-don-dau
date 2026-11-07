import { useEffect, useRef, useState } from 'react'
import type { RacerView } from '../contracts'

const ROOT = '/assets/duck-race/'
type Atlas = { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> }
const images = new Map<string, Promise<HTMLImageElement>>()
let atlas: Promise<Atlas> | undefined

function loadImage(src: string) {
  let pending = images.get(src)
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => { images.delete(src); reject(new Error('portrait')) }
      image.src = src
    })
    images.set(src, pending)
  }
  return pending
}

/** The same original body and registered wardrobe pixels used by the race. */
export function WardrobePortrait({ player, className = 'q4-duck-portrait' }: {
  player: Pick<RacerView, 'color' | 'cosmetics'>; className?: string
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [failedIdentity, setFailedIdentity] = useState('')
  const glasses = player.cosmetics?.glasses, scarf = player.cosmetics?.scarf
  const identity = [player.color, glasses, scarf].join('/')
  useEffect(() => {
    let stopped = false
    const items = [scarf, glasses].filter(Boolean)
    atlas ??= fetch(ROOT + 'experience-v4/cosmetics.json').then(response => {
      if (!response.ok) throw new Error('wardrobe')
      return response.json() as Promise<Atlas>
    }).catch(error => { atlas = undefined; throw error })
    void Promise.all([loadImage(`${ROOT}duckee/${player.color}/idle/0.png`),
      loadImage(ROOT + 'experience-v4/cosmetics.png'), atlas]).then(([body, accessories, data]) => {
      if (stopped || !canvas.current) return
      const context = canvas.current.getContext('2d')!
      context.clearRect(0, 0, 64, 64)
      context.imageSmoothingEnabled = false
      context.save()
      context.scale(64 / 48, 64 / 48)
      context.translate(-8, -12)
      context.drawImage(body, 0, 0)
      for (const item of items) {
        const frame = data.frames[`${item}/idle/0`].frame
        context.drawImage(accessories, frame.x, frame.y, frame.w, frame.h, 0, 0, 64, 64)
      }
      context.restore()
    }).catch(() => { if (!stopped) setFailedIdentity(identity) })
    return () => { stopped = true }
  }, [player.color, glasses, scarf, identity])
  return failedIdentity === identity
    ? <img className={className} src={`${ROOT}portraits-v6/duckee/${player.color}.webp`} alt="" draggable={false}/>
    : <canvas ref={canvas} width="64" height="64" className={className} aria-hidden="true"/>
}
