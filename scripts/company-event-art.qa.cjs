// Validate the self-contained SVG assets and show the approved painting style on both backgrounds.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),rows=require('../backend/src/game/company-events.data.json');
const out=path.join(root,'design-preview/company-events-v1');fs.mkdirSync(out,{recursive:true});
let browser;
(async()=>{
 assert.deepEqual(rows,require('../frontend/src/lib/company-events.json'),'Frontend/backend event data must match in independent Docker contexts');
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const entries=[...rows.map(r=>({id:r.id,title:r.title})),{id:'gen-lop-nghe',title:'Lớp nghề tại chỗ'}];
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname!=='game.test')return route.abort();
  if(u.pathname==='/')return route.fulfill({contentType:'text/html; charset=utf-8',body:`<!doctype html><html lang="vi"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#fff0d2;color:#4b1b14;font:16px Arial}h1{margin:0 0 8px;font-size:28px}p{margin:0 0 20px}main{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px}article{border:1px solid #ac7834;padding:10px;background:#f8e5bb}article>div{display:grid;grid-template-columns:1fr 1fr}img{width:100%;height:112px;object-fit:contain}img+img{background:#40151b}h2{font-size:16px;min-height:38px;margin:10px 0 0}</style><h1>SVG sự kiện doanh nghiệp</h1><p>${entries.length} file SVG riêng · Minh họa nét vẽ tay từ bộ đã duyệt, đóng gói trong SVG · Kiểm tra nền kem và đỏ rượu</p><main>${entries.map(e=>`<article><div><img src="/assets/ui/company-events-v1/${e.id}.svg"><img src="/assets/ui/company-events-v1/${e.id}.svg"></div><h2>${e.title}</h2></article>`).join('')}</main></html>`});
  const file=path.join(root,'frontend/dist',u.pathname);assert(fs.existsSync(file),u.pathname);
  return route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(file)});
 });
 await page.goto('http://game.test/');await page.waitForFunction(()=>[...document.images].every(im=>im.complete&&im.naturalWidth===256));
 assert.equal(await page.locator('article').count(),entries.length);
 await page.screenshot({path:path.join(out,'svg-gallery-1440.png'),fullPage:true});
 fs.writeFileSync(path.join(out,'art-report.json'),JSON.stringify({assets:entries.map(e=>e.id),format:'Self-contained SVG with embedded approved hand-painted WebP, not traced vector paths',backgrounds:['cream','wine'],allDecoded:true},null,2));
 console.log(`${entries.length} SVG assets decoded on cream/wine; matching backend/frontend data verified.`);
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close()});
