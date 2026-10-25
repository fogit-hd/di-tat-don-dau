import {describe,it,expect} from 'vitest'
import {balance} from '../../prisma/seed/balance'
import {createState,invest,applyPatch,runCycle} from './engine'
import {INVESTMENT_BASE_PRICES,investmentQuote} from './investment-pricing'
import {makeRng} from './rng'
import {LINES} from '../../prisma/seed/rules'
import type {ThemeDef,TeamState} from './types'
const theme={start:{cashMul:1,engineers:101.7,machines:1.4,pollution:0,dependency:0,condition:1},coefs:{epl:100,tech:.1,emission:1,baseOutput:13.7,basePrice:10,opex:1,idleCost:1},factoryName:'Xưởng'} as ThemeDef
const fresh=():TeamState=>({...createState(theme,10000,makeRng(1),balance),productionVersion:undefined,engineers:102,machines:1,machineProgress:.4})
describe('priced packages and discrete quantities',()=>{
 it('has distinct starter prices and increasing per-line prices',()=>{
  const state=fresh();expect(new Set(Object.values(INVESTMENT_BASE_PRICES)).size).toBe(5)
  expect(investmentQuote(state,'eng',50,1,0).total).toBe(50)
  expect(investmentQuote(state,'eng',50,10,0).total).toBe(545)
  state.investmentCounts={eng:10}
  expect(investmentQuote(state,'eng',50,1,0).price).toBe(60)
  expect(investmentQuote(state,'mac',200,1,0).price).toBe(200)
 })
 it('bulk and max match repeated purchases under discounts and surcharges',()=>{
  for(const line of ['eng','mac','sup','inf','grn'] as const)for(const mul of [.5,.9,1,1.15]){
   const state=fresh();state.effects=[{id:'price',title:'',body:'',visual:'none',severity:1,startedAt:0,endsAt:1,yearsLeft:2,outputMul:1,priceMul:1,inflationMul:1,investmentMul:mul}]
   state.investmentCounts={[line]:7}
   const bulk=investmentQuote(state,line,INVESTMENT_BASE_PRICES[line],10,0)
   let total=0
   for(let i=0;i<10;i++){total+=investmentQuote(state,line,INVESTMENT_BASE_PRICES[line],1,0).total;state.investmentCounts[line]!++}
   expect(total).toBe(bulk.total)
   const max=investmentQuote(state,line,INVESTMENT_BASE_PRICES[line],'max',0)
   expect(max.total).toBeLessThanOrEqual(state.cash);expect(max.total+max.nextPrice).toBeGreaterThan(state.cash)
  }
 })
 it('preserves construction progress without fractional machines, people or goods',()=>{
  let state=fresh();expect(state.machines).toBe(1);expect(state.machineProgress).toBeCloseTo(.4)
  const before=state.machines+(state.machineProgress??0)
  for(let i=0;i<10;i++){
   const result=invest(state,'mac',200,balance,LINES,200,1,.99)
   expect(result.ok).toBe(true);if(!result.ok)throw Error(result.error);state=result.state
   expect(Number.isInteger(state.machines)).toBe(true)
  }
  expect(state.machines+(state.machineProgress??0)).toBeCloseTo(before+1.98,10)
  for(let seed=1;seed<30;seed++){
   state=applyPatch(state,{title:'Thay đổi',body:'',visual:'none',exposure:'any',durationSec:[1,1],outputMul:[.8,1.2],priceMul:[1,1],inflationMul:[1,1],engineersPct:[-.17,.13],machinesAdd:[-.3,.4]},makeRng(seed),0,'event-'+seed,balance)
   state=runCycle(state,theme,makeRng(seed),1,balance)
   for(const value of [state.engineers,state.machines,state.cumulativeOutput,state.lastOutput,state.cycleReport!.operating,state.cycleReport!.sold])expect(Number.isInteger(value)).toBe(true)
  }
 })
})
