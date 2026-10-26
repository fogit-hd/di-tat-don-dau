const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname,out=path.join(root,'verification');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp'};
async function routeFiles(context) {
 await context.route('**/*',route=>{
 const url=new URL(route.request().url());if(url.hostname!=='mascot.test')return route.abort();
 const local=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(!local.startsWith(root+path.sep)||!fs.existsSync(local))return route.fulfill({status:404,body:'Not found'});
 return route.fulfill({contentType:types[path.extname(local)]||'application/octet-stream',body:fs.readFileSync(local)});
 });
}
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
const errors=[],measurements=[];
for(const width of [390,768,1440]) {
 const context=await browser.newContext({viewport:{width,height:width===390?844:900},deviceScaleFactor:1});
 await routeFiles(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://mascot.test/');await page.waitForFunction(()=>window.mascotPreview?.debug().ready);
 await page.waitForTimeout(1400);
 await page.screenshot({path:path.join(out,'preview-'+width+'.png'),fullPage:true});
 measurements.push(await page.evaluate(()=>{
 const d=window.mascotPreview.debug();
 const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
 return {width:innerWidth,scroll:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,pose:d,stage:rect('character-stage'),dialogue:rect('dialogue'),next:rect('next-year'),animations:document.getAnimations().length};
 }));
 await context.close();
}
await browser.close();
fs.writeFileSync(path.join(out,'first-pass.json'),JSON.stringify({errors,measurements},null,2));
console.log(JSON.stringify({errors,measurements}));
})().catch(e=>{console.error(e);process.exitCode=1;});
