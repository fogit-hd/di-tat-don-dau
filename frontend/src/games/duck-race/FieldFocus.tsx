import { useEffect, useRef } from 'react'
import { Application, Assets, Sprite, type Texture } from 'pixi.js'

/** Pointer-transparent Pixi feedback; the editable input keeps native semantics. */
export function FieldFocus() {
  const mount = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const host=mount.current!,field=host.parentElement!,app=new Application()
    let disposed=false,ready=false,active=field.contains(document.activeElement)
    const focus=()=>{active=true;host.dataset.active='true';if(ready){app.stage.visible=true;app.start()}}
    const blur=()=>{active=false;host.dataset.active='false';if(ready){app.stage.visible=false;app.render();app.stop()}}
    field.addEventListener('focusin',focus);field.addEventListener('focusout',blur)
    void(async()=>{
      await app.init({resizeTo:host,backgroundAlpha:0,antialias:true,resolution:Math.min(devicePixelRatio||1,2),autoDensity:true})
      if(disposed){app.destroy(true);return}
      host.appendChild(app.canvas);app.canvas.setAttribute('aria-hidden','true')
      const texture=await Assets.load<Texture>('/assets/duck-race/ui-v6/focus-feather.svg')
      if(disposed)return
      const feather=new Sprite(texture);feather.anchor.set(.5);feather.width=32;feather.height=24;app.stage.addChild(feather)
      const sparkTexture=await Assets.load<Texture>('/assets/duck-race/ui-v6/focus-spark.svg')
      if(disposed)return
      const sparks=Array.from({length:7},()=>{const sprite=new Sprite(sparkTexture);sprite.anchor.set(.5);sprite.width=sprite.height=9;app.stage.addChild(sprite);return sprite})
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches
      let elapsed=0
      app.ticker.add(t=>{
        elapsed+=t.deltaMS/1000;const w=app.screen.width,h=app.screen.height
        feather.position.set(w-25,h/2+(reduced?0:Math.sin(elapsed*2.5)*2));feather.rotation=reduced?0:Math.sin(elapsed*2)*.08
        sparks.forEach((s,i)=>{const phase=reduced?i/7:(elapsed*.35+i/7)%1;s.position.set(18+phase*Math.max(0,w-68),h-5-Math.sin(phase*Math.PI)*4);s.alpha=reduced?.8:Math.sin(phase*Math.PI);s.rotation=elapsed*.8+i})
      })
      ready=true;if(active)focus();else blur()
    })().catch(()=>{host.dataset.fallback='true'})
    return()=>{disposed=true;field.removeEventListener('focusin',focus);field.removeEventListener('focusout',blur);if(app.renderer)app.destroy(true,{children:true,texture:false,textureSource:false})}
  },[])
  return <span className="dq-field-focus" ref={mount} aria-hidden="true"><img src="/assets/duck-race/ui-v6/focus-feather.svg" alt=""/></span>
}
