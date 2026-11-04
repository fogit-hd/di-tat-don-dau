import poses from './porter-sprites-v4.json'
import { groundedRoute, groundedStep, walkingProgress } from './grounded-walk'

/** One consignment: warehouse porter → rigging on the quay → crane → deckhand. */
// Two warehouse deliveries share one slower, offscreen-turning traffic circuit.
export const HERO_LOOP_SECONDS = 48
export const HERO_ASSET_ROOT = '/assets/living-hero-v3/'
export const HERO_SPRITES = ['truck','truck-return','boat','carry','setdown','return','receiver','turn','pivot','parcel','hook','smoke','water'] as const
export type HeroSprites = Partial<Record<(typeof HERO_SPRITES)[number], HTMLImageElement>>
type Clip = keyof typeof poses.clips
type Point = [number, number]
export const heroAssetUrl = (name:string) => name==='truck-return'?'/assets/living-hero-v6/truck-return.webp':name in poses.clips?poses.clips[name as Clip].src:name==='parcel'?'/assets/living-hero-v4/parcel.webp':name==='boat' ? '/assets/living-hero-v2/boat-empty.webp'
 : ['smoke','water'].includes(name) ? '/assets/living-hero-v1/'+name+'.webp' : HERO_ASSET_ROOT+name+'.webp'
const tau=Math.PI*2, clamp=(v:number)=>Math.max(0,Math.min(1,v))
const ease=(p:number)=>{const n=clamp(p);return n*n*(3-2*n)}
const mix=(a:number,b:number,p:number)=>a+(b-a)*p
const lerp=(a:Point,b:Point,p:number):Point=>[mix(a[0],b[0],p),mix(a[1],b[1],p)]
const phase=(t:number,period:number)=>((t%period)+period)%period/period

// Contact points measured on each native camera view. The return is drawn from
// behind; no mirrored front grille, changing shear or mid-road turnaround.
export const TRUCK_VIEWS={
 truck:{size:[1016,514],front:[631/1016,505/514],rear:[181/1016,466/514],
  tyres:[[631/1016,505/514,.055],[181/1016,466/514,.047],[872/1016,488/514,.040]],
  hubs:[[.163,.795,.023,.055],[.607,.833,.028,.068]]},
 'truck-return':{size:[1280,611],front:[144/1280,491/611],rear:[681.5/1280,590/611],
  tyres:[[144/1280,491/611,.047],[681.5/1280,590/611,.065],[989.5/1280,572/611,.048]],
  hubs:[[.100,.663,.020,.063],[.518,.808,.025,.074]]},
}

export function heroTruckMotion(time:number,mobile=false){
 const clock=((time%HERO_LOOP_SECONDS)+HERO_LOOP_SECONDS)%HERO_LOOP_SECONDS
 const returning=clock>=25,truckSource=returning?'truck-return':'truck',truckDirection=returning?-1:1
 const progress=walkingProgress(clock-(returning?27:1.5),16)
 const start=returning?1.42:-.38,end=returning?-.38:1.42
 const tyreX=mix(start,end,progress),l=heroLayout(mobile),aspect=mobile?1086/1448:1672/941
 const truckWidth=mobile?(returning?.31:.34):(returning?.175:.185)
 // The return view previously moved UP toward the quay wall. Its tyre soles
 // must instead sit inside the paved strip, below the wall's masonry footing.
 // Leave the accepted outward trajectory exactly as it was.
 const lane=returning?(mobile?.010:.012):0,tyreY=l.road[0]+l.road[1]*tyreX+lane
 const view=TRUCK_VIEWS[truckSource],sourceAngle=Math.atan2((view.rear[1]-view.front[1])*view.size[1],(view.rear[0]-view.front[0])*view.size[0])
 const groundAngle=Math.atan(l.road[1]/aspect)+(returning?0:Math.PI)
 const truckRotation=groundAngle-sourceAngle
 return {truckSource:truckSource as keyof typeof TRUCK_VIEWS,truckDirection,truckWidth,truckRotation,tyreX,tyreY,drive:progress,
  truckDistance:Math.abs(tyreX-start)*Math.hypot(1,l.road[1]/aspect),truckTime:clock,
  truckVisible:progress>0&&progress<1}
}

