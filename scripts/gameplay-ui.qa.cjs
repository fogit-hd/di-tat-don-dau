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
 for(const [width,height]of[[1600,1000],[1440,900],[1280,720],[1920,1080],[1024,768],[768,1024],[390,844],[360,640],[844,390]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  const metrics=await page.evaluate(()=>{const dock=document.querySelector('.year-dock').getBoundingClientRect();const panel=document.querySelector('.game-panel');const choices=[...document.querySelectorAll('#dirs button')];return {scrollX:document.documentElement.scrollWidth,scrollY:document.documentElement.scrollHeight,dock:{top:dock.top,bottom:dock.bottom},inPanel:!!panel.querySelector('.year-dock'),panelHeight:panel.clientHeight,choicesWithin:choices.at(-1).getBoundingClientRect().bottom <= panel.getBoundingClientRect().bottom};});
  assert(metrics.scrollX<=width,`Horizontal overflow ${width}`);assert(metrics.scrollY<=height,`Page overflow ${width}`);assert(metrics.dock.bottom<=height,`Dock clipped ${width}`);assert(!metrics.inPanel);assert(metrics.panelHeight>35,`No panel space ${width}`);
  if(width>=1100)assert(metrics.choicesWithin,`Desktop choices clipped ${width}`);
  await capture(`.tmp/gameplay-${width}x${height}.png`); results.push({width,height,...metrics});
 }
 await page.setViewportSize({width:1440,height:900});
 await page.locator('.ongoing-card').first().click();await page.getByRole('dialog',{name:'Chi tiết sự kiện đang diễn ra'}).waitFor();await page.keyboard.press('Escape');assert(!(await page.locator('.event-detail-dialog').evaluate(d=>d.open)));
 await page.getByRole('tab',{name:'Doanh nghiệp',exact:true}).click();assert(await page.locator('#stats .stat').count()===6);
 await capture('.tmp/gameplay-enterprise.png');
 await page.getByRole('tab',{name:'Rủi ro'}).click();await page.getByText('Tử vong · kỳ chốt tới').waitFor();
 await capture('.tmp/gameplay-risk.png');
 await page.getByRole('tab',{name:'Lịch sử sự kiện',exact:true}).click();await page.getByText('Mất mùa vì mưa').last().waitFor();
 await page.keyboard.press('ArrowRight');assert(await page.getByRole('tab',{name:'Thay đổi từng năm'}).getAttribute('aria-selected')==='true');
 await page.getByRole('tab',{name:'Đầu tư',exact:true}).click();await page.locator('#dirs button').first().click();assert(requests.some(r=>r.url.endsWith('/invest')&&r.body.line==='eng'));
 await page.locator('.year-btn').click();assert(requests.some(r=>r.url.endsWith('/year')));
 scene.yearLockUntil=Date.now()+10000;await update();assert(await page.locator('.year-btn').isDisabled());assert((await page.locator('.year-btn').innerText()).includes('Đang diễn'));
 scene.yearLockUntil=0;snap.paused=true;snap.frozenNow=Date.now();await update();assert(await page.locator('.year-btn').isDisabled());assert(await page.locator('#dirs button:disabled').count()===5);
 snap.paused=false;scene.cash=0;scene.secondLife='available';scene.stateAidEligible=true;await update();await page.getByRole('button',{name:'Nhận vốn hỗ trợ để làm lại'}).click();assert(requests.some(r=>r.url.endsWith('/restart')));assert(await page.locator('.year-btn').isDisabled());
 snap.you.finished=true;scene.finished=true;await update();await page.getByRole('button',{name:'Kết thúc trò chơi'}).click();await page.getByRole('dialog',{name:'Kết quả lượt chơi'}).waitFor();await page.getByRole('button',{name:'Xem lại sự kiện'}).click();
 snap.you.finished=false;scene.finished=false;scene.cash=11076;
 for(const count of[0,1,4,8]){scene.activeEffects=Array.from({length:count},(_,i)=>({eventId:`effect-${i}`,label:`Sự kiện ${i+1}`,yearsLeft:2,cashPerYear:i%2?-100:100}));await update();assert(await page.locator('.ongoing-card').count()===count);}
 scene.effects=[{id:'timed',title:'Sản lượng tạm giảm',body:'Sản lượng giảm 10% trong thời gian có hiệu lực.',visual:'rain',startedAt:Date.now(),endsAt:Date.now()+60000}];await update();assert.equal(await page.locator('.ongoing-card').count(),9);
 scene.effects[0].title='Sự kiện 1';await update();assert.equal(await page.locator('.ongoing-card').count(),8);scene.effects=[];
 scene.factoryName='Công ty cổ phần tập đoàn chế biến xuất nhập khẩu trái cây sấy công nghệ cao Việt Nam '.repeat(5);snap.you.teamName='Tên đội siêu dài '.repeat(20);scene.cash=999999999999;scene.value=888888888888;await update();
 for(const [width,height]of[[1440,900],[390,844],[360,640]]){await page.setViewportSize({width,height});await page.waitForTimeout(100);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await capture(`.tmp/gameplay-long-${width}.png`);}
 await page.locator('.company-name summary').click();assert(await page.locator('.company-full').isVisible());
 await page.locator('.company-name summary').click();
 const industries=JSON.parse(fs.readFileSync('backend/prisma/seed/industries.seed.json','utf8')).industries;
 assert.equal(industries.length,64);
 scene.cash=11076;scene.value=35852;scene.activeEffects=[];
 for(const item of industries){
  scene.industryId=item.slug;scene.factoryName=item.name;
  scene.lines=[['eng',item.investLabels.nhanLuc],['mac',item.investLabels.mayMoc],['sup',item.investLabels.phuTro],['inf',item.investLabels.haTang],['grn','Công nghệ sạch']].map(([id,label])=>({id,label,hint:''}));
  await update();assert.equal(await page.locator('#dirs button').count(),5);assert((await page.locator('#dirs').innerText()).includes(item.investLabels.nhanLuc));
  assert(fs.existsSync(`frontend/public/assets/industries/${item.slug}/factory-1.webp`));
  {
    await page.waitForFunction(()=>{const images=[...document.querySelectorAll('#dirs .choice-art')];return images.length===5&&images.every(image=>image.complete&&image.naturalWidth>0);});
    await page.locator('.choice-art').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
    assert.equal(await page.locator('.choice-art').count(),5,`Expected five decoded upgrade images for ${item.slug}`);
    for(const line of ['eng','mac','sup','inf'])assert(fs.existsSync(`frontend/public/assets/investments/handdrawn-v1/${item.slug}/${line}.webp`));
  }
 }
 assert.equal(errors.length,0,errors.join('\n'));
 fs.writeFileSync('.tmp/gameplay-qa-results.json',JSON.stringify({results,requests,industriesChecked:64,errors,passed:true},null,2));
 console.log(JSON.stringify({results,requests,industriesChecked:64,errors,passed:true},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
