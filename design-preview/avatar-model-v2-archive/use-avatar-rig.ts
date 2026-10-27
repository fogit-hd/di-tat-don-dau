import { useEffect, useRef } from 'react'

/** Procedural skeletal poses, applied to SVG bone transforms. No CSS animation or image shaking. */
export function useAvatarRig(enabled:boolean,outfit:string){
 const root=useRef<SVGGElement>(null),head=useRef<SVGGElement>(null),leftUpper=useRef<SVGGElement>(null),leftLower=useRef<SVGGElement>(null),rightUpper=useRef<SVGGElement>(null),rightLower=useRef<SVGGElement>(null)
 const outfitRef=useRef(outfit),gestureStart=useRef(-10000)
 useEffect(()=>{if(outfitRef.current!==outfit){outfitRef.current=outfit;gestureStart.current=performance.now()}},[outfit])
 useEffect(()=>{
  if(!enabled||!root.current)return
  const node=root.current,svg=node.ownerSVGElement!,motion=matchMedia('(prefers-reduced-motion: reduce)')
  let frame=0,last=performance.now(),visible=true,alive=true,frames=0
  const pose=[0,0,0,0,0],start=last
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting});observer.observe(svg)
  function tick(now:number){
   if(!alive)return
   frame=requestAnimationFrame(tick)
   if(now-last<25)return
   const dt=Math.min(.1,(now-last)/1000);last=now
   if(!visible||document.hidden||motion.matches){svg.dataset.animation='rest';return}
   const t=(now-start)/1000,p=(now-gestureStart.current)/1800,inspect=p>=0&&p<1?Math.sin(Math.PI*p)**2:0
   const idle=Math.sin(t*1.55),breath=Math.sin(t*1.8)
   const targets=[-1.8+idle*1.6-inspect*8,2+Math.sin(t*1.15)*2-inspect*82,1.7-idle*1.8-inspect*4,-2+Math.cos(t*1.2)*2-inspect*30,Math.sin(t*.75)*1.4+inspect*8]
   const blend=1-Math.exp(-dt*9);for(let i=0;i<pose.length;i++)pose[i]+=(targets[i]-pose[i])*blend
   root.current?.setAttribute('transform',`translate(${Math.sin(t*.7)*.9} ${-breath*.7}) rotate(${Math.sin(t*.7)*.45} 160 550)`)
   head.current?.setAttribute('transform',`rotate(${pose[4]} 160 157) translate(0 ${-breath*.35})`)
   leftUpper.current?.setAttribute('transform',`rotate(${pose[0]} 105 190)`)
   leftLower.current?.setAttribute('transform',`rotate(${pose[1]} 83 268)`)
   rightUpper.current?.setAttribute('transform',`rotate(${pose[2]} 105 190)`)
   rightLower.current?.setAttribute('transform',`rotate(${pose[3]} 83 268)`)
   svg.dataset.animation=inspect>.06?'inspecting':'idle';svg.dataset.motionFrame=String(++frames)
  }
  frame=requestAnimationFrame(tick)
  return()=>{alive=false;cancelAnimationFrame(frame);observer.disconnect();for(const ref of [root,head,leftUpper,leftLower,rightUpper,rightLower])ref.current?.removeAttribute('transform')}
 },[enabled])
 return {root,head,leftUpper,leftLower,rightUpper,rightLower}
}