/** Feet are on the loading apron. Inside the bay the same actor is occluded by
 * its real doorway, rather than fading into existence on an open conveyor. */
export function heroLayout(mobile:boolean){
 const body=mobile?.105:.117,aspect=mobile?1086/1448:1672/941
 const pallet:Point=mobile?[.790,.633]:[.810,.671]
 const work:Point=[pallet[0]-poses.parcel.offset[0]*body/aspect,pallet[1]-poses.parcel.offset[1]*body]
 const boatWidth=mobile?.30:.17,boatDock=mobile?.845:.875,boatBase=mobile?.749:.807
 const boatHeight=boatWidth*aspect*365/900
 // Deck coordinates belong to the vessel, not the background painting. The
 // parcel rests inside the near gunwale, with its bottom hidden by that rail.
 const deck:Point=[boatDock+(.43-.5)*boatWidth,boatBase-(1-.74)*boatHeight]
 const slingHeight=(poses.parcel.bottom-poses.parcel.hook[1])*body/poses.parcel.referenceHeight
 const crewFloor=boatBase-(1-.71)*boatHeight
 const receiverHeight=(crewFloor-deck[1]+slingHeight)/-poses.receiverContact[1]
 const vessel={boatWidth,boatDock,boatBase,boatHeight,deck,receiverHeight,crewFloor}
 return mobile ? {
  ...vessel,
  inside:[.465,.635] as Point, door:[.525,.637] as Point, threshold:[.563,.65] as Point, work,
  doorway:[[.462,.639],[.462,.551],[.478,.528],[.509,.521],[.548,.531],[.568,.549],[.568,.639]] as Point[], actorHeight:body,
  clearY:.486, boomA:[724/1086,560/1448] as Point, boomB:[915/1086,350/1448] as Point,
  road:[.817,.059],
  water:[[.835,.638],[1,.622],[1,.815],[.62,.735],[.42,.735],[.42,.713],[.835,.643]] as Point[],
  foreground:[[.44,.765],[.60,.778],[.82,.824],[1,.838],[1,1],[.44,1]] as Point[],
  roadside:[[[0,.65],[.11,.72],[.19,.82],[.26,.93],[.57,1],[0,1]],[[.885,.855],[.94,.848],[1,.851],[1,1],[.85,1],[.85,.898],[.885,.89]]] as Point[][],
 } : {
  ...vessel,
  inside:[.638,.686] as Point, door:[.682,.687] as Point, threshold:[.709,.699] as Point, work,
  doorway:[[.659,.689],[.659,.560],[.667,.550],[.680,.551],[.697,.559],[.705,.577],[.705,.689]] as Point[], actorHeight:body,
  clearY:.47, boomA:[1260/1672,324/941] as Point, boomB:[1445/1672,142/941] as Point,
  road:[.80,.14],
  water:[[.91,.675],[1,.65],[1,.87],[.61,.792],[.61,.775],[.91,.706]] as Point[],
  foreground:[[.60,.81],[.72,.833],[.90,.873],[1,.881],[1,1],[.60,1]] as Point[],
  roadside:[[[0,.49],[.12,.52],[.19,.67],[.21,.81],[.27,.95],[.40,1],[0,1]],[[1630/1672,760/941],[1,750/941],[1,1],[1526/1672,1],[1526/1672,884/941],[1560/1672,877/941],[1560/1672,834/941],[1626/1672,821/941],[1630/1672,821/941]]] as Point[][],
 }
}

