import { AnimatedSprite, Assets, Container, Sprite, type Spritesheet, type Texture } from 'pixi.js'
import { TERRAIN_ZONES, terrainAt } from './track'

type Mode='ground'|'water'|'mud'
type Contact={x:number;y:number;mode:Mode;air:boolean;stroke:number;last:number;visible:boolean}
type Effect={sprite:AnimatedSprite;born:number;life:number;clip:string;water:boolean;frame:number}
type Surface={zone:typeof TERRAIN_ZONES[number];root:Container;flow?:AnimatedSprite;wakeRoot?:Container;ambient:number}

/** All visible VFX are painted animation frames; this class schedules their playback/contact. */
export class TerrainEffects{
 private time=0
 private active:Effect[]=[]
 private pool:AnimatedSprite[]=[]
 private contacts=new Map<string,Contact>()
 private surfaces:Surface[]=[]
 private ground=new Container({zIndex:2,interactiveChildren:false})
 private spray=new Container({zIndex:2000,interactiveChildren:false})
 private clips:Record<string,Texture[]>
 public splashCount=0
 public mudCount=0
 public strokeCount=0
 private constructor(privateWorld:Container,clips:Record<string,Texture[]>,privateReduced:boolean){
  this.clips=clips;this.reduced=privateReduced;privateWorld.addChild(this.ground,this.spray)
 }
 private reduced:boolean
 static async create(world:Container,reduced:boolean){
  const sheet=await Assets.load<Spritesheet>('/assets/duck-race/terrain-v9/effects.json'),fx=new TerrainEffects(world,sheet.animations,reduced)
  for(const zone of TERRAIN_ZONES){
   const [base,bank,maskTexture]=await Promise.all([Assets.load<Texture>(`/assets/duck-race/terrain-v9/${zone.kind}.webp`),Assets.load<Texture>(`/assets/duck-race/terrain-v9/${zone.kind}-bank.webp`),Assets.load<Texture>(`/assets/duck-race/terrain-v9/${zone.kind}-mask.png`)])
   const root=new Container({zIndex:1,interactiveChildren:false}),image=new Sprite(base),width=zone.end-zone.start,top=zone.centerY-zone.height/2
   image.position.set(zone.start,top);image.width=width;image.height=zone.height;root.addChild(image);world.addChild(root)
   const surface:Surface={zone,root,ambient:0}
   if(zone.kind==='water'){
    const flow=new AnimatedSprite(sheet.animations['water-flow']);flow.autoUpdate=false;flow.position.set(zone.start,top);flow.width=width;flow.height=zone.height
    const mask=new Sprite(maskTexture);mask.position.copyFrom(flow.position);mask.width=width;mask.height=zone.height;root.addChild(mask,flow);flow.mask=mask
    const shore=new Sprite(bank);shore.position.copyFrom(flow.position);shore.width=width;shore.height=zone.height;root.addChild(shore)
    const wakeRoot=new Container({zIndex:2,interactiveChildren:false}),wakeMask=new Sprite(maskTexture);wakeMask.position.copyFrom(flow.position);wakeMask.width=width;wakeMask.height=zone.height;world.addChild(wakeMask,wakeRoot);wakeRoot.mask=wakeMask
    surface.flow=flow;surface.wakeRoot=wakeRoot
   }
   fx.surfaces.push(surface)
  }
  return fx
 }
 textures(name:string){return this.clips[name]}
 private emit(clip:string,x:number,y:number,size:number,life:number,water=false,front=false){
  if(this.reduced||this.active.length>=320)return
  const frames=this.clips[clip];if(!frames)return
  const sprite=this.pool.pop()||new AnimatedSprite(frames);sprite.textures=frames;sprite.autoUpdate=false;sprite.anchor.set(.5,.91);sprite.position.set(x,y);sprite.width=sprite.height=size;sprite.alpha=1;sprite.rotation=0;sprite.visible=true;sprite.gotoAndStop(0)
  const surface=water?this.surfaces.find(s=>s.zone.kind==='water'&&x>=s.zone.start&&x<=s.zone.end):undefined
  ;(front?this.spray:surface?.wakeRoot||this.ground).addChild(sprite)
  this.active.push({sprite,born:this.time,life,clip,water,frame:0})
 }
 contact(id:string,x:number,y:number,mode:Mode,air:boolean,moving:boolean,frame:number,swimming:boolean,visible:boolean){
  const old=this.contacts.get(id),wet=mode==='water'&&!air,wasWet=old?.mode==='water'&&!old.air,landed=old?.air&&!air
  if(old&&visible&&!this.reduced){
   if(wet&&!wasWet||wasWet&&!wet){this.emit('splash',x,y+8,135,.65,false,true);this.splashCount++}
   if(mode==='mud'&&!air&&(old.mode!=='mud'||landed)){this.emit('mud-pull',x,y+8,90,.65,false,true);this.mudCount++}
   if(wet){
    const distance=Math.hypot(x-old.x,y-old.y),gap=moving?.12:.85
    if(this.time-old.last>gap){this.emit('wake',x-(moving?Math.sign(x-old.x)*14:0),y+8,moving?112:80,.8,true);old.last=this.time}
    if(swimming&&moving&&frame!==old.stroke&&(frame===1||frame===5)){
     this.emit('paddle',x-23,y+4,80,.45,false,true);this.strokeCount++
     if(distance>.1)this.emit('wake',old.x,old.y+8,86,.7,true)
    }
   }
   if(mode==='mud'&&!air&&moving&&frame!==old.stroke&&(frame===1||frame===3)){
    this.emit('mud-pull',x+(frame===1?-18:12),y+9,66,.7,false,true);this.mudCount++
   }
  }
  this.contacts.set(id,{x,y,mode,air,stroke:frame,last:old?.last??this.time-.9,visible})
 }
 update(dt:number,left:number,right:number,liveIds:Set<string>){
  this.time+=dt
  for(const surface of this.surfaces){
   const {zone,root,flow}=surface;root.visible=zone.end>left&&zone.start<right
   if(surface.wakeRoot)surface.wakeRoot.visible=root.visible
   if(flow)flow.gotoAndStop(this.reduced?0:Math.floor(this.time*14)%flow.totalFrames)
   if(!this.reduced&&root.visible&&this.time-surface.ambient>(zone.kind==='water'?.65:2.4)){
    const x=(zone.start+zone.end)/2+Math.sin(this.time*1.7)*35,y=zone.centerY+Math.cos(this.time*1.3)*60
    if(terrainAt(x,y)===zone.kind)this.emit(zone.kind==='water'?'wake':'mud-pull',x,y,zone.kind==='water'?62:32,zone.kind==='water'?1:.8,zone.kind==='water')
    surface.ambient=this.time
   }
  }
  for(let i=this.active.length-1;i>=0;i--){
   const e=this.active[i],t=(this.time-e.born)/e.life
   if(t>=1){e.sprite.removeFromParent();e.sprite.visible=false;this.pool.push(e.sprite);this.active.splice(i,1);continue}
   e.frame=Math.min(e.sprite.totalFrames-1,Math.floor(t*e.sprite.totalFrames));e.sprite.gotoAndStop(e.frame)
   e.sprite.alpha=t>.82?(1-t)/.18:1
   if(e.water)e.sprite.y+=dt*9
   e.sprite.visible=e.sprite.x>left-150&&e.sprite.x<right+150
  }
  for(const id of this.contacts.keys())if(!liveIds.has(id))this.contacts.delete(id)
 }
 get debug(){return{active:this.active.length,waterFrame:Math.floor(this.time*14)%24,time:this.time,splashes:this.splashCount,strokes:this.strokeCount,mud:this.mudCount}}
 destroy(){for(const sprite of this.pool)sprite.destroy({texture:false,textureSource:false});this.pool=[];this.contacts.clear()}
}
