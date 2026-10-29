// Record the actual production component; no simulated object motion or network API.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'design-preview/living-hero-v5');let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
 const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:path.join(out,'recording'),size:{width:1440,height:900}}});
 await context.route('**/*',route=>{
  const u=new URL(route.request().url());if(u.hostname!=='game.test')return route.abort();
  if(u.pathname==='/health'||u.pathname.startsWith('/api/'))return route.fulfill({json:{ok:true,yearMinSeconds:5}});
  if(u.pathname==='/config.js')return route.fulfill({contentType:'application/javascript',body:'window.__APP_CONFIG__={};'});
  let file=path.join(root,'frontend/dist',u.pathname);if(!path.extname(file))file=path.join(root,'frontend/dist/index.html');
  return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream'});
 });
 const page=await context.newPage(),video=page.video();await page.goto('http://game.test/');await page.locator('.living-hero[data-ready=true]').waitFor();
 // Recording/CPU load can slow a decorative clock. Wait for an ACTUAL cycle,
 // not a wall-clock sleep that could stop before the crew turns to depart.
 let previous=0,wrapped=false,departure=false,walking=false;const deadline=Date.now()+90000;
 while(Date.now()<deadline){
  const t=Number(await page.locator('.living-hero-canvas').getAttribute('data-time'));
  if(!walking&&t>=2.5&&t<4){await page.screenshot({path:path.join(out,'walking.png')});walking=true;}
  if(!departure&&t>=16.1&&t<17){await page.screenshot({path:path.join(out,'departure.png')});departure=true;}
  if(t<previous-10)wrapped=true;
  if(wrapped&&t>.5)break;
  previous=t;await page.waitForTimeout(120);
 }
 if(!wrapped||!departure)throw new Error('Did not record a complete walk/turn/departure cycle');
 await page.screenshot({path:path.join(out,'home-desktop.png')});await context.close();await video.saveAs(path.join(out,'replay-desktop.webm'));await video.delete();await browser.close();console.log('Saved complete production cycle, including departure-facing crew');
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