export function heroMotion(time:number,mobile=false){
 const t=((time%24)+24)%24,l=heroLayout(mobile)
 // Projection uses the painting's own aspect ratio, independent of viewport.
 const aspect=mobile?1086/1448:1672/941, h=l.actorHeight
 const floor:Point=[l.work[0]+poses.parcel.offset[0]*h/aspect,l.work[1]+poses.parcel.offset[1]*h]
 const boatX=t<4?mix(1.22,l.boatDock,ease(t/4)):t<16?l.boatDock:mix(l.boatDock,1.22,ease((t-16)/7))
 const boatBob=t>=4&&t<=16?0:Math.sin(phase(t,4)*tau)*.0007
 const depart:Point=[l.deck[0]+boatX-l.boatDock,l.deck[1]+boatBob]
 const owner=t<6?'porter':t<6.6?'quay':t<13?'crane':'boat'
 const cargo:Point=t<6.6?floor:t<8.6?[floor[0],mix(floor[1],l.clearY,ease((t-6.6)/2))]
  :t<10.6?[mix(floor[0],l.deck[0],ease((t-8.6)/2)),l.clearY]
  :t<13?[l.deck[0],mix(l.clearY,l.deck[1],ease((t-10.6)/2.4))]:depart
 const hookX=t<8.6?floor[0]:t<10.6?cargo[0]:t<15.6?l.deck[0]:mix(l.deck[0],floor[0],ease((t-15.6)/2))
 const slingHeight=(poses.parcel.bottom-poses.parcel.hook[1])*h/poses.parcel.referenceHeight
 const contactY=l.deck[1]-slingHeight
 const hookY=t<4.4?l.clearY-slingHeight:t<5.5?mix(l.clearY-slingHeight,floor[1]-slingHeight,ease((t-4.4)/1.1))
  :t<6.6?floor[1]-slingHeight:t<13?cargo[1]-slingHeight:t<14.1?contactY
  :mix(contactY,l.clearY-slingHeight,ease((t-14.1)/1.5))
 const anchor=lerp(l.boomA,l.boomB,clamp((hookX-l.boomA[0])/(l.boomB[0]-l.boomA[0])))
 let porter:Point, clip:Clip='carry',frame=0,inside=false,walkSample=0
 if(t<4.4){
  const end:Point=[l.work[0]+(poses.setdownGrip[0]-poses.carryGrip[0])*h/aspect,l.work[1]+(poses.setdownGrip[1]-poses.carryGrip[1])*h]
  const path=groundedRoute([l.inside,l.door,l.threshold,end],h,aspect,poses.clips.carry.stride,'start')
  const step=groundedStep(path,walkingProgress(t,4.4));porter=step.at;frame=step.frame;inside=step.segment===0;walkSample=step.sample
 }else if(t<6){porter=l.work;clip='setdown';frame=t<4.55?0:t<4.74?1:t<4.94?2:t<5.13?3:t<5.34?4:t<5.65?5:t<5.83?6:7}
 else if(t<6.6){porter=[l.work[0]+poses.returnOffset*h/aspect,l.work[1]];clip='pivot';frame=Math.min(7,Math.floor((t-6)/.6*8))}
 else {
  const start:Point=[l.work[0]+(poses.returnOffset-poses.clips.return.hipOffsets[0])*h/aspect,l.work[1]]
  const path=groundedRoute([start,l.threshold,l.door,l.inside],h,aspect,poses.clips.return.stride,'end')
  const step=groundedStep(path,walkingProgress(t-6.6,4.7));porter=step.at;frame=step.frame;inside=step.segment===2;walkSample=step.sample;clip='return'
 }
 // The receiving worker stays on the vessel; hands reach the fixed hook point.
 const rh=l.receiverHeight,rc=poses.receiverContact
 const receiver:Point=[depart[0]-rc[0]*rh/aspect,l.crewFloor+boatBob]
 const receiverClip:Clip=t>=14.8?'turn':'receiver'
 const receiverFrame=t>=14.8?Math.min(7,Math.floor((t-14.8)/.13)):t<13.2?0:t<13.45?1:t<13.8?2:t<14?3:t<14.2?4:t<14.45?5:t<14.7?6:7
 const traffic=heroTruckMotion(time,mobile)
 return {t,owner,cargo,floor,porter,clip,frame,inside,walkSample,boatX,boatBob,receiver,receiverClip,receiverFrame,hookX,hookY,anchor,...traffic,
  sling:1-ease((t-13.8)/.35),stage:t<4.4?'carry-from-warehouse':t<6?'set-down-and-rig':t<6.6?'clear-hands':t<13?'crane-loading':t<16?'deckhand-unhooks':'loaded-boat-departs'}
}

