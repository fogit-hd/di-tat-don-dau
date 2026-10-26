const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
process.chdir(root);
fs.mkdirSync('.tmp', { recursive: true });
const now = Date.now();
const industry = JSON.parse(fs.readFileSync('backend/prisma/seed/industries.seed.json','utf8')).industries.find(i=>i.slug==='trai-cay-say');
const labels = industry.investLabels;
const scene = {industryId:industry.slug, factoryName:'Đại Việt Chế biến trái cây sấy',art:'',unit:'sản phẩm',engineers:4705,machines:5.3,operating:3.4,idle:1.9,util:.64,tech:6.8,support:2,infra:4.9,green:7.9,pollution:0,output:1303,cash:11076,value:35852,trajectory:'build',lastIncome:1338,lastOutput:1303,cycles:22,log:[],dirs:[],lines:[['eng',labels.nhanLuc],['mac',labels.mayMoc],['sup',labels.phuTro],['inf',labels.haTang],['grn','Công nghệ sạch']].map(([id,label])=>({id,label,hint:''})),anchors:null,nextYearAt:now+46000,yearLockUntil:0,finished:false,secondLife:'locked',stateAidEligible:false,succession:null,effects:[],pending:null,introDone:true,eventLog:[{year:22,eventId:'rain',title:'Mất mùa vì mưa',body:'Mưa lớn làm giảm nguồn nguyên liệu và tăng chi phí.',icon:'rain',good:false,effect:'chi phí +13%'}],yearChanges:[{year:22,cashBefore:9738,cashAfter:11076,assetsBefore:32000,assetsAfter:35852,causes:[{kind:'production',label:'Sản xuất',cash:1338}]}],activeEffects:[{eventId:'one',label:'Nguồn đầu vào bị siết',cashPerYear:0,yearsLeft:2,investmentPct:15},{eventId:'two',label:'Nhà cung cấp trong nước vào chuỗi',cashPerYear:0,yearsLeft:2,investmentPct:-12},{eventId:'three',label:'Gói mua sắm xanh được duyệt',cashPerYear:0,yearsLeft:2,investmentPct:-10}],traits:[],deathChance:.025,nextDeathChance:.02625,successionChance:.05,nextSuccessionChance:.0525,successionRiskStartsAt:10};
const snap={serverNow:now,paused:false,frozenNow:null,room:{code:'QA1234',hostName:'QA',status:'playing',durationSec:900,startingCapital:10000,cycleSeconds:60,yearMinSeconds:5,step:1000,endsAt:now+652000,remainingMs:null,countdownEndsAt:null,cycleStartedAt:now,cycleElapsedMs:0,questionStats:[]},endings:{},teams:[],leaderboard:[],you:{id:'one',teamName:'Đại Việt',rank:1,correct:0,answered:0,finished:false,succession:null,theme:{id:'one',industryId:industry.slug,industryName:industry.name,name:'Xưởng trái cây',unit:'sản phẩm',role:industry.role,mission:'',factoryName:scene.factoryName,dirs:[],regionName:'',scaleName:'',contextName:'',art:''},scene},role:'player'};
scene.machines=5;scene.machineProgress=.3;scene.operating=3;scene.idle=2;
scene.upgradeEfficiency={eng:1.10,mac:.97,sup:1.07,inf:.94,grn:1.08};scene.annualConditions={eventChance:.57,familyChance:.05,interestRate:.08};
scene.deathChance=.015;scene.nextDeathChance=.017;scene.successionChance=.03;scene.nextSuccessionChance=.0325;
scene.traits=[{id:'family_fund',label:'Quỹ gia tộc',detail:'Ngăn phá sản khi chuyển giao quyền điều hành.',good:true},{id:'heir_abroad',label:'Con du học về nước',detail:'Tăng cơ hội người thừa kế giúp doanh nghiệp phát triển.',good:true}];
scene.yearChanges=[
 {year:31,cashBefore:4790,cashAfter:6480,assetsBefore:29325,assetsAfter:31970,causes:[{kind:'production',label:'Sản xuất',cash:1690}]},
 {year:30,cashBefore:3220,cashAfter:4790,assetsBefore:26791,assetsAfter:29325,causes:[{kind:'production',label:'Sản xuất',cash:1570}]},
 {year:29,cashBefore:7650,cashAfter:3220,assetsBefore:26855,assetsAfter:26791,causes:[{kind:'production',label:'Sản xuất',cash:1570},...scene.lines.map(line=>({kind:'investment',label:line.label,cash:-1000,packages:1,detail:'1 gói · hiệu quả 100% · giá gốc 1 tỷ · thực chi 1 tỷ'})),{kind:'investment',label:'Công nghệ sạch',cash:-1000,packages:1,detail:'1 gói · hiệu quả 100% · giá gốc 1 tỷ · thực chi 1 tỷ'}]}
];
const defaultFactoryName='Hồng Hà Chế tạo máy công cụ (máy tiện, máy phay CNC)';
scene.factoryName=defaultFactoryName;scene.introDone=false;snap.you.theme.factoryName=defaultFactoryName;
(async()=>{
 const {COMPANY_UPGRADES,companyUpgradePreview,upgradeCompany}=await import('../backend/src/game/company-upgrades.ts');
 const {industryEconomy}=await import('../backend/src/game/industry-economy.ts');
 const {investmentQuote}=await import('../backend/src/game/investment-pricing.ts');
 const {createState,openYearEffects,runCycle,invest,computeValue}=await import('../backend/src/game/engine.ts');
 const {balance}=await import('../backend/prisma/seed/balance.ts');
 const {investmentPreviews}=await import('../backend/src/game/investment-preview.ts');
 const {productionPlan,productionForecast}=await import('../backend/src/game/production.ts');
 const {annualBalance,annualEconomy}=await import('../backend/src/game/random-economy.ts');
 const {makeRng}=await import('../backend/src/game/rng.ts');
 const target=(balance.priceCapitalBase+1400/balance.engPerTy)*balance.priceRevenueShare;
 const modelTheme={...snap.you.theme,lines:scene.lines,coefs:{epl:1400,tech:.12,support:.08,infra:.08,emission:1,baseOutput:10,basePrice:target/10,opex:target*.3,idleCost:34},start:{cashMul:1,engineers:730,machines:.4,pollution:4,dependency:0,condition:1},eventIds:[]};
 let modelSeed=1;while(annualEconomy({seed:modelSeed,cycles:scene.cycles}).upgrade.sup!==1.07)modelSeed++;
 let snapshotModel;let basePrices={eng:1000,mac:1000,sup:1000,inf:1000,grn:1000};let discounted=true;let useV3=false;
 function syncEconomy(){
  const time=Date.now();
  const model={...createState(modelTheme,10000,makeRng(modelSeed),balance),...scene,productionVersion:useV3?3:undefined,seed:modelSeed,
   effects:discounted?[{id:'discount',visual:'none',title:'Ưu đãi',body:'',severity:1,startedAt:0,endsAt:1,outputMul:1,priceMul:1,inflationMul:1,yearsLeft:2,investmentMul:.9}]:[]};
  snapshotModel=model;
  scene.economyVersion=useV3?3:2;
  if(useV3){
    scene.lines=scene.lines.map(line=>({...line,label:line.id==='eng'?'Tuyển công nhân':line.id==='mac'?'Mở cụm sản xuất':line.label}));
    scene.crewRequired=industryEconomy(scene.industryId).crew;scene.crewSize=scene.crewRequired;model.crewSize=scene.crewSize;
    const capacity=productionPlan(model,modelTheme,annualBalance(model,balance),time);
    scene.operating=capacity.operating;scene.idle=capacity.idle;scene.value=computeValue(model,modelTheme,balance);
    scene.companyUpgrades=COMPANY_UPGRADES.map(kind=>companyUpgradePreview(model,modelTheme,annualBalance(model,balance),kind,time));
  }
  scene.upgradeEfficiency=annualEconomy(model).upgrade;
  scene.productionForecast=productionForecast(openYearEffects(model,time+1),modelTheme,annualBalance(model,balance),time+1);
  scene.operatingForecast=productionPlan(openYearEffects(model,time+1),modelTheme,annualBalance(model,balance),time+1);
  scene.investmentPreviews=investmentPreviews(model,modelTheme,balance,annualBalance(model,balance),scene.lines,basePrices,50,time);
  scene.linePrices=Object.fromEntries(scene.lines.map(line=>[line.id,investmentQuote(model,line.id,basePrices[line.id],1,time).price]));
 }
 syncEconomy();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,ignoreDefaultArgs:['--hide-scrollbars']});
 const context=await browser.newContext();
 const page=await context.newPage();await page.setViewportSize({width:360,height:800});let introAttempts=0; page.setDefaultTimeout(10000); const errors=[];const requests=[];const eventImageRequests=[];const sockets=[];
 const capture=async(file)=>{for(let attempt=0;attempt<3;attempt++){try{await page.screenshot({path:file,animations:'disabled'});return;}catch(error){if(attempt===2)throw error;await page.waitForTimeout(250);}}};
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',request=>{if(/assets\/ui\/(static-events-v3|event-scenes-v2|event-loops-v1)/.test(request.url()))eventImageRequests.push(request.url());});
 await page.addInitScript(()=>localStorage.setItem('player:QA1234','qa-token'));
 await page.routeWebSocket('**/socket.io/**',ws=>{
  sockets.push(ws);
  ws.send('0'+JSON.stringify({sid:'qa',upgrades:[],pingInterval:25000,pingTimeout:20000,maxPayload:1000000}));
  ws.onMessage(message=>{const s=String(message);if(s.startsWith('40'))ws.send('40'+JSON.stringify({sid:'qa'}));if(s.startsWith('42')&&s.includes('hello'))ws.send('42'+JSON.stringify(['snapshot',snap]));});
 });
 await page.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.hostname!=='game.test')return route.abort();
   if(url.pathname.startsWith('/api/')){
    if(url.pathname==='/api/setup')return route.fulfill({json:{yearMinSeconds:5,stepDivisor:10,stepRound:100,stepMin:500,lines:[]}});
    const body=route.request().postDataJSON();requests.push({url:url.pathname,body});
    if(url.pathname.endsWith('/company-upgrade')){
      const result=upgradeCompany(snapshotModel,modelTheme,annualBalance(snapshotModel,balance),body.upgrade,Date.now());
      if(!result.ok)return route.fulfill({status:400,json:{error:result.error}});
      Object.assign(scene,{cash:result.state.cash,workerSkill:result.state.workerSkill,machineQuality:result.state.machineQuality,condition:result.state.condition});syncEconomy();
      sockets.forEach(ws=>ws.send('42'+JSON.stringify(['snapshot',snap])));
    }
    if(url.pathname.endsWith('/invest')){
      const quote=investmentQuote(snapshotModel,body.line,basePrices[body.line],body.quantity,Date.now());
      const result=invest(snapshotModel,body.line,quote.total,balance,scene.lines,basePrices[body.line],quote.count,scene.upgradeEfficiency[body.line]);
      if(!result.ok)return route.fulfill({status:400,json:{error:result.error}});
      Object.assign(scene,{cash:result.state.cash,support:result.state.support,machines:result.state.machines,engineers:result.state.engineers,machineProgress:result.state.machineProgress,condition:result.state.condition,green:result.state.green,infra:result.state.infra,investmentCounts:result.state.investmentCounts});syncEconomy();
      sockets.forEach(ws=>ws.send('42'+JSON.stringify(['snapshot',snap])));
    }
    if(url.pathname.endsWith('/intro')){
      introAttempts++;
      if(introAttempts===1)return route.fulfill({status:400,json:{error:'Tên nhà máy không hợp lệ. Vui lòng thử lại.'}});
      if(typeof body?.factoryName!=='string'||body.factoryName.length>256)return route.fulfill({status:400,json:{error:'Tên nhà máy không quá 256 ký tự.'}});
      scene.factoryName=body.factoryName;scene.introDone=true;
      sockets.forEach(ws=>ws.send('42'+JSON.stringify(['snapshot',snap])));
    }
    return route.fulfill({json:{ok:true}});
  }
   let file=path.join(root,'frontend/dist',decodeURIComponent(url.pathname));if(!path.extname(file))file=path.join(root,'frontend/dist/index.html');
   if(!fs.existsSync(file))return route.fulfill({status:404,body:''});
   const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.gif':'image/gif','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
   return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
 });
 await page.goto('http://game.test/play/QA1234');await page.locator('#sIntro').waitFor();
 const update=async()=>{syncEconomy();snap.serverNow=Date.now();sockets.forEach(ws=>ws.send('42'+JSON.stringify(['snapshot',snap])));await page.waitForTimeout(280);};


 const input=page.getByLabel('Nhà máy của bạn tên là:');
 assert(defaultFactoryName.length>40);assert.equal(await input.inputValue(),defaultFactoryName);assert.equal(await input.getAttribute('maxlength'),'256');
 await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Tên nhà máy không hợp lệ'}).waitFor();
 assert.equal(requests.find(r=>r.url.endsWith('/intro')).body.factoryName,defaultFactoryName);
 await capture('.tmp/intro-error-visible.png');
 const edited=defaultFactoryName+' · Đội số 1';
 await input.fill(edited);await update();assert.equal(await input.inputValue(),edited);
 await input.press('Enter');await page.locator('.gameplay').waitFor();
 assert.equal(requests.filter(r=>r.url.endsWith('/intro')).length,2);
 assert.equal(scene.factoryName,edited);
 scene.cash=9100;scene.support=1;scene.linePrices={eng:900,mac:900,sup:900,inf:900,grn:900};await update();
 const upgrade=page.locator('#dirs button').nth(2);assert((await upgrade.innerText()).includes('900 triệu'));assert((await page.locator('.investment-card').nth(2).innerText()).includes('phí đầu vào'));
 await capture('.tmp/intro-success-and-discount.png');
 const sizes=[[390,844],[768,1024],[1440,900]];
 for(const [width,height] of sizes){
   await page.setViewportSize({width,height});scene.cash=10000;scene.support=1;scene.investmentCounts={};scene.yearLockUntil=Date.now()+5000;scene.nextYearAt=Date.now()+60000;await update();
   await page.getByRole('button',{name:'×1',exact:true}).click();
   const timer=await page.locator('.year-btn small').innerText();assert(Number.parseInt(timer)>50,`Must show year timer, not 5-second lock: ${timer}`);
   assert((await page.locator('.hud-value').first().innerText()).includes('10 tỷ'));
   await page.getByRole('button',{name:'×5',exact:true}).click();assert((await upgrade.innerText()).includes('4,68 tỷ'));
   await upgrade.click();await page.waitForFunction(()=>document.querySelector('.hud-value')?.textContent.includes('5,32 tỷ'));
   assert.equal(requests.filter(r=>r.url.endsWith('/invest')).at(-1).body.quantity,5);assert(Math.abs(scene.support-6.35)<1e-8);
   await page.getByRole('button',{name:'Tối đa',exact:true}).click();assert((await upgrade.innerText()).includes('5,13 tỷ'));
   await upgrade.click();await page.waitForFunction(()=>document.querySelector('.hud-value')?.textContent.includes('190 triệu'));
   assert(Math.abs(scene.support-11.7)<1e-8);assert.equal(scene.cash,190);
   await page.getByRole('button',{name:'×1',exact:true}).click();assert(await upgrade.isDisabled());
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Horizontal overflow at ${width}`);
   scene.cash=10000;scene.support=1;scene.investmentCounts={};scene.yearLockUntil=0;scene.factoryName='Đại Việt Chế biến trái cây sấy';await update();
   await page.getByRole('button',{name:'×5',exact:true}).click();
   assert((await page.locator('.investment-card').nth(2).innerText()).includes('107%'));
   assert.equal(await page.locator('.choice-result strong').count(),5);
   const order=await page.evaluate(()=>document.querySelector('#dirs').getBoundingClientRect().top < document.querySelector('.investment-footnote').getBoundingClientRect().top);assert(order,'Receipts must precede footnote on mobile');
   const card=page.locator('.investment-card').nth(1);await card.locator('summary').click();assert((await card.innerText()).includes('công nhân'));await card.locator('summary').click();
   await capture(`.tmp/economy-bulk-${width}.png`);
   await page.getByRole('button',{name:'×1',exact:true}).click();
   await page.locator('.game-panel').evaluate(el=>{el.scrollTop=0});
   await capture(`.tmp/transparency-investment-${width}.png`);
   await page.getByRole('button',{name:'Thông số',exact:true}).click();
   await page.getByRole('tab',{name:'Sản lượng',exact:true}).click();
   assert((await page.locator('.report-output-result').innerText()).includes('Sản lượng tạo ra'));
   await capture(`.tmp/transparency-output-${width}.png`);
   await page.getByRole('tab',{name:'Thu–chi',exact:true}).click();
   assert((await page.locator('.report-output-result').innerText()).includes('Lãi/lỗ'));
   await capture(`.tmp/transparency-finance-${width}.png`);
   await page.getByRole('tab',{name:'Tác động',exact:true}).click();assert.equal(await page.locator('.report-effect').count(),1);
   await page.getByRole('button',{name:'Về ảnh',exact:true}).click();
   const environment=page.locator('.pollution-explainer');await environment.locator('summary').click();
   assert((await environment.innerText()).includes('không phải cấp nâng cấp'));
   assert((await environment.innerText()).includes('tối đa giảm 35%'));
   assert((await environment.innerText()).includes('Giá bán giảm'));
   await capture(`.tmp/pollution-explained-v2-${width}.png`);await environment.locator('summary').click();
   await page.getByRole('tab',{name:'Doanh nghiệp',exact:true}).click();
   assert.equal(await page.locator('.enterprise-stat').count(),6);
   const perk=page.locator('.perk-chip').filter({hasText:'Quỹ gia tộc'});await perk.click();
   if(await perk.getAttribute('aria-pressed')!=='true')await perk.click();
   await page.locator('.perk-detail').filter({hasText:'Ngăn phá sản'}).waitFor();
   assert.equal(await page.locator('.environment-meter').getAttribute('aria-valuenow'),'0');
   assert.equal(await page.locator('.environment-meter > span').evaluate(el=>el.style.width),'0%');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await capture(`.tmp/enterprise-perks-${width}.png`);
   await page.locator('.game-panel').evaluate(el=>{el.scrollTop=0});
   await capture(`.tmp/enterprise-canvas-${width}.png`);
   await page.getByRole('tab',{name:'Thay đổi từng năm',exact:true}).click();
   assert.equal(await page.locator('.year-toggle[aria-expanded="true"]').count(),0);
   await page.getByRole('button',{name:/^Năm 29/}).click();
   assert.equal(await page.locator('.cash-ledger > li').count(),6);
   const green=page.locator('.cash-ledger > li').filter({hasText:'Công nghệ sạch'});
   assert((await green.innerText()).includes('×2'));assert((await green.innerText()).includes('-2 tỷ'));
   assert((await page.locator('.year-card.expanded .year-cash-delta').innerText()).includes('-4,43 tỷ'));
   await green.locator('summary').click();assert.equal(await green.locator('.ledger-entry-details').getAttribute('open'),'');
   await green.locator('summary').click();
   const assetBalances=page.locator('.year-card.expanded .year-balance-footer > details');
   await assetBalances.locator('summary').click();assert((await assetBalances.innerText()).includes('26,855 tỷ'));
   await assetBalances.locator('summary').click();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await capture(`.tmp/year-detail-${width}.png`);
   await page.locator('.game-panel').evaluate(el=>{el.scrollTop=0});
   await capture(`.tmp/year-canvas-${width}.png`);
   await page.getByRole('button',{name:/^Năm 31/}).click();assert.equal(await page.locator('.year-toggle[aria-expanded="true"]').count(),1);
   await page.getByRole('tab',{name:'Đầu tư',exact:true}).click();
 }
 scene.cash=0;scene.yearLockUntil=0;await update();
 await page.locator('.investment-warning').filter({hasText:'hết tiền mặt chưa phải phá sản'}).waitFor();
 assert.equal(await page.locator('.year-btn').isDisabled(),false);
 scene.bankrupt=true;scene.secondLife='available';scene.stateAidEligible=true;scene.nextYearAt=0;await update();
 await page.getByRole('button',{name:'Nhận vốn hỗ trợ để làm lại'}).waitFor();
 await page.getByRole('button',{name:/Chờ tái cơ cấu/}).waitFor();assert.equal(await page.locator('.year-btn').count(),0);
 await capture('.tmp/bankrupt-restructuring-v2.png');
 scene.bankrupt=false;scene.secondLife='locked';scene.stateAidEligible=false;scene.cash=10000;await update();
 const savedChanges=scene.yearChanges;
 const sample={...createState(modelTheme,719.39,makeRng(12),balance),cash:719.39,engineers:2800,machines:2,pollution:4,effects:[{id:'rain-proof',visual:'rain',title:'Mưa lớn',body:'',severity:1,startedAt:0,endsAt:1,outputMul:.9,priceMul:1,inflationMul:1,yearsLeft:2}]};
 const settled=runCycle(sample,modelTheme,makeRng(20),Date.now(),{...balance,outputNoiseMin:1,outputNoiseMax:1,priceNoiseMin:1,priceNoiseMax:1,inflationBase:.01,inflationNoiseMin:1,inflationNoiseMax:1});
 const report={...settled.cycleReport,year:6};
 const finalCash=settled.cash+50-70.03;
 const fullRow={year:6,cashBefore:719.39,cashAfter:finalCash,assetsBefore:10000,assetsAfter:11000,production:report,causes:[{kind:'production',label:'Lãi sản xuất',cash:report.net},{kind:'inflation',label:'Lạm phát',cash:-report.inflation},{kind:'ongoing',label:'Hỗ trợ hằng năm',cash:50},{kind:'event',label:'Cả kíp nghỉ ốm',cash:-70.03}]};
 const incomplete={year:5,cashBefore:719.39,cashAfter:1103.40,assetsBefore:10000,assetsAfter:11000,causes:[{kind:'production',label:'Sản xuất',cash:20.04},{kind:'event',label:'Cả kíp nghỉ ốm',cash:-70.03}]};
 scene.yearChanges=[fullRow,incomplete];await update();
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});await page.getByRole('tab',{name:'Thay đổi từng năm',exact:true}).click();
  await page.getByRole('button',{name:/^Năm 6/}).click();
  await page.locator('.cash-reconciliation.matched').waitFor();
  const productionRow=page.locator('.production-ledger-item');await productionRow.locator('summary').first().click();
  assert((await page.locator('.production-receipt').innerText()).includes('Sản lượng thực tế'));
  await capture(`.tmp/transparency-receipt-${width}.png`);
  await productionRow.locator('summary').first().click();
  await page.getByRole('button',{name:/^Năm 5/}).click();
  assert((await page.locator('.cash-reconciliation.mismatch').innerText()).includes('+434 triệu'));
  await page.locator('.game-panel').evaluate(el=>{el.scrollTop=0});
  await capture(`.tmp/transparency-unexplained-${width}.png`);
  await page.getByRole('tab',{name:'Đầu tư',exact:true}).click();
 }
 scene.yearChanges=savedChanges;await update();
 const eventBefore={year:scene.cycles,eventId:'trai-cay-say-01--port-delay',title:'Ùn tắc cửa khẩu · Cảng và kho bãi ùn tắc',body:'Hàng hóa chờ thông quan. Thiết bị và vật tư đến chậm.',icon:'traffic-cone',good:false,effect:'Giá đầu tư +8%'};
 scene.eventLog.unshift(eventBefore);await update();
 await page.locator('.event-new-badge').first().waitFor();
 await page.locator('.event-overview .event-row').filter({hasText:eventBefore.title}).click();
 await page.locator('.event-detail-dialog[open]').waitFor();
 assert.equal(await page.locator('.event-detail-dialog[open] .event-static').getAttribute('data-event-art'),'trai-cay-say-01');
 await page.waitForFunction(()=>[...document.querySelectorAll('.event-detail-dialog[open] .event-static img')].every(img=>img.naturalWidth===256));
 assert.equal(await page.locator('.event-context-art').count(),0);
 assert((await page.locator('.event-detail-dialog[open] .event-static img').getAttribute('src')).includes('/static-events-v3/port-congestion.webp'));
 for(const [width,height]of sizes){await page.setViewportSize({width,height});await page.waitForTimeout(250);await capture(`.tmp/event-specific-dialog-${width}.png`);}
 await page.locator('.event-detail-dialog[open]').getByRole('button',{name:'Đóng',exact:true}).click();
 assert.equal(await page.locator('.event-overview .event-row').filter({hasText:eventBefore.title}).locator('.event-new-badge').count(),0);
 assert.equal(await page.locator('.year-btn').isDisabled(),false);
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('tab',{name:/^Rủi ro/}).click();await page.getByText('Điều kiện kỳ chốt tới:',{exact:false}).waitFor();
 await page.getByText('Kỳ sau: 1,7% (+0,2%)',{exact:true}).waitFor();
 await page.getByText('Kỳ sau: 3,25% (+0,25%)',{exact:true}).waitFor();
 await capture('.tmp/random-risk-1440.png');
 await page.getByRole('tab',{name:'Đầu tư',exact:true}).click();
 const staticIcon=page.locator('.event-overview .event-static img').first();await staticIcon.waitFor();
 await page.waitForFunction(()=>[...document.querySelectorAll('.event-overview .event-static img')].some(el=>el.naturalWidth===256));
 const stableSrc=await staticIcon.getAttribute('src');assert(stableSrc.endsWith('.webp'));assert(stableSrc.includes('/static-events-v3/'));
 const before=await staticIcon.screenshot();await page.waitForTimeout(350);const after=await staticIcon.screenshot();assert(before.equals(after),'Event artwork is a static painting');
 await staticIcon.evaluate(el=>{window.artNode=el;window.artMutations=0;window.artObserver=new MutationObserver(list=>{window.artMutations+=list.filter(m=>m.attributeName==='src').length});window.artObserver.observe(el,{attributes:true});});
 for(let tick=0;tick<3;tick++)await update();
 assert(await staticIcon.evaluate(el=>window.artNode===el));assert.equal(await page.evaluate(()=>window.artMutations),0);await page.evaluate(()=>window.artObserver.disconnect());
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await staticIcon.getAttribute('src'),stableSrc);
 await page.emulateMedia({reducedMotion:'no-preference'});
 snap.paused=true;snap.frozenNow=Date.now();await update();assert.equal(await staticIcon.getAttribute('src'),stableSrc);
 snap.paused=false;snap.frozenNow=null;await update();
 const savedEvents=scene.eventLog;
 const {EVENT_ICON_KINDS}=await import('../frontend/src/components/icon-kind.ts');
 scene.eventLog=EVENT_ICON_KINDS.map((kind,index)=>({year:scene.cycles,eventId:'static-'+kind,title:'Sự kiện '+kind,body:'Kiểm tra biểu tượng có đúng loại.',icon:kind,good:index%2===0,effect:'Hiệu ứng minh họa'}));await update();
 await page.getByRole('tab',{name:'Lịch sử sự kiện',exact:true}).click();
 assert.equal(await page.locator('.game-panel .event-static').count(),33);
 const lastIcon=page.locator('.game-panel .event-static').last();await lastIcon.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>[...document.querySelectorAll('.game-panel .event-static img')].at(-1)?.naturalWidth===256);
 assert((await lastIcon.locator('img').getAttribute('src')).endsWith('cnc-breakdown.webp'));
 scene.eventLog=savedEvents;await update();await page.getByRole('tab',{name:'Đầu tư',exact:true}).click();
 assert.equal(await page.locator('.event-unread-count').count(),0,'Removed history records must not leave inaccessible unread badges');
 for(const [width,height] of sizes){await page.setViewportSize({width,height});await page.waitForTimeout(250);await capture(`.tmp/event-specific-gameplay-${width}.png`);}
 // Approved canvas: show representative paintings in history, compact rows and manual detail.
 scene.eventLog=[
 {year:12,eventId:'fam-bao-benh',title:'Chủ xưởng bạo bệnh',body:'Chủ xưởng mang bệnh nặng.',icon:'heart',good:false,effect:'Tăng rủi ro · xem chi tiết'},
 {year:12,eventId:'tec-may-hong',title:'Một máy chủ lực hỏng giữa ca',body:'Phải chờ phụ tùng. Các chuyền khác vẫn chạy.',icon:'wrench',good:false,effect:'Sản lượng -10%'},
 {year:11,eventId:'second-life-11',title:'Nhà nước chấp thuận hỗ trợ vốn',body:'Chương trình hỗ trợ vốn khởi động lại.',icon:'home',good:true,effect:'Đã chấp thuận · chưa giải ngân'},
 {year:11,eventId:'nat-mua-lon',title:'Mưa lớn',body:'Mưa lớn ảnh hưởng đến sản xuất.',icon:'rain',good:false,effect:'Sản lượng -10%'},
 {year:10,eventId:'trai-cay-say-04--green-support',title:'Gói mua sắm xanh được duyệt',body:'Giảm giá đầu tư.',icon:'leaf',good:true,effect:'Giá đầu tư -10%'}];
 await update();assert.equal(await page.locator('.event-detail-dialog[open]').count(),0,'Incoming events never open a modal');
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});await page.getByRole('tab',{name:'Lịch sử sự kiện',exact:true}).click();
  await page.locator('.game-panel .event-row').first().scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>[...document.querySelectorAll('.game-panel .event-static img')].slice(0,2).every(img=>img.naturalWidth===256));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal page scroll');
  await capture(`.tmp/static-canvas-history-${width}.png`);
  await page.locator('.game-panel .event-row').first().click();await page.locator('.event-detail-dialog[open]').waitFor();
  await page.waitForFunction(()=>document.querySelector('.event-detail-dialog[open] img')?.naturalWidth===256);
  assert((await page.locator('.event-detail-dialog[open] img').getAttribute('src')).endsWith('/illness.webp'));
  const dialogBox=await page.locator('.event-detail-dialog[open]').boundingBox();assert(dialogBox.x>=0&&dialogBox.y>=0&&dialogBox.x+dialogBox.width<=width);
  await capture(`.tmp/static-canvas-detail-${width}.png`);
  await page.locator('.event-detail-dialog[open]').getByRole('button',{name:'Đóng',exact:true}).click();
 }
 assert(eventImageRequests.length>0);assert(eventImageRequests.every(url=>url.includes('/static-events-v3/')&&url.endsWith('.webp')),'Only static approved artwork requested');
 // New default ladder and construction progress use the same real backend quotation.
 basePrices={eng:50,mac:200,sup:75,inf:100,grn:60};discounted=false;scene.investmentCounts={};scene.cash=10000;
 snap.room.step=50;snap.room.linePrices=basePrices;await update();
 await page.getByRole('tab',{name:'Đầu tư',exact:true}).click();await page.getByRole('button',{name:'×1',exact:true}).click();
 assert((await page.locator('.investment-buy').nth(0).innerText()).includes('50 triệu'));
 assert((await page.locator('.investment-buy').nth(1).innerText()).includes('200 triệu'));
 await page.locator('.investment-buy').nth(0).click();await page.waitForFunction(()=>document.querySelector('.investment-buy')?.textContent.includes('51 triệu'));
 assert.equal(scene.cash,9950);assert(Number.isInteger(scene.engineers));
 for(const [width,height]of sizes){await page.setViewportSize({width,height});await capture(`.tmp/rebalanced-investment-${width}.png`);}
 const heldAt=Date.now();scene.nextYearAt=heldAt+60000;scene.promptYearPausedAt=heldAt;scene.pending={id:'question-held',kind:'question',phase:'open',title:'Câu hỏi',body:'Câu hỏi đang mở; đồng hồ năm phải dừng.',options:[{id:'yes',text:'Đáp án kiểm tra'}],explanation:'',expiresAt:heldAt+50000};await update();
 await page.setViewportSize({width:390,height:844});assert((await page.locator('#mbody').innerText()).includes('Đồng hồ Sang năm đang tạm dừng'));
 assert(await page.locator('.year-btn').isDisabled());const timer=await page.locator('.year-btn small').innerText();await page.waitForTimeout(1200);assert.equal(await page.locator('.year-btn small').innerText(),timer);
 await capture('.tmp/question-year-paused-390.png');await page.getByRole('button',{name:'A. Đáp án kiểm tra',exact:true}).click();assert.equal(requests.findLast(r=>r.url.endsWith('/answer')).body.pendingId,'question-held');
 scene.pending=null;delete scene.promptYearPausedAt;await update();
 // New production model: actual per-industry prices, crew recruitment, quality and maintenance.
 useV3=true;discounted=false;basePrices=industryEconomy(scene.industryId).prices;
 const zero=createState(modelTheme,10000,makeRng(modelSeed),balance);
 Object.assign(scene,{...zero,introDone:true,nextYearAt:Date.now()+60000,factoryName:'Doanh nghiệp trái cây sấy',industryId:industry.slug,unit:'sản phẩm',cash:10000,lines:scene.lines,activeEffects:[],traits:[],eventLog:[]});await update();
 await page.getByRole('tab',{name:'Đầu tư',exact:true}).click();await page.getByRole('button',{name:'×1',exact:true}).click();
 assert((await page.locator('.investment-buy').nth(0).innerText()).includes('40 triệu'));
 assert((await page.locator('.investment-buy').nth(1).innerText()).includes('220 triệu'));
 assert.equal(scene.engineers,0);assert.equal(scene.machines,0);assert.equal(scene.operating,0);
 for(const [width,height]of sizes){await page.setViewportSize({width,height});await capture(`.tmp/company-v3-start-${width}.png`);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.getByRole('button',{name:/Tuyển đủ tổ/}).click();await page.waitForFunction(()=>document.querySelector('.investment-help')?.textContent.includes('Đang vận hành'));
 assert.equal(scene.engineers,5);assert.equal(requests.findLast(r=>r.url.endsWith('/invest')).body.quantity,'crew');
 await page.locator('.investment-buy').nth(1).click();await page.waitForFunction(()=>!document.querySelector('.investment-start-guide'));
 assert.equal(scene.machines,1);assert.equal(scene.operating,1);assert.equal(scene.machineProgress,0);
 for(let i=0;i<2;i++){
  await page.locator('.investment-buy').nth(1).click();await page.getByRole('button',{name:/Tuyển đủ tổ/}).click();
 }
 assert.equal(scene.operating,3);assert.equal(scene.engineers,15);assert.equal(scene.machines,3);
 await page.locator('.company-upgrades-panel[open]').waitFor();
 const beforeSkill=scene.companyUpgrades.find(u=>u.kind==='training');
 await page.locator('.company-upgrades .investment-buy').nth(0).click();await page.waitForTimeout(300);
 assert.equal(scene.workerSkill,1);assert(scene.productionForecast.expected.output>beforeSkill.outputBefore);
 await page.locator('.company-upgrades .investment-buy').nth(1).click();await page.waitForTimeout(300);assert.equal(scene.machineQuality,1);
 scene.condition=.75;await update();await page.locator('.company-upgrades .investment-buy').nth(2).click();await page.waitForTimeout(300);assert.equal(scene.condition,1);
 for(const [width,height]of sizes){await page.setViewportSize({width,height});await page.locator('.company-upgrades-panel').scrollIntoViewIfNeeded();await capture(`.tmp/company-v3-quality-${width}.png`);}
 assert(!/nhàn|1[.,]400/.test(await page.locator('.company-upgrades-panel').innerText()));
 const succession={causeText:'Chuyển giao quyền điều hành',outcome:'squander',outcomeLabel:'Phá gia chi tử',outcomeDetail:'Người thừa kế làm mất 50% tài sản.',multiplier:.5,assetsBefore:100000,assetsAfter:50000,year:22};
 snap.you.finished=true;snap.you.succession=succession;scene.finished=true;scene.succession=succession;scene.value=50000;scene.nextYearAt=0;
 scene.eventLog=[{year:22,eventId:'succession-22',title:'Chuyển giao quyền điều hành',body:succession.outcomeDetail,icon:'heart',good:false,effect:succession.outcomeDetail}];
 await update();await page.getByRole('button',{name:'Kết thúc trò chơi'}).waitFor();
 await page.getByText(succession.outcomeDetail,{exact:false}).first().waitFor();
 await capture('.tmp/succession-random-result.png');
 await page.reload();await page.getByText(succession.outcomeDetail,{exact:false}).first().waitFor();
 const image=page.locator('img').first();assert.equal(await image.getAttribute('draggable'),'false');
 assert.equal(await image.evaluate(el=>el.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true}))),false);
 assert.equal(await image.evaluate(el=>el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}))),false);
 const art=page.locator('svg[data-game-art]').first();if(await art.count())assert.equal(await art.evaluate(el=>el.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true}))),false);
 await page.goto('http://game.test/');await page.locator('.public-brand img').waitFor();
 assert.equal(await page.locator('.public-brand img').getAttribute('draggable'),'false');
 assert.equal(await page.locator('.public-brand img').evaluate(el=>el.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true}))),false);
 assert.equal(await page.locator('.public-brand img').evaluate(el=>el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}))),false);
 assert.equal(await page.getByRole('textbox',{name:'Mã phòng'}).evaluate(el=>el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}))),true);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:true,defaultNameLength:defaultFactoryName.length,maxLength:256,errorVisible:true,enterSubmits:true,invoice:900,bulkAndMax:true,yearCountdownConsistent:true,widths:sizes.map(s=>s[0]),successionLossVisible:'50%',sameAfterReload:true,enterpriseCanvas:true,groupedYearLedger:true,economyV2Receipts:true,pollutionExplainer:true,zeroCashCanProduce:true,bankruptcyStopsTimer:true,companyV3ZeroStart:true,industrySpecificPrices:true,crewRecruitment:true,qualityAndMaintenance:true,staticFallbacks:33,staticOnlyNetwork:true,canvasHistoryAndDetailWidths:sizes.map(s=>s[0]),staticNodeStableAcrossClocks:true,reducedMotionStatic:true,pausedStatic:true,imageDraggingBlocked:true,imageContextMenuBlocked:true,textContextMenuPreserved:true,errors},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

