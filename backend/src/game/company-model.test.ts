import {describe,it,expect} from 'vitest'
import fs from 'node:fs'
import {balance} from '../../prisma/seed/balance'
import {LINES} from '../../prisma/seed/rules'
import {createState,invest,runCycle,applyPatch} from './engine'
import {productionPlan} from './production'
import {companyUpgradePreview,upgradeCompany} from './company-upgrades'
import {industryEconomy,INDUSTRY_ECONOMY,companyEventPatch} from './industry-economy'
import {investmentQuote} from './investment-pricing'
import {makeRng} from './rng'
import type {ThemeDef} from './types'

const theme=(id='trai-cay-say')=>({industryId:id,unit:'sản phẩm',factoryName:'Xưởng',start:{cashMul:1,engineers:50000,machines:10,pollution:4,condition:.7,dependency:1},coefs:{epl:1400,emission:1,tech:.12,baseOutput:10,basePrice:16.4,opex:49.2,idleCost:34}} as ThemeDef)
const fresh=(id='trai-cay-say')=>createState(theme(id),10000,makeRng(1),balance)
describe('industry production units and purposeful upgrades',()=>{
 it('covers exactly the 64 real industries with authored crew and distinct price sets',()=>{
  const seed=JSON.parse(fs.readFileSync('prisma/seed/industries.seed.json','utf8'))
  expect(Object.keys(INDUSTRY_ECONOMY).sort()).toEqual(seed.industries.map((i:{slug:string})=>i.slug).sort())
  const sets=new Set<string>()
  for(const {crew,prices} of Object.values(INDUSTRY_ECONOMY)){
   expect(crew).toBeGreaterThanOrEqual(3);expect(crew).toBeLessThanOrEqual(6)
   for(const price of Object.values(prices))expect(Number.isInteger(price)&&price>0).toBe(true)
   sets.add(JSON.stringify(prices))
  }
  expect(sets.size).toBeGreaterThan(50)
  expect(industryEconomy('chip-ban-dan').prices.eng).toBeGreaterThan(industryEconomy('det-may').prices.eng)
 })
 it('starts at zero but keeps capital; one purchase delivers exactly one worker or complete unit',()=>{
  let s=fresh();expect([s.engineers,s.machines,s.cumulativeOutput,s.tech,s.support,s.infra,s.green]).toEqual([0,0,0,0,0,0,0]);expect(s.cash).toBe(10000);expect(s.condition).toBe(1)
  for(const line of ['eng','mac'] as const){const r=invest(s,line,200,balance,LINES,200,1,.9);expect(r.ok).toBe(true);if(!r.ok)throw Error(r.error);s=r.state}
  expect(s.engineers).toBe(1);expect(s.machines).toBe(1);expect(s.machineProgress).toBe(0)
  expect(productionPlan(s,theme(),balance,1).operating).toBe(0)
 })
 it('matches the visible example: 3 units, 12 people, 5 required -> 2 operating, 3 people missing',()=>{
  const s={...fresh(),machines:3,engineers:12};const p=productionPlan(s,theme(),balance,1)
  expect(p.engineersPerMachine).toBe(5);expect(p.operating).toBe(2);expect(p.idle).toBe(1);expect(p.staffMissing).toBe(3)
  const quote=investmentQuote(s,'eng',40,'crew',1);expect(quote.count).toBe(3)
  const hired=invest(s,'eng',quote.total,balance,LINES,40,quote.count)
  if(!hired.ok)throw Error(hired.error)
  expect(productionPlan(hired.state,theme(),balance,1).operating).toBe(3)
 })
 it('calibrates baseline returns against complete crew + equipment across all industries',()=>{
  for(const [id,profile]of Object.entries(INDUSTRY_ECONOMY)){
   const s={...fresh(id),machines:1,engineers:profile.crew,green:100}
   const plan=productionPlan(s,theme(id),balance,1)
   const entry=profile.prices.mac+profile.crew*profile.prices.eng
   expect(plan.net/entry).toBeCloseTo(.22,10)
  }
 })
 it('makes training, equipment improvement and maintenance affect real output and exact receipts',()=>{
  for(const kind of ['training','modernization','maintenance'] as const){
   const s={...fresh(),machines:3,engineers:15,condition:.75,green:100}
   const preview=companyUpgradePreview(s,theme(),balance,kind,1)
   expect(preview.locked).toBe(false);expect(preview.outputAfter).toBeGreaterThan(preview.outputBefore)
   const bought=upgradeCompany(s,theme(),balance,kind,1)
   if(!bought.ok)throw Error(bought.error)
   expect(bought.state.cash).toBe(s.cash-preview.price)
   expect(bought.state.machines).toBe(3);expect(bought.state.engineers).toBe(15)
   expect(productionPlan(bought.state,theme(),balance,2).net).toBeCloseTo(preview.netAfter,10)
   expect(bought.state.pendingCauses.at(-1)?.cash).toBe(-preview.price)
  }
 })
 it('caps quality, blocks redundant maintenance and does not award unlimited technology for spare staff',()=>{
  const s={...fresh(),machines:3,engineers:15,workerSkill:5,machineQuality:5}
  expect(upgradeCompany(s,theme(),balance,'training',1).ok).toBe(false)
  expect(upgradeCompany(s,theme(),balance,'modernization',1).ok).toBe(false)
  expect(upgradeCompany(s,theme(),balance,'maintenance',1).ok).toBe(false)
  expect(productionPlan({...s,engineers:5000},theme(),balance,1).tech).toBe(productionPlan(s,theme(),balance,1).tech)
  let live=s
  for(let year=0;year<200;year++)live=runCycle(live,theme(),makeRng(year+1),year+1,balance) as typeof s
  expect(live.tech).toBeLessThanOrEqual(3);expect(live.condition).toBeGreaterThanOrEqual(.6)
 })
 it('keeps late production proportional to staffed units and rescales old personnel gifts',()=>{
  const maxed={...fresh(),machines:100,engineers:500,tech:3,workerSkill:5,machineQuality:5,green:1000}
  const plan=productionPlan(maxed,theme(),balance,1,1.03,1)
  expect(plan.output).toBeLessThanOrEqual(23433)
  const patch=companyEventPatch(fresh(),theme(),{title:'Đào tạo',body:'',visual:'none',exposure:'any',durationSec:[1,1],outputMul:[1,1],priceMul:[1,1],inflationMul:[1,1],engineersAdd:[280,520]})
  const gift=applyPatch(fresh(),patch,makeRng(1),1,'gift',balance)
  expect(gift.engineers).toBeLessThanOrEqual(2);expect(gift.engineers).toBeGreaterThanOrEqual(1)
  expect(gift.effects[0]!.summary).toContain('công nhân')
 })
 it('bulk and Max sum actual price tiers across crew and scale boundaries without discounts on quantity',()=>{
  for(const line of ['eng','mac','sup','inf','grn'] as const)for(const start of [0,9,10,49,50,99]){
   const s=fresh();s.investmentCounts={[line]:start};const base=industryEconomy('trai-cay-say').prices[line]
   const quote=investmentQuote(s,line,base,10,0);let total=0
   for(let i=0;i<10;i++){total+=investmentQuote(s,line,base,1,0).total;s.investmentCounts[line]!++}
   expect(quote.total).toBe(total)
   const max=investmentQuote(s,line,base,'max',0);expect(max.total).toBeLessThanOrEqual(s.cash);expect(max.total+max.nextPrice).toBeGreaterThan(s.cash)
  }
 })
})
