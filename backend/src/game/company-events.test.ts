import {describe,it,expect} from 'vitest'
import fs from 'node:fs'
import {COMPANY_EVENTS,companyEventPool} from './company-events'
import {applyPatch,createState,patchFromEvent,runCycle,invest} from './engine'
import {productionPlan} from './production'
import {annualMachineWear} from './machine-condition'
import {makeRng} from './rng'
import {investmentQuote} from './investment-pricing'
import {companyUpgradePreview,upgradeCompany} from './company-upgrades'
import {companyEventPatch} from './industry-economy'
import {balance} from '../../prisma/seed/balance'
import {LINES} from '../../prisma/seed/rules'
import type {ThemeDef} from './types'

const theme={industryId:'trai-cay-say',factoryName:'Xưởng',unit:'sản phẩm',start:{cashMul:1,dependency:0},coefs:{epl:1400,emission:1,tech:.12,baseOutput:10,basePrice:16.4,opex:49.2,idleCost:34}} as ThemeDef
const fresh=()=>({...createState(theme,10000,makeRng(12),balance),machines:3,engineers:15,support:3,infra:3,green:3,workerSkill:3,machineQuality:3,condition:.75,investmentCounts:{eng:15,mac:3,sup:3,inf:3,grn:3}})
const event=(id:string)=>COMPANY_EVENTS.find(e=>e.id===`company-${id}`)!
const apply=(id:string,seed=1,state=fresh())=>applyPatch(state,patchFromEvent(event(id),event(id).title,event(id).body),makeRng(seed),1000,id,balance)

