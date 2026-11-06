import { gearStats, flightHeight, OBSTACLE_RULES, type RacerView } from './contracts'
import { FINISH_X, ROAD_Y, ROAD_HALF_WIDTH, START_X, STEP_PX, roadPosition, terrainAt, trackPoint, obstaclePoint } from './track'
import type { HazardView } from './contracts'

export type MotorState = Pick<RacerView,'x'|'y'|'gearHead'|'gearBody'> & {
  reserve: number; crouching: boolean; airborne: boolean; airSpeed?: number; guardHeld?: boolean
}
export type DodgeInput = { x: number; y: number }
/** Manual movement only, shared by authority and prediction. No idle drift or lane snapping. */
export class DuckMotor {
  readonly speedSlow = 96
  readonly speedBoost = 390
  readonly speedDodge = 130

  advance(state: MotorState, input: DodgeInput, seconds: number, wind = 1) {
    const dt = Math.max(0, Math.min(.25, seconds)), stats = gearStats(state)
    const mode = terrainAt(state.x,state.y)
    // Guard roots the duck. Directional input may turn the shield, never translate it.
    if(state.guardHeld)return {...roadPosition(state.x,state.y),mode,boosting:false,speed:0,reserve:state.reserve}
    const ix=Math.max(-1,Math.min(1,input.x)),iy=Math.max(-1,Math.min(1,input.y))
    const norm=Math.max(1,Math.hypot(ix,iy)),nx=ix/norm,ny=iy/norm
    const boosting = state.reserve > 0 && !state.crouching && nx>0
    const slow = mode==='water' ? stats.swim : mode==='mud' ? stats.mud : this.speedSlow*stats.walk/96
    const fast = mode==='water' ? stats.swim*1.5 : mode==='mud' ? stats.roll*.6 : this.speedBoost*stats.roll/390
    const rate = Math.abs(nx)*wind
    const base = state.airborne ? Math.min(state.airSpeed || slow,slow) : state.crouching ? slow*.45 : slow
    // Only the remaining paid distance uses boost speed, including its final fractional tick.
    const boostSpeed = state.airborne ? Math.max(base,fast) : fast
    const boostedSeconds = boosting ? Math.min(dt,state.reserve/Math.max(1,boostSpeed*rate)) : 0
    const dx = boostedSeconds*boostSpeed*rate+(dt-boostedSeconds)*base*rate
    const next = roadPosition(state.x+Math.sign(nx)*dx,state.y+ny*this.speedDodge*dt)
    return {...next,mode,boosting:boostedSeconds>0,speed:dt?Math.hypot(next.x-state.x,next.y-state.y)/dt:0,
      reserve:Math.max(0,state.reserve-Math.min(Math.max(0,next.x-state.x),boostedSeconds*boostSpeed*rate))}
  }
}

export const COURSE_LAYOUT = { version: 5, minSpacing: 210, maxSpacing: 370, footprintGap: 20, edgeInset: 8, actionSpacing: 820 } as const
/** Mandatory crawl gates meet BOTH banks. The small overlap closes the painted bank seam;
 * it does not enlarge the walkable road. Short/bypass variants are not this obstacle type. */
export const CRAWL_GATE_LAYOUT = { worldY: ROAD_Y, bankOverlap: 6, spanY: ROAD_HALF_WIDTH * 2 + 12 } as const

/** Actual ground base, excluding body height and decorative cast shadows. */
export function obstacleFootprint(h: HazardView) {
  const p = obstaclePoint(h)
  return { left: p.x - (h.thicknessX ?? 32) / 2, right: p.x + (h.thicknessX ?? 32) / 2,
    top: p.y - (h.spanY ?? 48) / 2, bottom: p.y + (h.spanY ?? 48) / 2 }
}
export function footprintsOverlap(a: HazardView, b: HazardView, gap = COURSE_LAYOUT.footprintGap) {
  const p = obstacleFootprint(a), q = obstacleFootprint(b)
  return p.left < q.right + gap && p.right + gap > q.left && p.top < q.bottom + gap && p.bottom + gap > q.top
}

/** Whole course is deterministic per room; rendering reveals objects as the camera approaches.
 * Dense continuous coordinates, not lanes. Every candidate passes ground-base separation.
 * Rare full-depth action barriers get extra approach/exit room for a complete jump/landing. */
