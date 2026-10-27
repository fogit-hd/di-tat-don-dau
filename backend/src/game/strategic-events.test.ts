import {describe,it,expect} from 'vitest'
import {commissionTransfer,finalSettlementPlans,strategicEligible,canQueueInteraction,type QueuedInteraction} from './strategic-events'
import {createState} from './engine'
import {makeRng} from './rng'
import {balance} from '../../prisma/seed/balance'
import type {ThemeDef} from './types'
const theme={industryId:'trai-cay-say',start:{cashMul:1,dependency:0}} as ThemeDef
const fresh=()=>createState(theme,10000,makeRng(7),balance)
describe('bounded inter-CEO events and final asset settlement',()=>{
 it('conserves total cash, caps transfers and never overdraws a payer',()=>{
  for(const cash of [-100,0,.01,1,100,1000000])for(const royalty of [false,true]){
   const payer={...fresh(),cash},payee=fresh(),total=payer.cash+payee.cash,r=commissionTransfer(payer,payee,makeRng(8),royalty)
   expect(payer.cash+payee.cash).toBeCloseTo(total,8);expect(r.amount).toBeGreaterThanOrEqual(0);expect(r.amount).toBeLessThanOrEqual(royalty?100:75);expect(payer.cash).toBeGreaterThanOrEqual(Math.min(0,cash));expect(r.percent).toBe(Math.round(r.percent))
  }
 })
 it('bounds pending fees on slow players and blocks duplicate actor-target fees',()=>{
  const pending={id:'one',eventId:'company-commission',title:'',body:'',originId:'a',targetId:'slow',originYear:20,targetYear:1,percent:3,cap:75,createdAt:1,status:'pending'} as QueuedInteraction
  expect(canQueueInteraction([pending],'a','slow','company-commission')).toBe(false)
  expect(canQueueInteraction([pending],'b','slow','company-commission')).toBe(true)
  expect(canQueueInteraction([pending,{...pending,id:'two',originId:'b'},{...pending,id:'three',originId:'c'}],'d','slow','company-royalty')).toBe(false)
  expect(canQueueInteraction([{...pending,status:'settled'}],'a','slow','company-commission')).toBe(true)
 })
 it('gates patent fees, scale advantages, counterparties and repeat final claims',()=>{
  const s=fresh();expect(strategicEligible('company-royalty',s,true)).toBe(false);s.exclusiveTechnology=true;expect(strategicEligible('company-royalty',s,true)).toBe(true);expect(strategicEligible('company-royalty',s,false)).toBe(false);expect(strategicEligible('company-exclusive-technology',s,true)).toBe(false)
  expect(strategicEligible('company-monopoly-scale',s,true)).toBe(false);s.machines=3;expect(strategicEligible('company-monopoly-scale',s,true)).toBe(true)
  s.finalClaims=[{eventId:'company-final-levy',title:'Nghĩa vụ',percent:8,basis:'own',direction:-1}];expect(strategicEligible('company-final-levy',s,true)).toBe(false)
 })
 it('uses the same pre-award richest baseline, applies caps and is order-independent',()=>{
  const a=fresh(),b=fresh();a.finalClaims=[{eventId:'bonus',title:'Thưởng',percent:3,basis:'richest',direction:1}];b.finalClaims=[...a.finalClaims,{eventId:'levy',title:'Thu',percent:8,basis:'own',direction:-1}]
  const parties=[{id:'a',name:'A',state:a,value:100},{id:'b',name:'B',state:b,value:100000}]
  const result=finalSettlementPlans(parties),reverse=finalSettlementPlans([...parties].reverse())
  expect(result[0].settlement.after).toBe(120);expect(result[1].settlement.after).toBe(100000)
  expect(result[1].settlement.items.map(i=>i.delta)).toEqual([500,-500]);expect(reverse.reverse()).toEqual(result)
  a.finalSettlement=result[0].settlement;expect(finalSettlementPlans([{...parties[0],value:120}])[0].settlement).toEqual(result[0].settlement)
  expect(finalSettlementPlans([{...parties[0],state:{...a,finalSettlement:undefined},value:0}])[0].settlement.after).toBe(0)
 })
})
