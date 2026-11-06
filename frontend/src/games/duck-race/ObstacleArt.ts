import { Assets, AnimatedSprite, Container, Sprite, Text, type Spritesheet, type Texture } from 'pixi.js'
import { OBSTACLE_RULES, type HazardView, type RacerView } from './contracts'
import { CRAWL_ART, crawlGateRegistration } from './phaser/world/crawlGate'

/** Painted models have their own ground pivot; Z height never changes their collision footprint. */
export class ObstacleArt {
  private textures = new Map<string, Texture>()
  private catcher!: Spritesheet
  private nodes = new Map<string, { root: Container; image: Sprite; shadow: Sprite; label?:Text }>()
  private world: Container
  constructor(world: Container) { this.world=world }
  async load() {
    await Promise.all(Object.keys(OBSTACLE_RULES).filter(k=>k!=='catcher').map(async k=>{
      this.textures.set(k,await Assets.load<Texture>(k==='underpass'?'/assets/duck-race/phaser-v2/crawl-gate.webp':`/assets/duck-race/v14/obstacle-${k}.webp`))
    }))
    this.textures.set('shadow',await Assets.load<Texture>('/assets/duck-race/svg/shadow.svg'))
    this.catcher=await Assets.load<Spritesheet>('/assets/duck-race/v14/catcher.json')
  }
  render(h:HazardView,x:number,y:number,now:number,players:RacerView[],reduced:boolean,showNames=false){
    if(!(h.kind in OBSTACLE_RULES))return false
    let item=this.nodes.get(h.id)
    if(!item){
      const root=new Container(),shadow=new Sprite(this.textures.get('shadow')!),image=h.kind==='catcher'
        ?new AnimatedSprite(this.catcher.animations.empty):new Sprite(this.textures.get(h.kind)!)
      shadow.anchor.set(.5);shadow.alpha=.48
      if(image instanceof AnimatedSprite)image.autoUpdate=false
      root.addChild(shadow,image);this.world.addChild(root);item={root,image,shadow};this.nodes.set(h.id,item)
    }
    const {root,image,shadow}=item,span=h.spanY??48
    root.position.set(x,y);root.visible=true;root.zIndex=y+span/2
    shadow.width=h.kind==='catcher'?70:Math.max(35,h.thicknessX??32);shadow.height=span+6
    if(h.kind==='catcher'&&image instanceof AnimatedSprite){
      const caught=players.find(p=>p.id===h.caughtRacerId),key=caught?`${caught.model}/${caught.model==='ducky'?'yellow':caught.color}`:'empty'
      const frames=this.catcher.animations[key]||this.catcher.animations.empty
      if(image.textures!==frames)image.textures=frames
      const t=h.caughtAt?now-h.caughtAt:0,alert=h.alertedAt?now-h.alertedAt:0
      const frame=h.caughtAt?(t<140?4:t<340?5:t<580?6:t<1000?7:6):!h.alertedAt?0:alert<240?1:alert<540?2:alert<900?3:0
      image.gotoAndStop(reduced&&h.caughtAt?6:frame)
      image.anchor.set(.23,.92);image.width=image.height=240;image.y=18
      shadow.position.set(96,17);shadow.width=100;shadow.height=18
      if(caught&&showNames){
        if(!item.label){item.label=new Text({text:'',style:{fontFamily:'Public UI',fontSize:14,fontWeight:'bold',fill:0xffedb3,stroke:{color:0x14372a,width:4}}});item.label.anchor.set(.5);root.addChild(item.label)}
        item.label.text=caught.name.length>22?caught.name.slice(0,21)+'…':caught.name;item.label.position.set(40,-190)
      }
    }else if(h.kind==='underpass'){
      const r=crawlGateRegistration(h)
      image.anchor.set(CRAWL_ART.axisX/CRAWL_ART.width,0);image.scale.set(r.scale)
      image.position.set(0,r.topY-y);shadow.y=0
    }else{
      image.anchor.set(.5,1)
      // The art runs along depth (screen Y), presenting its left face to a duck moving +X.
      // Fixed X thickness, randomized ground span; front foot is exactly at the footprint end.
      image.width=h.kind==='cart'?84:h.kind==='wall'?72:58
      image.height=span+(h.kind==='double'?68:h.kind==='wall'||h.kind==='cart'?110:24)
      image.y=span/2
      shadow.y=0
    }
    return true
  }
  begin(){for(const item of this.nodes.values())item.root.visible=false}
  end(){for(const [id,item] of this.nodes)if(!item.root.visible){item.root.destroy({children:true});this.nodes.delete(id)}}
  destroy(){for(const item of this.nodes.values())item.root.destroy({children:true});this.nodes.clear()}
}
