// Production UI, local fixtures only: no account, database or external requests.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createFixture}=require('./session-fixtures.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'design-preview/living-hero-v5/names');
fs.mkdirSync(out,{recursive:true});let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
 const report={viewports:[],errors:[],missing:[]};
 for(const [width,height]of [[390,844],[768,1024],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height}}),fixture=createFixture(),sockets=new Map();
  const names=['CẦN THÁCH ĐẤU','W'.repeat(24),'Nguyễn Hoàng Minh Tuấn Anh','TênCEOviếtliềnrấtdàikhôngcókhoảngtrắng'];
  const template=fixture.teams[0],roster=Array.from({length:50},(_,i)=>({...template,id:`ceo${i}`,teamName:names[i%4]+(i?` ${i}`:''),connected:true}));
  fixture.teams.splice(0,fixture.teams.length,...roster);fixture.you.teamName=roster[0].teamName;
  const snapshot=role=>fixture.snapshot(role);
  const push=()=>{for(const [ws,role]of sockets)ws.send('42'+JSON.stringify(['snapshot',snapshot(role)]))};
  await context.addInitScript(()=>{localStorage.setItem('host:XTV45','qa-host');localStorage.setItem('player:XTV45','qa-player')});
  await context.routeWebSocket('**/socket.io/**',ws=>{ws.send('0'+JSON.stringify({sid:'qa',upgrades:[],pingInterval:25000,pingTimeout:20000,maxPayload:1000000}));ws.onMessage(msg=>{const s=String(msg);if(s.startsWith('40'))ws.send('40{"sid":"qa"}');if(s.startsWith('42')){const [event,payload]=JSON.parse(s.slice(2));if(event==='hello'){sockets.set(ws,payload.role);push()}}});ws.onClose(()=>sockets.delete(ws))});
  await context.route('**/*',route=>{
   const u=new URL(route.request().url());if(u.hostname!=='game.test')return route.abort();
   if(u.pathname==='/health'||u.pathname.startsWith('/api/'))return route.fulfill({json:{ok:true,yearMinSeconds:5}});
   if(u.pathname==='/config.js')return route.fulfill({contentType:'application/javascript',body:'window.__APP_CONFIG__={};'});
   let file=path.join(root,'frontend/dist',decodeURIComponent(u.pathname));if(!path.extname(file))file=path.join(root,'frontend/dist/index.html');
   if(!fs.existsSync(file)){report.missing.push(u.pathname);return route.fulfill({status:404})}
   return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream'});
  });
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));page.setDefaultTimeout(15000);
  const check=async()=>{
   await page.locator('.lobby-ceo-card .ceo-name.single-line').first().waitFor();
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})))});
   const lines=await page.locator('.lobby-ceo-card .ceo-name.single-line').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),s=n.querySelector('svg').getBoundingClientRect(),font=parseFloat(getComputedStyle(n).fontSize),box=n.closest('button').getBoundingClientRect();return {height:parseFloat(getComputedStyle(n).height),line:font*1.34375,left:r.left,right:r.right,svgRight:s.right,boxRight:box.right,title:n.title,name:n.getAttribute('aria-label')}}));
   assert(lines.length>0&&lines.length<=10);for(const l of lines){assert(l.height<=l.line+.1);assert(l.svgRight<=l.right+1,'Measured lettering fits one line');assert(l.right<=l.boxRight+1);assert.equal(l.name,l.title)}
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal scroll');
  };
  for(const role of ['host','play']){
   await page.goto(`http://game.test/${role}/XTV45`);await page.locator('.lobby-ceo-grid').waitFor();await check();
   await page.screenshot({path:path.join(out,`${role}-${width}.png`)});
   await page.getByRole('searchbox',{name:'Tìm CEO',exact:true}).fill('can thach dau');await check();
   const card=page.locator('.lobby-ceo-card').first();await card.click();const tooltip=page.locator('.lobby-name-detail[data-open=true]');await tooltip.waitFor();assert((await tooltip.textContent()).includes(names[0]));
   const b=await tooltip.boundingBox();assert(b.x>=0&&b.x+b.width<=width+1,'Full name reveal remains in viewport');
   await page.screenshot({path:path.join(out,`${role}-full-name-${width}.png`)});
   await page.getByRole('searchbox',{name:'Tìm CEO',exact:true}).fill('W'.repeat(24));await check();
   const ellipsis=require('../frontend/src/shared/ui/public-letter-paths.json').bold['…'][1];
   assert(await page.locator('.lobby-ceo-card .ceo-name.single-line').first().evaluate((node,shape)=>{
    const paths=[...node.querySelectorAll('path')];return paths.some(n=>n.getAttribute('d')===shape)||paths.length===[...node.getAttribute('aria-label')].length;
   },ellipsis),'Name is fully readable when it fits; otherwise ends in a real ellipsis');
  }
  fixture.room.status='playing';await page.goto('http://game.test/host/XTV45');await page.locator('.live-ranking').waitFor();
  assert.equal(await page.locator('.live-person .ceo-name.single-line').count(),10);await page.screenshot({path:path.join(out,`live-${width}.png`)});
  report.viewports.push({width,height,hostAndPlayer:true,fullNameReveal:true,vectorEllipsis:true,liveRanking:true});await context.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
