import { describe, expect, it } from 'vitest'
import { balance } from '../../prisma/seed/balance'
import { LINES } from '../../prisma/seed/rules'
import { applyPatch, createState, invest, patchFromEvent, runCycle } from './engine'
import { isBankrupt, logisticsBenefits, pollutionPricePenalty, productionPlan, productionForecast, supplyBenefits } from './production'
import { makeRng } from './rng'
import type { EventDef, ThemeDef } from './types'

const target = (balance.priceCapitalBase + 1400 / balance.engPerTy) * balance.priceRevenueShare
const theme: ThemeDef = {
  id:'test', industryId:'go', industryName:'Gỗ', name:'Xưởng', unit:'sản phẩm', role:'', mission:'', factoryName:'Xưởng',
  dirs:['','','',''], lines:LINES, art:'', anchors:null, eventIds:[], regionId:'',regionName:'',scaleId:'',scaleName:'',contextId:'',contextName:'',vars:{},
  coefs:{epl:1400, tech:.12,support:.08,infra:.08,emission:1,baseOutput:10,basePrice:target/10,opex:target*.3,idleCost:34},
  start:{cashMul:1,engineers:2800,machines:2,pollution:0,dependency:0,condition:1},
}
const fresh = () => createState(theme,10000,makeRng(1),balance)
const plan = (state = fresh()) => productionPlan(state, theme, balance, 1000)
describe('economy v2 production and upgrade roles', () => {
  it('reduces price once at high pollution without reducing physical output', () => {
    const clean = plan(); const dirty = plan({...fresh(),pollution:100})
    expect(dirty.output).toBe(clean.output)
    expect(dirty.revenue / clean.revenue).toBeCloseTo(1-dirty.pricePenalty,10)
    expect(pollutionPricePenalty(30)).toBe(0)
    expect(pollutionPricePenalty(60)).toBeCloseTo(.15)
    expect(pollutionPricePenalty(100)).toBe(.35)
  })
  it('separates material savings from logistics and delivery without free output multipliers', () => {
    const base=plan(), supplier=plan({...fresh(),support:1}), infra=plan({...fresh(),infra:1})
    expect(supplier.output).toBe(base.output); expect(infra.output).toBe(base.output)
    expect(supplier.inputCost).toBeLessThan(base.inputCost)
    expect(supplier.logisticsCost).toBe(base.logisticsCost); expect(supplier.delivery).toBe(base.delivery)
    expect(infra.inputCost).toBe(base.inputCost); expect(infra.logisticsCost).toBeLessThan(base.logisticsCost)
    expect(infra.sold).toBeGreaterThan(base.sold); expect(infra.pollution).toBe(base.pollution)
  })
  it('caps benefits with diminishing returns and never sells more than produced', () => {
    expect(supplyBenefits(1000).inputDiscount).toBeLessThanOrEqual(.3)
    expect(supplyBenefits(1000).disruptionProtection).toBeLessThanOrEqual(.5)
    expect(logisticsBenefits(1000).logisticsDiscount).toBeLessThanOrEqual(.3)
    expect(logisticsBenefits(1000).delivery).toBeLessThanOrEqual(1)
    expect(supplyBenefits(2).inputDiscount-supplyBenefits(1).inputDiscount).toBeLessThan(supplyBenefits(1).inputDiscount)
    expect(plan({...fresh(),infra:1000}).sold).toBeLessThanOrEqual(plan().output)
    expect(plan({...fresh(),machines:0,support:100,infra:100}).revenue).toBe(0)
  })
  it('warns truthfully about unused machines and staff before buying more capacity', () => {
    const s=fresh(); s.machines=.4; s.engineers=730
    const upgraded=invest(s,'mac',1000,balance,LINES)
    expect(upgraded.ok).toBe(true); if(!upgraded.ok)return
    const after=plan(upgraded.state)
    expect(after.staffMissing).toBe(1230)
    expect(after.idleCost).toBeGreaterThan(0)
    expect(after.net).toBeLessThan(plan(s).net)
    const staffed=invest(upgraded.state,'eng',2000,balance,LINES)
    expect(staffed.ok).toBe(true); if(!staffed.ok)return
    expect(plan(staffed.state).staffMissing).toBe(0)
    expect(plan(staffed.state).net).toBeGreaterThan(after.net)
  })
  it('treats green as immediate relief plus recurring treatment, not extra infrastructure output', () => {
    const s={...fresh(),pollution:60};const result=invest(s,'grn',1000,balance,LINES)
    expect(result.ok).toBe(true);if(!result.ok)return
    expect(result.state.pollution).toBe(56)
    const after=plan(result.state)
    expect(after.treatment).toBe(1.7)
    expect(after.pollution).toBeLessThan(plan(s).pollution)
    expect(after.output).toBe(plan(s).output)
    expect(after.pricePenalty).toBeLessThan(plan(s).pricePenalty)
  })
  it('settles exactly the same production plan and includes idle costs with zero cash', () => {
    const s={...fresh(),cash:0,infra:2,support:3,green:1,pollution:45}
    const b={...balance,outputNoiseMin:1,outputNoiseMax:1,priceNoiseMin:1,priceNoiseMax:1,inflationBase:0}
    const expected=productionPlan(s,theme,b,1000)
    const actual=runCycle(s,theme,makeRng(9),1000,b)
    expect(actual.lastOutput).toBe(expected.output)
    expect(actual.lastIncome).toBeCloseTo(expected.net,10)
    expect(actual.cash).toBeCloseTo(expected.net,10)
    expect(actual.pollution).toBe(expected.pollution)
    expect(s.cycles).toBe(0)
  })
  it('mitigates explicitly tagged new supply shocks, keeps drawn percentages whole and leaves old effects alone', () => {
    const patch={visual:'supply_shock',title:'Thiếu vật tư',body:'',exposure:'any' as const,durationSec:[180,180] as [number,number],outputMul:[.6,.6] as [number,number],priceMul:[1,1] as [number,number],inflationMul:[1,1] as [number,number],investmentPct:[15,15] as [number,number],yearSpan:2,supplyShock:true as const}
    const bare=applyPatch(fresh(),patch,makeRng(19),1000,'a',balance)
    const supplied=applyPatch({...fresh(),support:6},patch,makeRng(19),1000,'a',balance)
    expect(supplied.effects[0]!.outputMul).toBeGreaterThan(bare.effects[0]!.outputMul)
    expect(supplied.effects[0]!.investmentMul!).toBeLessThan(bare.effects[0]!.investmentMul!)
    for(const effect of [bare.effects[0]!,supplied.effects[0]!]) {
      expect(effect.outputMul*100).toBeCloseTo(Math.round(effect.outputMul*100),8)
      expect(effect.investmentMul!*100).toBeCloseTo(Math.round(effect.investmentMul!*100),8)
    }
    const composite={...patch,supplyShock:'investment' as const}
    const variant=applyPatch({...fresh(),support:6},composite,makeRng(19),1000,'a',balance)
    expect(variant.effects[0]!.outputMul).toBe(bare.effects[0]!.outputMul)
    expect(variant.effects[0]!.investmentMul!).toBeLessThan(bare.effects[0]!.investmentMul!)
    const unrelated={...patch,supplyShock:undefined}
    expect(applyPatch(fresh(),unrelated,makeRng(19),1000,'a',balance).effects[0]!.outputMul).toBe(applyPatch({...fresh(),support:6},unrelated,makeRng(19),1000,'a',balance).effects[0]!.outputMul)
    const upgraded=invest(bare,'sup',1000,balance,LINES)
    if(upgraded.ok)expect(upgraded.state.effects).toEqual(bare.effects)
    expect(patchFromEvent({id:'industry.e1--input-shortage',visual:'none'} as EventDef,'','').supplyShock).toBe('investment')
    expect(patchFromEvent({id:'industry.e1--port-delay',visual:'none'} as EventDef,'','').supplyShock).toBe(undefined)
  })
  it('does not manufacture or accept purchases from explicit or historical bankruptcy', () => {
    const s={...fresh(),bankrupt:true}
    expect(isBankrupt({...fresh(),cash:0})).toBe(false)
    expect(runCycle(s,theme,makeRng(1),1000,balance)).toBe(s)
    expect(invest(s,'sup',1000,balance,LINES).ok).toBe(false)
  })
})