export function paintHero(ctx:CanvasRenderingContext2D,width:number,height:number,background:HTMLImageElement,sprites:HeroSprites,time:number,mobile:boolean){
 const scale=Math.min(width/background.naturalWidth,height/background.naturalHeight)
 const w=background.naturalWidth*scale,h=background.naturalHeight*scale,left=mobile?(width-w)/2:width-w,top=(height-h)/2
 const l=heroLayout(mobile),m=heroMotion(time,mobile),unit=l.actorHeight*h/poses.parcel.referenceHeight
 ctx.clearRect(0,0,width,height);ctx.save();ctx.translate(left,top);ctx.drawImage(background,0,0,w,h)
 ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip()
 const polygon=(points:Point[])=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.closePath()}
 const draw=(key:keyof HeroSprites,x:number,y:number,sw:number,opacity=1)=>{
  const image=sprites[key];if(!image)return
  ctx.save();ctx.globalAlpha=opacity;ctx.drawImage(image,x*w,y*h,sw*w,sw*w*image.naturalHeight/image.naturalWidth);ctx.restore()
 }
 const person=(clip:Clip,frame:number,at:Point,bodyHeight:number)=>{
  const image=sprites[clip];if(!image)return
  const config=poses.clips[clip] as {frames:{rect:number[]}[];anchor?:number[];referenceHeight?:number;mirrorX?:boolean}
  const a=config.anchor??poses.anchor,reference=config.referenceHeight??poses.referenceHeight
  const [sx,sy,sw,sh]=config.frames[frame].rect,u=bodyHeight*h/reference
  ctx.save();ctx.translate(at[0]*w,at[1]*h)
  if(config.mirrorX)ctx.scale(-1,1)
  ctx.drawImage(image,sx,sy,sw,sh,-a[0]*u,-a[1]*u,sw*u,sh*u);ctx.restore()
 }
 const parcel=(at:Point,sling=1)=>{
  const im=sprites.parcel;if(!im)return
  const pw=poses.parcel.width*unit,ph=poses.parcel.height*unit,x=at[0]*w-pw/2,y=at[1]*h-poses.parcel.bottom*unit
  const cut=poses.parcel.bodyTop,bodyY=y+ph*cut
  ctx.drawImage(im,0,im.naturalHeight*cut,im.naturalWidth,im.naturalHeight*(1-cut),x,bodyY,pw,ph*(1-cut))
  // The detached sling settles onto the crate; the wooden box never changes size.
  const ropeH=ph*cut*Math.max(.045,sling)
  ctx.drawImage(im,0,0,im.naturalWidth,im.naturalHeight*cut,x,bodyY-ropeH,pw,ropeH)
 }
 const shadow=(at:Point,wide:number,opacity=.14)=>{
  ctx.save();ctx.fillStyle=`rgba(57,37,17,${opacity})`;ctx.beginPath();ctx.ellipse(at[0]*w,at[1]*h,wide*h,wide*h*.13,0,0,tau);ctx.fill();ctx.restore()
 }
 ctx.save();polygon(l.water);ctx.clip()
 for(let i=0;i<3;i++){const p=phase(m.t+i,4);draw('water',(mobile?.78:.84)+p*.015,(mobile?.69:.75)+i*.025,mobile?.20:.12,Math.sin(p*Math.PI)*.12)}
 ctx.restore()
 const ready=['carry','setdown','return','receiver','turn','pivot','parcel','hook','boat'].every(key=>Boolean(sprites[key as keyof HeroSprites]))
 if(ready&&sprites.boat){
  const boat=sprites.boat,bw=l.boatWidth*w,bh=bw*boat.naturalHeight/boat.naturalWidth
  const waterline=(l.boatBase+m.boatBob)*h-bh*.075
  ctx.save();ctx.beginPath();ctx.rect(0,0,w,waterline);ctx.clip();ctx.translate(m.boatX*w,(l.boatBase+m.boatBob)*h);ctx.scale(-1,1);ctx.drawImage(boat,-bw/2,-bh,bw,bh);ctx.restore()
  // The hull floats on the water; cabins are allowed above its surface polygon.
  person(m.receiverClip,m.receiverFrame,m.receiver,l.receiverHeight)
  if(m.owner==='boat')parcel(m.cargo,m.sling)
  // Only the near gunwale covers the bottoms of the deckhand and landed parcel.
  // Trace the painted near rail, rather than copying a horizontal hull strip.
  // Coordinates are in the displayed (bow-left) boat, so its deck, cargo and
  // occluder remain attached while it bobs and leaves the dock.
  const nearRail:Point[]=[[.015,.40],[.12,.49],[.22,.55],[.33,.60],[.43,.64],[.55,.66],[.70,.66],[.88,.63],[.99,.52],[1,1],[0,1]]
  ctx.save();ctx.beginPath()
  nearRail.forEach(([u,v],i)=>{const x=m.boatX*w-bw/2+u*bw,y=(l.boatBase+m.boatBob)*h-bh+v*bh;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)})
  ctx.closePath();ctx.clip();ctx.beginPath();ctx.rect(0,0,w,waterline);ctx.clip()
  ctx.translate(m.boatX*w,(l.boatBase+m.boatBob)*h);ctx.scale(-1,1);ctx.drawImage(boat,-bw/2,-bh,bw,bh);ctx.restore()
  ctx.save();ctx.strokeStyle='rgba(238,250,231,.52)';ctx.lineWidth=Math.max(.7,w*.0007)
  // Low contact ripples follow the partially submerged hull.
  for(let i=0;i<3;i++){
   ctx.beginPath();ctx.ellipse(m.boatX*w+bw*.035,waterline+i*h*.002,bw*(.43+i*.025),h*(.002+i*.001),0,.08,Math.PI-.08);ctx.stroke()
  }
  ctx.restore()
 }
 if(ready){
  ctx.save()
  if(m.inside){polygon(l.doorway);ctx.clip()}
  if(m.t<11.3)shadow(m.porter,l.actorHeight*.20,m.inside?.07:.13)
  person(m.clip,m.frame,m.porter,l.actorHeight)
  ctx.restore()
  if(m.t>=5.65&&m.owner!=='boat'){
   if(m.owner!=='crane')shadow(m.floor,l.actorHeight*.19,.15)
   parcel(m.cargo)
  }
  // Cable is vertical from a trolley on the existing painted crane jib.
  ctx.save();ctx.strokeStyle='#493729';ctx.lineWidth=Math.max(.7,w*.0008)
  const hookH=l.actorHeight*h*.13,hookW=hookH*sprites.hook!.naturalWidth/sprites.hook!.naturalHeight
  const hx=m.hookX*w,hy=m.hookY*h
  ctx.beginPath();ctx.moveTo(m.anchor[0]*w,m.anchor[1]*h);ctx.lineTo(hx,hy-hookH);ctx.stroke()
  ctx.fillStyle='#3b3d32';ctx.fillRect(m.anchor[0]*w-w*.0025,m.anchor[1]*h-h*.003,w*.005,h*.006)
  ctx.drawImage(sprites.hook!,hx-hookW/2,hy-hookH,hookW,hookH);ctx.restore()
  // Copy the original foreground shore over objects behind it: a real depth
  // occluder from the same backplate, never an artificial tinted cover.
  ctx.save();polygon(l.foreground);ctx.clip();ctx.drawImage(background,0,0,w,h);ctx.restore()
 }
 if(sprites[m.truckSource]&&m.truckVisible){
  const im=sprites[m.truckSource]!,view=TRUCK_VIEWS[m.truckSource],tw=m.truckWidth*w,th=tw*im.naturalHeight/im.naturalWidth,x=-tw*view.front[0],y=-th*view.front[1]
  // Only a fixed rigid camera alignment. Scale and perspective never deform as
  // the vehicle travels. The actual front/rear tyre soles stay on their lane.
  ctx.save();ctx.translate(m.tyreX*w,m.tyreY*h);ctx.rotate(m.truckRotation)
  if(m.truckSource==='truck-return'){
   // The footprint lies on the road plane between the three visible tyre
   // contacts; it does not lift the truck or hide a gap with a blurred shadow.
   ctx.fillStyle='rgba(54,38,18,.13)';ctx.beginPath()
   view.tyres.forEach(([px,py],i)=>{if(i)ctx.lineTo(x+px*tw,y+py*th);else ctx.moveTo(x+px*tw,y+py*th)})
   ctx.closePath();ctx.fill()
  }
  for(const [px,py,rx]of view.tyres){
   ctx.fillStyle='rgba(46,28,14,.28)';ctx.beginPath();ctx.ellipse(x+px*tw,y+py*th,rx*tw,th*.013,0,0,tau);ctx.fill()
  }
  ctx.drawImage(im,x,y,tw,th)
  for(const [px,py,rx,ry]of view.hubs){
   ctx.save();ctx.translate(x+px*tw,y+py*th);ctx.scale(rx*tw,ry*th);ctx.beginPath();ctx.arc(0,0,1,0,tau);ctx.clip();ctx.rotate(m.truckDirection*m.truckDistance*w/(ry*th))
   ctx.drawImage(im,(px-rx)*im.naturalWidth,(py-ry)*im.naturalHeight,rx*2*im.naturalWidth,ry*2*im.naturalHeight,-1,-1,2,2);ctx.restore()
  }
  ctx.restore()
  // Near trees/stock conceal the road's entry and exit. The vehicle never resets
  // in open view, drives through the wall, or passes in front of near foliage.
  for(const foreground of l.roadside){ctx.save();polygon(foreground);ctx.clip();ctx.drawImage(background,0,0,w,h);ctx.restore()}
 }
 const chimneys=mobile?[[.104,.061],[.285,.098]]:[[.471,.081],[.558,.106],[.635,.177],[.669,.256]]
 for(const [index,chimney]of chimneys.entries())for(let i=0;i<3;i++){
  const p=phase(m.t+i+index*.41,4),size=(mobile?.20:.12)*(.55+p*.55)
  draw('smoke',chimney[0]-size*.87-p*.025,chimney[1]-size*w/h*.85-p*.025,size,Math.sin(p*Math.PI)*.3)
 }
 ctx.globalCompositeOperation='destination-in'
 const edge=ctx.createLinearGradient(0,0,w,0);edge.addColorStop(0,'transparent');edge.addColorStop(mobile?.035:.08,'#000');if(mobile)edge.addColorStop(.965,'#000');edge.addColorStop(1,mobile?'transparent':'#000');ctx.fillStyle=edge;ctx.fillRect(0,0,w,h)
 const upper=ctx.createLinearGradient(0,0,0,h);upper.addColorStop(0,'transparent');upper.addColorStop(.025,'#000');upper.addColorStop(1,'#000');ctx.fillStyle=upper;ctx.fillRect(0,0,w,h)
 ctx.restore()
}
