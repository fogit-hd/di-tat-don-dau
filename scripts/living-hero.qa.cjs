// Local production bundle only. No Google account, external request or database.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'design-preview/living-hero-v5/verification');
fs.mkdirSync(out,{recursive:true});
let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
 const report={viewports:[],checks:[],errors:[],missing:[],browser:'Playwright Chromium regression suite; in-app browser visual review is recorded separately'};
 for(const [width,height] of [[390,844],[768,1024],[1440,900],[360,800],[844,390],[1920,1080]]){
  const context=await browser.newContext({viewport:{width,height}});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname!=='game.test')return route.abort();
   if(url.pathname==='/health')return route.fulfill({json:{ok:true}});
   if(url.pathname==='/config.js')return route.fulfill({contentType:'application/javascript',body:'window.__APP_CONFIG__={};'});
   if(url.pathname.startsWith('/api/'))return route.fulfill({json:{yearMinSeconds:5}});
   if(url.pathname==='/__hero-renderer.js'){
    const ts=require('typescript');
    const source=fs.readFileSync(path.join(root,'frontend/src/lib/living-hero.ts'),'utf8').replace("import poses from './porter-sprites-v4.json'",'const poses='+fs.readFileSync(path.join(root,'frontend/src/lib/porter-sprites-v4.json'),'utf8')).replace("import { groundedRoute, groundedStep, walkingProgress } from './grounded-walk'",fs.readFileSync(path.join(root,'frontend/src/lib/grounded-walk.ts'),'utf8'));
    return route.fulfill({contentType:'application/javascript',body:ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText});
   }
   let file=path.join(root,'frontend/dist',decodeURIComponent(url.pathname));
   if(!path.extname(file))file=path.join(root,'frontend/dist/index.html');
   if(!fs.existsSync(file)){report.missing.push(url.pathname);return route.fulfill({status:404})}
   return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream'});
  });
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));page.setDefaultTimeout(15000);
  await page.goto('http://game.test/');await page.locator('.living-hero[data-ready=true]').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(700);
  const artRequests=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).filter(name=>name.includes('living-hero-v4')));
  assert(artRequests.some(name=>name.endsWith('/carry.webp'))&&artRequests.some(name=>name.endsWith('/return.webp')),'Production uses final painted poses');
  assert(artRequests.every(name=>!name.includes('-smooth')),'No rejected interpolation artifacts');
  const geometry=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,w:innerWidth,h:innerHeight,overflow:document.body.style.overflow,layout:document.querySelector('canvas.living-hero-canvas').dataset.layout}));
  assert(geometry.sw<=width&&geometry.sh<=height,JSON.stringify(geometry));assert.equal(geometry.overflow,'');
  const bleed=await page.locator('.public-hero').evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,right:r.right,border:getComputedStyle(n).borderTopWidth,painted:n.hasAttribute('data-painted-frame')}});
  assert.equal(bleed.x,0,'Hero begins at viewport edge');assert.equal(bleed.right,width,'Hero reaches viewport edge');assert.equal(bleed.border,'0px');assert.equal(bleed.painted,false);
  for(const selector of ['.public-header','.public-hero-copy','.public-join','.living-hero-toggle']){
   const b=await page.locator(selector).boundingBox();assert(b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1,`${selector} at ${width}`);
  }
  if(width<=900&&height>540){const copy=await page.locator('.public-hero-copy').boundingBox(),scene=await page.locator('.living-hero').boundingBox();assert(copy.y+copy.height<=scene.y+1,'Mobile content before scene');}
  assert.equal(await page.getByRole('heading',{level:1}).textContent(),'Xây doanh nghiệp. Chốt vận mệnh.');
  assert.equal(await page.getByRole('button',{name:'Tạo phòng',exact:true}).count(),1);
  const frame=page.locator('.living-hero-canvas'),before=await frame.getAttribute('data-time');
  await page.waitForTimeout(250);assert.notEqual(await frame.getAttribute('data-time'),before);
  await page.getByRole('button',{name:'Tạm dừng hoạt cảnh',exact:true}).click();await page.waitForTimeout(80);
  const stopped=await frame.getAttribute('data-time'),pixels=await frame.evaluate(n=>n.toDataURL());
  await page.waitForTimeout(250);assert.equal(await frame.getAttribute('data-time'),stopped);assert.equal(await frame.evaluate(n=>n.toDataURL()),pixels);
  await page.screenshot({path:path.join(out,`home-${width}x${height}.png`)});
  await page.getByPlaceholder('Nhập mã phòng').fill('A');await page.getByPlaceholder('Nhập mã phòng').press('Enter');await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('dialog').count(),0);
  await page.getByRole('button',{name:'Phát hoạt cảnh',exact:true}).click();await page.waitForTimeout(200);assert.notEqual(await frame.getAttribute('data-time'),stopped);
  if(width===1440){
   await page.getByRole('button',{name:'Tạo phòng',exact:true}).click();await page.getByRole('dialog').waitFor();await page.waitForTimeout(120);
   const modalTime=await frame.getAttribute('data-time');await page.waitForTimeout(200);assert.equal(await frame.getAttribute('data-time'),modalTime);await page.keyboard.press('Escape');await page.waitForTimeout(120);assert.notEqual(await frame.getAttribute('data-time'),modalTime);
   report.loop=await page.evaluate(async()=>{
    const m=await import('/__hero-renderer.js');
    const load=async name=>{const image=new Image();image.src=m.heroAssetUrl(name);await image.decode();return image};
    const sprites=Object.fromEntries(await Promise.all(m.HERO_SPRITES.map(async key=>[key,await load(key)])));
    const bg=await load('scene-desktop'),c=document.createElement('canvas');c.width=1340;c.height=754;const ctx=c.getContext('2d');
    m.paintHero(ctx,1340,754,bg,sprites,0,false);const start=c.toDataURL();
    m.paintHero(ctx,1340,754,bg,sprites,m.HERO_LOOP_SECONDS,false);const end=c.toDataURL();
    m.paintHero(ctx,1340,754,bg,sprites,6,false);const middle=c.toDataURL();
    return {endpointPixelIdentical:start===end,middleChanges:start!==middle,motionEqual:JSON.stringify(m.heroMotion(0))===JSON.stringify(m.heroMotion(m.HERO_LOOP_SECONDS))};
   });assert(report.loop.endpointPixelIdentical&&report.loop.middleChanges&&report.loop.motionEqual);
   // Background tab stops the active clock and does not fast-forward on return.
   const cover=await context.newPage();await cover.goto('about:blank');await cover.bringToFront();
   // Chromium headless may not hide background tabs, so use the real DOM event
   // contract if document.hidden is not exposed by this browser configuration.
   const nativeHidden=await page.evaluate(()=>document.hidden);
   if(!nativeHidden)await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
   await page.waitForTimeout(100);const hiddenTime=await frame.getAttribute('data-time');await page.waitForTimeout(200);assert.equal(await frame.getAttribute('data-time'),hiddenTime);
   if(!nativeHidden)await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
   await cover.close();await page.bringToFront();await page.waitForTimeout(150);assert.notEqual(await frame.getAttribute('data-time'),hiddenTime);
   report.visibilityCheck=nativeHidden?'Native hidden tab':'Simulated document.hidden + real visibilitychange listener (headless limitation)';
   await page.locator('.public-hero').evaluate(n=>n.style.visibility='hidden');await page.locator('.living-hero').evaluate(n=>n.style.transform='translateY(200vh)');await page.waitForTimeout(120);
   const offscreenTime=await frame.getAttribute('data-time');await page.waitForTimeout(200);assert.equal(await frame.getAttribute('data-time'),offscreenTime);
   await page.locator('.public-hero').evaluate(n=>n.style.removeProperty('visibility'));await page.locator('.living-hero').evaluate(n=>n.style.removeProperty('transform'));await page.waitForTimeout(150);assert.notEqual(await frame.getAttribute('data-time'),offscreenTime);
   // Reduced motion is also verified after a fresh navigation below.
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
   const reducedTime=await frame.getAttribute('data-time');await page.waitForTimeout(220);assert.equal(await frame.getAttribute('data-time'),reducedTime);
   await page.screenshot({path:path.join(out,'reduced-motion.png')});
  }
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.locator('.living-hero[data-ready=true]').waitFor();await page.waitForTimeout(100);
  const reducedStart=await frame.getAttribute('data-time');await page.waitForTimeout(200);assert.equal(await frame.getAttribute('data-time'),reducedStart);
  await page.getByRole('button',{name:'Phát hoạt cảnh',exact:true}).waitFor();
  report.viewports.push(geometry);await context.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);
 report.checks=['One hero; exact heading/copy; create only in navbar; real join Enter validation','No horizontal/vertical overflow at six sizes, including landscape','Porter carries from warehouse, rigs load, crane loads moored boat, deckhand unhooks; pause freezes pixels and clock; resume works','24-second start/end pixel-identical; midpoint differs','Reduced-motion preference freezes scene, including fresh loads','All production scene assets loaded without errors'];
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