describe('purposeful company events and fleet wear',()=>{
 it('provides distinct, local, self-contained SVG artwork for every added event',()=>{
  expect(COMPANY_EVENTS).toHaveLength(21)
  expect(JSON.parse(fs.readFileSync('src/game/company-events.data.json','utf8'))).toEqual(JSON.parse(fs.readFileSync('../frontend/src/lib/company-events.json','utf8')))
  for(const e of COMPANY_EVENTS){const svg=fs.readFileSync(`../frontend/public/assets/ui/company-events-v1/${e.id}.svg`,'utf8');expect(svg).toContain('viewBox="0 0 256 256"');expect(svg).toContain(e.title);expect(svg).toContain('data:image/webp;base64,');expect(svg).not.toContain('http://localhost')}
 })
 it('draws an integer 1–5 workers and stores the actual result without legacy rescaling',()=>{
  const values=new Set<number>()
  for(let seed=1;seed<120;seed++){const before=fresh(),after=apply('staff-arrival',seed,before),delta=after.engineers-before.engineers;values.add(delta);expect(delta).toBeGreaterThanOrEqual(1);expect(delta).toBeLessThanOrEqual(5);expect(after.effects[0].summary).toContain(`+${delta} người`);expect(after.cash).toBe(before.cash)}
  expect(values.size).toBe(5)
 })
 it('turns vocational-class spending into explicit 1–5 new workers instead of fractional equipment',()=>{
  const patch=companyEventPatch(fresh(),theme,{...patchFromEvent(event('staff-arrival'),'Lớp nghề tại chỗ',''),cash:[-78,-78],machinesAdd:[.23,.23],engineersAdd:undefined})
  const before=fresh(),after=applyPatch(before,patch,makeRng(8),1,'class',balance)
  expect(after.engineers-before.engineers).toBeGreaterThanOrEqual(1);expect(after.engineers-before.engineers).toBeLessThanOrEqual(5);expect(after.cash).toBeLessThan(before.cash);expect(after.machines).toBe(before.machines);expect(after.effects[0].summary).toContain('công nhân')
 })
 it('never changes paid price ladders when events remove resources or upgrade levels',()=>{
  for(const id of ['staff-resignation','supplier-withdrawal','depot-damage','filter-failure','key-crew-loss','control-fault']){
   const before=fresh(),after=apply(id,4,before)
   expect(after.investmentCounts).toEqual(before.investmentCounts)
   for(const line of ['eng','mac','sup','inf','grn'] as const)expect(investmentQuote(after,line,100,1,1000)).toEqual(investmentQuote(before,line,100,1,1000))
   if(id==='key-crew-loss'||id==='control-fault'){
    const kind=id==='key-crew-loss'?'training':'modernization'
    expect(companyUpgradePreview(after,theme,balance,kind,1000).price).toBe(companyUpgradePreview(before,theme,balance,kind,1000).price)
   }
  }
 })
 it('clamps losses to existing resources and explains the actual before/after values',()=>{
  const before={...fresh(),support:.5,infra:.5,green:.5,engineers:1,workerSkill:1,machineQuality:1,condition:.05}
  for(const id of ['supplier-withdrawal','depot-damage','filter-failure','key-crew-loss','control-fault','bearing-failure']){
   const after=apply(id,2,before)
   for(const n of [after.support,after.infra,after.green,after.workerSkill,after.machineQuality,after.condition])expect(n).toBeGreaterThanOrEqual(0)
   expect(after.effects[0].summary).toContain('→ 0')
  }
  expect(apply('staff-resignation',2,before).engineers).toBe(0)
 })
 it('treats resource events as immediate persistent changes, not a fake timed bonus',()=>{
  const after=apply('depot-damage')
  expect(after.infra).toBeLessThan(3);expect(after.effects[0].yearsLeft).toBe(0);expect(after.effects[0].endsAt).toBe(1000)
  const next=runCycle(after,theme,makeRng(10),2000,balance)
  expect(next.infra).toBe(after.infra)
 })
 it('does not offer damage to absent upgrades or improvement beyond max skill',()=>{
  const s={...fresh(),support:0,infra:0,green:0,workerSkill:5,machineQuality:5,condition:1,engineers:0}
  const ids=companyEventPool(s,[])
  for(const id of ['supplier-withdrawal','depot-damage','filter-failure','mentor-visit','upgrade-sponsor','preventive-service','staff-resignation'])expect(ids).not.toContain(`company-${id}`)
  expect(ids).toContain('company-staff-arrival');expect(companyEventPool({...s,productionVersion:undefined},['old'])).toEqual(['old'])
  const empty=companyEventPool({...fresh(),engineers:0,machines:0},[])
  expect(empty).not.toContain('company-mentor-visit');expect(empty).not.toContain('company-upgrade-sponsor')
 })
 it('uses reproducible integer 5–10 percentage-point wear with variation across years/CEOs',()=>{
  const amounts=new Set<number>()
  for(let seed=1;seed<100;seed++){const s={...fresh(),seed};const wear=annualMachineWear(s);amounts.add(Math.round(wear*100));expect(wear).toBeGreaterThanOrEqual(.05);expect(wear).toBeLessThanOrEqual(.10);expect(wear*100).toBeCloseTo(Math.round(wear*100),10);const next=runCycle(s,theme,makeRng(9),1000,balance);expect(next.condition).toBeCloseTo(s.condition-wear);expect(next.cycleReport?.conditionWearPct).toBe(Math.round(wear*100))}
  expect(amounts.size).toBe(6)
  const mixed={...fresh(),condition:.8125}
  expect(mixed.condition-runCycle(mixed,theme,makeRng(8),1000,balance).condition).toBeCloseTo(annualMachineWear(mixed),10)
 })
 it('stops production at zero condition without destroying assets or ending the CEO turn; maintenance restarts it',()=>{
  const before={...fresh(),condition:.03},dead=runCycle(before,theme,makeRng(1),1000,balance)
  expect(dead.condition).toBe(0);expect(dead.finished).toBe(false);expect(dead.machines).toBe(3);expect(dead.engineers).toBe(15)
  const plan=productionPlan(dead,theme,balance,2000);expect(plan.operating).toBe(0);expect(plan.stopped).toBe(3);expect(plan.idle).toBe(0);expect(plan.output).toBe(0);expect(plan.revenue).toBe(0)
  const fixed=upgradeCompany(dead,theme,balance,'maintenance',2000);if(!fixed.ok)throw Error(fixed.error)
  expect(fixed.state.condition).toBe(1);expect(productionPlan(fixed.state,theme,balance,3000).output).toBeGreaterThan(0)
 })
 it('does not wear uninstalled/idle fleets and cannot create free machines by repairs',()=>{
  const idle={...fresh(),engineers:0};expect(runCycle(idle,theme,makeRng(1),1000,balance).condition).toBe(idle.condition)
  const repaired=apply('preventive-service',5,{...fresh(),condition:.9});expect(repaired.condition).toBe(1);expect(repaired.machines).toBe(3)
  const bought=invest({...fresh(),condition:0},'mac',300,balance,LINES,300,1);if(!bought.ok)throw Error(bought.error)
  expect(bought.state.condition).toBeCloseTo(.25);expect(bought.state.machines).toBe(4)
 })
})
