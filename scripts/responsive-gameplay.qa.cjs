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
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,ignoreDefaultArgs:['--hide-scrollbars']});
 const context=await browser.newContext();
 const page=await context.newPage(); page.setDefaultTimeout(10000); const errors=[];const requests=[]; const sockets=[];
 const capture=async(file)=>{for(let attempt=0;attempt<3;attempt++){try{await page.screenshot({path:file,animations:'disabled'});return;}catch(error){if(attempt===2)throw error;await page.waitForTimeout(250);}}};
 page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>localStorage.setItem('player:QA1234','qa-token'));
 await page.routeWebSocket('**/socket.io/**',ws=>{
  sockets.push(ws);
  ws.send('0'+JSON.stringify({sid:'qa',upgrades:[],pingInterval:25000,pingTimeout:20000,maxPayload:1000000}));
  ws.onMessage(message=>{const s=String(message);if(s.startsWith('40'))ws.send('40'+JSON.stringify({sid:'qa'}));if(s.startsWith('42')&&s.includes('hello'))ws.send('42'+JSON.stringify(['snapshot',snap]));});
 });
 await page.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.hostname!=='game.test')return route.abort();
   if(url.pathname.startsWith('/api/')){requests.push({url:url.pathname,body:route.request().postDataJSON()});return route.fulfill({json:{ok:true}});}
   let file=path.join(root,'frontend/dist',decodeURIComponent(url.pathname));if(!path.extname(file))file=path.join(root,'frontend/dist/index.html');
   if(!fs.existsSync(file))return route.fulfill({status:404,body:''});
   const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
   return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
 });
 await page.goto('http://game.test/play/QA1234');await page.locator('.gameplay').waitFor();
 const update=async()=>{snap.serverNow=Date.now();sockets.forEach(ws=>ws.send('42'+JSON.stringify(['snapshot',snap])));await page.waitForTimeout(100);};

 const results=[];
 const frames=await page.evaluate(async()=>Promise.all(['panel','inset','control'].map(async name=>{const img=new Image();img.src='/assets/ui/painted-frames-v1/'+name+'.svg';await img.decode();return {name,width:img.naturalWidth,height:img.naturalHeight};})));
 assert(frames.every(frame=>frame.width===768&&frame.height===768));
 for(const [width,height] of [[320,568],[360,640],[390,844],[412,915],[540,720],[720,540],[768,1024],[820,1180],[1024,768],[1180,820],[844,390],[1440,900],[1600,1000]]) {
  await page.setViewportSize({width,height});await page.waitForTimeout(180);
  const metrics=await page.evaluate(()=>{
   const panel=document.querySelector('.game-panel'),dock=document.querySelector('.year-dock').getBoundingClientRect();
   const tabs=[...document.querySelectorAll('.game-tablist button')].map(button=>{const r=button.getBoundingClientRect(),s=getComputedStyle(button);return {label:button.firstChild.textContent,x:r.x,right:r.right,y:r.y,height:r.height,wrap:s.whiteSpace,clipped:button.scrollWidth>button.clientWidth+1};});
   const scrollers=[...document.querySelectorAll('.gameplay *')].filter(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return r.width>0&&r.height>0&&['auto','scroll'].includes(s.overflowY)&&el.scrollHeight>el.clientHeight+2;}).map(el=>el.className);
   return {scrollX:document.documentElement.scrollWidth,scrollY:document.documentElement.scrollHeight,dock:{top:dock.top,bottom:dock.bottom},panelHeight:panel.clientHeight,tabs,scrollers};
  });
  assert(metrics.scrollX<=width,'Horizontal overflow '+width);assert(metrics.scrollY<=height,'Page overflow '+width);
  assert(metrics.dock.bottom<=height,'Clipped dock '+width);assert(metrics.panelHeight>=45,'No panel space '+width);
  assert.equal(metrics.tabs.length,5);
  for(const tab of metrics.tabs){assert(tab.x>=0&&tab.right<=width,'Tab outside screen '+tab.label+' '+width);assert.equal(tab.wrap,'nowrap');assert(!tab.clipped,'Tab text clipped '+tab.label+' '+width);}
  assert(metrics.scrollers.every(name=>name==='game-panel'),'Nested scrollers '+width+' '+metrics.scrollers);
  assert.equal(await page.locator('#dirs button').count(),5);
  const painted=await page.evaluate(()=>['.top','.game-tabs','.event-overview','.year-dock','.game-panel','.choice.btn','.game-tablist button.on','.year-btn'].map(selector=>{const s=getComputedStyle(document.querySelector(selector));return {selector,source:s.borderImageSource,shadow:s.boxShadow};}));
  for(const item of painted){assert(item.source.includes('/assets/ui/painted-frames-v1/'), 'Missing painted frame '+item.selector+' '+width);assert.equal(item.shadow,'none');}
  const perimeter=await page.locator('.year-perimeter').boundingBox();assert(perimeter&&perimeter.width>=width-45);
  await capture('.tmp/responsive-'+width+'x'+height+'.png');results.push({width,height,...metrics,painted});
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('.event-overview .event-row').first().click();
 const summaryDialog=page.getByRole('dialog',{name:'Chi tiết sự kiện',exact:true});await summaryDialog.waitFor();
 assert.equal(await summaryDialog.locator('h2').evaluate(el=>getComputedStyle(el).color),'rgb(84, 32, 24)');
 assert.equal(await summaryDialog.locator('h2').evaluate(el=>getComputedStyle(el).backgroundImage),'none');
 await summaryDialog.getByRole('button',{name:'Đóng',exact:true}).click();
 await page.locator('#dirs button').first().click();assert(requests.some(r=>r.url.endsWith('/invest')&&r.body.line==='eng'));
 await page.locator('.year-btn').click();assert(requests.some(r=>r.url.endsWith('/year')));
 scene.yearLockUntil=Date.now()+10000;await update();assert(await page.locator('.year-btn').isDisabled());
 scene.yearLockUntil=0;snap.paused=true;snap.frozenNow=Date.now();await update();
 assert(await page.locator('.year-btn').isDisabled());
 const offset=await page.locator('.year-perimeter-progress').getAttribute('stroke-dashoffset');await page.waitForTimeout(300);assert.equal(await page.locator('.year-perimeter-progress').getAttribute('stroke-dashoffset'),offset);
 snap.paused=false;await update();
 await page.getByRole('tab',{name:'Doanh nghiệp',exact:true}).click();assert.equal(await page.locator('#stats .stat').count(),6);
 await page.getByRole('tab',{name:/^Rủi ro/}).click();await page.getByText('Tử vong · kỳ chốt tới').waitFor();
 await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('tab',{name:'Lịch sử sự kiện',exact:true}).getAttribute('aria-selected'),'true');
 // Bounded preview; all entries remain accessible in the ONE workspace scroller.
 scene.effects=[];
 for(const count of [0,1,7,20]){
  scene.activeEffects=Array.from({length:count},(_,i)=>({eventId:'effect-'+i,label:'Sự kiện '+(i+1),yearsLeft:2,cashPerYear:i%2?-100:100,investmentPct:i%2?15:-10}));
  scene.eventLog=Array.from({length:3},(_,i)=>({year:22,eventId:'year-'+i,title:'Sự kiện năm nay '+(i+1),body:'Nội dung có đầy đủ dấu tiếng Việt. '.repeat(6),icon:'rain',good:i%2===0,effect:'Chi phí +8%'}));
  await update();
  await page.getByRole('button',{name:'Còn hiệu lực '+count,exact:true}).click();
  assert(await page.locator('.event-overview .event-row:visible').count()<=3);
  await page.getByRole('button',{name:'Xem tất cả ('+(count+3)+')',exact:true}).click();
  assert.equal(await page.getByRole('tab',{name:'Lịch sử sự kiện',exact:true}).getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('.game-panel .event-row').count(),count);
  assert.equal(await page.locator('dialog[open]').count(),0);
 }
 for(const [width,height] of [[390,844],[768,1024],[720,540]]) {
  await page.setViewportSize({width,height});await page.waitForTimeout(100);await capture('.tmp/responsive-events-'+width+'.png');
 }
 for(const [width,height] of [[320,568],[360,640],[390,844],[540,720],[720,540],[768,1024],[844,390],[1024,768]]) {
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  const bounds=await page.evaluate(()=>({summary:document.querySelector('.event-overview').getBoundingClientRect().bottom,dock:document.querySelector('.year-dock').getBoundingClientRect().top,panel:document.querySelector('.game-panel').clientHeight}));
  assert(bounds.summary<=bounds.dock,'Many events overlap dock '+width);assert(bounds.panel>=45,'Many events hide workspace '+width);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.locator('.game-panel .event-row').first().click();
 const dialog=page.getByRole('dialog',{name:'Chi tiết sự kiện',exact:true});await dialog.waitFor();
 assert.equal(await dialog.locator('h2').evaluate(el=>getComputedStyle(el).backgroundImage),'none');
 scene.activeEffects[0].yearsLeft=1;await update();assert((await dialog.innerText()).includes('Còn 1 năm'));
 await page.keyboard.press('Escape');
 // The settlement metadata still controls pending/active economic labels, even after animation expiry.
 scene.activeEffects=[];
 scene.effects=[{id:'annual',eventId:'revenue-cut',title:'Doanh thu giảm',body:'Doanh thu giảm trong hai kỳ sản xuất.',visual:'market_crash',startedAt:Date.now()-400000,endsAt:Date.now()-1000,yearsLeft:2,deferred:true,economic:true,good:false,summary:'doanh thu -11%'}];
 await update();
 const annual=page.locator('.game-panel .event-row').filter({hasText:'Doanh thu giảm'});
 assert((await annual.innerText()).includes('Áp dụng từ năm kế tiếp · kéo dài 2 năm'));
 assert(!(await page.locator('.event-overview').innerText()).includes('giây'));
 await annual.click();await dialog.waitFor();
 scene.effects[0].deferred=false;await update();assert((await dialog.innerText()).includes('Còn 2 năm'));
 scene.effects[0].yearsLeft=1;await update();assert((await dialog.innerText()).includes('Còn 1 năm'));
 scene.effects=[];await update();assert.equal(await page.locator('dialog[open]').count(),0);
 // New traits are inline and cannot capture the year button.
 await page.locator('.year-btn').focus();
 scene.traits=[{id:'illness',label:'Bạo bệnh',detail:'Legacy detail',acquiredYear:22,good:false},{id:'longevity',label:'Trường thọ',detail:'Legacy detail',acquiredYear:21,good:true}];
 await update();assert.equal(await page.locator('dialog[open]').count(),0);assert(await page.locator('.year-btn').evaluate(el=>el===document.activeElement));
 assert.equal(await page.locator('.trait-status-item').count(),2);
 // Long labels and money do not break the app shell or hide the year action.
 scene.factoryName='Công ty cổ phần tập đoàn xuất nhập khẩu nguyên liệu và sản phẩm giấy '.repeat(6);
 scene.cash=999999999999;scene.value=888888888888;
 await update();
 for(const [width,height] of [[320,568],[390,844],[768,1024]]) {
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const dock=await page.locator('.year-dock').boundingBox();assert(dock&&dock.y+dock.height<=height);
 }
 await page.locator('.company-name summary').click();await page.locator('.company-full').waitFor();await page.locator('.company-name summary').click();
 scene.factoryName='Thăng Long Sản xuất giấy và bao bì';scene.cash=1779;scene.value=10635;
 snap.you.finished=true;scene.finished=true;
 snap.you.succession={causeText:'Tai nạn tại hiện trường',outcomeLabel:'Phá gia chi tử',outcomeDetail:'Lượt chơi của đội đã được chốt.'};
 await update();
 await page.setViewportSize({width:390,height:844});await page.locator('.inline-result').waitFor();
 assert.equal(await page.getByRole('tab',{name:'Lịch sử sự kiện',exact:true}).getAttribute('aria-selected'),'true');
 await capture('.tmp/responsive-finished-390.png');
 await page.getByRole('button',{name:'Kết thúc trò chơi'}).click();await page.getByRole('dialog',{name:'Kết quả lượt chơi'}).waitFor();await page.getByRole('button',{name:'Xem lại sự kiện'}).click();
 snap.you.finished=false;scene.finished=false;scene.cash=0;scene.secondLife='available';scene.stateAidEligible=true;
 await update();await page.getByRole('button',{name:'Nhận vốn hỗ trợ để làm lại'}).click();assert(requests.some(r=>r.url.endsWith('/restart')));
 // Verify all local illustration mappings still load for every industry.
 scene.cash=11076;scene.value=35852;scene.secondLife='locked';scene.traits=[];scene.activeEffects=[];await update();
 const industries=JSON.parse(fs.readFileSync('backend/prisma/seed/industries.seed.json','utf8')).industries;
 for(const item of industries) {
  scene.industryId=item.slug;scene.factoryName=item.name;
  scene.lines=[['eng',item.investLabels.nhanLuc],['mac',item.investLabels.mayMoc],['sup',item.investLabels.phuTro],['inf',item.investLabels.haTang],['grn','Công nghệ sạch']].map(([id,label])=>({id,label,hint:''}));
  await update();
  await page.waitForFunction(()=>{const images=[...document.querySelectorAll('#dirs .choice-art')];return images.length===5&&images.every(image=>image.complete&&image.naturalWidth>0);});
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync('.tmp/responsive-qa-results.json',JSON.stringify({passed:true,frames,results,requests,industries:industries.length,errors},null,2));
 console.log(JSON.stringify({passed:true,viewports:results.length,industries:industries.length,errors},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

