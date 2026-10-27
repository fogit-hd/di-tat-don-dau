import {describe,it,expect} from 'vitest'
import {balance} from '../../prisma/seed/balance'
import {createState,runCycle} from './engine'
import {productionPlan,productionForecast} from './production'
import {annualDefectPercent,machineHealth} from './machine-condition'
import {makeRng} from './rng'
import type {ThemeDef} from './types'
const theme={industryId:'trai-cay-say',unit:'sản phẩm',start:{cashMul:1,dependency:0},coefs:{epl:1400,emission:1,tech:.12,baseOutput:10,basePrice:16.4,opex:49.2,idleCost:34}} as ThemeDef
const fresh=()=>({...createState(theme,10000,makeRng(7),balance),machines:10,engineers:50,green:100})
describe('durability tiers and unsellable defects',()=>{
 it('uses the approved boundaries rather than multiplying output by raw durability',()=>{
  const cases=[[1,1,0,1],[.8001,1,0,1],[.8,.9,2,4],[.6,.75,5,8],[.4,.55,9,15],[.2,.3,16,25],[.00001,.3,16,25],[0,0,0,0]]
  for(const [condition,speed,defectMin,defectMax] of cases)expect(machineHealth(condition)).toEqual({speed,defectMin,defectMax})
  for(const condition of [.95,.81])expect(productionPlan({...fresh(),condition},theme,balance,1,1,1,0).output).toBe(productionPlan(fresh(),theme,balance,1,1,1,0).output)
 })
 it('charges the same manufacturing cost for rejected products and never sells them',()=>{
  const s={...fresh(),condition:.1},noDefects=productionPlan({...s,condition:1},theme,balance,1,1,1,0),p=productionPlan(s,theme,balance,1,1,1,25)
  expect(p.output).toBeLessThan(noDefects.output);expect(p.defective).toBe(Math.floor(p.output*.25));expect(p.saleable+p.defective).toBe(p.output)
  expect(p.sold).toBe(Math.floor(p.saleable*p.delivery));expect(p.revenue).toBeCloseTo(p.sold*p.price*p.revenueMul)
  expect(p.opex).toBe(noDefects.opex)
  for(const count of [p.output,p.defective,p.saleable,p.sold,p.operating])expect(Number.isInteger(count)).toBe(true)
 })
 it('draws only integer fault percentages and does not reroll on reload/forecast',()=>{
  const s={...fresh(),condition:.4},before=JSON.stringify(s),values=new Set<number>()
  for(let seed=1;seed<=100;seed++){const v=annualDefectPercent({...s,seed});values.add(v);expect(Number.isInteger(v)&&v>=9&&v<=15).toBe(true)}
  expect(values.size).toBe(7)
  for(let i=0;i<5;i++)productionForecast(s,theme,balance,1000)
  expect(JSON.stringify(s)).toBe(before)
  const a=runCycle(s,theme,makeRng(42),1000,balance),b=runCycle(JSON.parse(before),theme,makeRng(42),1000,balance)
  expect(a.cycleReport).toEqual(b.cycleReport);expect(a.cycleReport?.defectRatePct).toBe(annualDefectPercent(s))
  expect(a.cycleReport?.conditionFactor).toBe(.55)
 })
 it('encloses all legal noise and fault rolls without sampling the RNG',()=>{
  for(const condition of [1,.8,.6,.4,.2,0]){
   const s={...fresh(),condition},f=productionForecast(s,theme,balance,1000)
   for(let seed=1;seed<40;seed++){const r=runCycle({...s,seed},theme,makeRng(seed),1000,balance).cycleReport!;expect(r.sold).toBeGreaterThanOrEqual(f.range.soldMin);expect(r.sold).toBeLessThanOrEqual(f.range.soldMax);expect(r.net).toBeGreaterThanOrEqual(f.range.netMin-1e-8);expect(r.net).toBeLessThanOrEqual(f.range.netMax+1e-8)}
   if(!condition){expect(f.range.outputMax).toBe(0);expect(f.expected.defective).toBe(0)}
  }
 })
})
