import { useEffect, useRef, useState } from 'react'
import { HERO_ASSET_ROOT, HERO_SPRITES, HERO_LOOP_SECONDS, heroAssetUrl, heroMotion, paintHero, type HeroSprites } from '../lib/living-hero'

/** Decorative Canvas2D scene. Forms, navigation and text remain real DOM controls. */
export function LivingHeroScene({ suspended = false }: { suspended?: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [ready, setReady] = useState(false)
  const pausedRef = useRef(paused)
  const suspendedRef = useRef(suspended)
  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { suspendedRef.current = suspended }, [suspended])

  useEffect(() => {
    const node = canvas.current, container = root.current
    const ctx = node?.getContext('2d', { alpha: true })
    if (!node || !ctx || !container) return
    let disposed=false, frame=0, lastTime=0, lastPaint=0, elapsed=0, visible=true, dirty=true, presented=false
    let width=0, height=0, mobile=false, background: HTMLImageElement | undefined
    let desktop: HTMLImageElement | undefined, portrait: HTMLImageElement | undefined
    let loadingDesktop=false, loadingPortrait=false
    const sprites: HeroSprites = {}
    const media=window.matchMedia('(max-width: 900px) and (min-height: 541px)')
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)')
    const load=async(name:string) => {
      const image=new Image();image.decoding='async';image.src=heroAssetUrl(name)
      try {await image.decode();return disposed?undefined:image} catch {return undefined}
    }
    const resize=() => {
      const bounds=container.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.5)
      width=bounds.width;height=bounds.height;mobile=media.matches
      node.width=Math.max(1,Math.round(width*dpr));node.height=Math.max(1,Math.round(height*dpr))
      ctx.setTransform(dpr,0,0,dpr,0,0);background=mobile?portrait:desktop;dirty=true
      if(!background&&presented){presented=false;setReady(false)}
      // Fetch only the matching backplate; cache the other if the layout changes.
      if(mobile&&!portrait&&!loadingPortrait){loadingPortrait=true;void load('scene-mobile').then(image=>{portrait=image;if(!disposed)resize()})}
      if(!mobile&&!desktop&&!loadingDesktop){loadingDesktop=true;void load('scene-desktop').then(image=>{desktop=image;if(!disposed)resize()})}
    }
    const observer=new ResizeObserver(resize);observer.observe(container)
    const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;lastTime=0;dirty=true});intersection.observe(container)
    const visibility=()=>{lastTime=0;dirty=true}
    const motionPreference=()=>{setPaused(reduced.matches);dirty=true}
    document.addEventListener('visibilitychange',visibility)
    reduced.addEventListener('change',motionPreference);media.addEventListener('change',resize)
    for(const key of HERO_SPRITES)void load(key).then(image=>{if(image){sprites[key]=image;dirty=true}})
    const tick=(now:number)=>{
      if(disposed)return
      const actorsReady=['carry','setdown','return','receiver','turn','pivot','parcel','hook','boat'].every(key=>Boolean(sprites[key as keyof HeroSprites]))
      const running=actorsReady&&!pausedRef.current&&!suspendedRef.current&&visible&&!document.hidden
      node.dataset.running=String(running)
      if(running&&lastTime)elapsed=(elapsed+Math.min((now-lastTime)/1000,.08))%HERO_LOOP_SECONDS
      lastTime=running?now:0
      // No redraws while paused, hidden or covered; no catch-up on return.
      if(background&&visible&&!document.hidden&&(dirty||(running&&now-lastPaint>=1000/(mobile?30:60)))){
        paintHero(ctx,width,height,background,sprites,elapsed,mobile)
        if(!presented&&actorsReady){presented=true;setReady(true)}
        node.dataset.time=elapsed.toFixed(3);node.dataset.running=String(running)
        node.dataset.layout=mobile?'portrait':'landscape';lastPaint=now;dirty=false
        node.dataset.delivery=heroMotion(elapsed,mobile).stage
      }
      frame=requestAnimationFrame(tick)
    }
    resize();frame=requestAnimationFrame(tick)
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motionPreference);media.removeEventListener('change',resize)}
  }, [])

  return <div ref={root} className="living-hero" data-ready={ready}>
    <picture className="living-hero-fallback" aria-hidden="true">
      <source media="(max-width: 900px) and (min-height: 541px)" srcSet={`${HERO_ASSET_ROOT}scene-mobile.webp`}/>
      <img src={`${HERO_ASSET_ROOT}scene-desktop.webp`} width="1672" height="941" alt="" draggable={false} decoding="async" fetchPriority="high"/>
    </picture>
    <canvas ref={canvas} className="living-hero-canvas" aria-hidden="true"/>
    <button className="living-hero-toggle" type="button" disabled={!ready} aria-label={paused?'Phát hoạt cảnh':'Tạm dừng hoạt cảnh'} aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">{paused?<path d="M8 4 20 12 8 20Z" fill="currentColor"/>:<path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>}</svg>
    </button>
  </div>
}
