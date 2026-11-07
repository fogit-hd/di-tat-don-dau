import Phaser from 'phaser'
import type { SceneInput } from './PhaserView'
import type { RacerView } from '../contracts'
import type { ChestKind } from '../experience-contracts'
import { ScoreMotion, elapsedTime } from './motion'
import { PaintedFX } from './PaintedFX'
import { RaceEffects } from './RaceEffects'
import { EXPERIENCE_RULES } from '../experience-contracts'
import { periodicPainting, panoramaTiles, type EraPainting } from './panorama'

const ROOT='/assets/duck-race/',ART=ROOT+'experience-v4/'
type Hooks={ready:()=>void;error:(message:string)=>void;chest:(kind:ChestKind)=>void}
type Mode='race'|'chests'|'portrait'|'landing'|'field'
type Panorama=EraPainting
type Actor={body:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Image;head:Phaser.GameObjects.Image;scarf:Phaser.GameObjects.Image;marker:Phaser.GameObjects.Image;name:Phaser.GameObjects.Text;gain:Phaser.GameObjects.Text;beat:number;fxSeq?:number}
type Puff={image:Phaser.GameObjects.Image;at:number;life:number;x:number;y:number;size:number;screen:boolean}

class ExperienceScene extends Phaser.Scene{
 private read:()=>SceneInput;private hooks:Hooks;private mode:Mode;private failed=false
 private motion=new ScoreMotion();private actors=new Map<string,Actor>();private background:Phaser.GameObjects.Image[]=[];private dust:Puff[]=[]
 private eras:Panorama[]=[];private era=0;private transition?:{from:number;to:number;at:number};private tileKeys=new Set<string>()
 private chestSprites:Phaser.GameObjects.Image[]=[];private chestVisibleAt=0;private chestActive=false;private chestExitAt=-Infinity;private chestKey='';private chestFXAt=0
 private ambientTime=0
 private chestPaint?:PaintedFX
 private raceEffects?:RaceEffects
 private focusArt:Phaser.GameObjects.Image[]=[]
 constructor(mode:Mode,read:()=>SceneInput,hooks:Hooks){super('DuckExperience');this.mode=mode;this.read=read;this.hooks=hooks}
 preload(){
  this.load.on('loaderror',(file:Phaser.Loader.File)=>{this.failed=true;this.hooks.error(`Không tải được hình ${file.key}. Hãy thử lại.`)})
  if(this.mode==='field'){this.load.svg('feather',ROOT+'ui-v6/focus-feather.svg');this.load.svg('spark',ROOT+'ui-v6/focus-spark.svg');return}
  if(this.mode==='chests'){
   PaintedFX.preload(this,['safe','chain','skull','wind'])
   for(const kind of ['safe','single','explosive'])for(let f=0;f<6;f++)this.load.image(`chest-${kind}-${f}`,`${ROOT}eras-v2/chests/${kind}/${f}.webp`)
   this.load.image('painted-fx',ROOT+'eras-v2/chest-fx.webp')
  }else{
   this.load.atlas('native',ART+'native.png',ART+'native.json');this.load.atlas('cosmetics',ART+'cosmetics.png',ART+'cosmetics.json')
   this.load.svg('shadow',ROOT+'svg/shadow.svg');this.load.svg('marker',ROOT+'ui-v6/you-marker.svg')
   for(let i=0;i<6;i++)this.load.image(`painted-dust-${i}`,`${ROOT}experience-v6/fx/dust-air/${i}.webp`)
   if(this.mode==='landing')this.load.image('landing',ART+'landing.webp')
   if(this.mode==='race'){
    RaceEffects.preload(this)
    this.load.json('eras',ROOT+'experience-v6/eras/manifest.json')
    for(let era=0;era<EXPERIENCE_RULES.eraCount;era++)this.load.image(`scene-${era}`,`${ROOT}experience-v6/eras/era-${era+1}.webp`)
   }
  }
 }
 create(){
  if(this.failed)return
  if(this.mode==='field'){
   this.focusArt=[this.add.image(0,0,'feather').setDisplaySize(29,22),...Array.from({length:8},()=>this.add.image(0,0,'spark').setDisplaySize(7,7))]
   this.game.canvas.setAttribute('aria-hidden','true');this.game.canvas.dataset.engine='phaser-4.2.1';this.hooks.ready();return
  }
  if(this.textures.exists('native'))this.textures.get('native').setFilter(Phaser.Textures.FilterMode.NEAREST)
  if(this.textures.exists('cosmetics'))this.textures.get('cosmetics').setFilter(Phaser.Textures.FilterMode.NEAREST)
  if(this.mode==='chests'){
   const fx=this.textures.get('painted-fx'),source=fx.getSourceImage() as HTMLImageElement
   for(let i=0;i<8;i++)fx.add(String(i),0,Math.floor(i%4*source.width/4),Math.floor(Math.floor(i/4)*source.height/2),Math.floor(source.width/4),Math.floor(source.height/2))
  }
  for(let i=0;i<48;i++)this.dust.push({image:this.add.image(0,0,this.mode==='chests'?'painted-fx':'painted-dust-0',this.mode==='chests'?'0':undefined).setVisible(false).setDepth(9000),at:0,life:0,x:0,y:0,size:0,screen:false})
  if(this.mode==='race')this.raceEffects=new RaceEffects(this)
  if(this.mode==='race'){this.eras=this.cache.json.get('eras').eras;for(let i=0;i<16;i++)this.background.push(this.add.image(0,0,'scene-0').setOrigin(0).setScrollFactor(0).setDepth(-100))}
  if(this.mode==='landing')this.background.push(this.add.image(0,0,'landing').setOrigin(0).setDepth(-100))
  if(this.mode==='chests')for(const kind of ['safe','single','explosive'] as const){const sprite=this.add.image(0,0,`chest-${kind}-0`).setOrigin(.5,364/384).setVisible(false);this.chestSprites.push(sprite)}
  if(this.mode==='chests')this.chestPaint=new PaintedFX(this)
  this.game.canvas.setAttribute('aria-hidden','true');this.game.canvas.dataset.engine='phaser-4.2.1';this.hooks.ready()
  this.events.once('shutdown',()=>{this.raceEffects?.destroy();this.actors.clear();this.tileKeys.clear();this.dust=[]})
 }
 private tile(era:number){
  const key=`panorama-${era}`
  if(this.textures.exists(key))return key
  const source=this.textures.get(`scene-${era}`).getSourceImage() as HTMLImageElement
  const texture=this.textures.createCanvas(key,source.width-Math.max(2,Math.round(source.width*.018)),source.height)!
  periodicPainting(source,texture.canvas)
  texture.refresh()
  this.tileKeys.add(key)
  return key
 }
 private scenery(era:number,camera:number,zoom:number,now:number,reduced:boolean):[number,number]{
  if(era!==this.era&&!this.transition){
   if(reduced)this.era=era
   else this.transition={from:this.era,to:era,at:now}
  }
  const transition=this.transition
  const progress=transition?Math.max(0,Math.min(1,(now-transition.at)/1250)):0
  const mix=progress*progress*(3-2*progress)
  const views=transition?[{era:transition.from,alpha:1},{era:transition.to,alpha:mix}]:[{era:this.era,alpha:1}]
  let slot=0
  for(const view of views){
   const key=this.tile(view.era)
   const source=this.textures.get(key).getSourceImage() as HTMLCanvasElement
   for(const part of panoramaTiles(camera,this.scale.width,this.scale.height,zoom,source.width,source.height)){
    let sprite=this.background[slot++]
    if(!sprite){sprite=this.add.image(0,0,key).setOrigin(0).setScrollFactor(0).setDepth(-100);this.background.push(sprite)}
    sprite.setTexture(key).setPosition(part.x,0).setDisplaySize(part.width,part.height).setAlpha(view.alpha).setVisible(true)
   }
  }
  for(;slot<this.background.length;slot++)this.background[slot].setVisible(false)
  const from=this.eras[transition?.from??this.era].road,to=this.eras[transition?.to??this.era].road
  const road:[number,number]=[from[0]+(to[0]-from[0])*mix,from[1]+(to[1]-from[1])*mix]
  if(transition&&progress>=1){this.era=transition.to;this.transition=undefined}
  this.game.canvas.dataset.era=String(era+1)
  return road
 }
 private actor(p:RacerView){
  let a=this.actors.get(p.id);if(a)return a
  const body=this.add.image(0,0,'native',`${p.color}/idle/0`).setOrigin(.5,.75)
  a={body,shadow:this.add.image(0,0,'shadow').setDisplaySize(60,13),head:this.add.image(0,0,'cosmetics','brass/idle/0').setOrigin(.5,.75),scarf:this.add.image(0,0,'cosmetics','red/idle/0').setOrigin(.5,.75),marker:this.add.image(0,0,'marker').setDisplaySize(18,21).setOrigin(.5,1),name:this.add.text(0,0,'',{fontFamily:'Public UI, sans-serif',fontSize:'12px',color:'#fff3d1',backgroundColor:'#14392d',padding:{x:6,y:3}}).setOrigin(.5,1),gain:this.add.text(0,0,'',{fontFamily:'Public UI, sans-serif',fontSize:'19px',fontStyle:'bold',color:'#f6d27c',stroke:'#183627',strokeThickness:3}).setOrigin(.5,1),beat:-1}
  this.actors.set(p.id,a);return a
 }
 private drawActor(p:RacerView,x:number,y:number,pose:string,frame:number,z:number,size:number,host:boolean,me:boolean,now:number,delta=0,changedAt=-Infinity){
  const a=this.actor(p),key=`${p.color}/${pose}/${frame}`
  a.body.setFrame(key,false,false).setPosition(x,y-z).setScale(size).setDepth(y)
  a.shadow.setPosition(x,y+2).setDepth(y-.4).setAlpha(z? .5: .9).setDisplaySize(23*size,4.5*size)
  const cosmetics=p.cosmetics
  for(const [sprite,item]of [[a.head,cosmetics?.glasses],[a.scarf,cosmetics?.scarf]] as const){sprite.setVisible(!!item);if(item)sprite.setFrame(`${item}/${pose}/${frame}`,false,false).setPosition(x,y-z).setScale(size).setDepth(y+.1)}
  a.marker.setVisible(me).setPosition(x,y-z-30*size-8).setDepth(8000)
  a.name.setVisible(host).setText(p.name.length>20?p.name.slice(0,19)+'…':p.name).setPosition(x,y-z-31*size-8).setDepth(8001)
  const age=now-changedAt;a.gain.setVisible(age>=0&&age<1650&&delta!==0).setText((delta>0?'+':'')+delta).setColor(delta>0?'#ffe191':'#ffd8c8').setPosition(x,y-z-36*size-Math.min(24,age*.015)).setDepth(8100)
  return a
 }
 private puff(x:number,y:number,size:number,life:number,at:number,screen=false){const p=this.dust.find(p=>p.life===0);if(p)Object.assign(p,{x,y,size,life,at,screen})}
 private particles(now:number,delta:number){for(const p of this.dust){if(!p.life)continue;const t=(now-p.at)/p.life;if(t<0)continue;if(t>=1){p.life=0;p.image.setVisible(false);continue}p.image.setVisible(true);if(this.mode==='chests')p.image.setFrame(String(Math.min(7,Math.floor(t*8))));else p.image.setTexture(`painted-dust-${Math.min(5,Math.floor(t*6))}`);p.image.setPosition(p.x+(p.screen?t*1800:-t*14),p.y).setDisplaySize(p.size,p.size*.56).setAlpha(Math.sin(t*Math.PI)*(p.screen?.23:.28));if(p.screen)p.image.setDepth(6000);else p.image.setDepth(p.y+.2)}void delta}
 update(clock:number,delta:number){
  if(this.failed)return
  const input=this.read(),w=this.scale.width,h=this.scale.height,reduced=input.reduced
  if(this.mode==='field'){
   const t=clock/1000;this.focusArt[0].setPosition(w-23,h/2+(reduced?0:Math.sin(t*2.4)*1.5)).setRotation(reduced?0:Math.sin(t*1.8)*.07)
   this.focusArt.slice(1).forEach((spark,i)=>{const p=reduced?i/8:(t*.27+i/8)%1;spark.setPosition(12+p*Math.max(0,w-60),h-5-Math.sin(p*Math.PI)*2).setAlpha(reduced?.8:.25+Math.sin(p*Math.PI)*.75).setRotation(reduced?0:t+i)})
   return
  }
  if(this.mode==='chests'){this.updateChests(input,clock);return}
  if(this.mode==='portrait'){
   if(input.portrait){const pose=reduced?'idle':Math.floor(clock/2600)%2?'walk_run':'idle',frame=reduced?0:Math.floor(clock/150)%4;this.drawActor(input.portrait,w*.5,h*.74,pose,frame,0,Math.min(6,w/64),false,false,clock)}return
  }
  if(this.mode==='landing'){
   this.background[0].setDisplaySize(w,h)
   const running=!input.landingPaused&&!reduced;if(running)this.ambientTime+=Math.min(delta,80)
   for(let i=0;i<7;i++){const color=(['red','orange','blue','purple','aqua','yellow','green'] as const)[i],p={id:String(i),color,name:''} as RacerView,x=(this.ambientTime*.048+(i+.5)*(w+200)/7)%(w+200)-100
    const actor=this.drawActor(p,x,h*.86,running?'walk_run':'idle',running?Math.floor(this.ambientTime/165+i)%4:0,0,w<600?1.45:2.5,false,false,clock),beat=Math.floor(this.ambientTime/900)
    if(running&&actor.beat!==beat){actor.beat=beat;this.puff(x-15,h*.86+3,24,550,clock)}
   }this.particles(clock,delta);return
  }
  const s=input.snapshot;if(!s?.experience)return
  const elapsed=elapsedTime(s,input.now),active=s.phase==='racing'&&!s.experience.paused,zoom=w<600?.66:w<900?.85:1
  this.motion.update(s.players,elapsed,input.host?s.players[0]?.id:s.me?.id,w,zoom,reduced)
  const road=this.scenery(Math.min(EXPERIENCE_RULES.eraCount-1,Math.floor(elapsed/EXPERIENCE_RULES.eraMs)),this.motion.camera,zoom,clock,reduced)
  this.raceEffects?.begin(elapsed,w,h,reduced,road)
  const keep=new Set<string>()
  for(const p of s.players){const runner=this.motion.actors.get(p.id)!;const x=(runner.worldX-this.motion.camera)*zoom,y=h*(road[0]+(road[1]-road[0])*(.12+p.y/6*.76)),size=w<600?2.15:2.7
   const pose=active?runner.pose:'idle',frame=active?runner.frame:0,z=active?runner.z:0
   const a=this.drawActor(p,x,y,pose,frame,z*zoom,size,input.host,p.id===s.me?.id&&!input.host,elapsed,runner.delta,runner.changedAt);keep.add(p.id)
   this.raceEffects?.follow(p.id,x,y)
   const events=p.scoreEvents||[],latest=events.at(-1)?.seq||0
   const fresh=a.fxSeq===undefined?events.filter(event=>elapsed-event.at<=1500):events.filter(event=>event.seq>a.fxSeq!)
   for(const event of fresh)if(event.fx){this.raceEffects?.trigger(`${p.id}:${event.seq}`,event.fx,elapsed,x,y,event.delta,p.id)}
   a.fxSeq=latest
   if(p.shield>0)this.raceEffects?.shield(x,y,size,elapsed,reduced)
   if(!reduced&&active){const beat=Math.floor(runner.gait/2);if(beat!==a.beat&&!runner.damage){a.beat=beat;this.puff(x-18,y,28,580,clock)}}
   if(p.id===s.me?.id)Object.assign(this.game.canvas.dataset,{pose,frame:String(frame),score:String(p.points),bodyScale:String(size),worldX:String(runner.worldX),offset:String(runner.offset),jumpHeight:String(z),damage:String(!!runner.damage)})
  }
  for(const [id,a]of this.actors)if(!keep.has(id)){Object.values(a).forEach(object=>{if(object&&typeof object==='object'&&'destroy'in object)(object as Phaser.GameObjects.GameObject).destroy()});this.actors.delete(id)}
  this.raceEffects?.end()
  this.particles(clock,delta)
 }
 private updateChests(input:SceneInput,clock:number){
  const s=input.snapshot,q=s?.experience?.quiz,chest=s?.experience?.chest,elapsed=s?elapsedTime(s,input.now):0
  const visible=!!q&&['chests','opening','target'].includes(q.phase),w=this.scale.width,h=this.scale.height
  if(visible&&!this.chestActive){this.chestVisibleAt=clock;this.chestFXAt=0}
  if(!visible&&this.chestActive)this.chestExitAt=clock
  this.chestActive=visible
  const display=visible||!input.reduced&&clock-this.chestExitAt<240
  this.chestPaint?.hide()
  const key=chest?chest.kind+':'+chest.chosenAt:'';if(this.chestKey!==key){this.chestKey=key;this.chestFXAt=0}
  const enter=input.reduced?1:Math.min(1,(clock-this.chestVisibleAt)/350),exit=visible?1:Math.max(0,1-(clock-this.chestExitAt)/240),size=Math.min(350,w/3*1.4,h*.94),scale=size/384
  for(const [i,kind]of (['safe','single','explosive'] as const).entries()){
   const sprite=this.chestSprites[i];if(!sprite)continue;sprite.setVisible(display);if(!display)continue
   const selected=chest?.kind===kind,age=chest?(elapsed-chest.chosenAt)/1000:-1,frame=selected&&age>=.7?Math.min(5,Math.floor((age-.7)/.9*6)):0
   const shake=selected&&age>=0&&age<.7&&!input.reduced?Math.sin(age*62)*Math.sin(age/.7*Math.PI):0
   sprite.setTexture(`chest-${kind}-${frame}`).setPosition(w*(i+.5)/3+shake*2,h-18+(1-enter)**3*18).setScale(scale).setAngle(shake*1.4).setAlpha(enter*exit*(chest&&!selected?.34:1))
   if(selected&&age>1&&age<2.8&&!input.reduced&&clock-this.chestFXAt>90){this.chestFXAt=clock;this.puff(w*(i+.5)/3+Math.sin(age*17)*size*.25,h-size*.52,26,650,clock)}
   if(selected&&age>=.65&&age<2.65)this.chestPaint?.draw(({safe:'safe',single:'chain',explosive:'skull'} as const)[kind],(age-.65)/2,w*(i+.5)/3,h-18-size*.32,Math.min(size*1.55,h*1.12),9200,input.reduced)
  }
  this.particles(clock,16)
 }
}
export function createExperienceGame(parent:HTMLElement,kind:Mode,read:()=>SceneInput,hooks:Hooks){
 const transparent=kind==='chests'||kind==='portrait'||kind==='field'
 return new Phaser.Game({type:Phaser.AUTO,parent,banner:false,title:'Quiz Duck Race',backgroundColor:transparent?'rgba(0,0,0,0)':'#a6cbd1',transparent,antialias:true,roundPixels:false,scale:{mode:Phaser.Scale.RESIZE,width:Math.max(1,parent.clientWidth),height:Math.max(1,parent.clientHeight),expandParent:false},fps:{target:60,smoothStep:true},audio:{noAudio:true},autoFocus:false,disableContextMenu:true,input:{keyboard:false},scene:new ExperienceScene(kind,read,hooks)})
}
