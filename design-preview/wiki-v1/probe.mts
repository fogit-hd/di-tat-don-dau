import fs from 'node:fs'
import {createState,applyPatch,openYearEffects,runCycle} from '../../backend/src/game/engine'
import {productionForecast,productionPlan} from '../../backend/src/game/production'
import {INDUSTRY_ECONOMY} from '../../backend/src/game/industry-economy'
import {balance} from '../../backend/prisma/seed/balance'
import {makeRng} from '../../backend/src/game/rng'
import {authoredEffectDocument,effectPayload} from '../../backend/prisma/seed/effects'
import {readStoredEffect} from '../../backend/src/game/stored-effect'
const theme=(id:string)=>({industryId:id,unit:'sản phẩm',factoryName:'Xưởng',start:{cashMul:1,engineers:0,machines:0,pollution:0,condition:1,dependency:0},coefs:{epl:1400,emission:1,tech:.12,baseOutput:10,basePrice:16.4,opex:49.2,idleCost:34}} as any)
const fresh=(id='chip-ban-dan')=>createState(theme(id),10000,makeRng(1),balance)
const industries=Object.entries(INDUSTRY_ECONOMY).map(([id,p])=>{
 const state={...fresh(id),machines:1,engineers:p.crew}
 const plan=productionPlan(state,theme(id),balance,1)
 const range=productionForecast(state,theme(id),balance,1).range
 return {id,crew:p.crew,prices:p.prices,entry:p.prices.mac+p.crew*p.prices.eng,output:plan.output,sold:plan.sold,basePrice:plan.basePrice,revenue:plan.revenue,cost:plan.opex,net:plan.net,range}
})
const base={visual:'boom',title:'Probe',body:'',exposure:'any' as const}
const state={...fresh(),machines:1,engineers:4}
const rounding=Array.from({length:12},(_,i)=>{
 const rng=makeRng(i+1)
 const x=applyPatch(state,{...base,...readStoredEffect(authoredEffectDocument({assetsPct:-30,years:1}),'probe')},rng,1,'asset',balance)
 return {seed:i+1,clustersBefore:1,clustersAfter:x.machines,workersBefore:4,workersAfter:x.engineers,summary:x.effects[0].summary}
})
const zero=applyPatch(fresh(),{...base,...readStoredEffect(authoredEffectDocument({cashPerYear:150,years:3}),'probe')},makeRng(3),1,'free',balance)
const settled=runCycle(openYearEffects(zero,2),theme('chip-ban-dan'),makeRng(3),2,{...balance,inflationBase:0})
const expansion=Array.from({length:12},(_,i)=>{
 const x=applyPatch(state,{...base,...readStoredEffect(effectPayload('expansion',2),'probe')},makeRng(i+1),1,'expand',balance)
 return {seed:i+1,clusters:x.machines,cashDelta:x.cash-state.cash}
})
let capped=state
for(let i=0;i<13;i++)capped=applyPatch(capped,{...base,...readStoredEffect(authoredEffectDocument({costPct:10,years:3}),'probe')},makeRng(i+1),1,'cap-'+i,balance)
const result={industries,rounding,zeroOperationCash:{operating:settled.cycleReport?.operating,output:settled.cycleReport?.output,cashDelta:settled.cash-zero.cash,ongoing:settled.cycleReport?.ongoing},expansion,effectLimit:{added:13,retained:capped.effects.length,firstDropped:!capped.effects.some(x=>x.id==='cap-0')},compounding:{threeRevenueBonusesOf20Percent:1.2**3,threeRevenueCutsOf20Percent:.8**3}}
fs.writeFileSync(new URL('./probe-results.json',import.meta.url),JSON.stringify(result,null,2))
console.log(JSON.stringify({industryCount:industries.length,examples:industries.filter(x=>['chip-ban-dan','trai-cay-say','det-may'].includes(x.id)),zeroOperationCash:result.zeroOperationCash,effectLimit:result.effectLimit,rounding:rounding[0],expansion:expansion[0]},null,2))
