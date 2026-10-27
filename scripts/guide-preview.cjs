// Local-only interactive tutorial preview. Not imported by, or deployed with, the app.
exports.makeGuidePreview=async fixture=>{
 const {createState,computeValue,invest,runCycle,openYearEffects}=await import('../backend/src/game/engine.ts');
 const {balance}=await import('../backend/prisma/seed/balance.ts');
 const {makeRng}=await import('../backend/src/game/rng.ts');
 const {industryEconomy}=await import('../backend/src/game/industry-economy.ts');
 const {investmentPreviews}=await import('../backend/src/game/investment-preview.ts');
 const {investmentQuote}=await import('../backend/src/game/investment-pricing.ts');
 const {annualBalance,annualEconomy}=await import('../backend/src/game/random-economy.ts');
 const {productionPlan,productionForecast}=await import('../backend/src/game/production.ts');
 const {tutorialAction,tutorialPurchase}=await import('../backend/src/game/tutorial.ts');
 const lines=[['eng','Tuyển công nhân'],['mac','Mở cụm sản xuất'],['sup','Liên kết nhà cung cấp'],['inf','Mở rộng hạ tầng'],['grn','Công nghệ sạch']].map(([id,label])=>({id,label,hint:label}));
 const theme={...fixture.theme,lines,eventIds:[],coefs:{epl:1000,tech:.1,support:.1,infra:.1,emission:1,baseOutput:10,basePrice:20,opex:30,idleCost:2},start:{cashMul:1,engineers:0,machines:0,pollution:0,dependency:0,condition:1}};
 const eco=industryEconomy(theme.industryId);let state=createState(theme,10000,makeRng(7),balance);state.introDone=true;state.tutorial={version:2,step:0,complete:false};
 const scene=()=>{const now=Date.now(),ab=annualBalance(state,balance),plan=productionPlan(openYearEffects(state,now+1),theme,ab,now+1);return {...state,industryId:theme.industryId,unit:'sản phẩm',economyVersion:3,crewRequired:eco.crew,operating:plan.operating,idle:plan.idle,value:computeValue(state,theme,balance),output:state.cumulativeOutput??0,lines,traits:[],activeEffects:[],yearChanges:state.cycleReport?[{year:1,cashBefore:10000,cashAfter:state.cash,assetsBefore:10000,assetsAfter:computeValue(state,theme,balance),production:state.cycleReport,causes:[{kind:'production',label:'Sản xuất',cash:state.cycleReport.net}]}]:[],lastProduction:state.cycleReport,investmentPreviews:investmentPreviews(state,theme,balance,ab,lines,eco.prices,50,now),productionForecast:productionForecast(openYearEffects(state,now+1),theme,ab,now+1),operatingForecast:plan,linePrices:eco.prices,deathChance:0,successionChance:0}}
 return {
  snapshot(role){const snap=fixture.snapshot(role);if(snap.you){snap.you.theme=theme;snap.you.scene=scene();snap.you.rank=1}return snap},
  act(path,body){
   const action=tutorialAction(state),now=Date.now();
   if(path.endsWith('/invest')){const required=tutorialPurchase(state);if(!required||required.line!==body.line||required.quantity!==body.quantity)throw Error('Hãy bấm nút đang được hướng dẫn');const q=investmentQuote(state,body.line,eco.prices[body.line],body.quantity,now);const result=invest(state,body.line,q.total,balance,lines,eco.prices[body.line],q.count,annualEconomy(state).upgrade[body.line]);if(!result.ok)throw Error(result.error);state=result.state;state.tutorial.step++}
   if(path.endsWith('/tutorial')){if(body.action!==action)throw Error('Hãy thực hiện đúng bước');if(action==='complete'){state.tutorial.complete=true;state.nextYearAt=now+60000;state.yearLockUntil=now+5000}state.tutorial.step++}
   if(path.endsWith('/year')){if(action!=='year')throw Error('Hãy hoàn tất hướng dẫn');state=runCycle(state,theme,makeRng(9),now,annualBalance(state,balance));state.tutorial.step++;state.nextYearAt=0;state.yearLockUntil=0}
  }
 }
}
