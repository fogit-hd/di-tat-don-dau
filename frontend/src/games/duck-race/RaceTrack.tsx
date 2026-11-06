import { useEffect, useRef, type RefObject } from 'react'
import { AnimatedSprite, Application, Assets, ColorMatrixFilter, Container, Sprite, Text, type Texture, type Spritesheet } from 'pixi.js'
import { gsap } from 'gsap'
import type { HazardView, RacerView, WindGust } from './contracts'
import { flightHeight } from './contracts'
import { windStrength } from './wind'

import { WORLD, ROAD_Y, ROAD_HALF_WIDTH, trackPoint, terrainAt, obstaclePoint, beamHeight } from './track'
import { FollowCamera } from './camera'
import { MotionBuffer, predictLocal, reconcileLocal, jumpPose, type LocalIntent } from './motion'
import { GearRig } from './GearRig'
import { TerrainEffects } from './TerrainEffects'
import { ObstacleArt } from './ObstacleArt'
type DuckNode = { node: Container; sprite: AnimatedSprite; label: Text; ripple: Sprite; x: number; y: number; state: string; key: string; motion: MotionBuffer; poseAt: number; plate: Sprite; marker?: Sprite; wasAirborne: boolean; landingUntil: number; facing: number; flash: ColorMatrixFilter; gear: GearRig }
export function RaceTrack({ players, hazards, now, me, intent, wind, compact = false, running = false, serverTime = now, cameraMode = 'leader' }: { players: RacerView[]; hazards: HazardView[]; now: number; wind?:WindGust; me?: string; intent?: RefObject<LocalIntent>; compact?: boolean; running?: boolean; serverTime?: number; cameraMode?: 'leader' | 'wealth' }) {
  const mount = useRef<HTMLDivElement>(null), state = useRef({ players, hazards, now, me, running, serverTime, cameraMode, intent,wind })
  useEffect(() => { state.current = { players, hazards, now, me, running, serverTime, cameraMode, intent,wind } }, [players, hazards, now, me, running, serverTime, cameraMode, intent,wind])
  useEffect(() => {
    let disposed = false, ready = false, resizeObserver:ResizeObserver|undefined
    const app = new Application(), nodes = new Map<string, DuckNode>(), world = new Container({ interactiveChildren: false, sortableChildren:true })
    const clips = new Map<string, Texture[]>(), hazardNodes = new Map<string, Container>(), tweens: gsap.core.Tween[] = []
    let terrainFx:TerrainEffects|undefined, obstacleArt:ObstacleArt|undefined
    let camera: FollowCamera | undefined, lastFrame = performance.now(), clockOffset = state.current.now - performance.now(), frameClock = state.current.now, lastAuthority = -1
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    async function init() {
      await app.init({ resizeTo: mount.current!, antialias: false, background: '#122e36', resolution: Math.min(devicePixelRatio || 1, 2), autoDensity: true })
      if (disposed) { app.destroy(true); return }
      ready = true; mount.current!.appendChild(app.canvas); app.canvas.setAttribute('aria-hidden', 'true')
      // Pixi's resizeTo listens to window resize, not every grid/drawer/terminal-layout change.
      resizeObserver=new ResizeObserver(()=>{if(!disposed&&ready)app.resize()})
      resizeObserver.observe(mount.current!)
      app.stage.addChild(world)
      const art = new Map<string,Texture>()
      await Promise.all(['terrain','hurdle','gate','start','finish','shadow','nameplate','start-label','finish-label','you-marker'].map(async name=>{art.set(name,await Assets.load<Texture>(name==='you-marker'?'/assets/duck-race/ui-v6/you-marker.svg':name.endsWith('-label')?`/assets/duck-race/lettering-v4/${name}.svg`:name==='terrain'?'/assets/duck-race/side-v10/countryside.webp':name==='nameplate'?'/assets/duck-race/painted-frames-v2/button-teal-normal.svg':`/assets/duck-race/svg/${name}.svg`))}))
      await Promise.all(['hurdle','gate','beam-posts','beam-log','beam-rope'].map(async name=>{art.set(name,await Assets.load<Texture>(`/assets/duck-race/world-v8/${name}.${name==='wake'||name==='mud-splash'?'svg':'webp'}`))}))
      const gearAtlas=await Assets.load<Spritesheet>('/assets/duck-race/gear-poses-v12.json')
      Object.values(gearAtlas.textures).forEach(t=>{t.source.scaleMode='nearest'})
      if(disposed)return
      const terrainTiles=Array.from({length:5},()=>new Sprite(art.get('terrain')!))
      world.addChild(...terrainTiles)
      terrainFx=await TerrainEffects.create(world,reduced)
      obstacleArt=new ObstacleArt(world);await obstacleArt.load()
      if(disposed)return
      for(let distance=0;distance<=100;distance+=5){
        const marker=new Container(),p=trackPoint(distance);marker.position.set(p.x,ROAD_Y-ROAD_HALF_WIDTH-100)
        if(distance===0||distance===100){const label=new Sprite(art.get(distance===0?'start-label':'finish-label')!);label.anchor.set(.5);label.scale.set(.32);marker.addChild(label)}
        else {const text=new Text({text:`${distance}%`,style:{fontFamily:'Public UI',fontSize:20,fontWeight:'bold',fill:0xfff0c6,stroke:{color:0x375036,width:4}}});text.anchor.set(.5);marker.addChild(text)}
        world.addChild(marker)
      }
      for(const finish of [false,true]){
        const p=trackPoint(finish?100:0),marker=new Sprite(art.get(finish?'finish':'start')!);marker.anchor.set(.5);marker.width=22;marker.height=ROAD_HALF_WIDTH*2+16;marker.position.set(p.x,p.y);world.addChild(marker)
      }
      const atlas = await Assets.load<Spritesheet>('/assets/duck-race/ducks-v12.json')
      for (const [key, textures] of Object.entries(atlas.animations)) { textures.forEach(t => t.source.scaleMode = 'nearest'); clips.set(key, textures) }
      if (disposed) return
      camera = new FollowCamera(world, reduced)
      app.ticker.add(() => {
        const stamp = performance.now(), dt = Math.min(.1, (stamp - lastFrame) / 1000); lastFrame = stamp
        const current = state.current, viewWidth = app.screen.width, viewHeight = app.screen.height
        if(current.serverTime!==lastAuthority){const offset=current.serverTime-stamp;clockOffset=lastAuthority<0?offset:clockOffset+(offset-clockOffset)*.2;lastAuthority=current.serverTime}
        frameClock=Math.max(frameClock,stamp+clockOffset)
        const scale = Math.max(.85, Math.min(1.4, viewHeight / 650))
        world.scale.set(scale)
        const focus = current.players.find(p => p.id === current.me) || current.players.reduce<RacerView | undefined>((a, b) => !a || (current.cameraMode === 'wealth' ? b.points > a.points : b.progress > a.progress) ? b : a, undefined)
        for (let i = 0; i < current.players.length; i++) {
          const p = current.players[i], key = `${p.model}/${p.model === 'ducky' ? 'yellow' : p.color}`
          let duck = nodes.get(p.id)
          if (!duck) {
            const sprite = new AnimatedSprite(clips.get(`${key}/idle`)!), node = new Container(), ripple = new Sprite(art.get('shadow')!)
            ripple.anchor.set(.5);ripple.scale.set(.72);ripple.y=2
            sprite.anchor.set(.5,.75);sprite.scale.set(3.2);sprite.autoUpdate=false
            const label = new Text({ text: p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name, style: { fontFamily: 'Public UI', fontSize: 15, fontWeight: 'bold', fill: 0xffefcf } }); label.anchor.set(.5); label.y = -76
            const plate=new Sprite(art.get('nameplate')!);plate.anchor.set(.5);plate.width=240;plate.height=34;plate.y=-76;node.addChild(ripple,sprite,plate,label); world.addChild(node)
            const marker=p.id===current.me?new Sprite(art.get('you-marker')!):undefined;if(marker){marker.anchor.set(.5);marker.width=24;marker.height=28;node.addChild(marker)}
            const flash=new ColorMatrixFilter();flash.matrix=[0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0]
            const gear=new GearRig(gearAtlas.textures);node.addChild(gear.root)
            duck = { marker, node, sprite, label, ripple, x: p.x, y: p.y, state: 'idle', key, motion:new MotionBuffer(), poseAt:frameClock, plate, wasAirborne:false, landingUntil:0, facing:1, flash, gear }; nodes.set(p.id, duck)
            if (!reduced) tweens.push(gsap.from(node, { alpha: 0, duration: .4 }))
          }
          duck.motion.push(current.serverTime,p)
          const local=p.id===current.me?current.intent?.current:undefined
          const weather=current.hazards.find(h=>h.category==='environment'&&Math.abs(h.position-p.progress)<2)
          const wind=weather?.kind==='tailwind'?1.15:weather?.kind==='headwind'?.85:1
          const position=current.running&&local?reconcileLocal(duck,predictLocal(p,current.serverTime,frameClock,local,wind,current.wind),local,dt,p.stunnedUntil>frameClock):duck.motion.sample(current.running?frameClock-110:current.serverTime)
          duck.x=position.x;duck.y=position.y;duck.node.visible=true
          duck.node.zIndex=duck.y
          if(p.capturedAt){duck.node.visible=false;duck.node.position.set(p.x,p.y);continue}
          duck.label.visible=duck.plate.visible=!current.me
          if(duck.key!==key){duck.key=key;duck.state='';duck.poseAt=frameClock}
          const end=p.jumpUntil,windFalling=(p.windFallUntil||0)>frameClock,airborne=end>frameClock||windFalling,elapsedJump=Math.max(0,frameClock-(p.jumpStartedAt||end-(p.jumpDuration||1100))),mode=terrainAt(duck.x,duck.y)
          if(duck.wasAirborne&&!airborne)duck.landingUntil=frameClock+140
          duck.wasAirborne=airborne
          const moving=current.running&&p.speed>.1&&p.stunnedUntil<=frameClock
          const crouch=!airborne&&(local?local.crouch:p.crouching)
          const action=windFalling?'fall':p.stunnedUntil>frameClock?'knockout':p.attackingUntil>frameClock?`attack_${p.attackStyle||'idle'}`:p.guardHeld?'guard':airborne?(p.jumpCount||1)>1?'double_jump':jumpPose(elapsedJump):mode==='water'?moving?'swim':'swim_idle':crouch?moving?'crawl':'crouch':duck.landingUntil>frameClock?'land':moving?p.rolling?'roll':mode==='mud'?'mud_walk':'walk_run':'idle'
          if(duck.state!==action){duck.state=action;duck.poseAt=frameClock;const frames=clips.get(`${key}/${action}`)||clips.get(`${key}/idle`)!;duck.sprite.textures=action==='crouch'?[frames[frames.length-1]]:frames}
          const count=duck.sprite.textures.length,elapsed=(frameClock-duck.poseAt)/1000
          const frame=reduced?0:action.startsWith('attack_')?Math.max(0,Math.min(count-1,Math.floor((400-Math.max(0,p.attackingUntil-frameClock))/400*count))):action==='knockout'?Math.min(count-1,Math.floor(elapsed*10)):action==='jump'?Math.min(count-1,Math.floor(elapsedJump/160*count)):action==='land'?Math.min(count-1,Math.floor(elapsed/.14*count)):Math.floor(elapsed*(action==='roll'?14:action==='air'?7:action==='idle'?6:action==='mud_walk'||action==='swim_idle'?5:10))%count
          duck.sprite.gotoAndStop(frame);duck.node.position.set(duck.x,duck.y)
          const fx=local?.guard&&local.x?local.x:p.facingX;if(Math.abs(fx)>.1)duck.facing=fx<0?-1:1
          duck.sprite.scale.x=duck.facing*3.2;duck.sprite.scale.y=3.2
          duck.sprite.y=airborne?-flightHeight(p,frameClock):mode==='mud'?4:mode==='water'?4+(reduced?0:Math.sin(stamp/220)*1.6):0
          duck.ripple.alpha=mode==='water'?0:airborne?.45:1
          // Recovery flashes recolour only opaque body pixels; they do not fade the entire duck away.
          duck.sprite.filters=(p.recoveryUntil||0)>frameClock&&p.stunnedUntil<=frameClock&&!reduced&&Math.floor(stamp/110)%2===0?[duck.flash]:[]
          duck.sprite.alpha=1
          const visible=duck.x>-world.x/scale-150&&duck.x<(viewWidth-world.x)/scale+150
          terrainFx?.contact(p.id,duck.x,duck.y,mode,airborne,moving,frame,action==='swim',visible)
          duck.gear.update(key,action,frame,p.gearHead,p.gearBody,duck.facing,duck.sprite.y,stamp)
          if(p.id===current.me){app.canvas.dataset.localX=String(duck.x);app.canvas.dataset.localY=String(duck.y);app.canvas.dataset.pose=action;app.canvas.dataset.terrainMode=mode;app.canvas.dataset.poseFrame=String(frame);app.canvas.dataset.jumpHeight=String(-duck.sprite.y);app.canvas.dataset.bodyScaleY=String(duck.sprite.scale.y);app.canvas.dataset.facing=String(duck.facing);app.canvas.dataset.bodyAtlas='v12'}
          if(duck.marker){duck.marker.y=duck.sprite.y-78+(reduced?0:Math.sin(stamp/230)*4);duck.marker.scale.set((reduced?1:1+Math.sin(stamp/350)*.06)*.86)}
          const text=`${p.rank}. ${p.name}`
          duck.label.style.fontSize=Math.min(15,210/Math.max(1,text.length*.59))
          if (duck.label.text !== text) duck.label.text = text
          if (p.id === current.me) duck.label.style.fill = 0xffe59c
        }
        const followed = focus && nodes.get(focus.id), position = followed?.node.position || trackPoint(0)
        camera?.updateCamera({ id: focus?.id || 'start', x: position.x, y: position.y, boosting: !!focus?.rolling }, viewWidth, viewHeight, scale)
        terrainFx?.update(dt,-world.x/scale-100,(viewWidth-world.x)/scale+100,new Set(current.players.map(p=>p.id)))
        if(terrainFx){const fx=terrainFx.debug;app.canvas.dataset.waterFrame=String(fx.waterFrame);app.canvas.dataset.vfxActive=String(fx.active);app.canvas.dataset.splashes=String(fx.splashes);app.canvas.dataset.paddleStrokes=String(fx.strokes);app.canvas.dataset.mudSteps=String(fx.mud)}
        const tileStart=Math.floor((-world.x/scale)/1600)-1;terrainTiles.forEach((tile,i)=>{const index=tileStart+i,flip=Math.abs(index%2)===1;tile.scale.x=flip?-1:1;tile.position.set(index*1600+(flip?1600:0),0)})
        app.canvas.dataset.nameLabels=String([...nodes.values()].filter(n=>n.label.visible).length);app.canvas.dataset.playerMarkers=String([...nodes.values()].filter(n=>n.marker).length)
        app.canvas.dataset.cameraTarget = focus?.id || 'start'
        app.canvas.dataset.cameraX = String(world.x); app.canvas.dataset.cameraY = String(world.y);app.canvas.dataset.worldWidth=String(WORLD);app.canvas.dataset.visibleWorldWidth=String(viewWidth/scale)
        for (const [id, duck] of nodes) if (!current.players.some(p => p.id === id)) { duck.node.destroy({ children: true }); nodes.delete(id) }
        const visible=new Set<string>(),left=-world.x/scale-250,right=(viewWidth-world.x)/scale+250
        obstacleArt?.begin()
        const obstaclePositions:{id:string;worldX:number;worldY:number;screenX:number;screenY:number;lane?:number;rowId?:string;freeLane?:number}[]=[]
        const gust=current.running?current.wind:undefined
        const gustPower=windStrength(gust,frameClock)
        const renderedHazards:HazardView[]=gust&&gustPower>0?[...current.hazards,{id:gust.id,category:'environment',kind:gust.direction===1?'tailwind':'headwind',
          worldX:position.x,worldY:ROAD_Y,position:position.x/600,offset:0,expiresAt:gust.endsAt}]:current.hazards
        for(const h of renderedHazards){
          const p=obstaclePoint(h,frameClock)
          if(['rain','headwind','tailwind'].includes(h.kind))p.y=ROAD_Y
          if(p.x<left||p.x>right)continue
          if(obstacleArt?.render(h,p.x,p.y,frameClock,current.players,reduced,!current.me)){const screen=world.toGlobal(p);obstaclePositions.push({id:h.id,worldX:p.x,worldY:p.y,screenX:screen.x,screenY:screen.y});continue}
          visible.add(h.id)
          if(!hazardNodes.has(h.id)){
            const name=['rock','boulder'].includes(h.kind)?'boulder':h.kind==='whirlwind'?'dust':h.kind==='headwind'||h.kind==='tailwind'?'wind':h.kind==='rain'?'rain':''
            const textures=name?terrainFx?.textures(name):undefined
            const node=new Container(),image=textures?new AnimatedSprite(textures):new Sprite(art.get(h.kind==='beam'?'beam-posts':h.kind)!);image.anchor.set(.5,.93);if(image instanceof AnimatedSprite)image.autoUpdate=false
            if(['rock','boulder'].includes(h.kind)){image.width=image.height=h.kind==='rock'?100:125}
            if(h.kind==='whirlwind'){image.width=145;image.height=175}
            if(['hurdle','gate','beam'].includes(h.kind)){image.width=h.kind==='hurdle'?155:180;image.height=h.kind==='hurdle'?80:160}
            const shadow=new Sprite(art.get('shadow')!);shadow.anchor.set(.5);shadow.width=h.kind==='hurdle'?150:100;shadow.height=22;shadow.alpha=.55
            if(['rain','tailwind','headwind'].includes(h.kind)){image.width=h.kind==='rain'?440:360;image.height=h.kind==='rain'?360:240;image.anchor.set(.5,.75);shadow.visible=false}
            node.addChild(shadow,image);node.position.set(p.x,p.y)
            if(h.kind==='beam'){
              for(const x of [-44,44]){const rope=new Sprite(art.get('beam-rope')!);rope.anchor.set(.5,0);rope.x=x;rope.y=-133;rope.width=5;node.addChild(rope)}
              const log=new Sprite(art.get('beam-log')!);log.anchor.set(.5);log.width=120;log.height=29;node.addChild(log)
            }
            world.addChild(node);hazardNodes.set(h.id,node)

          }
          const node=hazardNodes.get(h.id)!
          node.position.set(p.x,p.y)
          node.zIndex=p.y
          const screen=node.getGlobalPosition()
          obstaclePositions.push({id:h.id,worldX:p.x,worldY:p.y,screenX:screen.x,screenY:screen.y,lane:h.lane,rowId:h.rowId,freeLane:h.freeLane})
          if(h.kind==='beam'){const lift=beamHeight(h,frameClock);node.children[4].y=-lift;for(const rope of node.children.slice(2,4))rope.height=133-lift;node.children[0].alpha=.65-lift/250}
          const image=node.children[1];if(image instanceof AnimatedSprite)image.gotoAndStop(reduced||h.kind==='rock'?0:Math.floor(frameClock/110)%image.totalFrames)
          if(h.kind==='headwind')image.scale.x=-Math.abs(image.scale.x)
          node.alpha=h.category==='environment'?Math.max(0,Math.min(1,(h.expiresAt-current.now)/500)):1
          if(h.id===gust?.id)node.alpha=gustPower
        }
        for(const [id,node] of hazardNodes)if(!visible.has(id)){node.destroy({children:true});hazardNodes.delete(id)}
        obstacleArt?.end()
        app.canvas.dataset.obstaclePositions=JSON.stringify(obstaclePositions)

      })
    }
    void init().catch(() => { if (mount.current && !disposed) mount.current.dataset.error = 'Không tải được đường đua. Hãy tải lại trang.' })
    return () => { disposed = true;resizeObserver?.disconnect(); camera?.destroy();terrainFx?.destroy();obstacleArt?.destroy(); tweens.forEach(t => t.kill()); if (ready) app.destroy(true, { children: true, texture: false, textureSource: false }) }
  }, [compact])
  return <div className="dq-track" ref={mount} role="img" aria-label="Đường đua ngang 60.000px. WASD để di chuyển, thả phím đứng yên. Vật cản cố định trên bản đồ, vị trí và chiều dài ngẫu nhiên. Không có làn." />
}

