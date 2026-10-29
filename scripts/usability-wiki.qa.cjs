const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'design-preview/usability-v5/wiki');fs.mkdirSync(out,{recursive:true});let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});const report={sizes:[],errors:[],missing:[]};
 for(const [width,height]of [[390,844],[768,1024],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height}});await context.route('**/*',route=>{
   const url=new URL(route.request().url());if(url.hostname!=='game.test')return route.abort();
   if(url.pathname==='/health'||url.pathname.startsWith('/api/'))return route.fulfill({json:{ok:true,yearMinSeconds:5}});
   if(url.pathname==='/config.js')return route.fulfill({contentType:'application/javascript',body:'window.__APP_CONFIG__={};'});
   let file=path.join(root,'frontend/dist',decodeURIComponent(url.pathname));if(!path.extname(file))file=path.join(root,'frontend/dist/index.html');
   if(!fs.existsSync(file)){report.missing.push(url.pathname);return route.fulfill({status:404})}
   return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream'});
  });
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));page.setDefaultTimeout(15000);
  await page.goto('http://game.test/wiki?section=questions');await page.locator('.wiki-question-card').first().waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.wiki-question-card>summary')).display==='grid');
  const seen=new Set();
  for(let p=0;p<(width===1440?8:1);p++){
   assert.equal(await page.locator('.wiki-question-card').count(),10);
   for(const card of await page.locator('.wiki-question-card').all()){
    const title=await card.locator('summary b').innerText();assert(!seen.has(title));seen.add(title);await card.locator('summary').click();
    assert.equal(await card.locator('ol>li').count(),4);assert.equal(await card.locator('li.is-correct').count(),1);assert((await card.locator('.wiki-question-answer>p').innerText()).length>25);
    await card.locator('summary').click();
   }
   if(p<7&&width===1440)await page.getByRole('navigation',{name:'Trang ngân hàng câu hỏi',exact:true}).getByRole('button',{name:'Tiếp',exact:true}).click();
  }
  if(width===1440)assert.equal(seen.size,80);
  await page.getByRole('searchbox',{name:'Tìm câu hỏi',exact:true}).fill('chip');assert(await page.locator('.wiki-question-card').count()<=10);await page.getByRole('searchbox',{name:'Tìm câu hỏi',exact:true}).fill('');
  await page.locator('.wiki-question-card').first().locator('summary').click();await page.screenshot({path:path.join(out,`questions-${width}.png`),fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.goto('http://game.test/wiki?section=industries');await page.locator('.wiki-industry-row').first().waitFor();assert.equal(await page.locator('.wiki-industry-row').count(),10);
  await page.goto('http://game.test/wiki?section=events');await page.getByLabel('Loại sự kiện',{exact:true}).selectOption('recent');assert.equal(await page.locator('.wiki-event-row').count(),10);
  await page.goto('http://game.test/wiki?section=updates');await page.locator('.wiki-update-event').first().waitFor();assert.equal(await page.locator('.wiki-update-event').count(),10);
  await page.getByRole('navigation',{name:'Trang cập nhật sự kiện',exact:true}).getByRole('button',{name:'Tiếp',exact:true}).click();assert.equal(await page.locator('.wiki-update-event').count(),10);
  await page.getByRole('navigation',{name:'Trang cập nhật sự kiện',exact:true}).getByRole('button',{name:'Tiếp',exact:true}).click();assert.equal(await page.locator('.wiki-update-event').count(),1);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));report.sizes.push({width,height,allAnswersChecked:seen.size});await context.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
