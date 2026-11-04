import { Container, Sprite, type Texture } from 'pixi.js'
import type { GearId } from './contracts'
/** Frame-baked overlays follow exactly the character's native sprite frame. */
export class GearRig {
  root=new Container()
  head=new Sprite()
  body=new Sprite()
  private textures:Record<string,Texture>
  constructor(textures:Record<string,Texture>){this.textures=textures;this.root.addChild(this.body,this.head);this.head.anchor.set(.5,.75);this.body.anchor.set(.5,.75)}
  update(_key:string,pose:string,frame:number,head:GearId|undefined,body:GearId|undefined,facing:number,y:number,_stamp:number){
    this.root.scale.set(facing*3.2,3.2);this.root.y=y
    this.head.visible=!!head;this.body.visible=!!body
    if(head)this.head.texture=this.textures[`${head}/${pose}/${frame}`]||this.textures[`${head}/idle/0`]
    if(body)this.body.texture=this.textures[`${body}/${pose}/${frame}`]||this.textures[`${body}/idle/0`]
  }
}
