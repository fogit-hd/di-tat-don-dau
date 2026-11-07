import Phaser from 'phaser'
import {actorPose,awardLayout,awardPad,awardSchedule,phaseAt,SHEETS,type AwardPhase,type ResultPlayer,type Sheet} from './motion'

const ROOT='/assets/duck-race/',ART=ROOT+'results-v1/'
export type AwardsInput={players:readonly ResultPlayer[];reduced:boolean;paused:boolean;replay:number}
export type AwardsFrame={phase:AwardPhase;revealed:number[];layout:ReturnType<typeof awardLayout>;done:boolean}
type Hooks={ready:()=>void;frame:(state:AwardsFrame)=>void;error:(message:string)=>void}
type Actor={player:ResultPlayer;body:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Ellipse}

class AwardsScene extends Phaser.Scene{
 private read:()=>AwardsInput;private hooks:Hooks;private elapsed=0;private replay=0;private failed=false
 private actors:Actor[]=[];private cups?:Phaser.GameObjects.Image;private lastState=''
 private clip?:Phaser.GameObjects.Graphics;private mask?:Phaser.Display.Masks.GeometryMask
 constructor(read:()=>AwardsInput,hooks:Hooks){super('DuckAwards');this.read=read;this.hooks=hooks}
 preload(){
  this.load.on('loaderror',()=>{if(!this.failed){this.failed=true;this.hooks.error('Không tải được hoạt ảnh trao giải. Vui lòng thử lại.')}})
  this.load.image('cups',ART+'trophy-cups.webp')
  this.load.atlas('native',ROOT+'experience-v4/native.png',ROOT+'experience-v4/native.json')
  const keys=new Set<string>()
  for(const p of this.read().players.filter(p=>p.rank<=3)){
   const sheets:Sheet[]=p.rank===1?['winner-parachute','winner-stow','winner-coronation','winner-crowned-idle']:p.rank===2?['silver-gift','silver-cheer']:['bronze-climb']
   for(const key of sheets){const id=p.color+'/'+key;if(keys.has(id))continue;keys.add(id)
    this.load.spritesheet(id,ART+id+'.png',{frameWidth:SHEETS[key].cell,frameHeight:SHEETS[key].cell})}
   if(p.rank===3)for(let f=0;f<2;f++)this.load.image(p.color+'/crouch/'+f,ROOT+'duckee/'+p.color+'/crouch/'+f+'.png')
  }
 }
 create(){
  if(this.failed)return
  for(const key of this.textures.getTextureKeys())if(key!=='cups')this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST)
  this.cups=this.add.image(0,0,'cups').setOrigin(0)
  this.clip=this.make.graphics({x:0,y:0},false);this.mask=this.clip.createGeometryMask()
  this.actors=this.read().players.filter(p=>p.rank<=3).map(player=>({player,
   shadow:this.add.ellipse(0,0,20,3.6,0x071c11,.22).setDepth(1),
   body:this.add.image(0,0,'native',player.color+'/idle/0').setVisible(false).setDepth(2)}))
  this.game.canvas.setAttribute('aria-hidden','true');this.game.canvas.dataset.engine='phaser-4.2.1'
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{for(const a of this.actors)a.body.clearMask();this.mask?.destroy();this.clip?.destroy()})
  this.hooks.ready();this.paint()
 }
 update(_clock:number,delta:number){
  if(this.failed||!this.cups)return
  const input=this.read(),schedule=awardSchedule(input.players)
  if(this.replay!==input.replay){this.replay=input.replay;this.elapsed=0}
  if(input.reduced)this.elapsed=schedule.total
  else if(!input.paused&&!document.hidden)this.elapsed=Math.min(schedule.total,this.elapsed+Math.min(80,delta))
  this.paint()
 }
 private paint(){
  const input=this.read(),s=awardSchedule(input.players),t=this.elapsed,w=this.scale.width,h=this.scale.height,l=awardLayout(w,h)
  const intro=input.reduced?1:Math.min(1,t/550)
  this.cups?.setPosition(l.ix,l.iy+(1-intro)*18).setDisplaySize(l.iw,l.ih).setAlpha(intro)
  const revealed:number[]=[]
  for(const a of this.actors){
   const rank=a.player.rank,pose=actorPose(rank,t,s),pad=awardPad(rank,l)
   a.body.setVisible(pose.visible);a.shadow.setVisible(pose.visible)
   if(!pose.visible)continue
   if(pose.landed)revealed.push(rank)
   a.shadow.setPosition(pad.x,pad.y+1).setScale(l.scale).setAlpha(.22*(rank===1&&!pose.landed?pose.p:1))
   if(pose.key==='idle'||pose.key==='land')a.body.setTexture('native',`${a.player.color}/${pose.key}/${pose.frame}`)
   else if(pose.key==='crouch')a.body.setTexture(`${a.player.color}/crouch/${pose.frame}`)
   else a.body.setTexture(`${a.player.color}/${pose.key}`,pose.frame)
   a.body.setOrigin(.5,pose.cell===96?88/96:48/64).setScale(l.scale)
   let x=pad.x,y=pad.y+pose.offset*l.scale
   if(rank===1&&!pose.landed){const descent=1-(1-pose.p)**1.35;y=-90+(pad.y+90)*descent;x+=Math.sin(pose.p*Math.PI*3)*(1-pose.p)*l.scale*5}
   a.body.setPosition(x,y)
   if(rank===3&&!pose.landed){this.clip?.clear().fillStyle(0xffffff).fillRect(0,0,w,pad.y+1);if(this.mask)a.body.setMask(this.mask)}
   else a.body.clearMask()
  }
  const phase=phaseAt(t,s),done=t>=s.total,key=[phase,revealed.join(','),w,h,done].join('|')
  this.game.canvas.dataset.awardPhase=phase
  if(this.lastState!==key){this.lastState=key;this.hooks.frame({phase,revealed,layout:l,done})}
 }
}
export function createAwardsGame(parent:HTMLElement,read:()=>AwardsInput,hooks:Hooks){
 return new Phaser.Game({type:Phaser.AUTO,parent,banner:false,transparent:true,antialias:true,autoFocus:false,disableContextMenu:true,
  scale:{mode:Phaser.Scale.RESIZE,width:Math.max(1,parent.clientWidth),height:Math.max(1,parent.clientHeight),expandParent:false},
  fps:{target:60,smoothStep:true},audio:{noAudio:true},input:{keyboard:false},scene:new AwardsScene(read,hooks)})
}
