import { WATER_SHAPE, MUD_SHAPE } from './terrain-shapes'
export const WORLD = 60000
export const START_X = 0
export const FINISH_X = WORLD
export const ROAD_Y = 500
export const ROAD_HALF_WIDTH = 84
export const LANE_OFFSETS = [-56, 0, 56] as const
export const LANE_Y = LANE_OFFSETS.map(offset => ROAD_Y + offset)
export const LANE_HALF_WIDTH = 28
export const STEP_PX = (FINISH_X - START_X) / 100
export const samples = [{x: START_X, y: ROAD_Y}, {x: FINISH_X, y: ROAD_Y}]
/** Fixed world coordinates. Movement between lane centers remains continuous. */
export function trackPoint(progress: number, offset = 0) {
  return {x: START_X + Math.max(0,Math.min(100,progress)) * STEP_PX, y: ROAD_Y + offset, angle: 0}
}
export function projectToTrack(x: number, y: number) {
  const boundedX=Math.max(START_X,Math.min(FINISH_X,x))
  return {progress:boundedX>=FINISH_X?100:(boundedX-START_X)/STEP_PX,offset:y-ROAD_Y,angle:0,x:boundedX,y:ROAD_Y}
}
export function roadPosition(x: number,y: number,halfWidth=ROAD_HALF_WIDTH){
  const p=projectToTrack(x,y),offset=Math.max(-halfWidth,Math.min(halfWidth,p.offset))
  return {x:p.x,y:ROAD_Y+offset,progress:p.progress,offset}
}

export const TERRAIN_ZONES = Array.from({length:12},(_,i)=>({id:'terrain-'+i,start:1800+i*4500,end:1800+i*4500+(i%2?235:250),centerY:ROAD_Y+(i%3-1)*12,height:i%2?84:92,kind:i%2?'mud' as const:'water' as const}))
export function pointInTerrain(shape:readonly(readonly[number,number])[],x:number,y:number){
 let inside=false
 for(let i=0,j=shape.length-1;i<shape.length;j=i++){const a=shape[i],b=shape[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside}
 return inside
}
/** Wet collision follows the painted contour, with dry space above/below each patch. */
export function terrainAt(x:number,y=ROAD_Y):'ground'|'water'|'mud'{
 for(const z of TERRAIN_ZONES){if(x<z.start||x>z.end)continue;const nx=(x-z.start)/(z.end-z.start),ny=(y-(z.centerY-z.height/2))/z.height;if(pointInTerrain(z.kind==='water'?WATER_SHAPE:MUD_SHAPE,nx,ny))return z.kind}
 return 'ground'
}
export function obstaclePoint(h:{position:number;offset:number;worldX?:number;worldY?:number},_now=0){
 const fallback=trackPoint(h.position,h.offset)
 return {x:h.worldX??fallback.x,y:h.worldY??fallback.y,angle:0}
}
/** Gantry feet stay on the ground. Only its suspended log changes elevation. */
export function beamHeight(h:{phase?:number},now:number){return 28+(1+Math.sin(now/850+(h.phase||0)))*34}
