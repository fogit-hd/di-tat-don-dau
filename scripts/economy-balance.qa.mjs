import assert from 'node:assert/strict';
import fs from 'node:fs';
import { balance } from '../backend/prisma/seed/balance.ts';
import { LINES } from '../backend/prisma/seed/rules.ts';
import { createState, invest, runCycle, computeValue } from '../backend/src/game/engine.ts';
import { productionPlan } from '../backend/src/game/production.ts';
import { annualBalance, annualEconomy, annualPolicy } from '../backend/src/game/random-economy.ts';
import { mortalityChanceFor, deathChanceFor } from '../backend/src/game/succession.ts';
import { makeRng } from '../backend/src/game/rng.ts';

const target = (balance.priceCapitalBase + 1400 / balance.engPerTy) * balance.priceRevenueShare;
const theme = {
 id:'wood',industryId:'go',industryName:'Gỗ',name:'Xưởng',unit:'sản phẩm',factoryName:'Xưởng',dirs:['','','',''],lines:LINES,art:'',eventIds:[],
 coefs:{epl:1400,tech:.12,support:.08,infra:.08,emission:1,baseOutput:10,basePrice:target/10,opex:target*.3,idleCost:34},
 start:{cashMul:1,engineers:730,machines:.4,pollution:4,dependency:0,condition:1},
};
const fresh=(seed=1)=>createState(theme,10000,makeRng(seed),balance);
const rows=[];
for(const id of ['none','eng','mac','sup','inf','grn']) {
 let s=fresh();if(id!=='none')s=invest(s,id,1000,balance,LINES).state;
 const p=productionPlan(s,theme,balance,1);
 rows.push({line:id,netMillion:+p.net.toFixed(3),operating:+p.operating.toFixed(3),idle:+p.idle.toFixed(3),pollution:+p.pollution.toFixed(3)});
}
assert(rows.find(r=>r.line==='mac').netMillion<rows[0].netMillion,'Unstaffed machinery must not promise instant profit');
const strategies={
 balanced:s=>s.engineers < s.machines*1400 ? 'eng' : 'mac',
 machines:()=> 'mac',
 support:()=> 'sup',
 mixed:(_,year)=>['eng','mac','sup','inf','grn'][year%5],
};
const sims=[];
const start=performance.now();
for(const [strategy,choose] of Object.entries(strategies)) {
 let value=0,cash=0,negative=0;
 for(let seed=1;seed<=500;seed++) {
  let s=fresh(seed);const rng=makeRng(seed+1000);
  for(let year=0;year<50;year++) {
   const line=choose(s,year);
   if(s.cash>=1000)s=invest(s,line,1000,balance,LINES,1000,1,annualEconomy(s).upgrade[line]).state;
   s=runCycle(s,theme,rng,(year+1)*60000,annualBalance(s,balance));
   assert(Number.isFinite(s.cash));assert(s.pollution>=0&&s.pollution<=100);
  }
  value+=computeValue(s,theme,balance);cash+=s.cash;if(s.cash<0)negative++;
 }
 sims.push({strategy,meanValueMillion:Math.round(value/500),meanCashMillion:Math.round(cash/500),negativeCashRuns:negative});
}
const policy=annualPolicy({seed:1,cycles:0},{baseChance:.01,stepPerYear:.0025,maxChance:.3,longevityChance:.01,illnessAdd:.1,traitRules:{}});
assert.equal(mortalityChanceFor(100,15,policy,[]),.02);assert.equal(deathChanceFor(100,15,policy,[]),.04);
const report={onePackage:rows,controlledFiftyYearRuns:sims,runs:2000,elapsedMs:Math.round(performance.now()-start),healthyCaps:{death:.02,succession:.04}};
fs.mkdirSync('.tmp',{recursive:true});fs.writeFileSync('.tmp/economy-balance-v2.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
