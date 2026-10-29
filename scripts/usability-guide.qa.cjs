const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const automatic=true;
const demo=false,fallback=false;let browser;
const root=path.resolve(__dirname,'..'),out=path.join(root,'design-preview/usability-v5/guide');fs.mkdirSync(out,{recursive:true});
const actions=['company','cash','assets','year-count','clock','income','rank','sound','investment','cluster','crew','supply','infrastructure','green','enterprise-ready','stat-workers','stat-clusters','stat-products','stat-tech','stat-supply','stat-infra','stat-environment','stat-quality','risk','events','years','year','complete'];
(async()=>{
 const {createState,computeValue,invest,runCycle,openYearEffects}=await import('../backend/src/game/engine.ts');
 const {balance}=await import('../backend/prisma/seed/balance.ts');
 const {makeRng}=await import('../backend/src/game/rng.ts');
 const {industryEconomy}=await import('../backend/src/game/industry-economy.ts');
 const {investmentPreviews}=await import('../backend/src/game/investment-preview.ts');
 const {investmentQuote}=await import('../backend/src/game/investment-pricing.ts');
 const {annualBalance,annualEconomy}=await import('../backend/src/game/random-economy.ts');
 const {productionPlan,productionForecast}=await import('../backend/src/game/production.ts');
 const {guideStep,guideDisplayedTab}=await import('../frontend/src/lib/first-year-guide.ts');
 for(const [step,tab] of [[14,'enterprise'],[22,'enterprise'],[23,'risk'],[24,'events'],[25,'years']])assert.equal(guideDisplayedTab(step,2),tab,'reload/in-flight tab must match the spoken topic');
 const {advisorDirection}=await import('../frontend/src/lib/advisor-direction.ts');
 const {money}=await import('../frontend/src/lib/format.ts');
 assert.equal(advisorDirection(0,-600),'point-up');assert.equal(advisorDirection(150,-400),'point-up');assert.equal(advisorDirection(-150,-400),'point-up');assert.equal(advisorDirection(600,-400),'point');
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
 const report={errors:[],missing:[],widths:[],requests:[]};
 for(const width of (process.env.ADVISOR_WIDTHS?process.env.ADVISOR_WIDTHS.split(',').map(Number):[390,768,1440])){
  const height=width===844?390:width===360?800:width===390?844:width===768?1024:900;
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference',recordVideo:width===1440&&!automatic?{dir:path.join(out,'recording'),size:{width,height}}:undefined});
  await context.addInitScript(()=>localStorage.setItem('player:QA1234','test-player'));
  const industry=width===768?'chip-ban-dan':'trai-cay-say',eco=industryEconomy(industry);
  const lines=[['eng','Tuyển công nhân'],['mac','Mở cụm sản xuất'],['sup','Liên kết nhà cung cấp'],['inf','Mở rộng hạ tầng'],['grn','Công nghệ sạch']].map(([id,label])=>({id,label,hint:label}));
  const theme={id:industry,industryId:industry,industryName:width===768?'Sản xuất chip bán dẫn':'Chế biến trái cây sấy',factoryName:'Đại Việt · Doanh nghiệp kiểm thử',name:'Xưởng kiểm thử',unit:'sản phẩm',role:'Giám đốc',mission:'',dirs:[],lines,art:'',anchors:null,eventIds:[],regionId:'hn',regionName:'Hà Nội',scaleId:'small',scaleName:'Xưởng nhỏ',contextId:'new',contextName:'Khởi nghiệp',vars:{},coefs:{epl:1000,tech:.1,support:.1,infra:.1,emission:1,baseOutput:10,basePrice:20,opex:30,idleCost:2},start:{cashMul:1,engineers:0,machines:0,pollution:0,dependency:0,condition:1}};
  let state=createState(theme,10000,makeRng(7),balance);state.tutorial={version:2,step:0,complete:false};
  const deadline=Date.now()+600000,sockets=new Set(),requests=[],snap={serverNow:Date.now(),paused:false,frozenNow:null,room:{code:'QA1234',hostName:'Chủ phòng',status:'playing',durationSec:600,startingCapital:10000,cycleSeconds:60,yearMinSeconds:5,step:50,endsAt:deadline,remainingMs:null,countdownEndsAt:null,cycleStartedAt:Date.now(),cycleElapsedMs:0,questionStats:[]},teams:[],leaderboard:[],endings:{},you:{id:'one',teamName:'Đại Việt',rank:1,correct:0,answered:0,finished:false,succession:null,theme,scene:null},role:'player'};
  function sync(){
   const now=Date.now(),ab=annualBalance(state,balance),plan=productionPlan(openYearEffects(state,now+1),theme,ab,now+1);
   snap.serverNow=now;snap.you.scene={...state,industryId:industry,art:'',unit:'sản phẩm',operating:plan.operating,idle:plan.idle,stopped:plan.stopped,util:plan.util,output:state.lastOutput,value:computeValue(state,theme,balance),trajectory:'build',dirs:[],lines,anchors:null,economyVersion:3,crewRequired:eco.crew,activeEffects:[],yearChanges:[],traits:[],deathChance:0,nextDeathChance:0,successionChance:0,nextSuccessionChance:0,investmentPreviews:investmentPreviews(state,theme,balance,ab,lines,eco.prices,50,now),productionForecast:productionForecast(openYearEffects(state,now+1),theme,ab,now+1),operatingForecast:plan,linePrices:Object.fromEntries(lines.map(l=>[l.id,investmentQuote(state,l.id,eco.prices[l.id],1,now).price])),upgradeEfficiency:annualEconomy(state).upgrade};
   if(state.cycleReport){const r=state.cycleReport;snap.you.scene.lastProduction=r;snap.you.scene.yearChanges=[{year:r.year,cashBefore:state.cash-r.net+r.inflation-r.ongoing-r.interest,cashAfter:state.cash,assetsBefore:0,assetsAfter:computeValue(state,theme,balance),production:r,causes:[{kind:'production',label:'Sản xuất',cash:r.net},{kind:'inflation',label:'Lạm phát',cash:-r.inflation},{kind:'interest',label:'Lãi nợ',cash:r.interest},{kind:'ongoing',label:'Sự kiện',cash:r.ongoing}]}]}
   for(const socket of sockets)try{socket.send('42'+JSON.stringify(['snapshot',snap]))}catch{sockets.delete(socket)}
  }
  sync();let failCash=!automatic;
  snap.you.teamName=width===768?'Lan':'Minh';
  const varied={...snap.you.scene,crewRequired:7,engineers:3,tutorial:{version:2,step:9,complete:false},investmentPreviews:{...snap.you.scene.investmentPreviews,mac:{1:{total:735,count:1}},eng:{crew:{count:4,total:315}}}};
  assert(guideStep(varied,{ceoName:'An',industryName:'Ngành riêng'}).text.includes('735 triệu'));varied.tutorial.step=10;const personal=guideStep(varied,{ceoName:'An',industryName:'Ngành riêng'}).text;assert(personal.includes('4 người')&&personal.includes('315 triệu'));
  await context.routeWebSocket('**/socket.io/**',ws=>{sockets.add(ws);ws.send('0'+JSON.stringify({sid:'qa',upgrades:[],pingInterval:25000,pingTimeout:20000,maxPayload:1000000}));ws.onMessage(message=>{const s=String(message);if(s.startsWith('40'))ws.send('40'+JSON.stringify({sid:'qa'}));if(s.startsWith('42')&&s.includes('hello')){sync()}})});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.hostname!=='game.test')return route.abort();
   if(url.pathname.startsWith('/api/')){
    const body=route.request().postDataJSON()||{};requests.push({path:url.pathname,body});
    if(url.pathname.endsWith('/intro')){state.introDone=true;state.factoryName=body.factoryName}
    if(url.pathname.endsWith('/tutorial')){
     if(body.action==='cash'&&failCash){failCash=false;return route.fulfill({status:503,json:{error:'Kiểm thử lỗi kết nối, hãy thử lại.'}})}
     if(body.action!==actions[state.tutorial.step])return route.fulfill({status:409,json:{error:'Sai bước'}});
     if(body.action==='complete'){state.tutorial.complete=true;state.nextYearAt=Date.now()+60000;state.yearLockUntil=Date.now()+5000}
     state.tutorial.step++;
    }
    if(url.pathname.endsWith('/invest')){
     assert.equal(actions[state.tutorial.step],{mac:'cluster',eng:'crew',sup:'supply',inf:'infrastructure',grn:'green'}[body.line]);
     const quote=investmentQuote(state,body.line,eco.prices[body.line],body.quantity,Date.now());const result=invest(state,body.line,quote.total,balance,lines,eco.prices[body.line],quote.count,annualEconomy(state).upgrade[body.line]);assert(result.ok);state=result.state;state.tutorial.step++;
    }
    if(url.pathname.endsWith('/year')){assert.equal(actions[state.tutorial.step],'year');state=runCycle(state,theme,makeRng(9),Date.now(),annualBalance(state,balance));state.tutorial.step++;state.nextYearAt=0;state.yearLockUntil=0}
    sync();return route.fulfill({json:{ok:true}});
   }
   if(url.pathname==='/config.js')return route.fulfill({contentType:'application/javascript',body:'window.__APP_CONFIG__={};'});
   if(fallback&&url.pathname.endsWith('/advisor-v1/talk.png'))return route.fulfill({status:404,body:''});
   let file=path.join(root,'frontend/dist',decodeURIComponent(url.pathname));if(!path.extname(file))file=path.join(root,'frontend/dist/index.html');
   if(!fs.existsSync(file)){report.missing.push(url.pathname);return route.fulfill({status:404,body:''})}
   return route.fulfill({contentType:({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
  });
  const page=await context.newPage(),video=page.video();page.on('pageerror',e=>report.errors.push(String(e)));page.setDefaultTimeout(15000);
  await page.addInitScript(()=>{window.__advisorEntranceAlpha=1;new MutationObserver(()=>{const a=document.querySelector('.first-year-advisor canvas');if(a?.dataset.phase==='arriving')window.__advisorEntranceAlpha=Math.min(window.__advisorEntranceAlpha,Number(a.dataset.alpha))}).observe(document,{subtree:true,attributes:true,attributeFilter:['data-alpha']})});
  await page.clock.install(); await page.addInitScript(()=>{window.qaFrames=0;const f=()=>{window.qaFrames++;requestAnimationFrame(f)};requestAnimationFrame(f)});
  await page.goto('http://game.test/play/QA1234');assert.equal(await page.locator('#sIntro input').count(),0,'CEO must not be asked to rename the company');await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();
  const actor=page.locator('.first-year-advisor canvas');await actor.waitFor();
  const pump=async(test,label,max=600)=>{for(let n=0;!(await test())&&n<max;n++){await page.clock.runFor(300);await new Promise(r=>setTimeout(r,8))}if(!(await test())){await page.screenshot({path:path.join(out,`failure-${width}.png`)});console.error(report.errors,await actor.evaluate(n=>({dataset:{...n.dataset},lost:n.getContext("2d").isContextLost(),frames:window.qaFrames,now:performance.now(),hidden:document.hidden}))); await page.clock.resume(); await page.waitForTimeout(2000); console.error("after real time",await actor.evaluate(n=>({...n.dataset})));throw Error(`${label}: step ${state.tutorial.step}, ${await actor.getAttribute('data-dialogue')}, ${await actor.getAttribute('data-pose')}`)}};
  await pump(async()=>await actor.getAttribute('data-dialogue')==='awaiting-continue','manual contextual welcome');
  await page.clock.runFor(12000);assert.equal(state.tutorial.step,0,'Welcome waits for a screen tap');assert.equal(await actor.getAttribute('data-focus'),'');
  await page.mouse.click(width-2,height-2);await pump(()=>state.tutorial.step===1,'tap continues welcome');
  if(width===390){
   await pump(async()=>await actor.getAttribute('data-step')==='1'&&String(await actor.getAttribute('data-pose')).endsWith('-talk'),'pointing and talking before typed sentence');
   const poses=new Set(),frames=new Set(),lengths=[];
   for(let i=0;i<18;i++){await page.clock.runFor(80);poses.add(await actor.getAttribute('data-pose'));frames.add(await actor.getAttribute('data-frame'));lengths.push(await page.locator('.advisor-dialogue>p').first().textContent().then(x=>x.length));}
   assert(lengths.at(-1)>lengths[0],'Letters reveal progressively');assert(frames.size>1,'Mouth changes while letters reveal');assert([...poses].every(p=>p.endsWith('-talk')),'No silent pointing entrance while text is revealing');
   await page.screenshot({path:path.join(out,`speech-${width}.png`)});
  }
  await pump(()=>state.tutorial.step===9,'HUD and investment explanation auto-advance without tab clicks');
  assert.equal(await page.locator('.game-panel').getAttribute('data-active-tab'),'investment');assert.equal(requests.filter(r=>r.path.endsWith('/invest')).length,0);
  await page.clock.runFor(12000);assert.equal(state.tutorial.step,9,'Never automatically purchase');assert.equal(state.nextYearAt,0);
  if(width<700)assert.equal(await page.locator('.factory-scene').isVisible(),false,'Phone prioritises gameplay over company image');
  for(let i=9;i<=13;i++){
   await pump(async()=>state.tutorial.step===i&&await actor.getAttribute('data-step')===String(i)&&await actor.getAttribute('data-dialogue')==='awaiting-action','purchase ready');
   const target=({cluster:'buy-mac',crew:'buy-crew',supply:'buy-sup',infrastructure:'buy-inf',green:'buy-grn'})[actions[i]];
   const button=page.locator(`[data-guide="${target}"]`);await pump(async()=>!(await button.isDisabled()),'actual purchase button enabled');
   const b=await button.boundingBox(),bubble=await page.locator('.advisor-dialogue').boundingBox();assert(!(b.x<bubble.x+bubble.width&&b.x+b.width>bubble.x&&b.y<bubble.y+bubble.height&&b.y+b.height>bubble.y),'Dialogue does not cover purchase button');
   await page.screenshot({path:path.join(out,`${actions[i]}-${width}.png`)});
   await button.click({force:true});await pump(()=>state.tutorial.step===i+1,'real purchase advances');
  }
  const seen=[];
  for(let i=14;i<=25;i++){
   await pump(()=>state.tutorial.step===i,'explanation '+actions[i]);await pump(async()=>await actor.getAttribute('data-step')===String(i),'render explanation');
   const expected=i<=22?'enterprise':i===23?'risk':i===24?'events':'years';assert.equal(await page.locator('.game-panel').getAttribute('data-active-tab'),expected,'Tab opens before its explanation');
   const spoken=await page.locator('.advisor-dialogue .advisor-sr').textContent();assert(!/đã mở|tôi đã mở|bạn bấm tab/iu.test(spoken));seen.push(actions[i]);
   if([15,23,24].includes(i))await page.screenshot({path:path.join(out,`${actions[i]}-${width}.png`)});
   // Let this explanation complete naturally, including the 2.5s response gap.
   await pump(()=>state.tutorial.step>i,'automatic next explanation');
  }
  await pump(async()=>state.tutorial.step===26&&await actor.getAttribute('data-dialogue')==='awaiting-action','manual year button');
  await page.clock.runFor(6000);assert.equal(state.cycles,0);assert.equal(state.nextYearAt,0);
  await page.locator('[data-guide="year"]').click({force:true});await pump(()=>state.tutorial.complete,'complete first year');
  assert.equal(state.cycles,1);assert(state.nextYearAt>Date.now()+58000);assert.equal(snap.room.endsAt,deadline);
  assert.equal(requests.filter(r=>r.path.endsWith('/invest')).length,5);report.widths.push({width,seen,realPurchases:5,year:state.cycles});
  await page.clock.runFor(400);assert.equal(await page.locator('.first-year-advisor').count(),0);
  state.finished=true;snap.you.finished=true;sync();await page.clock.runFor(400);await page.locator('.company-name summary').click({force:true});await page.clock.runFor(200);
  assert.equal(await page.locator('.company-full b').evaluate(n=>getComputedStyle(n).color),'rgb(67, 39, 25)');
  assert(await page.locator('.company-full b').evaluate(n=>getComputedStyle(n).fontFamily.includes('Public UI')));
  if(width<700){const a=await page.locator('.top-ended').boundingBox(),b=await page.locator('.top-tools .rank').boundingBox();assert(a.x+a.width<=b.x+1,'Finished state and rank do not overlap');}
  await page.screenshot({path:path.join(out,`finished-title-${width}.png`)});await context.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();
})().catch(async error=>{console.error(error);await browser?.close();process.exitCode=1});
