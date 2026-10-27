const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const automatic=process.env.ADVISOR_AUTOMATIC==='1',reloadOnly=process.env.ADVISOR_RELOAD==='1';
const demo=process.env.ADVISOR_DEMO==='1',fallback=process.env.ADVISOR_FALLBACK==='1';let browser;
const root=path.resolve(__dirname,'..'),out=path.join(root,'design-preview/mascot-guide-v3/'+(process.env.ADVISOR_OUTPUT||(demo?'verification-demo':'verification-approved-guide-v2')));fs.mkdirSync(out,{recursive:true});
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
 assert.equal(advisorDirection(0,-600),'point-up');assert.equal(advisorDirection(150,-400),'point-steep-right');assert.equal(advisorDirection(-150,-400),'point-steep-left');assert.equal(advisorDirection(600,-400),'point');
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
 const report={errors:[],missing:[],widths:[],requests:[]};
 for(const width of (process.env.ADVISOR_WIDTHS?process.env.ADVISOR_WIDTHS.split(',').map(Number):demo?[1440]:[360,390,768,844,1440])){
  const height=width===844?390:width===360?800:width===390?844:width===768?1024:900;
  const context=await browser.newContext({viewport:{width,height},reducedMotion:automatic?'reduce':'no-preference',recordVideo:width===1440&&!automatic?{dir:path.join(out,'recording'),size:{width,height}}:undefined});
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
  if(automatic)await page.clock.install();
  await page.goto('http://game.test/play/QA1234');assert.equal(await page.locator('#sIntro input').count(),0,'CEO must not be asked to rename the company');await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();
  const actor=page.locator('.first-year-advisor canvas');await actor.waitFor();
  if(reloadOnly){
   for(const [step,tab] of [[14,'enterprise'],[23,'risk'],[24,'events'],[25,'years']]){
    state.tutorial.step=step;sync();await page.reload();await actor.waitFor();
    for(let turn=0;await actor.getAttribute('data-step')!==String(step)&&turn<120;turn++){await page.clock.runFor(100);await new Promise(r=>setTimeout(r,10))}
    assert.equal(await actor.getAttribute('data-step'),String(step));assert.equal(await page.locator('.game-panel').getAttribute('data-active-tab'),tab,'reload must open the tab before speech');
    await page.screenshot({path:path.join(out,`reload-${tab}-${width}.png`),fullPage:true});
   }
   report.widths.push({width,reload:true});await context.close();continue;
  }
  if(automatic){
   const pumpUntil=async(test,label,max=700)=>{for(let turn=0;!test()&&turn<max;turn++){await page.clock.runFor(400);await new Promise(r=>setTimeout(r,10))}if(!test()){await page.screenshot({path:path.join(out,`automatic-failure-${width}.png`),fullPage:true});console.error({width,label,step:state.tutorial.step,actor:await actor.getAttribute('data-step'),dialogue:await actor.getAttribute('data-dialogue'),last:requests.slice(-3)})}assert(test(),label)};
   await pumpUntil(()=>state.tutorial.step===1,'first explanation advances after speech');
   snap.paused=true;sync();await page.clock.runFor(10000);assert.equal(state.tutorial.step,1,'paused explanation must not auto-advance');snap.paused=false;sync();
   await pumpUntil(()=>state.tutorial.step===8,'HUD explanations advance automatically');
   await page.clock.runFor(20000);assert.equal(state.tutorial.step,8,'investment tab requires a real click');
   await page.locator('[data-guide="tab-investment"]').click({force:true});
   await pumpUntil(()=>state.tutorial.step===9,'investment tab click acknowledges the visit');
   assert.equal(await page.locator('.game-panel').getAttribute('data-active-tab'),'investment');
   assert.equal(requests.filter(r=>r.path.endsWith('/invest')).length,0);assert.equal(state.nextYearAt,0);
   const cashBefore=state.cash,clockBefore=await page.locator('[data-guide="clock"]').innerText();
   await page.clock.runFor(12000);assert.equal(state.tutorial.step,9,'no automatic purchase');assert.equal(state.cash,cashBefore);
   const clockAfter=await page.locator('[data-guide="clock"]').innerText();assert.notEqual(clockBefore,clockAfter,'match clock keeps running while purchase waits');
   snap.paused=true;sync();await page.clock.runFor(4000);assert.equal(state.tutorial.step,9);snap.paused=false;sync();
   for(let i=9;i<=13;i++){
    await pumpUntil(()=>state.tutorial.step===i,'purchase step still current');
    for(let turn=0;await actor.getAttribute('data-step')!==String(i)&&turn<100;turn++){await page.clock.runFor(400);await new Promise(r=>setTimeout(r,20))}
    assert.equal(await actor.getAttribute('data-step'),String(i));
    for(let turn=0;await actor.getAttribute('data-dialogue')!=='awaiting-action'&&turn<100;turn++)await page.clock.runFor(400);
    assert.equal(await actor.getAttribute('data-dialogue'),'awaiting-action');
    const selector=({cluster:'buy-mac',crew:'buy-crew',supply:'buy-sup',infrastructure:'buy-inf',green:'buy-grn'})[actions[i]];
    const purchaseButton=page.locator(`[data-guide="${selector}"]`);
    for(let turn=0;await purchaseButton.isDisabled()&&turn<100;turn++){await page.clock.runFor(400);await new Promise(r=>setTimeout(r,20))}
    assert.equal(await purchaseButton.isDisabled(),false);
    await purchaseButton.click({force:true});
    await pumpUntil(()=>state.tutorial.step===i+1,'real button purchase must advance');
   }
   for(const [step,tab] of [[14,'enterprise'],[23,'risk'],[24,'events'],[25,'years']]){
    await pumpUntil(()=>state.tutorial.step===step,'enter explanation '+tab);
    for(let turn=0;await actor.getAttribute('data-step')!==String(step)&&turn<100;turn++){await page.clock.runFor(80);await new Promise(r=>setTimeout(r,10))}
    assert.equal(await page.locator('.game-panel').getAttribute('data-active-tab'),tab,'tab is open before the explanation is read');
    assert(await page.locator('.advisor-dialogue > p').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=21));
    await page.screenshot({path:path.join(out,`explain-${tab}-${width}.png`),fullPage:true});
   }
   await pumpUntil(()=>state.tutorial.step===26,'all non-investment tabs progress automatically');
   assert.equal(await page.locator('.game-panel').getAttribute('data-active-tab'),'years');
   const visited=requests.filter(r=>r.path.endsWith('/tutorial')).map(r=>r.body.action);
   for(const action of ['investment','enterprise-ready','risk','events','years'])assert(visited.includes(action),'tab was not opened '+action);
   await page.clock.runFor(15000);assert.equal(state.cycles,0);assert.equal(state.nextYearAt,0);assert.equal(state.tutorial.step,26,'year settlement remains manual');
   await page.locator('[data-guide="year"]').click({force:true});await pumpUntil(()=>state.tutorial.complete,'guide must finish after the real year button');
   assert.equal(state.cycles,1);assert(state.nextYearAt>Date.now()+58000);assert.equal(snap.room.endsAt,deadline);
   await page.clock.runFor(500);assert.equal(await page.locator('.first-year-advisor').count(),0);
   const {COMPANY_EVENTS}=await import('../backend/src/game/company-events.ts');
   const {applyPatch,patchFromEvent}=await import('../backend/src/game/engine.ts');
   for(const e of COMPANY_EVENTS.slice(0,4)){state=applyPatch(state,patchFromEvent(e,e.title,e.body),makeRng(14),Date.now(),e.id,balance);state.eventLog.push({year:state.cycles,eventId:e.id,title:e.title,body:e.body,icon:e.icon,good:e.good,effect:state.effects[0].summary})}
   sync();await page.clock.runFor(500);
   await page.locator('.factory-report-toggle').click({force:true});await page.clock.runFor(400);
   assert.equal(await page.locator('.factory-report [role="tablist"],.factory-report details').count(),0);
   assert.equal(await page.locator('.factory-key-metrics article').count(),2);
   assert(await page.locator('.factory-cash-forecast').isVisible());
   assert(await page.locator('.factory-report').evaluate(el=>el.scrollHeight<=el.clientHeight+1),'no inner statistics scroll');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(out,`compact-statistics-${width}.png`),fullPage:true});
   state.condition=0;sync();await page.clock.runFor(500);
   assert((await page.locator('.factory-key-warning').innerText()).includes('Bảo dưỡng'));
   assert.equal(snap.you.scene.operating,0);assert.equal(snap.you.scene.productionForecast.expected.output,0);
   await page.screenshot({path:path.join(out,`worn-machines-${width}.png`),fullPage:true});
   await page.locator('[data-guide="tab-events"]').click({force:true});await page.clock.runFor(500);
   const icon=page.locator('[data-event-art="company-staff-arrival"] img').first();await icon.scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector('[data-event-art="company-staff-arrival"] img')?.naturalWidth===256);
   assert((await icon.getAttribute('src')).endsWith('.svg'));
   await page.screenshot({path:path.join(out,`company-events-${width}.png`),fullPage:true});
   report.widths.push({width,automatic:true,clockBefore,clockAfter,requests:requests.length,cycles:state.cycles,realPurchases:requests.filter(r=>r.path.endsWith('/invest')).length});report.requests.push({width,requests});
   await context.close();continue;
  }

  if(fallback){await page.locator('.advisor-dialogue').waitFor({state:'visible'});for(let i=0;i<8;i++){await page.mouse.click(width-2,height-2);await page.waitForTimeout(200);assert.equal(state.tutorial.step,i+1,'asset fallback must still let any screen tap skip HUD');}report.widths.push({width,fallback:true});await context.close();continue}
  async function respondUntilAction(){
   for(let turn=0;turn<20;turn++){
    const phase=await actor.getAttribute('data-dialogue');
    if(phase==='awaiting-action')return;
    await page.mouse.click(width-2,height-2);await page.waitForTimeout(100);
   }
   throw new Error('Dialogue did not reach required action');
  }
  await page.waitForFunction(()=>document.querySelector('.first-year-advisor canvas')?.dataset.phase==='arriving');
  await page.waitForFunction(()=>document.querySelector('.first-year-advisor canvas')?.dataset.phase==='talking');
  assert(await page.evaluate(()=>window.__advisorEntranceAlpha<1),'arrival must fade into gameplay');
  const clockBefore=await page.locator('[data-guide="clock"]').innerText();await page.waitForTimeout(2200);const clockAfter=await page.locator('[data-guide="clock"]').innerText();assert.notEqual(clockBefore,clockAfter,'whole match clock must continue');assert.equal(state.tutorial.step,0);assert.equal(state.nextYearAt,0);assert.equal(snap.room.endsAt,deadline);
  assert.equal(await actor.getAttribute('data-plaque-gap'),'-3');
  assert(await page.locator('.advisor-attention-frame').isVisible());assert((await page.locator('.advisor-attention-frame').evaluate(el=>getComputedStyle(el).borderImageSource)).includes('attention-frame.svg'));

  assert(await page.locator('.advisor-dialogue > p').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=18),'dialogue must use enlarged readable text');
  if(width===1440){const pos=await actor.evaluate(el=>({actor:JSON.parse(el.dataset.portrait),bubble:document.querySelector('.advisor-dialogue').getBoundingClientRect().top,events:document.querySelector('.event-overview').getBoundingClientRect().bottom}));assert(pos.actor.top>=pos.events,'portrait belongs below the event panel');assert(pos.bubble<pos.actor.top,'dialogue belongs above/right of portrait')}
  if(width===1440){
   await page.waitForFunction(()=>document.querySelector('.first-year-advisor canvas')?.dataset.pose.endsWith('-talk'));
   const moving=new Set();for(let sample=0;sample<8;sample++){moving.add(await actor.getAttribute('data-frame'));await page.waitForTimeout(140)}assert(moving.size>1,'talking while pointing uses changing mouth frames');
   const alpha=await actor.evaluate(el=>{const r=document.querySelector(el.dataset.focus).getBoundingClientRect(),d=el.width/innerWidth,c=el.getContext('2d');return {outer:c.getImageData(Math.floor((innerWidth-2)*d),Math.floor((innerHeight-2)*d),1,1).data[3],inner:c.getImageData(Math.floor((r.x+r.width/2)*d),Math.floor((r.y+r.height/2)*d),1,1).data[3]}});assert(alpha.outer>alpha.inner+30,'grey shade must exclude the focused subject');
   const chunk=Number(await actor.getAttribute('data-chunk'));await page.waitForFunction(()=>document.querySelector('.first-year-advisor canvas')?.dataset.dialogue==='pause');assert(Number(await actor.getAttribute('data-pause-remaining'))>=2);await page.screenshot({path:path.join(out,'guide-dialogue-1440.png'),fullPage:true});await page.waitForTimeout(800);assert.equal(Number(await actor.getAttribute('data-chunk')),chunk,'post-speech pause must not skip immediately');
   await page.waitForFunction(chunk=>Number(document.querySelector('.first-year-advisor canvas')?.dataset.chunk)===chunk+1,chunk);assert.equal(state.tutorial.step,0,'automatic speech continuation cannot acknowledge gameplay action');
  }
  assert(await page.locator('[data-guide="tab-years"]').isDisabled());assert(await page.locator('[data-guide="year"]').isDisabled());
  await page.screenshot({path:path.join(out,`entrance-hud-${width}.png`),fullPage:true});
  const opened=[],geometry=[];
  assert.equal(await page.locator('.starter-actions').count(),0,'no tutorial-only purchase shortcuts');
  for(let i=0;i<actions.length-1;i++){
   const action=actions[i],info=i<8||action.startsWith('stat-');
   const selector=({cluster:'buy-mac',crew:'buy-crew',supply:'buy-sup',infrastructure:'buy-inf',green:'buy-grn','enterprise-ready':'tab-enterprise',investment:'tab-investment',risk:'tab-risk',events:'tab-events',years:'tab-years'})[action]??action;
   await page.waitForFunction(i=>document.querySelector('.first-year-advisor canvas')?.dataset.step===String(i),i);
   if(selector.startsWith('tab-')){
    const active=await page.locator('.game-panel').getAttribute('data-active-tab');opened.push(active);assert.equal(active,selector.replace('tab-',''),'tab opens before narration');
    if(action==='investment'){await respondUntilAction();await page.locator(`[data-guide="${selector}"]`).click()}
    else for(let turn=0;state.tutorial.step===i&&turn<40;turn++){await page.mouse.click(width-2,height-2);await page.waitForTimeout(120)}
    await page.waitForFunction(i=>document.querySelector('.first-year-advisor canvas')?.dataset.step===String(i+1),i);continue;
   }
   if(!info)await respondUntilAction();
   const target=page.locator(`[data-guide="${selector}"]`);await target.scrollIntoViewIfNeeded();await page.waitForTimeout(140);
   const g=await page.evaluate(selector=>{const a=document.querySelector('.advisor-dialogue').getBoundingClientRect(),b=document.querySelector(`[data-guide="${selector}"]`).getBoundingClientRect();return {scroll:document.documentElement.scrollWidth,width:innerWidth,target:[b.x,b.y,b.width,b.height],dialogue:[a.x,a.y,a.width,a.height],overlap:Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))}},selector);geometry.push({action,...g});assert.equal(g.scroll,width);assert.equal(g.overlap,0,action+' bubble covers target '+width);assert(g.dialogue[1]>=0&&g.dialogue[1]+g.dialogue[3]<=height,action+' bubble outside viewport');
   if(!info){await page.mouse.click(width-2,height-2);await page.waitForTimeout(100);assert.equal(state.tutorial.step,i,'a required tab or purchase cannot be skipped by the dialogue');}
   if(i===2){await page.reload();await page.waitForFunction(()=>document.querySelector('.first-year-advisor canvas')?.dataset.phase==='talking');assert.equal(state.tutorial.step,2)}
   if(i===1){await page.keyboard.press('Enter');await page.getByRole('button',{name:'Thử lại',exact:true}).waitFor();assert.equal(state.tutorial.step,1);await page.getByRole('button',{name:'Thử lại',exact:true}).click()}
   else if(info)await page.mouse.click(width-2,height-2);
   else await target.click();
   await page.waitForFunction(i=>document.querySelector('.first-year-advisor canvas')?.dataset.step===String(i+1),i);
   if(selector.startsWith('tab-')){const active=await page.locator('.game-panel').getAttribute('data-active-tab');opened.push(active);assert.equal(active,selector.replace('tab-',''))}
   if(['cluster','crew','stat-workers','stat-infra','green'].includes(action))await page.screenshot({path:path.join(out,`${action}-${width}.png`),fullPage:true});
   if(action!=='year')assert.equal(state.nextYearAt,0);
  }
  assert.equal(state.cycles,1);assert.equal(state.tutorial.complete,false);assert.equal(state.nextYearAt,0);
  for(let turn=0;turn<15&&await actor.count();turn++){if(await actor.getAttribute('data-dialogue')==='completing')break;await page.mouse.click(width-2,height-2);await page.waitForTimeout(150)}
  await page.locator('.first-year-advisor').waitFor({state:'detached',timeout:20000});assert(state.tutorial.complete);assert(state.nextYearAt>Date.now()+58000);assert.equal(snap.room.endsAt,deadline);
  assert.equal(await page.locator('[data-advisor-highlighted],[data-advisor-pending]').count(),0,'tutorial markers must be cleaned up');
  assert.equal(state.machines,1);assert.equal(state.engineers,eco.crew);assert(state.support>0&&state.infra>0&&state.green>0,'all five real investment cards used');assert(opened.includes('investment')&&opened.includes('enterprise')&&opened.includes('risk')&&opened.includes('events')&&opened.includes('years'));
  await page.screenshot({path:path.join(out,`complete-${width}.png`),fullPage:true});
  if(width===1440){
   const clean=async locator=>assert(!/(máy chủ|xác nhận|cách tính|công thức|hệ số|Doanh thu =|Tiền mặt cuối năm =)/iu.test(await locator.innerText()),'gameplay must only show results and stats');
   await page.locator('.factory-report-toggle').click();assert.equal(await page.locator('.factory-report [role=tablist],.factory-report details').count(),0);await clean(page.locator('.factory-report'));await page.screenshot({path:path.join(out,'statistics-clean-1440.png'),fullPage:true});
   await page.locator('[data-guide="tab-risk"]').click();await clean(page.locator('.game-panel'));
   await page.locator('[data-guide="tab-years"]').click();await page.locator('.year-toggle').first().click();await page.locator('.production-ledger-item summary').click();await clean(page.locator('.game-panel'));await page.screenshot({path:path.join(out,'ledger-clean-1440.png'),fullPage:true});
   await page.locator('[data-guide="tab-investment"]').click();await page.locator('.investment-projection').evaluateAll(nodes=>nodes.forEach(el=>el.open=true));await clean(page.locator('.game-panel'));
  }
  report.widths.push({width,industry,crew:eco.crew,clockBefore,clockAfter,opened,geometry,cash:state.cash,nextYearAt:state.nextYearAt,deadline});report.requests.push({width,requests});
  await context.close();if(video)await video.saveAs(path.join(out,demo?'gameplay-guide-clean.webm':'gameplay-guide-1440.webm'));
 }
 await browser.close();assert.equal(report.errors.length,0);assert.equal(report.missing.length,0);fs.writeFileSync(path.join(out,fallback?'fallback-report.json':'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({widths:report.widths.map(x=>x.width),errors:report.errors,missing:report.missing,checks:automatic?'automatic HUD; manual investment tab and purchases/year; other tabs open before speech; enlarged dialogue; paused guide; global clock; durability/fault forecasts; SVG event art':fallback?'asset-failure fallback: 8 HUD steps skippable by screen tap':demo?'clean gameplay demonstration':'CEO identity, no duplicate company-name entry, actual industry/randomized prices and crew, lower-left guide, own dialogue/spotlight SVGs, readable text, skippable HUD, automatic tab visits, clean stats/ledger, upward point poses, 2.5-second pause, global clock, real purchases, retry, reload, year-2 timer, cleanup'}));
})().catch(async error=>{console.error(error);await browser?.close();process.exitCode=1});
