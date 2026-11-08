import { useEffect, useRef, useState } from 'react'
import type { RacerView } from '../contracts'
import { cosmeticItems } from '../experience-contracts'
import { APPAREL_ROOT, newApparel } from './wardrobe-art'

const ROOT = '/assets/duck-race/'
type Atlas = { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> }
const images = new Map<string, Promise<HTMLImageElement>>()
const atlases = new Map<string,Promise<Atlas>>()
function loadAtlas(root:string){
 let pending=atlases.get(root)
 if(!pending){pending=fetch(root+'cosmetics.json').then(response=>{if(!response.ok)throw new Error('wardrobe');return response.json() as Promise<Atlas>}).catch(error=>{atlases.delete(root);throw error});atlases.set(root,pending)}
 return pending
}

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
  const glasses = player.cosmetics?.glasses, scarf = player.cosmetics?.scarf, outfit=player.cosmetics?.outfit
  const identity = [player.color, glasses, scarf, outfit].join('/')
  useEffect(() => {
    let stopped = false
    const items = cosmeticItems({glasses:glasses||'',scarf:scarf||'',outfit})
    void Promise.all([loadImage(`${ROOT}duckee/${player.color}/idle/0.png`),
      Promise.all(items.map(async item=>{const root=newApparel(item)?APPAREL_ROOT:ROOT+'experience-v4/';return {item,image:await loadImage(root+'cosmetics.png'),data:await loadAtlas(root)}}))]).then(([body, layers]) => {
      if (stopped || !canvas.current) return
      const context = canvas.current.getContext('2d')!
      context.clearRect(0, 0, 64, 64)
      context.imageSmoothingEnabled = false
      context.save()
      context.scale(64 / 48, 64 / 48)
      context.translate(-8, -12)
      context.drawImage(body, 0, 0)
      for (const {item,image,data} of layers) {
        const frame = data.frames[`${item}/idle/0`].frame
        context.drawImage(image, frame.x, frame.y, frame.w, frame.h, 0, 0, 64, 64)
      }
      context.restore()
    }).catch(() => { if (!stopped) setFailedIdentity(identity) })
    return () => { stopped = true }
  }, [player.color, glasses, scarf, outfit, identity])
  return failedIdentity === identity
    ? <img className={className} src={`${ROOT}portraits-v6/duckee/${player.color}.webp`} alt="" draggable={false}/>
    : <canvas ref={canvas} width="64" height="64" className={className} aria-hidden="true"/>
}
