import Phaser from 'phaser'
import type { SceneInput } from './PhaserView'
import type { RacerView } from '../contracts'
import type { ChestKind } from '../experience-contracts'
import { ScoreMotion, elapsedTime } from './motion'

const ROOT='/assets/duck-race/',ART=ROOT+'experience-v4/'
type Hooks={ready:()=>void;error:(message:string)=>void;chest:(kind:ChestKind)=>void}
type Mode='race'|'chests'|'portrait'|'landing'|'field'
type Panorama={files:string[];roadCuts:[number,number][];name:string}
type Actor={body:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Image;head:Phaser.GameObjects.Image;scarf:Phaser.GameObjects.Image;marker:Phaser.GameObjects.Image;name:Phaser.GameObjects.Text;gain:Phaser.GameObjects.Text;beat:number}
type Puff={image:Phaser.GameObjects.Image;at:number;life:number;x:number;y:number;size:number;screen:boolean}

class ExperienceScene extends Phaser.Scene{
 private read:()=>SceneInput;private hooks:Hooks;private mode:Mode;private failed=false
 private motion=new ScoreMotion();private actors=new Map<string,Actor>();private background:Phaser.GameObjects.Image[]=[];private dust:Puff[]=[]
 private eras:Panorama[]=[];private era=0;private transition?:{from:number;to:number;at:number};private tileKeys=new Set<string>();private cleanTiles=false
 private chestSprites:Phaser.GameObjects.Image[]=[];private chestVisibleAt=0;private chestActive=false;private chestExitAt=-Infinity;private chestKey='';private chestFXAt=0
 private ambientTime=0
 private focusArt:Phaser.GameObjects.Image[]=[]
 constructor(mode:Mode,read:()=>SceneInput,hooks:Hooks){super('DuckExperience');this.mode=mode;this.read=read;this.hooks=hooks}
 preload(){
  this.load.on('loaderror',(file:Phaser.Loader.File)=>{this.failed=true;this.hooks.error(`Không tải được hình ${file.key}. Hãy thử lại.`)})
  if(this.mode==='field'){this.load.svg('feather',ROOT+'ui-v6/focus-feather.svg');this.load.svg('spark',ROOT+'ui-v6/focus-spark.svg');return}
  if(this.mode==='chests'){
   for(const kind of ['safe','single','explosive'])for(let f=0;f<6;f++)this.load.image(`chest-${kind}-${f}`,`${ROOT}eras-v2/chests/${kind}/${f}.webp`)
   this.load.image('painted-fx',ROOT+'eras-v2/chest-fx.webp')
  }else{
   this.load.atlas('native',ART+'native.png',ART+'native.json');this.load.atlas('cosmetics',ART+'cosmetics.png',ART+'cosmetics.json')
   this.load.svg('shadow',ROOT+'svg/shadow.svg');this.load.svg('marker',ROOT+'ui-v6/you-marker.svg')
   this.load.image('painted-fx',ROOT+'scroll-v4/smoke-atlas.webp')
   if(this.mode==='landing')this.load.image('landing',ART+'landing.webp')
   if(this.mode==='race'){
    this.load.json('eras',ROOT+'scroll-v4/manifest.json')
    for(let era=0;era<6;era++)for(let i=0;i<4;i++)this.load.image(`scene-${era}-${i}`,`${ROOT}scroll-v4/${era+1}/scene-${i+1}.webp`)
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
  const fx=this.textures.get('painted-fx'),source=fx.getSourceImage() as HTMLImageElement
  for(let i=0;i<8;i++)fx.add(String(i),0,Math.floor(i%4*source.width/4),Math.floor(Math.floor(i/4)*source.height/2),Math.floor(source.width/4),Math.floor(source.height/2))
  for(let i=0;i<48;i++)this.dust.push({image:this.add.image(0,0,'painted-fx','0').setVisible(false).setDepth(9000),at:0,life:0,x:0,y:0,size:0,screen:false})
  if(this.mode==='race'){this.eras=this.cache.json.get('eras').eras;for(let i=0;i<16;i++)this.background.push(this.add.image(0,0,'scene-0-0').setOrigin(0).setScrollFactor(0).setDepth(-100))}
  if(this.mode==='landing')this.background.push(this.add.image(0,0,'landing').setOrigin(0).setDepth(-100))
  if(this.mode==='chests')for(const kind of ['safe','single','explosive'] as const){const sprite=this.add.image(0,0,`chest-${kind}-0`).setOrigin(.5,364/384).setVisible(false);this.chestSprites.push(sprite)}
  this.game.canvas.setAttribute('aria-hidden','true');this.game.canvas.dataset.engine='phaser-4.2.1';this.hooks.ready()
  this.events.once('shutdown',()=>{this.actors.clear();this.tileKeys.clear();this.dust=[]})
 }
 private tile(era:number,index:number){
  const key=`painted-${era}-${index}`;if(this.textures.exists(key))return key
  const source=this.textures.get(`scene-${era}-${index}`).getSourceImage() as HTMLImageElement,cut=this.eras[era].roadCuts[index]
  const texture=this.textures.createCanvas(key,1152,512)!;const ctx=texture.context,top=512*.52,bottom=512*.77,a=Math.round(source.height*cut[0]),b=Math.round(source.height*cut[1])
  ctx.drawImage(source,0,0,source.width,a,0,0,1152,top);ctx.drawImage(source,0,a,source.width,b-a,0,top,1152,bottom-top);ctx.drawImage(source,0,b,source.width,source.height-b,0,bottom,1152,512-bottom)
  ctx.globalCompositeOperation='destination-in';const blend=ctx.createLinearGradient(0,0,128,0);blend.addColorStop(0,'rgba(0,0,0,0)');blend.addColorStop(1,'#000');ctx.fillStyle=blend;ctx.fillRect(0,0,1152,512);texture.refresh();this.tileKeys.add(key);return key
 }
 private scenery(era:number,camera:number,zoom:number,now:number,reduced:boolean){
  if(this.cleanTiles){for(const sprite of this.background)sprite.setTexture(`scene-${this.era}-0`).setVisible(false);for(const key of this.tileKeys)if(!key.startsWith(`painted-${this.era}-`)){this.textures.remove(key);this.tileKeys.delete(key)}this.cleanTiles=false}
  if(era!==this.era&&!this.transition){if(reduced)this.era=era;else{this.transition={from:this.era,to:era,at:now};for(let i=0;i<5;i++)this.puff(-170-i*110,this.scale.height*(.35+i*.045),260,1600,now+i*45,true)}}
  const transition=this.transition,progress=transition?Math.min(1,(now-transition.at)/1250):0
  const views=transition?[{era:transition.from,alpha:1},{era:transition.to,alpha:progress*progress*(3-2*progress)}]:[{era:this.era,alpha:1}]
  const first=Math.floor(camera/1024)-1,count=Math.ceil(this.scale.width/(1024*zoom))+2;let slot=0
  for(const view of views)for(let j=0;j<count;j++){
   const tile=first+j,index=((tile%4)+4)%4,sprite=this.background[slot++];if(!sprite)continue
   sprite.setTexture(this.tile(view.era,index)).setPosition((tile*1024-camera)*zoom,0).setDisplaySize(1152*zoom,this.scale.height).setAlpha(view.alpha).setVisible(true)
  }
  for(;slot<this.background.length;slot++)this.background[slot].setVisible(false)
  if(transition&&progress>=1){this.era=transition.to;this.transition=undefined;this.cleanTiles=true}
  this.game.canvas.dataset.scene=String(((Math.floor((camera+this.scale.width*.38/zoom)/1024)%4)+4)%4+1)
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
 private particles(now:number,delta:number){for(const p of this.dust){if(!p.life)continue;const t=(now-p.at)/p.life;if(t<0)continue;if(t>=1){p.life=0;p.image.setVisible(false);continue}p.image.setVisible(true).setFrame(String(Math.min(7,Math.floor(t*8)))).setPosition(p.x+(p.screen?t*1800:-t*14),p.y).setDisplaySize(p.size,p.size*.56).setAlpha(Math.sin(t*Math.PI)*(p.screen?.23:.28));if(p.screen)p.image.setDepth(6000);else p.image.setDepth(p.y+.2)}void delta}
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
  this.scenery(Math.min(5,Math.floor(elapsed/120000)),this.motion.camera,zoom,clock,reduced)
  const keep=new Set<string>()
  for(const p of s.players){const runner=this.motion.actors.get(p.id)!;const x=(runner.worldX-this.motion.camera)*zoom,y=h*.52+h*.25*(.12+p.y/6*.76),size=w<600?2.15:2.7
   const pose=active?runner.pose:'idle',frame=active?runner.frame:0,z=active?runner.z:0
   const a=this.drawActor(p,x,y,pose,frame,z*zoom,size,input.host,p.id===s.me?.id&&!input.host,elapsed,runner.delta,runner.changedAt);keep.add(p.id)
   if(!reduced&&active){const beat=Math.floor(runner.gait/2);if(beat!==a.beat&&!runner.damage){a.beat=beat;this.puff(x-18,y,28,580,clock)}}
   if(p.id===s.me?.id)Object.assign(this.game.canvas.dataset,{pose,frame:String(frame),score:String(p.points),bodyScale:String(size),worldX:String(runner.worldX),offset:String(runner.offset),jumpHeight:String(z),damage:String(!!runner.damage)})
  }
  for(const [id,a]of this.actors)if(!keep.has(id)){Object.values(a).forEach(object=>{if(object&&typeof object==='object'&&'destroy'in object)(object as Phaser.GameObjects.GameObject).destroy()});this.actors.delete(id)}
  this.particles(clock,delta)
 }
 private updateChests(input:SceneInput,clock:number){
  const s=input.snapshot,q=s?.experience?.quiz,chest=s?.experience?.chest,elapsed=s?elapsedTime(s,input.now):0
  const visible=!!q&&['chests','opening','target'].includes(q.phase),w=this.scale.width,h=this.scale.height
  if(visible&&!this.chestActive){this.chestVisibleAt=clock;this.chestFXAt=0}
  if(!visible&&this.chestActive)this.chestExitAt=clock
  this.chestActive=visible
  const display=visible||!input.reduced&&clock-this.chestExitAt<240
  const key=chest?chest.kind+':'+chest.chosenAt:'';if(this.chestKey!==key){this.chestKey=key;this.chestFXAt=0}
  const enter=input.reduced?1:Math.min(1,(clock-this.chestVisibleAt)/350),exit=visible?1:Math.max(0,1-(clock-this.chestExitAt)/240),size=Math.min(350,w/3*1.4,h*.94),scale=size/384
  for(const [i,kind]of (['safe','single','explosive'] as const).entries()){
   const sprite=this.chestSprites[i];if(!sprite)continue;sprite.setVisible(display);if(!display)continue
   const selected=chest?.kind===kind,age=chest?(elapsed-chest.chosenAt)/1000:-1,frame=selected&&age>=.7?Math.min(5,Math.floor((age-.7)/.9*6)):0
   const shake=selected&&age>=0&&age<.7&&!input.reduced?Math.sin(age*62)*Math.sin(age/.7*Math.PI):0
   sprite.setTexture(`chest-${kind}-${frame}`).setPosition(w*(i+.5)/3+shake*2,h-18+(1-enter)**3*18).setScale(scale).setAngle(shake*1.4).setAlpha(enter*exit*(chest&&!selected?.34:1))
   if(selected&&age>1&&age<2.8&&!input.reduced&&clock-this.chestFXAt>90){this.chestFXAt=clock;this.puff(w*(i+.5)/3+Math.sin(age*17)*size*.25,h-size*.52,26,650,clock)}
  }
  this.particles(clock,16)
 }
}
export function createExperienceGame(parent:HTMLElement,kind:Mode,read:()=>SceneInput,hooks:Hooks){
 const transparent=kind==='chests'||kind==='portrait'||kind==='field'
 return new Phaser.Game({type:Phaser.AUTO,parent,banner:false,title:'Quiz Duck Race',backgroundColor:transparent?'rgba(0,0,0,0)':'#a6cbd1',transparent,antialias:true,roundPixels:false,scale:{mode:Phaser.Scale.RESIZE,width:Math.max(1,parent.clientWidth),height:Math.max(1,parent.clientHeight),expandParent:false},fps:{target:60,smoothStep:true},audio:{noAudio:true},autoFocus:false,disableContextMenu:true,input:{keyboard:false},scene:new ExperienceScene(kind,read,hooks)})
}
