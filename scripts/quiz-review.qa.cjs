// Production bundle, local request/socket fixtures, no live API or database writes.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createFixture}=require('./session-fixtures.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'design-preview/'+(process.env.QUIZ_OUTPUT||'quiz-review-v1'));fs.mkdirSync(out,{recursive:true});
let browser;
(async()=>{
 const {quizStatistics}=await import('../backend/src/game/quiz-review.ts');
 const options=[{id:'a',text:'Mua thêm thiết bị mà chưa chuẩn bị tổ công nhân vận hành.'},{id:'b',text:'Phối hợp thiết bị, nhân lực và công nghệ phù hợp với quy mô.'},{id:'c',text:'Chỉ mở rộng kho bãi để tự động tăng số công nhân.'},{id:'d',text:'Bỏ bảo dưỡng dù độ bền đã thấp.'}];
 const visits=Array.from({length:8},(_,i)=>({id:'visit-'+i,questionId:i<4?'shared':'q'+i,prompt:i<4?'Phương án nào giúp doanh nghiệp vận hành hiệu quả?':`Câu hỏi ${i}: Chọn chiến lược nâng cấp phù hợp với doanh nghiệp của bạn.`,options:i%2?[...options].reverse():options,correctOptionId:'b',explanation:'Nhân lực đủ tổ, thiết bị được bảo dưỡng và công nghệ hỗ trợ cùng nhau.',year:i+1,chosenOptionId:i===2?undefined:i===0?'a':'b',correct:i!==0&&i!==2,resolved:true}));
 const report={errors:[],missing:[],widths:[],checks:['selected wrong answer red','correct answer green','timeout unselected','own answers survive reload','host appearances and four option distributions','animated bars/reduced motion','pagination','no horizontal overflow','full final-transfer receipt in event history']};
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:width===768?1024:900}}),fixture=createFixture();fixture.room.status='ended';fixture.you.finished=true;fixture.teams[0].finished=true;
  fixture.room.questionStats=quizStatistics(visits);fixture.you.questionReview=visits;
  const settlement='Quyết toán khi tổng kết · CEO Minh trả CEO Lan 75 triệu · 3% tiền mặt khả dụng lúc xử lý, trần 75 triệu';
  fixture.scene.eventLog=[{year:30,eventId:'company-commission',title:'Trả hoa hồng giao dịch',body:'Giao dịch chờ được quyết toán khi trận kết thúc.',icon:'coinsDown',good:false,effect:settlement}];
  await context.addInitScript(()=>{localStorage.setItem('host:XTV45','qa-host');localStorage.setItem('player:XTV45','qa-player')});
  await context.routeWebSocket('**/socket.io/**',ws=>{ws.send('0'+JSON.stringify({sid:'qa',upgrades:[],pingInterval:25000,pingTimeout:20000,maxPayload:1000000}));ws.onMessage(message=>{const s=String(message);if(s.startsWith('40'))ws.send('40{"sid":"qa"}');if(s.startsWith('42')){const [event,data]=JSON.parse(s.slice(2));if(event==='hello')ws.send('42'+JSON.stringify(['snapshot',fixture.snapshot(data.role)]))}})});
  await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='game.test')return route.abort();if(u.pathname.startsWith('/api/'))return route.fulfill({json:{ok:true}});if(u.pathname==='/config.js')return route.fulfill({contentType:'application/javascript',body:'window.__APP_CONFIG__={};'});let file=path.join(root,'frontend/dist',decodeURIComponent(u.pathname));if(!path.extname(file))file=path.join(root,'frontend/dist/index.html');if(!fs.existsSync(file)){report.missing.push(u.pathname);return route.fulfill({status:404,body:''})}return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream'})});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));
  const capture=async name=>{await page.locator('.session-screen img').evaluateAll(ns=>Promise.all(ns.map(i=>{i.loading='eager';return i.decode()})));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,`${name}-${width}.png`),fullPage:true})};
  await page.goto('http://game.test/play/XTV45');await page.locator('.session-player-results').waitFor();await page.getByRole('tab',{name:'Sự kiện',exact:true}).click();await page.locator('.result-event-list summary').first().click();
  assert.equal(await page.locator('.result-event-receipt .art-text').getAttribute('aria-label'),settlement);await capture('final-transfer-history');
  await page.getByRole('tab',{name:'Câu hỏi',exact:true}).click();
  assert.equal(await page.locator('.quiz-review-card').count(),3);assert.equal(await page.locator('.quiz-review-card').nth(0).locator('.is-wrong').count(),1);assert.equal(await page.locator('.quiz-review-card').nth(0).locator('.is-correct').count(),1);assert.equal(await page.locator('.quiz-review-card').nth(1).locator('.is-wrong').count(),0);assert.equal(await page.locator('.quiz-review-card').nth(1).locator('.is-correct').count(),1);assert((await page.locator('.quiz-review-card').nth(2).innerText()).includes('Chưa trả lời'));
  await capture('player-answers');await page.getByRole('button',{name:'Sau',exact:true}).click();assert((await page.locator('.quiz-review-card').first().innerText()).includes('Năm 4'));
  await page.reload();await page.locator('.session-player-results').waitFor();await page.getByRole('tab',{name:'Câu hỏi',exact:true}).click();assert.equal(await page.locator('.is-wrong').count(),1);
  await page.goto('http://game.test/host/XTV45');await page.locator('.session-host-results').waitFor();await page.getByRole('tab',{name:'Câu hỏi',exact:true}).click();await page.locator('.session-question-toggle').first().click();
  assert((await page.locator('.session-question-score .art-text').first().getAttribute('aria-label')).includes('50%'));assert((await page.locator('.session-question-score .art-text').first().getAttribute('aria-label')).includes('4 lần'));assert.equal(await page.locator('.quiz-host-detail .quiz-options li').count(),4);assert.equal(await page.locator('.quiz-host-detail .is-correct').count(),1);
  const shares=await page.locator('.quiz-distribution').evaluateAll(ns=>ns.map(n=>n.style.width));assert.deepEqual(shares,['25%','50%','0%','0%']);assert.equal(await page.locator('.quiz-distribution').first().evaluate(n=>getComputedStyle(n).animationName),'quiz-bar-enter');
  await capture('host-distribution');await page.getByRole('button',{name:'Trang sau',exact:true}).click();assert.equal(await page.locator('.session-question-toggle').count(),1);await page.locator('.session-question-toggle').first().click();await capture('host-pagination');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.quiz-distribution').first().evaluate(n=>getComputedStyle(n).animationName),'none');
  report.widths.push(width);await context.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close()});
