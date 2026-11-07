import Phaser from 'phaser'
export type PaintedKind='safe'|'chain'|'skull'|'lightning'|'wind'
/** Authored V5 frames; the renderer interpolates opacity, never redraws art. */
export class PaintedFX {
 static preload(scene:Phaser.Scene,kinds:PaintedKind[]){
  for(const kind of kinds)for(let f=0;f<6;f++)scene.load.image(`v5-${kind}-${f}`,`/assets/duck-race/experience-v5/fx/${kind}/${f}.webp`)
 }
 private sprites:Phaser.GameObjects.Image[]
 constructor(scene:Phaser.Scene){this.sprites=[0,1].map(()=>scene.add.image(0,0,'v5-wind-0').setOrigin(.5,.78).setVisible(false))}
 hide(){for(const image of this.sprites)image.setVisible(false)}
 draw(kind:PaintedKind,progress:number,x:number,y:number,size:number,depth:number,reduced=false){
  if(progress<0||progress>=1){this.hide();return}
  const phase=progress*5,a=Math.floor(phase),b=Math.min(5,a+1),mix=phase-a
  for(const [i,image]of this.sprites.entries())image.setTexture(`v5-${kind}-${i?b:a}`).setPosition(x,y).setDisplaySize(size,size).setDepth(depth).setAlpha((i?mix:1-mix)*(reduced?.4:.85)).setVisible(true)
 }
 destroy(){for(const image of this.sprites)image.destroy()}
}
