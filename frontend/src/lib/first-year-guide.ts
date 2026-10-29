import { guideV2, GUIDE_V2_ACTIONS } from './first-year-guide-v2'
import type { SceneView } from '../api/types'

export type GuideStep = {action:string;target:string;text:string;tab?:string;focus?:string;interaction?:'continue';manual?:boolean;skip?:boolean}
const LEGACY_ACTIONS=['company','cash','assets','year-count','clock','income','rank','sound','investment','enterprise','risk','events','years','investment-return','cluster','crew','enterprise-ready','year','complete']
export function guideActive(scene:SceneView){return (scene.tutorial?.version===1||scene.tutorial?.version===2)&&!scene.tutorial.complete&&!scene.finished&&!scene.bankrupt}
export function guideStep(scene:SceneView,context:{ceoName?:string;industryName?:string;rank?:number;durationSec?:number}={}):GuideStep{
 return guideV2(scene,context,scene.tutorial?.version===1?LEGACY_ACTIONS[Math.min(scene.tutorial.step,LEGACY_ACTIONS.length-1)]:undefined)
}
export function guideDisplayedTab(step:number,version:number=1){
 const action=(version===2?GUIDE_V2_ACTIONS:LEGACY_ACTIONS)[step]
 if(action==='enterprise'||action==='enterprise-ready'||action?.startsWith('stat-'))return 'enterprise'
 if(action==='risk')return 'risk'
 if(action==='events')return 'events'
 if(action==='years'||action==='year'||action==='complete')return 'years'
 return 'investment'
}
