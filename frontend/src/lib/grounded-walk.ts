export type GroundPoint = [number,number]
const walkClamp=(n:number)=>Math.max(0,Math.min(1,n))

/** Coordinates are measured in standing body heights, not elapsed frames. */
export function groundedRoute(points:GroundPoint[],bodyHeight:number,aspect:number,stride:number,extend:'start'|'end'){
 const route=points.map(p=>[...p] as GroundPoint)
 const length=(a:GroundPoint,b:GroundPoint)=>Math.hypot((b[0]-a[0])*aspect,b[1]-a[1])/bodyHeight
 let total=route.slice(1).reduce((sum,p,i)=>sum+length(route[i],p),0)
 const a=extend==='start'?0:route.length-1,b=extend==='start'?1:a-1
 const rest=total-length(route[a],route[b]),dy=(route[a][1]-route[b][1])/bodyHeight
 let cycles=Math.ceil(total/stride)
 while(cycles*stride-rest<Math.abs(dy))cycles++
 const segment=cycles*stride-rest
 route[a][0]=route[b][0]-Math.sqrt(Math.max(0,segment*segment-dy*dy))*bodyHeight/aspect
 const cumulative=[0]
 for(let i=1;i<route.length;i++)cumulative.push(cumulative[i-1]+length(route[i-1],route[i]))
 total=cumulative.at(-1)!
 return {points:route,cumulative,total,stride}
}

/** One phase follows the travelled distance through every route waypoint.
 * Torso translation stays continuous; only the complete painted cel changes. */
export function groundedStep(route:ReturnType<typeof groundedRoute>,progress:number,frames=16){
 const distance=walkClamp(progress)*route.total,phase=distance/route.stride
 const sample=Math.floor((phase+1e-8)*frames),frame=sample%frames
 const travelled=distance
 let segment=0
 while(segment<route.points.length-2&&travelled>route.cumulative[segment+1]+1e-8)segment++
 const p=walkClamp((travelled-route.cumulative[segment])/(route.cumulative[segment+1]-route.cumulative[segment]))
 const a=route.points[segment],b=route.points[segment+1]
 const at:GroundPoint=[a[0]+(b[0]-a[0])*p,a[1]+(b[1]-a[1])*p]
 return {at,frame,segment,sample,travelled}
}

/** Ease speed into/out of a walk, without restarting its phase at a waypoint. */
export function walkingProgress(time:number,duration:number){
 const t=walkClamp(time/duration)*duration,ramp=.22,total=duration-ramp
 return t<ramp?t*t/(2*ramp*total):t>duration-ramp?1-(duration-t)**2/(2*ramp*total):(t-ramp/2)/total
}