describe('production audit and conditional forecasts',()=>{
  it('forecasts legal whole-percent draw bounds without advancing RNG or mutating state',()=>{
    const state=fresh(),before=JSON.stringify(state)
    const b={...balance,outputNoiseMin:.973,outputNoiseMax:1.027,priceNoiseMin:.981,priceNoiseMax:1.019}
    const forecast=productionForecast(state,theme,b,1000)
    expect(forecast.range.outputNoiseMin).toBe(.98);expect(forecast.range.outputNoiseMax).toBe(1.02)
    expect(forecast.range.priceNoiseMin).toBe(.99);expect(forecast.range.priceNoiseMax).toBe(1.01)
    for(let seed=1;seed<=100;seed++) {
      const result=runCycle(state,theme,makeRng(seed),1000,b)
      expect(result.lastOutput).toBeGreaterThanOrEqual(forecast.range.outputMin-1e-8)
      expect(result.lastOutput).toBeLessThanOrEqual(forecast.range.outputMax+1e-8)
      expect(result.cycleReport!.net).toBeGreaterThanOrEqual(forecast.range.netMin-1e-8)
      expect(result.cycleReport!.net).toBeLessThanOrEqual(forecast.range.netMax+1e-8)
    }
    expect(JSON.stringify(state)).toBe(before)
  })
  it('captures independent output and price factors and retains every settled cost and cash part',()=>{
    const state={...fresh(),cash:-200,effects:[{id:'rain',visual:'rain',title:'Mưa',body:'',severity:1,startedAt:0,endsAt:1,outputMul:.9,priceMul:.8,inflationMul:1,revenueMul:.95,costMul:1.1,cashPerYear:50,yearsLeft:2}]}
    const result=runCycle(state,theme,makeRng(80),1000,balance)
    const r=result.cycleReport!
    expect(r.appliedEffects[0]!.outputMul).toBe(.9)
    expect(r.theoreticalOutput*r.outputMul*r.outputNoise).toBeCloseTo(r.output,9)
    expect(r.sold*r.price*r.revenueMul).toBeCloseTo(r.revenue,9)
    expect(r.inputCost+r.logisticsCost+r.otherCost+r.idleCost).toBeCloseTo(r.opex,9)
    expect(result.cash-state.cash).toBeCloseTo(r.net-r.inflation+r.interest+r.ongoing,9)
    expect(r.inflation).toBe(0);expect(r.interest).toBeLessThan(0)
    state.effects[0]!.outputMul=.4
    expect(r.appliedEffects[0]!.outputMul).toBe(.9)
  })
})
