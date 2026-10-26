const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname,out=path.join(root,'verification-direction');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const directions=['point','point-right','point-down-right','point-up-left','point-left','point-down-left'];
async function serve(context){await context.route('**/*',route=>{
 const u=new URL(route.request().url());if(u.hostname!=='mascot.test')return route.abort();
 const file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
 return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
});}
const debug=p=>p.evaluate(()=>window.mascotPreview.debug());
const motion=(p,name)=>p.evaluate(name=>document.querySelector('[data-motion="'+name+'"]').click(),name);
async function ready(p){await p.goto('http://mascot.test/');await p.waitForFunction(()=>window.mascotPreview?.debug().ready);}
async function idle(p){await motion(p,'wait');await p.waitForFunction(()=>{const s=window.mascotPreview.debug();return !s.gesture&&s.pointProgress===0&&s.clip==='breathe';});}
async function checkOverlay(p){return p.evaluate(()=>{
 const r=document.getElementById('advisor-nameplate').getBoundingClientRect(),t=document.getElementById(window.mascotPreview.debug().target)?.getBoundingClientRect();
 const overlap=t?Math.max(0,Math.min(r.right,t.right)-Math.max(r.left,t.left))*Math.max(0,Math.min(r.bottom,t.bottom)-Math.max(r.top,t.top)):0;
 return {plate:[r.x,r.y,r.width,r.height],inside:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,overlap,scroll:document.documentElement.scrollWidth,animations:document.getAnimations().length,text:document.getElementById('advisor-nameplate').textContent};
});}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
 const report={sizes:[],errors:[],checks:[]};
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900}});await serve(context);
  const p=await context.newPage();p.on('pageerror',e=>report.errors.push(String(e)));await ready(p);
  await p.waitForFunction(()=>!window.mascotPreview.debug().speaking,{},{timeout:20000});
  await p.waitForFunction(()=>window.mascotPreview.debug().pointProgress===1);
  const hint=await debug(p);assert.equal(hint.pointName,hint.expectedDirection);assert.equal(hint.step,0);assert.equal(hint.yearTwoRemaining,null);
  await p.screenshot({path:path.join(out,'automatic-hint-'+width+'.png'),fullPage:true});
  await p.waitForFunction(()=>window.mascotPreview.debug().clip==='breathe');
  await idle(p);const waist=(await debug(p)).worldAnchor;
  const breathing=new Set();for(let i=0;i<19;i++){await p.waitForTimeout(240);const s=await debug(p);breathing.add(s.frame);assert.equal(s.clip,'breathe');assert.equal(s.cameraScale,1);assert.deepEqual(s.worldAnchor,waist);assert.equal(s.speaking,false);assert.equal(s.step,0);}
  assert(breathing.size>=7);assert.equal((await debug(p)).yearTwoRemaining,null);
  await p.screenshot({path:path.join(out,'breathing-nameplate-'+width+'.png'),fullPage:true});
  const overlay=await checkOverlay(p);assert(overlay.inside);assert.equal(overlay.overlap,0);assert.equal(overlay.text,'Cố vấn doanh nghiệp');assert.equal(overlay.scroll,width);assert.equal(overlay.animations,0);
  await motion(p,'talk');const talkFrames=new Set();for(let i=0;i<13;i++){await p.waitForTimeout(150);const s=await debug(p);assert.equal(s.cameraScale,1,'no talk camera zoom');assert.deepEqual(s.worldAnchor,waist);talkFrames.add(s.frame);}
  assert(talkFrames.size>=3);assert(!talkFrames.has(3));assert(!talkFrames.has(5));
  await idle(p);
  for(const name of directions){
   await motion(p,name);await p.waitForFunction(name=>{const s=window.mascotPreview.debug();return s.clip===name&&s.pointProgress===1;},name);
   const s=await debug(p);assert.equal(s.frame,7);assert.deepEqual(s.worldAnchor,waist);assert.equal(s.step,0);
   const plate=await checkOverlay(p);assert(plate.inside);assert.equal(plate.overlap,0);
   await p.screenshot({path:path.join(out,name+'-'+width+'.png'),fullPage:true});
  }
  await idle(p);
  // Resize while pointing: retreat to the shared rest pose before adopting a new direction.
  await p.evaluate(()=>document.getElementById('return-guide').click());
  const flow=[];
  for(const id of ['tab-invest','buy-cluster','hire-crew','tab-company','next-year']){
   const button=p.locator('#'+id);await button.scrollIntoViewIfNeeded();
   await p.waitForFunction(()=>!window.mascotPreview.debug().speaking,{},{timeout:20000});
   const s=await debug(p);flow.push({id,direction:s.pointName,expected:s.expectedDirection});
   assert(await button.isEnabled());assert.equal(s.yearTwoRemaining,null);
   const plate=await checkOverlay(p);assert.equal(plate.overlap,0);
   await button.click();
   if(id==='next-year')await p.waitForFunction(()=>window.mascotPreview.debug().complete);
   else await p.waitForFunction(id=>window.mascotPreview.debug().target!==id,id);
  }
  const done=await debug(p);assert.equal(done.year,2);assert(done.yearTwoRemaining>58);assert.equal(done.cash,9580);assert.equal(done.workers,5);assert(await p.locator('#advisor-nameplate').isHidden());
  report.sizes.push({width,hint,overlay,breathingFrames:[...breathing],talkFrames:[...talkFrames],flow,done});await context.close();
 }
 {
  const c=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:844}});await serve(c);const p=await c.newPage();await ready(p);await p.waitForTimeout(600);const s=await debug(p);assert.equal(s.frame,0);assert.equal(s.speaking,false);assert.equal(s.pointProgress,0);assert.equal(s.step,0);await c.close();
 }
 const c=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:path.join(out,'recording'),size:{width:1440,height:1000}}});await serve(c);const p=await c.newPage(),video=p.video();await ready(p);
 await p.waitForFunction(()=>!window.mascotPreview.debug().speaking);await p.waitForTimeout(2000);
 await idle(p);await p.waitForTimeout(5000);await motion(p,'talk');await p.waitForTimeout(3500);await idle(p);await p.waitForTimeout(500);
 for(const name of directions){await motion(p,name);await p.waitForFunction(()=>window.mascotPreview.debug().pointProgress===1);await p.waitForTimeout(700);await idle(p);await p.waitForTimeout(200);}
 await c.close();await video.saveAs(path.join(root,'08-direction-breathing.webm'));await browser.close();
 report.checks=['six authored pointing directions','actual target geometry selects guide direction','gaze and chin: source art visual review','hands lower before direction change','whole-actor breathing loop while waiting','fixed camera and gentler talking mouth sequence','framed advisor plaque stays in viewport and clear of buttons','no CSS or Web Animations','no year-1 timer or automatic step','all five actions and year-2 timer','reduced motion static actor','390/768/1440 no horizontal overflow'];
 assert.equal(report.errors.length,0);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,widths:report.sizes.map(x=>x.width),errors:report.errors}));
})().catch(e=>{console.error(e);process.exitCode=1;});
