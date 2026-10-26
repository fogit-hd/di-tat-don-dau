const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const demo=process.env.ADVISOR_DEMO==='1';let browser;
const root=path.resolve(__dirname,'..'),out=path.join(root,'design-preview/mascot-guide-v3/'+(demo?'verification-demo':'verification-production'));fs.mkdirSync(out,{recursive:true});
const actions=['company','cash','assets','year-count','clock','income','rank','sound','investment','enterprise','risk','events','years','investment-return','cluster','crew','enterprise-ready','year','complete'];
(async()=>{
 const {createState,computeValue,invest,runCycle,openYearEffects}=await import('../backend/src/game/engine.ts');
 const {balance}=await import('../backend/prisma/seed/balance.ts');
 const {makeRng}=await import('../backend/src/game/rng.ts');
 const {industryEconomy}=await import('../backend/src/game/industry-economy.ts');
 const {investmentPreviews}=await import('../backend/src/game/investment-preview.ts');
 const {investmentQuote}=await import('../backend/src/game/investment-pricing.ts');
 const {annualBalance,annualEconomy}=await import('../backend/src/game/random-economy.ts');
 const {productionPlan,productionForecast}=await import('../backend/src/game/production.ts');
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
 const report={errors:[],missing:[],widths:[],requests:[]};
 for(const width of (demo?[1440]:[360,390,768,844,1440])){
  const height=width===844?390:width===360?800:width===390?844:width===768?1024:900;
  const context=await browser.newContext({viewport:{width,height},recordVideo:width===1440?{dir:path.join(out,'recording'),size:{width,height}}:undefined});
  await context.addInitScript(()=>localStorage.setItem('player:QA1234','test-player'));
  const industry=width===768?'chip-ban-dan':'trai-cay-say',eco=industryEconomy(industry);
  const lines=[['eng','Tuyển công nhân'],['mac','Mở cụm sản xuất'],['sup','Liên kết nhà cung cấp'],['inf','Mở rộng hạ tầng'],['grn','Công nghệ sạch']].map(([id,label])=>({id,label,hint:label}));
  const theme={id:industry,industryId:industry,industryName:'Doanh nghiệp kiểm thử',factoryName:'Đại Việt · Doanh nghiệp kiểm thử',name:'Xưởng kiểm thử',unit:'sản phẩm',role:'Giám đốc',mission:'',dirs:[],lines,art:'',anchors:null,eventIds:[],regionId:'hn',regionName:'Hà Nội',scaleId:'small',scaleName:'Xưởng nhỏ',contextId:'new',contextName:'Khởi nghiệp',vars:{},coefs:{epl:1000,tech:.1,support:.1,infra:.1,emission:1,baseOutput:10,basePrice:20,opex:30,idleCost:2},start:{cashMul:1,engineers:0,machines:0,pollution:0,dependency:0,condition:1}};
  let state=createState(theme,10000,makeRng(7),balance);state.tutorial={version:1,step:0,complete:false};
  const deadline=Date.now()+600000,sockets=new Set(),requests=[],snap={serverNow:Date.now(),paused:false,frozenNow:null,room:{code:'QA1234',hostName:'Chủ phòng',status:'playing',durationSec:600,startingCapital:10000,cycleSeconds:60,yearMinSeconds:5,step:50,endsAt:deadline,remainingMs:null,countdownEndsAt:null,cycleStartedAt:Date.now(),cycleElapsedMs:0,questionStats:[]},teams:[],leaderboard:[],endings:{},you:{id:'one',teamName:'Đại Việt',rank:1,correct:0,answered:0,finished:false,succession:null,theme,scene:null},role:'player'};
  function sync(){
   const now=Date.now(),ab=annualBalance(state,balance),plan=productionPlan(openYearEffects(state,now+1),theme,ab,now+1);
   snap.serverNow=now;snap.you.scene={...state,industryId:industry,art:'',unit:'sản phẩm',operating:plan.operating,idle:plan.idle,util:plan.util,output:state.lastOutput,value:computeValue(state,theme,balance),trajectory:'build',dirs:[],lines,anchors:null,economyVersion:3,crewRequired:eco.crew,activeEffects:[],yearChanges:[],traits:[],deathChance:0,nextDeathChance:0,successionChance:0,nextSuccessionChance:0,investmentPreviews:investmentPreviews(state,theme,balance,ab,lines,eco.prices,50,now),productionForecast:productionForecast(openYearEffects(state,now+1),theme,ab,now+1),operatingForecast:plan,linePrices:Object.fromEntries(lines.map(l=>[l.id,investmentQuote(state,l.id,eco.prices[l.id],1,now).price])),upgradeEfficiency:annualEconomy(state).upgrade};
   for(const socket of sockets)try{socket.send('42'+JSON.stringify(['snapshot',snap]))}catch{sockets.delete(socket)}
  }
  sync();let failCash=!demo;
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
     assert.equal(actions[state.tutorial.step],body.line==='mac'?'cluster':'crew');
     const quote=investmentQuote(state,body.line,eco.prices[body.line],body.quantity,Date.now());const result=invest(state,body.line,quote.total,balance,lines,eco.prices[body.line],quote.count,annualEconomy(state).upgrade[body.line]);assert(result.ok);state=result.state;state.tutorial.step++;
    }
    if(url.pathname.endsWith('/year')){assert.equal(actions[state.tutorial.step],'year');state=runCycle(state,theme,makeRng(9),Date.now(),annualBalance(state,balance));state.tutorial.step++;state.nextYearAt=0;state.yearLockUntil=0}
    sync();return route.fulfill({json:{ok:true}});
   }
   if(url.pathname==='/config.js')return route.fulfill({contentType:'application/javascript',body:'window.__APP_CONFIG__={};'});
   let file=path.join(root,'frontend/dist',decodeURIComponent(url.pathname));if(!path.extname(file))file=path.join(root,'frontend/dist/index.html');
   if(!fs.existsSync(file)){report.missing.push(url.pathname);return route.fulfill({status:404,body:''})}
   return route.fulfill({contentType:({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
  });
  const page=await context.newPage(),video=page.video();page.on('pageerror',e=>report.errors.push(String(e)));page.setDefaultTimeout(15000);
  await page.addInitScript(()=>{window.__advisorEntranceAlpha=1;new MutationObserver(()=>{const a=document.querySelector('.first-year-advisor canvas');if(a?.dataset.phase==='arriving')window.__advisorEntranceAlpha=Math.min(window.__advisorEntranceAlpha,Number(a.dataset.alpha))}).observe(document,{subtree:true,attributes:true,attributeFilter:['data-alpha']})});
  await page.goto('http://game.test/play/QA1234');await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();
  const actor=page.locator('.first-year-advisor canvas');await actor.waitFor();
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
  if(width===1440){
   const before=await page.locator('.advisor-dialogue > p').first().innerText();await page.waitForTimeout(300);const after=await page.locator('.advisor-dialogue > p').first().innerText();assert(after.length>before.length&&after.length-before.length<15,'slower grapheme reveal');
   await page.waitForFunction(()=>document.querySelector('.first-year-advisor canvas')?.dataset.pose.endsWith('-talk'));
   const moving=new Set();for(let sample=0;sample<8;sample++){moving.add(await actor.getAttribute('data-frame'));await page.waitForTimeout(140)}assert(moving.size>1,'talking while pointing uses changing mouth frames');
   const alpha=await actor.evaluate(el=>{const r=document.querySelector(el.dataset.focus).getBoundingClientRect(),d=el.width/innerWidth,c=el.getContext('2d');return {outer:c.getImageData(Math.floor((innerWidth-2)*d),Math.floor((innerHeight-2)*d),1,1).data[3],inner:c.getImageData(Math.floor((r.x+r.width/2)*d),Math.floor((r.y+r.height/2)*d),1,1).data[3]}});assert(alpha.outer>alpha.inner+30,'grey shade must exclude the focused subject');
   const chunk=Number(await actor.getAttribute('data-chunk'));await page.mouse.click(width-2,height-2);await page.waitForTimeout(100);assert.equal(await actor.getAttribute('data-dialogue'),'pause');assert(Number(await actor.getAttribute('data-pause-remaining'))>=2);await page.waitForTimeout(1100);assert.equal(Number(await actor.getAttribute('data-chunk')),chunk,'post-speech pause must not skip immediately');
   await page.waitForFunction(chunk=>Number(document.querySelector('.first-year-advisor canvas')?.dataset.chunk)===chunk+1,chunk);assert.equal(state.tutorial.step,0,'automatic speech continuation cannot acknowledge gameplay action');
  }
  assert(await page.locator('[data-guide="tab-years"]').isDisabled());assert(await page.locator('[data-guide="year"]').isDisabled());
  await page.screenshot({path:path.join(out,`entrance-hud-${width}.png`),fullPage:true});
  const opened=[],geometry=[];
  for(let i=0;i<18;i++){
   const action=actions[i],selector=action==='cluster'?'starter-cluster':action==='crew'?'starter-crew':action==='enterprise-ready'?'tab-enterprise':action==='investment-return'?'tab-investment':['investment','enterprise','risk','events','years'].includes(action)?'tab-'+action:action;
   await page.waitForFunction(i=>document.querySelector('.first-year-advisor canvas')?.dataset.step===String(i),i);
   if(i===9){assert.equal(await actor.getAttribute('data-focus'),'[data-guide="tab-investment"]','explanation highlights its current subject before requesting another tab')}
   await respondUntilAction();
   const target=page.locator(`[data-guide="${selector}"]`);await target.scrollIntoViewIfNeeded();await page.waitForTimeout(100);
   const g=await page.evaluate(selector=>{const a=document.querySelector('.advisor-dialogue').getBoundingClientRect(),b=document.querySelector(`[data-guide="${selector}"]`).getBoundingClientRect();return {scroll:document.documentElement.scrollWidth,width:innerWidth,target:[b.x,b.y,b.width,b.height],dialogue:[a.x,a.y,a.width,a.height],overlap:Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))}},selector);geometry.push({action,...g});assert.equal(g.scroll,width);assert.equal(g.overlap,0,action+' bubble covers target at '+width);assert(g.dialogue[1]>=0&&g.dialogue[1]+g.dialogue[3]<=height,action+' dialogue outside viewport at '+width);
   if(i===0){await page.waitForTimeout(3200);assert.equal(state.tutorial.step,0,'final sentence must wait for required gameplay action')}
   if(i===2&&!demo){await page.reload();await page.waitForFunction(()=>document.querySelector('.first-year-advisor canvas')?.dataset.phase==='talking');assert.equal(state.tutorial.step,2);await respondUntilAction()}
   if(i===1&&!demo){await target.focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Thử lại',exact:true}).waitFor();assert.equal(state.tutorial.step,1);await page.getByRole('button',{name:'Thử lại',exact:true}).click()}
   else if(i===10){await target.focus();await page.keyboard.press('Enter')}
   else await target.click();
   await page.waitForFunction(i=>document.querySelector('.first-year-advisor canvas')?.dataset.step===String(i+1),i);
   if(selector.startsWith('tab-')){const active=await page.locator('.game-panel').getAttribute('data-active-tab');opened.push(active);assert.equal(active,selector.replace('tab-',''))}
   if(i===10||i===14||i===16)await page.screenshot({path:path.join(out,`${action}-${width}.png`),fullPage:true});
   if(i<17)assert.equal(state.nextYearAt,0);
  }
  assert.equal(state.cycles,1);assert.equal(state.tutorial.complete,false);assert.equal(state.nextYearAt,0);
  for(let turn=0;turn<15&&await actor.count();turn++){if(await actor.getAttribute('data-dialogue')==='completing')break;await page.mouse.click(width-2,height-2);await page.waitForTimeout(150)}
  await page.locator('.first-year-advisor').waitFor({state:'detached',timeout:20000});assert(state.tutorial.complete);assert(state.nextYearAt>Date.now()+58000);assert.equal(snap.room.endsAt,deadline);
  assert.equal(await page.locator('[data-advisor-highlighted],[data-advisor-pending]').count(),0,'tutorial markers must be cleaned up');
  assert.equal(state.machines,1);assert.equal(state.engineers,eco.crew);assert(opened.includes('investment')&&opened.includes('enterprise')&&opened.includes('risk')&&opened.includes('events')&&opened.includes('years'));
  await page.screenshot({path:path.join(out,`complete-${width}.png`),fullPage:true});
  report.widths.push({width,industry,crew:eco.crew,clockBefore,clockAfter,opened,geometry,cash:state.cash,nextYearAt:state.nextYearAt,deadline});report.requests.push({width,requests});
  await context.close();if(video)await video.saveAs(path.join(out,demo?'gameplay-guide-clean.webm':'gameplay-guide-1440.webm'));
 }
 await browser.close();assert.equal(report.errors.length,0);assert.equal(report.missing.length,0);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({widths:report.widths.map(x=>x.width),errors:report.errors,missing:report.missing,checks:demo?'clean gameplay demonstration':'spotlight, pointed speech, slower text, 3-second pause/tap, mandatory HUD/tabs, plaque attachment, global clock, real industry purchases, retry, reload, year-2 timer, cleanup'}));
})().catch(async error=>{console.error(error);await browser?.close();process.exitCode=1});
