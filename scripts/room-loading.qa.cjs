// Connection-screen regression against the production bundle with local socket fixtures.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'design-preview/session-review-v2/verification-room-loading');
fs.mkdirSync(out,{recursive:true});let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
 const report={screens:[],errors:[],missing:[]};
 for(const [width,height] of [[320,740],[390,844],[768,1024],[1440,900],[844,390]]){
  const context=await browser.newContext({viewport:{width,height}}),sockets=new Set();
  await context.addInitScript(()=>{localStorage.setItem('player:X3QG5','qa-player');localStorage.setItem('host:X3QG5','qa-host')});
  await context.routeWebSocket('**/socket.io/**',ws=>{
   ws.send('0'+JSON.stringify({sid:'local',upgrades:[],pingInterval:25000,pingTimeout:20000,maxPayload:1000000}));
   ws.onMessage(m=>{const s=String(m);if(s.startsWith('40'))ws.send('40{"sid":"local"}');if(s.startsWith('42')&&s.includes('hello'))sockets.add(ws)});
   ws.onClose(()=>sockets.delete(ws));
  });
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.hostname!=='game.test')return route.abort();
   if(url.pathname.startsWith('/api/')||url.pathname==='/health')return route.fulfill({json:{ok:true,yearMinSeconds:5}});
   if(url.pathname==='/config.js')return route.fulfill({contentType:'application/javascript',body:'window.__APP_CONFIG__={};'});
   let file=path.join(root,'frontend/dist',decodeURIComponent(url.pathname));if(!path.extname(file))file=path.join(root,'frontend/dist/index.html');
   if(!fs.existsSync(file)){report.missing.push(url.pathname);return route.fulfill({status:404})}
   return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream'});
  });
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));
  const check=async state=>{
   const card=page.locator('.room-loading-card');await card.waitFor();await page.evaluate(()=>document.fonts.ready);
   const geometry=await page.evaluate(()=>{const card=document.querySelector('.room-loading-card'),screen=document.querySelector('.session-loading'),b=card.getBoundingClientRect(),s=screen.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,overflow:screen.scrollWidth>screen.clientWidth,screenW:s.width,font:getComputedStyle(screen).fontFamily}});
   assert(!geometry.overflow);assert(Math.abs(geometry.x+geometry.w/2-width/2)<2,'Card must be centered');assert(geometry.w<=(height<600&&width>=640?660:520));
   assert(geometry.font.includes('Public UI'));assert(geometry.y>=0);
   assert(geometry.y+geometry.h<=height,'Card must fit the viewport');
   const buttons=page.locator('.room-loading-card .session-form-actions>.session-button');
   if(await buttons.count()){
    const a=await buttons.nth(0).boundingBox(),b=await buttons.nth(1).boundingBox();assert(a.height>=44&&b.height>=44);assert.equal(a.height,b.height);assert(Math.abs(a.width-b.width)<1);
    if(width>=360){assert.equal(a.y,b.y,'Actions stay in one aligned row');assert(a.x+a.width<=b.x)}
    await buttons.first().focus();assert.notEqual(await buttons.first().evaluate(el=>getComputedStyle(el).outlineStyle),'none');await buttons.first().blur();
   }
   await page.screenshot({path:path.join(out,`${width}x${height}-${state}.png`)});report.screens.push({width,height,state,...geometry});
  };
  await page.goto('http://game.test/play/X3QG5');await page.getByRole('heading',{name:'Đang vào phòng…',exact:true}).waitFor();await check('loading');
  // Wait for the real socket hello, then deliver the same missing-room error as production.
  for(let i=0;!sockets.size&&i<100;i++)await new Promise(r=>setTimeout(r,20));assert(sockets.size);
  for(const ws of sockets)ws.send('42'+JSON.stringify(['problem',{error:'Không thấy phòng'}]));
  await page.getByRole('heading',{name:'Chưa kết nối được với phòng.',exact:true}).waitFor();await check('missing-room');
  await page.getByRole('button',{name:'Thử lại',exact:true}).click();await page.getByRole('heading',{name:'Đang vào phòng…',exact:true}).waitFor();
  for(let i=0;!sockets.size&&i<100;i++)await new Promise(r=>setTimeout(r,20));
  for(const ws of sockets)ws.send('42'+JSON.stringify(['problem',{error:'Kết nối bị gián đoạn. Vui lòng thử lại sau ít phút để tiếp tục vào phòng.'}]));
  await page.getByRole('heading',{name:'Chưa kết nối được với phòng.',exact:true}).waitFor();await check('long-error');
  await page.getByRole('link',{name:'Về trang chủ',exact:true}).click();await page.waitForURL('http://game.test/');
  await page.goto('http://game.test/host/X3QG5');await page.getByRole('heading',{name:'Đang mở phòng…',exact:true}).waitFor();await check('host-loading');
  await context.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({screens:report.screens.length,widths:[320,390,768,1440,844],checks:'Vietnamese lettering, centered bounded card, long error wrapping, equal/tappable actions, keyboard focus, reload retry, home link, player/host loading, no horizontal overflow',errors:report.errors}));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close()});
