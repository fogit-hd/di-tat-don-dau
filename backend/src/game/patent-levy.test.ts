import {describe,it,expect} from 'vitest'
import {PATENT_LEVY_ID,PATENT_LEVY_POLICY,rollPatentLevy,patentLevyTransfers,finalSettlementPlans,strategicEligible,type StrategicParty} from './strategic-events'
import {createState} from './engine'
import {makeRng} from './rng'
import {balance} from '../../prisma/seed/balance'
import type {ThemeDef} from './types'
const theme={industryId:'trai-cay-say',start:{cashMul:1,dependency:0}} as ThemeDef
const party=(id:string,value:number,owner=false,rate=0):StrategicParty=>({id,name:id,state:{...createState(theme,0,makeRng(7),balance),exclusiveTechnology:owner,...rate?{patentLevy:{percent:rate,year:1}}:{}},value})
const total=(plans:ReturnType<typeof finalSettlementPlans>)=>plans.reduce((n,row)=>n+row.settlement.after,0)

describe('random final patent asset transfers',()=>{
 it('matches the 3% of 10 billion example without touching operating cash',()=>{
  const parties=[party('A',10000,true),party('B',6000,false,3)],before=JSON.stringify(parties),plans=finalSettlementPlans(parties)
  expect(plans.map(p=>p.settlement.after)).toEqual([9700,6300]);expect(total(plans)).toBe(16000);expect(JSON.stringify(parties)).toBe(before)
  expect(plans[0].settlement.items[0]).toMatchObject({eventId:PATENT_LEVY_ID,delta:-300,counterpartyId:'B',basis:10000,percent:3})
  expect(plans[1].settlement.items[0]).toMatchObject({delta:300,counterpartyId:'A',receiptId:plans[0].settlement.items[0].receiptId})
 })
 it('draws whole percentages once and gates on another patent owner, not on their cash',()=>{
  const values=new Set<number>();for(let seed=1;seed<100;seed++){const claim=rollPatentLevy(makeRng(seed),7);expect(claim.year).toBe(7);expect(Number.isInteger(claim.percent)).toBe(true);expect(claim.percent).toBeGreaterThanOrEqual(1);expect(claim.percent).toBeLessThanOrEqual(3);values.add(claim.percent)}expect(values.size).toBe(3)
  const s=party('B',1000).state;expect(strategicEligible(PATENT_LEVY_ID,s,false,true)).toBe(true);expect(strategicEligible(PATENT_LEVY_ID,s,true,false)).toBe(false);s.patentLevy={percent:2,year:1};expect(strategicEligible(PATENT_LEVY_ID,s,true,true)).toBe(false)
 })
 it('never charges self or a CEO without exclusive technology; zero estates stay zero',()=>{
  const parties=[party('self',10000,true,3),party('other',5000),party('zero-owner',0,true),party('zero-collector',0,false,3)]
  expect(patentLevyTransfers(parties)).toEqual([]);expect(finalSettlementPlans(parties).map(p=>p.settlement.after)).toEqual([10000,5000,0,0])
  expect(finalSettlementPlans(parties)[0].settlement.items[0].title).toContain('Không có tài sản')
 })
 it('uses pre-adjustment baselines when both CEOs own patents and collection rights',()=>{
  const parties=[party('A',10000,true,1),party('B',6000,true,3)],plans=finalSettlementPlans(parties)
  expect(plans.map(p=>p.settlement.after)).toEqual([9760,6240]);expect(total(plans)).toBe(16000)
  expect(patentLevyTransfers(parties).map(r=>r.amount)).toEqual([300,60])
 })
 it('shares one payer cap proportionally among many collectors',()=>{
  const parties=[party('owner',10000,true),...Array.from({length:10},(_,i)=>party('c'+i,10000,false,3))],rows=patentLevyTransfers(parties)
  expect(rows).toHaveLength(10);expect(rows.every(r=>r.amount===100&&r.limited)).toBe(true)
  expect(rows.reduce((n,r)=>n+r.amount,0)).toBe(1000);expect(total(finalSettlementPlans(parties))).toBe(parties.reduce((n,p)=>n+p.value,0))
 })
 it('caps total receipts for a small collector and preserves conservation and ordering',()=>{
  const parties=[party('collector',1000,false,3),...Array.from({length:10},(_,i)=>party('p'+i,100000,true))],rows=patentLevyTransfers(parties)
  expect(rows.reduce((n,r)=>n+r.amount,0)).toBe(200);expect(patentLevyTransfers([...parties].reverse())).toEqual(rows)
  for(const row of rows)expect(row.amount).toBeLessThanOrEqual(Math.min(row.basis*PATENT_LEVY_POLICY.payerFraction,PATENT_LEVY_POLICY.payerCap))
 })
 it('is immutable and idempotent when stored settlements are read after reload',()=>{
  const parties=[party('A',10000,true),party('B',6000,false,3)],first=finalSettlementPlans(parties)
  parties.forEach((p,i)=>{p.state.finalSettlement=JSON.parse(JSON.stringify(first[i].settlement));p.value=first[i].settlement.after})
  expect(finalSettlementPlans(parties)).toEqual(first)
 })
 it('keeps older final bonuses on the same baseline rather than taxing their new proceeds',()=>{
  const a=party('A',10000,true),b=party('B',6000,false,3);a.state.finalClaims=[{eventId:'bonus',title:'Thưởng',percent:3,basis:'richest',direction:1}]
  const plans=finalSettlementPlans([a,b]);expect(plans[0].settlement.items.find(i=>i.eventId===PATENT_LEVY_ID)?.basis).toBe(10000);expect(plans.map(p=>p.settlement.after)).toEqual([10000,6300])
 })
})
