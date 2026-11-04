import { useEffect, useRef, useState } from 'react'
import { AnimatedSprite, Application, Assets, Container, type Spritesheet } from 'pixi.js'
import { DUCK_COLORS, EQUIPMENT, type DuckColor, type GearId, type RacerView } from './contracts'
import { StaticArt as S } from './StaticArt'
import { GearRig } from './GearRig'

export function EquipmentDrawer({me,onClose,onSave}:{me:RacerView;onClose:()=>void;onSave:(data:Record<string,unknown>)=>Promise<void>}){
 const [color,setColor]=useState<DuckColor>(me.color),[model,setModel]=useState(me.model),[head,setHead]=useState(me.gearHead),[body,setBody]=useState(me.gearBody),[saving,setSaving]=useState(false)
 const closeAction=useRef(onClose)
 useEffect(()=>{closeAction.current=onClose},[onClose])
 const ref=useRef<HTMLDivElement>(null),selection=useRef({color,model,head,body}),close=useRef<HTMLButtonElement>(null)
 useEffect(()=>{selection.current={color,model,head,body}},[color,model,head,body])
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement;close.current?.focus()
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')closeAction.current();if(e.key==='Tab'){const list=Array.from(ref.current!.parentElement!.querySelectorAll<HTMLElement>('button:not(:disabled)'));if(e.shiftKey&&document.activeElement===list[0]){e.preventDefault();list.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===list.at(-1)){e.preventDefault();list[0]?.focus()}}}
  document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus()}
 },[])
 useEffect(()=>{
  let disposed=false,ready=false;const app=new Application()
  async function init(){await app.init({resizeTo:ref.current!,backgroundAlpha:0,antialias:false,resolution:Math.min(devicePixelRatio,2),autoDensity:true});ready=true;if(disposed){app.destroy(true);return};ref.current!.appendChild(app.canvas)
   const [sheet,gearSheet]=await Promise.all([Assets.load<Spritesheet>('/assets/duck-race/ducks-v9.json'),Assets.load<Spritesheet>('/assets/duck-race/gear-poses-v9.json')]);if(disposed)return
   for(const atlas of [sheet,gearSheet])Object.values(atlas.textures).forEach(t=>{t.source.scaleMode='nearest'})
   const root=new Container(),sprite=new AnimatedSprite(sheet.animations['ducky/yellow/idle']),gear=new GearRig(gearSheet.textures);sprite.anchor.set(.5,.75);sprite.scale.set(3.2);sprite.autoUpdate=false;root.addChild(sprite,gear.root);app.stage.addChild(root)
   app.ticker.add(()=>{const s=selection.current,key=`${s.model}/${s.model==='ducky'?'yellow':s.color}`,pose=Math.floor(performance.now()/3500)%2?'walk_run':'idle',textures=sheet.animations[`${key}/${pose}`],frame=Math.floor(performance.now()/130)%textures.length;sprite.textures=textures;sprite.gotoAndStop(frame);root.position.set(app.screen.width/2,app.screen.height*.7);root.scale.set(1.5);gear.update(key,pose,frame,s.head,s.body,1,0,performance.now())})
  }void init().catch(()=>{if(ref.current)ref.current.dataset.error='Không tải được nhân vật'})
  return()=>{disposed=true;if(ready)app.destroy(true,{children:true,texture:false,textureSource:false})}
 },[])
 return <div className="dq-equipment-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="dq-equipment" role="dialog" aria-modal="true" aria-label="Thay đổi nhận diện"><button ref={close} className="dq-equipment-close" onClick={onClose} aria-label="Đóng thay đổi nhận diện"><S text="Đóng"/></button><h2><S text="Thay đổi nhận diện" bold/></h2><div className="dq-equipment-preview" ref={ref}/><fieldset><legend><S text="Chọn vịt của bạn" bold/></legend><div className="dq-colors">{DUCK_COLORS.map(c=><button key={c} style={{backgroundColor:({yellow:'#ebd64d',aqua:'#3eaba8',blue:'#3577c4',green:'#6aa62b',orange:'#e89130',purple:'#9561b8',red:'#c34540',tan:'#b79260'})[c]}} onClick={()=>{setColor(c);setModel('duckee')}} aria-label={`Vịt ${c}`} aria-pressed={model==='duckee'&&color===c}><img src={`/assets/duck-race/portraits-v6/duckee/${c}.webp`} alt=""/></button>)}<button onClick={()=>setModel('ducky')} aria-pressed={model==='ducky'}><S text="Ducky"/></button></div></fieldset><p><S text="Hai vị trí trang sức · Mỗi món có lợi và bất lợi"/></p><div className="dq-equipment-items">{Object.entries(EQUIPMENT).map(([id,item])=><button key={id} aria-pressed={head===id||body===id} onClick={()=>item.slot==='head'?setHead(head===id?undefined:id as GearId):setBody(body===id?undefined:id as GearId)}><img src={`/assets/duck-race/gear-ui/${id}.svg`} alt=""/><span><strong><S text={item.title} bold/></strong><small><S text={item.benefit}/></small><small><S text={item.cost}/></small></span></button>)}</div><button className="dq-primary dq-wide" disabled={saving} onClick={async()=>{setSaving(true);try{await onSave({color,model,gearHead:head||'',gearBody:body||''});onClose()}catch{/* Parent renders the error toast; keep the drawer open. */}finally{setSaving(false)}}}><S text="Lưu diện mạo" bold/></button></section></div>
}
