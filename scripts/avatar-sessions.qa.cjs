const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createFixture}=require('./session-fixtures.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'design-preview/session-flow-v1/'+(process.env.AVATAR_OUTPUT||'verification-approved-sessions'));fs.mkdirSync(out,{recursive:true});
let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
 const report={widths:[],errors:[],missing:[],requests:[]};
 for(const width of (process.env.AVATAR_WIDTHS||'390,768,1440').split(',').map(Number)){
  const context=await browser.newContext({reducedMotion:process.env.AVATAR_REDUCED==='1'?'reduce':'no-preference',viewport:{width,height:width===390?844:width===768?1024:900},recordVideo:width===1440?{dir:path.join(out,'recording'),size:{width:1440,height:900}}:undefined});
  const fixture=createFixture(),sockets=new Map(),requests=[];if(process.env.AVATAR_REDUCED==='1')fixture.teams[1].playerStatus='centennial';let failSave=true,delaySnapshot=false;
  const push=()=>{if(delaySnapshot)return;for(const [ws,role]of sockets)ws.send('42'+JSON.stringify(['snapshot',fixture.snapshot(role)]))};
  await context.routeWebSocket('**/socket.io/**',ws=>{
   ws.send('0'+JSON.stringify({sid:'local',upgrades:[],pingInterval:25000,pingTimeout:20000,maxPayload:1000000}));
   ws.onMessage(m=>{const s=String(m);if(s.startsWith('40'))ws.send('40{"sid":"local"}');if(s.startsWith('42')){const [event,data]=JSON.parse(s.slice(2));if(event==='hello'){sockets.set(ws,data.role);push()}}});ws.onClose(()=>sockets.delete(ws));
  });
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.hostname!=='game.test')return route.abort();
   if(url.pathname==='/health')return route.fulfill({json:{ok:true}});
   if(url.pathname.startsWith('/api/')){
    const req=route.request(),body=req.postData()?req.postDataJSON():null;requests.push({path:url.pathname,body,headers:req.headers()});
    if(url.pathname==='/api/setup')return route.fulfill({json:{yearMinSeconds:5}});
    if(url.pathname.endsWith('/exists'))return route.fulfill({json:{ok:true}});
    if(url.pathname.endsWith('/join')){fixture.you.teamName=body.teamName;fixture.teams[0].teamName=body.teamName;return route.fulfill({json:{playerToken:'qa-player'}})}
    if(url.pathname.endsWith('/avatar')){if(failSave){failSave=false;return route.fulfill({status:503,json:{error:'Không lưu được diện mạo, hãy thử lại.'}})}assert.equal(req.headers()['x-player-token'],'qa-player');fixture.teams[0].avatar={...body};push();return route.fulfill({json:{avatar:body}})}
    if(url.pathname.endsWith('/pause')){fixture.room.status='paused';fixture.room.remainingMs=400000;push()}
    if(url.pathname.endsWith('/resume')){fixture.room.status='playing';fixture.room.endsAt=Date.now()+400000;push()}
    return route.fulfill({json:{ok:true}});
   }
   if(url.pathname==='/config.js')return route.fulfill({contentType:'application/javascript',body:'window.__APP_CONFIG__={};'});
   let file=path.join(root,'frontend/dist',decodeURIComponent(url.pathname));if(!path.extname(file))file=path.join(root,'frontend/dist/index.html');
   if(!fs.existsSync(file)){report.missing.push(url.pathname);return route.fulfill({status:404,body:''})}
   return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});
  });
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));page.setDefaultTimeout(15000);
  const capture=async(name,target=page)=>{await page.locator('.session-screen image').evaluateAll(nodes=>Promise.all(nodes.map(n=>{const i=new Image();i.src=n.getAttribute('href');return i.decode()})));await page.locator('.session-screen img').evaluateAll(nodes=>Promise.all(nodes.map(i=>{i.loading='eager';return i.decode()})));await target.screenshot({path:path.join(out,`${name}-${width}.png`),...(target===page?{fullPage:true}:{})})};
  const noOverflow=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,'no horizontal page overflow');
  await page.goto('http://game.test/?code=XTV45');await page.getByRole('dialog',{name:'Vào phòng chơi',exact:true}).waitFor();
  await page.getByPlaceholder('Nhập tên CEO',{exact:true}).fill(process.env.AVATAR_DEMO?'Minh':'WWWWWWWWWWWWWWWWWWWWWWWW');
  await capture('join');await page.getByRole('button',{name:'Vào sảnh',exact:true}).click();await page.locator('.ceo-lobby').waitFor();
  const actor=page.locator('.avatar-stage .ceo-avatar');await actor.waitFor();
  await actor.evaluate(img=>img.decode());
  const source=await actor.getAttribute('src');
  await page.getByRole('button',{name:'Sơ mi',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.avatar-stage img')?.src.endsWith('/shirt.webp'));
  assert.equal(await actor.getAttribute('src'),source.replace('/suit.webp','/shirt.webp'),'only the chosen outfit changes');
  assert.equal(await actor.evaluate(el=>getComputedStyle(el).animationName),'none','user reverted to the original painted avatar');
  await capture('avatar-picker');await capture('model-detail',page.locator('.avatar-stage'));
  for(const outfit of ['Kỹ sư','Áo khoác','Công xưởng','Nhà sáng lập','Vest CEO'])await page.getByRole('button',{name:outfit,exact:true}).click();
  await page.getByRole('button',{name:'Dáng 4',exact:true}).click();await page.getByRole('button',{name:'Màu da 6',exact:true}).click();await page.getByRole('button',{name:'Kỹ sư',exact:true}).click();
  await page.getByRole('button',{name:'Lưu diện mạo',exact:true}).click();await page.getByRole('alert').waitFor();assert.deepEqual(fixture.teams[0].avatar,{body:'slim-male',skin:'ivory',outfit:'suit'});
  await page.getByRole('button',{name:'Lưu diện mạo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.avatar-save')?.disabled);
  const selected={body:'curvy-female',skin:'deep',outfit:'engineer'};assert.deepEqual(fixture.teams[0].avatar,selected);await noOverflow();await capture('avatar-saved');
  await page.reload();await actor.waitFor();assert((await actor.getAttribute('src')).endsWith('/curvy-female/deep/engineer.webp'));
  if(width<=900){await page.getByRole('tab',{name:'Trong phòng (8)',exact:true}).click();await page.locator('.ceo-lobby-roster').waitFor({state:'visible'});await capture('ceo-roster')}
  delaySnapshot=true;await page.reload();await page.getByRole('heading',{name:'Đang vào phòng…',exact:true}).waitFor();await capture('loading');
  for(const ws of sockets.keys())ws.send('42'+JSON.stringify(['problem',{error:'Chưa kết nối được với phòng.'}]));await page.getByRole('button',{name:'Thử lại',exact:true}).waitFor();await capture('loading-error');
  delaySnapshot=false;await page.getByRole('button',{name:'Thử lại',exact:true}).click();await page.locator('.ceo-lobby').waitFor();
  fixture.room.status='countdown';fixture.room.countdownEndsAt=Date.now()+3000;push();await page.locator('.session-countdown').waitFor();await capture('countdown');
  fixture.room.status='playing';fixture.room.endsAt=Date.now()+880000;push();await page.locator('.assignment-card').waitFor();assert.equal(await page.locator('#sIntro input').count(),0);await capture('assigned-business');await noOverflow();
  await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();assert(requests.find(r=>r.path.endsWith('/intro')&&r.body.factoryName===fixture.theme.factoryName));
  await page.evaluate(()=>localStorage.setItem('host:XTV45','qa-host'));await page.goto('http://game.test/host/XTV45');await page.locator('.session-host-live').waitFor();await noOverflow();
  assert.equal(await page.locator('.podium-slot').count(),0);assert.equal(await page.locator('.live-ranking li').count(),8);assert.equal(await page.locator('.host-watched').count(),0);
  assert(!(await page.locator('.live-ranking').innerText()).includes('Đang cập nhật'));await capture('host-live');
  const first=fixture.teams[0],third=fixture.teams[2];fixture.teams.splice(0,3,third,fixture.teams[1],first);push();
  await page.waitForFunction(()=>document.querySelector('.live-ranking li')?.dataset.ceoId==='ceo2');
  assert(await page.locator('.live-ranking [data-movement=up]').count());assert(await page.locator('.live-ranking [data-movement=down]').count());
  await capture('rank-swap');fixture.teams.splice(0,3,first,fixture.teams[1],third);push();await page.waitForTimeout(600);
  await page.getByRole('button',{name:'Tạm dừng',exact:true}).click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();assert(requests.find(r=>r.path.endsWith('/pause'))&&requests.find(r=>r.path.endsWith('/resume')));
  await page.getByRole('button',{name:'Kết thúc sớm',exact:true}).click();assert(!requests.some(r=>r.path.endsWith('/end')));await page.getByRole('button',{name:'Chốt kết thúc',exact:true}).click();assert(requests.some(r=>r.path.endsWith('/end')));
  fixture.room.status='ended';push();await page.locator('.session-host-results').waitFor();await page.waitForTimeout(350);assert.equal(await page.locator('.place-3').evaluate(n=>Number(getComputedStyle(n).opacity)>0),true);assert.equal(await page.locator('.place-1').evaluate(n=>Number(getComputedStyle(n).opacity)),0);await page.waitForTimeout(1200);assert(await page.locator('.place-2').evaluate(n=>Number(getComputedStyle(n).opacity)>0));assert.equal(await page.locator('.place-1').evaluate(n=>Number(getComputedStyle(n).opacity)),0);await page.waitForTimeout(2700);await capture('host-results');await noOverflow();
  await page.locator('.place-1 button').click();await page.getByRole('tab',{name:'Từng CEO',exact:true,selected:true}).waitFor();assert(await page.locator('.host-ceo-tab .ceo-name.full').count());await capture('host-ceo-detail');
  await page.getByRole('tab',{name:'Câu hỏi',exact:true}).click();await page.locator('.session-question-toggle').first().click();await capture('host-questions');
  await page.goto('http://game.test/play/XTV45');await page.locator('.session-player-results').waitFor();assert((await page.locator('.player-victory-art .ceo-avatar').getAttribute('src')).endsWith('/curvy-female/deep/engineer.webp'));await page.waitForTimeout(650);await capture('player-results');await noOverflow();
  assert.equal(await page.locator('.session-player-results .session-podium,.session-player-results .ranking-list').count(),0);
  await page.getByRole('tab',{name:'Dòng tiền',exact:true}).click();await page.locator('.year-toggle').first().click();await capture('player-cash');assert(await page.locator('.result-ledger .painted-icon').evaluateAll(ns=>ns.every(n=>n.getBoundingClientRect().width<=52)));await page.getByRole('tab',{name:'Sự kiện',exact:true}).click();await page.locator('.result-event-list summary').first().click();await capture('player-events');assert(await page.locator('.result-event-list .event-static').evaluateAll(ns=>ns.every(n=>n.getBoundingClientRect().width<=48)));
  await page.goto('http://game.test/wiki?section=industries');await page.locator('.wiki-layout').waitFor();const search=page.getByRole('searchbox',{name:'Tìm ngành',exact:true});if(await search.count()){await search.fill('trái cây');await capture('wiki-fields');assert((await search.evaluate(n=>getComputedStyle(n).borderImageSource)).includes('/field-paper-'))}await noOverflow();
  await page.goto('http://game.test/host/XTV45');await page.locator('.session-host-results').waitFor();assert.equal(await page.locator('.awards-reveal').count(),0,'same-room results must not replay on re-entry');
  const saved=[...fixture.teams];for(const count of [2,1,0]){fixture.teams.splice(0,fixture.teams.length,...saved.slice(0,count));push();await page.waitForFunction(count=>document.querySelectorAll('.podium-slot').length===count,count);assert.equal(await page.locator('.ranking-list li').count(),0);await noOverflow()}
  report.widths.push(width);report.requests.push({width,requests});await context.close();
 }
 await browser.close();assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({widths:report.widths,errors:report.errors,missing:report.missing,checks:'loading/error/retry, native SVG fields/Wiki, live full-table FLIP up/down, ordered 3-2-1 ceremony without replay, 0/1/2 CEOs, personal-only results, bounded icons, join, approved whole painted avatars and all outfit choices, save failure/retry/reload, customized roster, countdown/context, host live/pause, top3+rank4+, long names, personal results/cash/events'}));
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
