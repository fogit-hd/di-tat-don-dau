const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const out=path.join(root,process.env.PUBLIC_QA_OUT||'design-preview/landing-wiki-v2/verification-final');fs.mkdirSync(out,{recursive:true});
const requests=[],errors=[],missing=[],mockPlayErrors=[];let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
 const context=await browser.newContext();
 await context.addInitScript(()=>{
  window.__APP_CONFIG__={googleClientId:'preview-only-client-id'};
  window.google={accounts:{id:{initialize(config){window.__testGoogle=config.callback},renderButton(element){const b=document.createElement('button');b.textContent='Google kiểm thử';b.onclick=()=>window.__testGoogle({credential:'synthetic-test-credential'});element.append(b)},disableAutoSelect(){window.__autoSelectDisabled=true}}}};
  document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('script');s.dataset.googleIdentity='true';document.head.append(s)});
 });
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname!=='game.test')return route.abort();
  if(u.pathname==='/config.js')return route.fulfill({contentType:'application/javascript',body:"window.__APP_CONFIG__={googleClientId:'preview-only-client-id'};"});
  if(u.pathname==='/health')return route.fulfill({json:{ok:true}});
  if(u.pathname.startsWith('/api/')){
   requests.push({path:u.pathname,method:route.request().method(),body:route.request().postDataJSON(),headers:route.request().headers()});
   if(u.pathname==='/api/setup')return route.fulfill({json:{yearMinSeconds:5,investmentBasePrices:{eng:50,mac:200,sup:75,inf:100,grn:60},lines:[]}});
   if(u.pathname==='/api/auth/google')return route.fulfill({json:{token:'test-session',user:{name:'Chủ phòng kiểm thử'}}});
   if(u.pathname.endsWith('/exists'))return route.fulfill({json:{exists:true}});
   if(u.pathname.endsWith('/join'))return route.fulfill({json:{playerToken:'test-player'}});
   if(u.pathname==='/api/rooms')return route.fulfill({json:{code:'QA1234',hostToken:'test-host'}});
   return route.fulfill({json:{ok:true}});
  }
  let file=path.join(root,'frontend/dist',decodeURIComponent(u.pathname));if(!path.extname(file))file=path.join(root,'frontend/dist/index.html');
  if(!fs.existsSync(file)){missing.push(u.pathname);return route.fulfill({status:404,body:''})}
  const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
  return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
 });
 const page=await context.newPage();page.on('pageerror',e=>(/\/(play|host)\//.test(page.url())?mockPlayErrors:errors).push(e.message));
 const measurements=[];
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:width===390?844:width===768?1024:900});
  for(const [name,url] of [['landing','/'],['wiki','/wiki'],['industry','/wiki?section=industries'],['production','/wiki?section=production&industry=chip-ban-dan'],['upgrades','/wiki?section=upgrades&industry=trai-cay-say'],['events','/wiki?section=events'],['risk','/wiki?section=risk']]){
   await page.goto('http://game.test'+url);await page.locator('.public-site main').waitFor();await page.evaluate(()=>document.fonts.ready);await page.locator('img').evaluateAll(imgs=>{imgs.forEach(i=>{i.loading='eager'});return Promise.all(imgs.map(i=>i.decode()))});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const m=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src),title:document.querySelector('h1')?.getAttribute('id')??'wiki',buttons:[...document.querySelectorAll('button,a')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().right>innerWidth+1).map(e=>e.getAttribute('aria-label')||e.textContent).slice(0,5)}));
   measurements.push({name,width,...m});assert(m.scroll<=width,`${name} overflow at ${width}`);assert.equal(m.broken.length,0,`${name} broken images`);assert.equal(m.buttons.length,0,`${name} clipped controls: ${m.buttons}`);
   await page.screenshot({path:path.join(out,`${name}-${width}.png`),fullPage:true,animations:'disabled'});
  }
 }
 await page.goto('http://game.test/');await page.getByRole('button',{name:'Tạo phòng',exact:true}).click();
 await page.getByRole('dialog',{name:'Đăng nhập để tạo phòng'}).waitFor();assert(!requests.some(r=>r.path==='/api/rooms'),'must not create before Google sign-in');
 await page.getByRole('button',{name:'Google kiểm thử'}).click();await page.getByRole('dialog',{name:'Tạo phòng',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('host-session')),'test-session');
 await page.getByRole('button',{name:'Đóng',exact:true}).click();await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();assert.equal(await page.evaluate(()=>localStorage.getItem('host-session')),null);
 await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.getByRole('button',{name:'Google kiểm thử'}).click();await page.getByRole('button',{name:'Đăng xuất',exact:true}).waitFor();assert.equal(await page.getByRole('dialog').count(),0,'login-only must not open room configuration');
 const prevented=await page.locator('.public-brand img').evaluate(img=>!img.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true})));assert(prevented,'art context menu must be blocked');
 assert.equal(await page.locator('.public-brand img').evaluate(i=>i.draggable),false);
 await page.getByRole('textbox',{name:'Mã phòng'}).fill('QA1234');await page.getByRole('textbox',{name:'Mã phòng'}).press('Enter');await page.getByRole('textbox',{name:'Tên đội'}).fill('Đội QA');await page.getByRole('button',{name:'Vào sảnh',exact:true}).click();await page.waitForURL('**/play/QA1234');
 assert(requests.some(r=>r.path==='/api/rooms/QA1234/join'&&r.body.teamName==='Đội QA'));
 await page.goto('http://game.test/wiki?section=events');await page.getByRole('searchbox',{name:'Tìm sự kiện'}).fill('Cấm xuất máy quang khắc');await page.locator('.wiki-event-row').first().click();await page.getByRole('combobox',{name:'Biến thể ngữ cảnh',exact:true}).selectOption('green-support');assert(await page.getByRole('article').getByRole('heading',{name:/Gói mua sắm xanh/}).count());
 await page.setViewportSize({width:1440,height:900});await page.screenshot({path:path.join(out,'event-detail-1440.png'),fullPage:true});
 await page.getByRole('searchbox',{name:'Tìm sự kiện'}).fill('don chip');assert((await page.locator('.wiki-event-row').count())>0,'accentless search must match titles beginning with Đ');
 await page.goto('http://game.test/wiki?section=industries');await page.getByRole('searchbox',{name:'Tìm ngành'}).fill('trái cây');assert.equal(await page.locator('.wiki-industry-row').count(),1);
 await page.goto('http://game.test/');await page.getByRole('button',{name:'Tạo phòng',exact:true}).click();await page.getByRole('dialog',{name:'Tạo phòng',exact:true}).waitFor();await page.getByRole('button',{name:'Mở phòng',exact:true}).click();await page.waitForURL('**/host/QA1234');
 const created=requests.find(r=>r.path==='/api/rooms');assert.equal(created.headers['x-host-session'],'test-session');assert.equal(created.body.cycleSeconds,60);assert.equal(created.body.startingCapital,10000);assert.equal('linePrices' in created.body,false,'room creation must not send price overrides');
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({measurements,missing,errors,mockPlayErrors,checks:['Google before create','login-only does not create','logout','join code by Enter and name submit by click','context menu prevented','drag disabled','Wiki search','event context selector','authenticated room create POST'],apiRequests:requests.map(({path,method,body})=>({path,method,body}))},null,2));
 // Errors from host/play mocks are not gameplay validation; public-page runtime must remain clean.
 assert.equal(missing.length,0,'missing static assets');
 assert.equal(errors.length,0,'public-page runtime errors');
 console.log(JSON.stringify({screens:measurements.length,missing,errors,checks:'passed'}));await browser.close();
})().catch(async error=>{console.error(error);await browser?.close();process.exitCode=1});
