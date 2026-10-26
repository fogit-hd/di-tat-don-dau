import { useEffect, useRef, useState } from 'react'
import { atlas, preloadAdvisor, type Frame, type Assets } from '../lib/advisor-assets'
import type { GuideStep } from '../lib/first-year-guide'
import { dialogueChunks, LETTER_SECONDS, RESPONSE_SECONDS } from '../lib/advisor-dialogue'
import './first-year-advisor.css'

const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
function resolveFrame(name:string,index:number) {
  let key=`${name}:${index}`,frame=atlas.clips[name].frames[index]
  if(frame.shared){key=frame.shared;const [clip,n]=key.split(':');frame=atlas.clips[clip].frames[Number(n)]}
  return {key,frame:frame as Exclude<Frame,{shared:string}>}
}
function direction(dx:number,dy:number){const side=dx<0?'left':'right';return dy < -Math.abs(dx)*.55?(side==='right'?'point':'point-up-left'):dy>Math.abs(dx)*.65?'point-down-'+side:'point-'+side}
function intersects(a:DOMRect|{left:number;right:number;top:number;bottom:number},b:DOMRect){return a.left<b.right+8&&a.right>b.left-8&&a.top<b.bottom+8&&a.bottom>b.top-8}

export function FirstYearAdvisor(props:{step:GuideStep;stepIndex:number;paused:boolean;busy:boolean;error:string;onAcknowledge:(action:string)=>Promise<boolean>}) {
  const latest=useRef(props)
  useEffect(()=>{latest.current=props},[props])
  const canvas=useRef<HTMLCanvasElement>(null),bubble=useRef<HTMLElement>(null),words=useRef<HTMLParagraphElement>(null),announcement=useRef<HTMLParagraphElement>(null),cue=useRef<HTMLParagraphElement>(null)
  const [ready,setReady]=useState(false),[loadError,setLoadError]=useState(false),[finishError,setFinishError]=useState(false)
  const readyRef=useRef(false)
  const respond=useRef<()=> 'consumed'|'action'>(()=>'consumed')
  useEffect(()=>{
    let alive=true,raf=0,last=0,t=0,entered=false,stepSeen='',speechTime=0,speechTotal=0,shown=0,reading=false,arrival=0,finishedAt=0,finishSent=false
    let chars:string[]=[],beats:number[]=[],point:{name:string;progress:number;out:boolean;hold:number;subject:string}|null=null,confirm=0,idleStart=0,measureKey=''
    let chunks:string[]=[],chunkIndex=0,pauseUntil=Infinity,responded=false,focusMark:HTMLElement|null=null,actionMark:HTMLElement|null=null,originalAria:string|null=null
    const pointer={x:-1,y:-1}
    const reduced=matchMedia('(prefers-reduced-motion: reduce)')
    const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('vi',{granularity:'grapheme'}):null
    const select=()=>document.querySelector<HTMLElement>(latest.current.step.target||':not(*)')
    const focusSelector=()=>/bấm/iu.test(chunks[chunkIndex]??'')?latest.current.step.target:latest.current.step.focus??latest.current.step.target
    const focusSelect=()=>document.querySelector<HTMLElement>(focusSelector()||':not(*)')
    function finishSpeech(){reading=false;pauseUntil=t+RESPONSE_SECONDS;idleStart=t;if(words.current)words.current.textContent=chars.join('')}
    function beginChunk(index:number){
      chunkIndex=index;responded=false;finishedAt=0;if(point)point.out=true
      const normalized=chunks[index].normalize('NFC')
      chars=segmenter?Array.from(segmenter.segment(normalized),part=>part.segment):Array.from(normalized);beats=[];speechTotal=0
      for(const char of chars){beats.push(speechTotal);speechTotal+=/[.!?]/.test(char)?.3:/[,;:]/.test(char)?.14:LETTER_SECONDS}
      shown=Math.min(6,chars.length);speechTime=beats[shown]??0;reading=!reduced.matches;pauseUntil=reduced.matches?t+RESPONSE_SECONDS:Infinity;idleStart=t
      if(words.current)words.current.textContent=reduced.matches?normalized:chars.slice(0,shown).join('')
      if(announcement.current)announcement.current.textContent=normalized
      focusSelect()?.scrollIntoView({block:'nearest',inline:'nearest',behavior:reduced.matches?'instant':'smooth'})
      bubble.current?.focus({preventScroll:true})
    }
    function prepareStep(){
      const p=latest.current
      const stepKey=`${p.stepIndex}:${p.step.action}:${p.step.text}`
      if(stepSeen===stepKey)return
      const hadStep=Boolean(stepSeen);stepSeen=stepKey;setFinishError(false);finishSent=false;finishedAt=0
      if(point)point.out=true
      confirm=hadStep&&(p.step.action==='crew'||p.step.action==='enterprise-ready')?1.15:0
      chunks=dialogueChunks(p.step.text);beginChunk(0)
    }
    respond.current=()=>{
      if(!entered||latest.current.paused||latest.current.busy)return 'consumed'
      if(reading){finishSpeech();return 'consumed'}
      if(chunkIndex<chunks.length-1){beginChunk(chunkIndex+1);return 'consumed'}
      responded=true
      return latest.current.step.action==='complete'?'consumed':'action'
    }
    function pointerMove(event:PointerEvent){pointer.x=event.clientX;pointer.y=event.clientY}
    document.addEventListener('pointermove',pointerMove,{passive:true})
    function layout(target:HTMLElement|null){
      const vw=innerWidth,vh=innerHeight,small=vw<640||vh<600,compact=vw<1024,side=small
      const scene=document.querySelector('.factory-scene')?.getBoundingClientRect(),r=target?.getBoundingClientRect()
      const h=Math.min(small?124:compact?150:205,vh<600?110:205),plateW=side?148:compact?174:210,plateH=plateW*48/260
      const bw=side?Math.max(120,Math.min(360,vw-plateW-36)):Math.min(360,(scene?.width??360)-12)
      const key=`${latest.current.stepIndex}:${bw}:${latest.current.step.text}`
      if(key!==measureKey&&words.current){
        const measure=canvas.current?.getContext('2d');if(measure){measure.font=`${small?15:17}px "Times New Roman",serif`;let line='',lines=1
          let maxLines=1
          for(const chunk of dialogueChunks(latest.current.step.text)){line='';lines=1;for(const word of chunk.split(/\s+/)){const test=line?line+' '+word:word;if(measure.measureText(test).width>bw-(small?40:62)){lines++;line=word}else line=test}maxLines=Math.max(maxLines,lines)}
          words.current.style.minHeight=Math.ceil(maxLines*(small?20.25:24.65))+'px';measureKey=key
        }
      }
      const bh=bubble.current?.getBoundingClientRect().height||170
      let left=clamp(scene?.left??12,12,vw-plateW-12),top=clamp((scene?.top??vh-h-plateH-24)+12,16,vh-h-plateH-16)
      let bx=left,by=top+h+plateH+8
      if(side){left=12;bx=left+plateW+12;top=clamp(scene?.top??20,16,vh-Math.max(h+plateH,bh)-16);by=top}
      if(!side){by=clamp(Math.max(by,(scene?.bottom??by)+6),16,vh-bh-12)}
      const occupied=()=>({left:Math.min(left,bx),right:Math.max(left+plateW,bx+bw),top:Math.min(top,by),bottom:Math.max(top+h+plateH,by+bh)})
      if(r&&intersects(occupied(),r)){
        const total=side?Math.max(h+plateH,bh):h+plateH+bh+10
        const roomAbove=r.top-16,roomBelow=vh-r.bottom-16
        top=roomAbove>=total?Math.max(12,r.top-total-12):roomBelow>=total?r.bottom+12:12
        by=side?top:top+h+plateH+8
        // If a full-width target leaves little space, speech can sit across the
        // free opposite edge while the portrait stays in the factory area.
        if(by+bh>vh-8)by=Math.max(8,r.top-bh-12)
      }
      if(bubble.current){bubble.current.style.left=bx+'px';bubble.current.style.top=by+'px';bubble.current.style.width=bw+'px'}
      return {x:left+plateW/2,top,height:h,plateW,plateH,target:r,origin:[left+plateW/2,top+h*.42]}
    }
    function draw(assets:Assets,dt:number){
      const el=canvas.current,ctx=el?.getContext('2d');if(!ctx||!el)return
      const p=latest.current,dpr=Math.min(devicePixelRatio||1,2)
      if(el.width!==Math.round(innerWidth*dpr)||el.height!==Math.round(innerHeight*dpr)){el.width=Math.round(innerWidth*dpr);el.height=Math.round(innerHeight*dpr)}
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,innerWidth,innerHeight)
      if(entered)prepareStep()
      if(entered&&!reading&&chunkIndex<chunks.length-1&&t>=pauseUntil&&!p.paused)beginChunk(chunkIndex+1)
      const box=layout(focusSelect());let name='breathe',index=Math.floor(((t-idleStart)%4.2)/4.2*8),alpha=1,shift=0
      if(!entered){
        arrival+=dt;const progress=reduced.matches?1:clamp(arrival/1.2,0,1)
        name='arrive';index=Math.min(7,Math.floor(progress*8));alpha=reduced.matches?1:clamp(arrival/.32,0,1);shift=-24*(1-(1-(1-progress)**3))
        if(progress===1){entered=true;readyRef.current=true;setReady(true);prepareStep()}
      }else{
        if(reading&&!point?.out&&confirm<=0){
          speechTime+=dt;while(shown<chars.length&&speechTime>=beats[shown])shown++
          if(words.current){const text=chars.slice(0,shown).join('');if(words.current.textContent!==text)words.current.textContent=text}
          if(speechTime>=speechTotal)finishSpeech()
        }
        const wanted=box.target?direction(box.target.left+box.target.width/2-box.origin[0],box.target.top+box.target.height/2-box.origin[1]):'point-right'
        if(reading&&!point&&confirm<=0&&!reduced.matches&&box.target&&assets.frames.has(wanted+':7')&&assets.frames.has(wanted+'-talk:0'))point={name:wanted,progress:0,out:false,hold:0,subject:focusSelector()}
        const sequence=[0,1,2,1,0,4,1,0]
        let mouth=sequence[Math.floor(speechTime*7)%sequence.length]
        if(/[\s.!?,;:]/.test(chars[Math.max(0,shown-1)]??''))mouth=0
        if(point){
          if(wanted!==point.name||point.subject!==focusSelector())point.out=true
          point.progress=clamp(point.progress+(point.out?-dt/.32:dt/.48),0,1)
          if(point.progress===1&&!reading){point.hold+=dt;if(point.hold>1.1)point.out=true}
          name=point.name;index=Math.min(7,Math.floor(point.progress*7.999))
          if(point.progress===1&&!point.out){name=point.name+'-talk';index=reading?mouth:0}
          if(point.out&&point.progress===0){point=null;idleStart=t}
        }else if(confirm>0){
          confirm=Math.max(0,confirm-dt)
          if(assets.frames.has('confirm:4')){
            const elapsed=1.15-confirm,progress=elapsed<.45?elapsed/.45:elapsed<.7?1:Math.max(0,1-(elapsed-.7)/.45)
            name='confirm';index=Math.min(7,Math.floor(progress*7.999))
          }
        }
        else if(reading){
          name='talk';index=mouth
        }
        if(p.step.action==='complete'&&!reading&&!point&&chunkIndex===chunks.length-1&&(responded||t>=pauseUntil)){
          if(!finishedAt)finishedAt=t
          const elapsed=t-finishedAt;name='celebrate';index=Math.min(7,Math.floor(elapsed/.65*8))
          if(elapsed>(reduced.matches?.1:1.5)&&!finishSent){finishSent=true;void p.onAcknowledge('complete').then(ok=>{if(alive&&!ok)setFinishError(true)})}
        }
      }
      if(reduced.matches){name='talk';index=0}
      let resolved=resolveFrame(name,index),bitmap=assets.frames.get(resolved.key)
      if(!bitmap){resolved=resolveFrame('talk',0);bitmap=assets.frames.get(resolved.key)}
      if(!bitmap)return
      const waiting=entered&&!reading,remaining=waiting?Math.max(0,Math.ceil(pauseUntil-t)):0
      const responseReady=waiting&&chunkIndex===chunks.length-1&&(responded||t>=pauseUntil)&&!p.busy&&!p.paused
      const canAct=responseReady&&p.step.action!=='complete'
      const dialogueState=!entered?'arriving':reading?'speaking':responseReady&&p.step.action==='complete'?'completing':chunkIndex<chunks.length-1?'pause':canAct?'awaiting-action':'pause'
      const cueText=!entered?'':reading?'Chạm để xem hết đoạn này':dialogueState==='completing'?'':dialogueState==='awaiting-action'?'Bấm mục đang sáng để tiếp tục':`Chạm để tiếp tục${responded?'':` · ${remaining}s`}`
      if(cue.current&&cue.current.textContent!==cueText)cue.current.textContent=cueText
      const focus=focusSelect(),action=select()
      if(focus!==focusMark){focusMark?.removeAttribute('data-advisor-highlighted');focusMark=focus;focusMark?.setAttribute('data-advisor-highlighted','')}
      if(action!==actionMark){if(actionMark){actionMark.removeAttribute('data-advisor-pending');if(originalAria===null)actionMark.removeAttribute('aria-disabled');else actionMark.setAttribute('aria-disabled',originalAria)}actionMark=action;originalAria=action?.getAttribute('aria-disabled')??null}
      if(actionMark){actionMark.toggleAttribute('data-advisor-pending',!canAct);const aria=canAct?originalAria:'true';if(actionMark.getAttribute('aria-disabled')!==aria){if(aria===null)actionMark.removeAttribute('aria-disabled');else actionMark.setAttribute('aria-disabled',aria)}}
      // Neutral grey outside the cut-out; guide art is painted afterward and
      // stays bright. The canvas never intercepts the real target's pointer.
      ctx.save();ctx.fillStyle=`rgba(29,31,35,${.34*alpha})`;ctx.beginPath();ctx.rect(0,0,innerWidth,innerHeight)
      if(box.target)ctx.roundRect(box.target.left-7,box.target.top-7,box.target.width+14,box.target.height+14,8)
      ctx.fill('evenodd');ctx.restore()
      if(entered&&box.target){
        const r=box.target,hover=pointer.x>=r.left&&pointer.x<=r.right&&pointer.y>=r.top&&pointer.y<=r.bottom
        const pulse=reduced.matches?0:(1+Math.sin(t*3))/2,kind=focusSelector().includes('tab-')?'tab':focusSelector().includes('starter-')?'investment':focusSelector().includes('"year"')?'year':'hud'
        ctx.save();ctx.fillStyle=`rgba(255,211,99,${hover?.1:.025+pulse*.025})`;ctx.beginPath();ctx.roundRect(r.left-3,r.top-3,r.width+6,r.height+6,6);ctx.fill()
        ctx.strokeStyle=hover?'#fff3bc':'#ffda76';ctx.lineWidth=kind==='investment'?3:2;ctx.beginPath();ctx.roundRect(r.left-5,r.top-5,r.width+10,r.height+10,7);ctx.stroke()
        if(kind==='investment'||kind==='year'){
          ctx.lineWidth=3;for(const [x,y,dx,dy] of [[r.left-8,r.top-8,1,1],[r.right+8,r.top-8,-1,1],[r.left-8,r.bottom+8,1,-1],[r.right+8,r.bottom+8,-1,-1]]){ctx.beginPath();ctx.moveTo(x+dx*12,y);ctx.lineTo(x,y);ctx.lineTo(x,y+dy*12);ctx.stroke()}
        }else if(kind==='tab'){ctx.fillStyle='#ffda76';ctx.beginPath();ctx.moveTo(r.left+r.width/2-5,r.top-13);ctx.lineTo(r.left+r.width/2+5,r.top-13);ctx.lineTo(r.left+r.width/2,r.top-8);ctx.fill()}
        ctx.restore();el.dataset.focusKind=kind
      }
      const f=resolved.frame,scale=box.height/atlas.referenceHeight*f.cameraScale,waist=box.top+box.height*atlas.waistFraction
      const x=box.x-f.anchor[0]*scale+shift,y=waist-f.anchor[1]*scale
      ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,x,y,f.rect[2]*scale,f.rect[3]*scale)
      // Attach the upper plaque trim directly to the actual opaque body bottom.
      // There is no reserved atlas gutter between jeans and the nameplate.
      const plateTop=y+f.body[3]*scale-3
      ctx.drawImage(assets.plate,box.x-box.plateW/2+shift,plateTop,box.plateW,box.plateH)
      ctx.fillStyle='#ffedba';ctx.font=`700 ${box.plateW<160?12:box.plateW<190?14:17}px "Times New Roman",serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Cố vấn doanh nghiệp',box.x+shift,plateTop+box.plateH/2,box.plateW-25)
      ctx.restore()
      el.dataset.phase=!entered?'arriving':reading?'talking':point?'pointing':p.step.action==='complete'?'celebrating':'waiting'
      el.dataset.pose=name;el.dataset.frame=String(index);el.dataset.alpha=String(alpha);el.dataset.step=String(p.stepIndex)
      el.dataset.plaqueGap=String(plateTop-(y+f.body[3]*scale))
      el.dataset.dialogue=dialogueState;el.dataset.chunk=String(chunkIndex);el.dataset.chunks=String(chunks.length);el.dataset.pauseRemaining=String(remaining);el.dataset.focus=focusSelector();el.dataset.shadeOpacity=String(.34*alpha)
    }
    void preloadAdvisor().then(assets=>{
      if(!alive)return
      const tick=(now:number)=>{if(!alive)return;const dt=last?clamp((now-last)/1000,0,.08):0;last=now
        const elapsed=document.hidden||latest.current.paused?0:dt;t+=elapsed;draw(assets,elapsed);raf=requestAnimationFrame(tick)}
      raf=requestAnimationFrame(tick)
    }).catch(()=>{if(alive){readyRef.current=true;respond.current=()=> 'action';setReady(true);setLoadError(true)}})
    return ()=>{alive=false;readyRef.current=false;respond.current=()=> 'consumed';cancelAnimationFrame(raf);document.removeEventListener('pointermove',pointerMove);focusMark?.removeAttribute('data-advisor-highlighted');if(actionMark){actionMark.removeAttribute('data-advisor-pending');if(originalAria===null)actionMark.removeAttribute('aria-disabled');else actionMark.setAttribute('aria-disabled',originalAria)}}
  },[])
  useEffect(()=>{
    function capture(event:Event){
      const node=event.target as HTMLElement
      if(node.closest('[data-guide-retry]')||node.closest('[data-guide="sound"]')&&readyRef.current&&latest.current.step.action!=='sound')return
      const target=document.querySelector(latest.current.step.target||':not(*)')
      if(!readyRef.current||respond.current()!=='action'||!target||!target.contains(node)){event.preventDefault();event.stopPropagation()}
    }
    function keyboard(event:KeyboardEvent){
      if(event.key==='Tab'&&!event.ctrlKey&&!event.metaKey){const target=canvas.current?.dataset.dialogue==='awaiting-action'?document.querySelector<HTMLElement>(latest.current.step.target||'[data-guide-retry]'):bubble.current;if(target){event.preventDefault();target.focus({preventScroll:true})}}
      else if(event.key==='Enter'||event.key===' '){capture(event)}
    }
    document.addEventListener('click',capture,true);document.addEventListener('keydown',keyboard,true)
    return ()=>{document.removeEventListener('click',capture,true);document.removeEventListener('keydown',keyboard,true)}
  },[])
  const retry=()=>void props.onAcknowledge(props.step.action).then(ok=>{if(ok)setFinishError(false)})
  return <aside className="first-year-advisor" aria-label="Cố vấn doanh nghiệp">
    <canvas ref={canvas} aria-hidden="true" />
    <section ref={bubble} className="advisor-dialogue" hidden={!ready} tabIndex={-1} aria-label="Lời hướng dẫn">
      <p ref={words} aria-hidden="true">{loadError?props.step.text:undefined}</p>
      <p ref={announcement} className="advisor-sr" aria-live="polite" aria-atomic="true">{loadError?props.step.text:undefined}</p>
      <p ref={cue} className="advisor-cue" aria-live="off" />
      {props.step.action==='continue-without-purchase'&&<button type="button" data-guide="insufficient-capital" disabled={props.busy||props.paused} onClick={retry}>Tiếp tục với vốn hiện có</button>}
      {props.step.action.startsWith('confirm-existing-')&&<button type="button" data-guide="existing-resource" disabled={props.busy||props.paused} onClick={retry}>Đã kiểm tra</button>}
      {(finishError||props.error||loadError&&props.step.action==='complete')&&<div className="advisor-error"><span>{props.error||'Chưa thể tiếp tục. Hãy thử lại.'}</span><button type="button" data-guide-retry disabled={props.busy||props.paused} onClick={retry}>Thử lại</button></div>}
    </section>
  </aside>
}