export function spawnObstacles(seed: number): HazardView[] {
  const hazards: HazardView[]=[]
  const courseSeed=seed
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
  for(let x=START_X+900;x<FINISH_X-1000;){
    const full = random() < .07
    if (full && hazards.length) x = Math.max(x, hazards[hazards.length - 1].worldX! + COURSE_LAYOUT.actionSpacing)
    const rowX = x
    const nextGap = full ? COURSE_LAYOUT.actionSpacing : COURSE_LAYOUT.minSpacing + Math.floor(random() * (COURSE_LAYOUT.maxSpacing - COURSE_LAYOUT.minSpacing + 1))
    x += nextGap
    if (rowX >= FINISH_X - 1000) break
    if([-65,0,65].some(offset=>terrainAt(rowX,ROAD_Y+offset)!=='ground'))continue
    const rowId=`road-${courseSeed}-${rowX}`, pattern=full ? 2 : [0,1,3,4][Math.floor(random()*4)]
    function place(kind:keyof typeof OBSTACLE_RULES,center:number,span:number){
      if (kind === 'underpass') { center = CRAWL_GATE_LAYOUT.worldY; span = CRAWL_GATE_LAYOUT.spanY }
      const min = kind === 'cart' ? 42 : kind === 'catcher' ? 30 : 22
      const candidate: HazardView = {id:`${rowId}-${hazards.length}`,rowId,worldX:rowX,worldY:center,
        position:(rowX-START_X)/STEP_PX,offset:center-ROAD_Y,kind,spanY:span,
        thicknessX:min+Math.floor(random()*(kind==='cart'?45:39)),heightZ:OBSTACLE_RULES[kind].height,
        moving:false,phase:random()*Math.PI*2,category:'obstacle',expiresAt:8640000000000000}
      if (!hazards.some(other => footprintsOverlap(candidate, other))) hazards.push(candidate)
    }
    const top=ROAD_Y-ROAD_HALF_WIDTH+COURSE_LAYOUT.edgeInset,bottom=ROAD_Y+ROAD_HALF_WIDTH-COURSE_LAYOUT.edgeInset,depth=bottom-top
    if(pattern===0){
      // Two unequal edge barriers. At least 68 px remains open, including duck footprint.
      const gap=68+random()*20,center=ROAD_Y+(random()-.5)*34
      const a=center-gap/2-top,b=bottom-center-gap/2
      place('wall',top+a/2,a);place('cart',bottom-b/2,b)
    }else if(pattern===1){
      const span=48+random()*56,fromTop=random()<.5
      place(random()<.5?'wall':'cart',fromTop?top+span/2:bottom-span/2,span)
    }else if(pattern===2){
      // Full-depth barriers always have a valid physical action, never an impassable wall.
      place((['hop','double','underpass'] as const)[Math.floor(random()*3)],ROAD_Y,depth)
    }else{
      const span=32+random()*62,center=top+span/2+random()*(depth-span)
      place(pattern===4&&random()<.55?'catcher':(['hop','roots','double'] as const)[Math.floor(random()*3)],center,span)
    }
  }
  return hazards
}

/** Swept AABB in WORLD coordinates, independent of camera/duck-relative screen X.
 * Ground footprint is independent of sprite height and camera scale. */
export function obstacleCollision(from:{x:number;y:number},to:{x:number;y:number},h:HazardView,now:number,dt:number):number|null{
  if(h.category==='environment'&&h.kind!=='whirlwind')return null
  const before=obstaclePoint(h,now-dt*1000),after=obstaclePoint(h,now)
  const rx=h.thicknessX!==undefined?h.thicknessX/2+14:['rock','boulder'].includes(h.kind)?38:60
  const ry=h.spanY!==undefined?h.spanY/2+10:h.lane!==undefined?18:h.kind==='gate'?30:h.kind==='hurdle'?20:24
  const start={x:from.x-before.x,y:from.y-before.y},delta={x:to.x-after.x-start.x,y:to.y-after.y-start.y}
  let enter=0,exit=1
  for(const [axis,radius] of [['x',rx],['y',ry]] as const){
    if(Math.abs(delta[axis])<1e-9){if(Math.abs(start[axis])>radius)return null;continue}
    const a=(-radius-start[axis])/delta[axis],b=(radius-start[axis])/delta[axis]
    enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b))
    if(enter>exit)return null
  }
  return enter<=1&&exit>=0?Math.max(0,enter):null
}

/** A high wall is never bypassed by a boost, gear or a high jump. */
export function clearsObstacle(p:Pick<RacerView,'jumpUntil'|'crouching'|'rolling'|'jumpCount'|'jumpStartedAt'|'jumpDuration'|'jumpFrom'> & Partial<Pick<RacerView,'attackingUntil'|'guardHeld'>>,h:HazardView,now:number){
  const height=flightHeight(p,now)
  if(h.kind==='underpass'||h.kind==='gate')return p.jumpUntil<=now&&p.crouching&&!p.rolling&&!p.guardHeld&&(p.attackingUntil||0)<=now
  if(['wall','cart','catcher','whirlwind'].includes(h.kind))return false
  if(h.kind==='double')return (p.jumpCount||0)>=2&&height>(h.heightZ??63)
  return height>(h.heightZ??(['rock','boulder','hurdle'].includes(h.kind)?18:26))
}

/** The two planted feet remain solid even when the racer crawls below the lintel. */
export function crawlSupportFootprints(h: HazardView): HazardView[] {
  if (h.kind !== 'underpass') return []
  const p = obstaclePoint(h), span = h.spanY ?? 48, footDepth = Math.min(18, span * .2)
  return [-1, 1].map((side, i) => ({ ...h, id: `${h.id}-foot-${i}`, worldX: p.x,
    worldY: p.y + side * (span - footDepth) / 2, spanY: footDepth,
    thicknessX: (h.thicknessX ?? 32) * .65 }))
}

/** First blocking surface along this tick. Used by authority and the isolated Phaser fixture.
 * A successful Shift action clears the lintel, never either planted support. */
export function blockingObstacleContact(p: Parameters<typeof clearsObstacle>[0], from: {x:number;y:number},
  to: {x:number;y:number}, h: HazardView, now: number, dt: number): number | null {
  const contact = obstacleCollision(from, to, h, now, dt)
  if (contact === null) return null
  if (!clearsObstacle(p, h, now - dt * 1000 + contact * dt * 1000)) return contact
  const feet = crawlSupportFootprints(h).map(foot => obstacleCollision(from, to, foot, now, dt))
    .filter((t): t is number => t !== null)
  return feet.length ? Math.min(...feet) : null
}

export function progressPosition(percent:number,offset=0){return trackPoint(percent,offset)}
