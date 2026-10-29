// Production-bundle browser regression. Google Identity and API responses are local fixtures.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.HOME_QA_OUTPUT||path.join(root,'design-preview/home-login-wiki-v1'));
const company=require('../frontend/src/lib/company-events.json');
fs.mkdirSync(out,{recursive:true});
let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
 const report={viewports:[],checks:[],errors:[],missing:[],blockedExternal:[],authentication:'Google Identity and credential verification mocked; no real Google account or live database'};
 for(const [width,height] of [[360,800],[390,844],[768,1024],[1440,900],[844,390]]){
  const context=await browser.newContext({viewport:{width,height}}),posts=[];
  let authFailure=false,delayAuth=false,scriptFailure=false;
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url()),req=route.request();
   if(url.hostname==='accounts.google.com'&&url.pathname==='/gsi/client'){
    if(scriptFailure)return route.abort();
    return route.fulfill({contentType:'application/javascript',body:`window.google={accounts:{id:{initialize(c){window.__googleCallback=c.callback},renderButton(el,opts){window.__googleOptions=opts;const b=document.createElement('button');b.textContent='Đăng nhập bằng Google (QA)';b.style.cssText='min-height:44px;width:'+opts.width+'px;max-width:100%;font:14px Arial;background:#fff;border:1px solid #ccc;border-radius:4px;padding:10px';b.onclick=()=>window.__googleCallback({credential:'local-qa-credential'});el.appendChild(b)},disableAutoSelect(){window.__googleLogout=true}}}};`});
   }
   if(url.hostname!=='game.test'){report.blockedExternal.push(url.hostname);return route.abort()}
   if(url.pathname==='/config.js')return route.fulfill({contentType:'application/javascript',body:'window.__APP_CONFIG__={googleClientId:"qa-local-client"};'});
   if(url.pathname==='/health')return route.fulfill({json:{ok:true}});
   if(url.pathname==='/api/setup')return route.fulfill({json:{yearMinSeconds:5}});
   if(url.pathname==='/api/auth/google'){
    posts.push({path:url.pathname,body:req.postDataJSON()});
    if(delayAuth)await new Promise(resolve=>setTimeout(resolve,600));
    return route.fulfill(authFailure?{status:400,json:{error:'Không xác minh được tài khoản Google'}}:{json:{token:'qa-host-session',user:{name:'Chủ phòng tiếng Việt'}}});
   }
   if(url.pathname.startsWith('/api/'))return route.fulfill({json:{ok:true}});
   let file=path.join(root,'frontend/dist',decodeURIComponent(url.pathname));
   if(!path.extname(file))file=path.join(root,'frontend/dist/index.html');
   if(!fs.existsSync(file)){report.missing.push(url.pathname);return route.fulfill({status:404})}
   return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream'});
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>report.errors.push(String(e)));
  const settle=()=>page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})))});
  const geometry=()=>page.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,overflow:document.body.style.overflow}));
  await page.goto('http://game.test/');await settle();
  const before=await geometry();assert(before.sw<=width);assert(before.sh<=height,`Landing must fit viewport: ${JSON.stringify(before)}`);assert.equal(before.overflow,'','Do not hide page overflow to fake the fit');
  assert.equal(await page.locator('.public-landing>section').count(),1);assert.equal(await page.locator('.public-how,.public-features,.public-home>.public-footer').count(),0);
  assert.equal(await page.locator('.public-nav a').nth(0).getAttribute('href'),'/wiki?section=start');
  assert.equal(await page.locator('.public-nav a').nth(1).getAttribute('href'),'/wiki?section=events');
  for(const selector of ['.public-header','.public-hero-copy','.public-join','.living-hero']){
   const box=await page.locator(selector).boundingBox();assert(box.x>=0&&box.x+box.width<=width+1);assert(box.y>=0&&box.y+box.height<=height+1,`${selector} visible at ${width}x${height}`);
  }
  if(width<=900&&height>540){const copy=await page.locator('.public-hero-copy').boundingBox(),art=await page.locator('.living-hero').boundingBox();assert(copy.y+copy.height<=art.y+1,'Mobile copy and form precede the illustration');}
  assert.equal(await page.locator('.public-join input').evaluate(n=>getComputedStyle(n,'::placeholder').color),'rgb(229, 207, 170)');
  assert.equal(await page.locator('.living-hero-fallback img').evaluate(n=>getComputedStyle(n).objectFit),'contain');
  await page.locator('.public-home img').evaluateAll(nodes=>Promise.all(nodes.map(img=>img.decode())));
  await page.screenshot({path:path.join(out,`home-${width}x${height}.png`)});
  // Join remains a real, visible form and validates Enter without opening login.
  await page.getByPlaceholder('Nhập mã phòng').fill('A');await page.getByPlaceholder('Nhập mã phòng').press('Enter');
  await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('dialog').count(),0);
  await page.getByRole('button',{name:'Tạo phòng',exact:true}).click();
  let login=page.getByRole('dialog',{name:'Đăng nhập để tạo phòng',exact:true});await login.waitFor();await settle();
  await login.getByRole('button',{name:'Đăng nhập bằng Google (QA)',exact:true}).waitFor();
  const box=await login.boundingBox();assert(box.width<=width-20&&box.height<height-20);assert(box.height<600,'Content-height panel, no mobile full-height modal');
  assert.equal(await login.evaluate(n=>n.scrollWidth<=n.clientWidth),true);await page.screenshot({path:path.join(out,`login-${width}x${height}.png`)});
  await page.keyboard.press('Escape');await login.waitFor({state:'detached'});
  assert(await page.getByRole('button',{name:'Tạo phòng',exact:true}).evaluate(n=>document.activeElement===n));assert.equal((await geometry()).overflow,'');
  // Plain login stores the session but does not open create-room automatically.
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  login=page.getByRole('dialog',{name:'Đăng nhập chủ phòng',exact:true});await login.waitFor();
  await login.getByRole('button',{name:'Đăng nhập bằng Google (QA)',exact:true}).click();
  await login.waitFor({state:'detached'});assert.equal(await page.getByRole('dialog',{name:'Tạo phòng',exact:true}).count(),0);
  assert.equal(await page.evaluate(()=>localStorage.getItem('host-session')),'qa-host-session');
  await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();assert.equal(await page.evaluate(()=>localStorage.getItem('host-session')),null);
  // Create intent resumes the settings form only after successful server verification.
  await page.getByRole('button',{name:'Tạo phòng',exact:true}).click();login=page.getByRole('dialog',{name:'Đăng nhập để tạo phòng',exact:true});
  authFailure=true;await login.getByRole('button',{name:'Đăng nhập bằng Google (QA)',exact:true}).click();await login.getByRole('alert').waitFor();
  assert.equal(await page.getByRole('dialog',{name:'Tạo phòng',exact:true}).count(),0);await page.screenshot({path:path.join(out,`login-error-${width}.png`)});
  authFailure=false;await login.getByRole('button',{name:'Thử lại',exact:true}).click();await login.getByRole('button',{name:'Đăng nhập bằng Google (QA)',exact:true}).click();
  const create=page.getByRole('dialog',{name:'Tạo phòng',exact:true});await create.waitFor();assert.equal(await create.locator('.session-name-field input').inputValue(),'Chủ phòng tiếng Việt');
  await page.keyboard.press('Escape');await create.waitFor({state:'detached'});
  for(const row of posts)assert.deepEqual(row.body,{credential:'local-qa-credential'});
  assert.equal(posts.length,3);
  await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();
  // Cancel during verification must not mutate the session or open a late modal.
  delayAuth=true;await page.getByRole('button',{name:'Tạo phòng',exact:true}).click();login=page.getByRole('dialog',{name:'Đăng nhập để tạo phòng',exact:true});
  await login.getByRole('button',{name:'Đăng nhập bằng Google (QA)',exact:true}).click();await login.getByRole('status').waitFor();await page.keyboard.press('Escape');
  await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>localStorage.getItem('host-session')),null);assert.equal(await page.getByRole('dialog').count(),0);delayAuth=false;
  if(width===390){
   await page.evaluate(()=>{delete window.google;document.querySelector('script[data-google-identity]')?.remove()});scriptFailure=true;
   await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();login=page.getByRole('dialog',{name:'Đăng nhập chủ phòng',exact:true});await login.getByRole('alert').waitFor();
   scriptFailure=false;await login.getByRole('button',{name:'Thử lại',exact:true}).click();await login.getByRole('button',{name:'Đăng nhập bằng Google (QA)',exact:true}).waitFor();await page.keyboard.press('Escape');
  }
  await page.goto('http://game.test/wiki?section=updates');await page.locator('.wiki-update-events').waitFor();await settle();
  for(let p=0;p<Math.ceil(company.length/10);p++){
   assert.equal(await page.locator('.wiki-update-event').count(),Math.min(10,company.length-p*10));
   for(const event of company.slice(p*10,p*10+10))assert(await page.locator('.wiki-update-event').filter({has:page.getByRole('img',{name:event.title,exact:true})}).count()||await page.locator('.wiki-update-event').filter({hasText:event.title}).count());
   if(p<Math.ceil(company.length/10)-1)await page.getByRole('navigation',{name:'Trang cập nhật sự kiện',exact:true}).getByRole('button',{name:'Tiếp',exact:true}).click();
  }
  await page.locator('.wiki-update-rules details').nth(4).locator('summary').click();
  assert((await geometry()).sw<=width);await page.screenshot({path:path.join(out,`wiki-updates-${width}.png`)});
  await page.locator('.wiki-update-event').last().getByRole('button',{name:'Xem chi tiết',exact:true}).click();await page.locator('.wiki-event-detail').waitFor();await settle();
  await page.locator('.wiki-event-detail').screenshot({path:path.join(out,`wiki-patent-${width}.png`)});
  assert((await geometry()).sw<=width);
  await page.goto('http://game.test/wiki?section=events');await page.getByLabel('Loại sự kiện',{exact:true}).selectOption('recent');
  assert.equal(await page.locator('.wiki-event-row').count(),10);assert.equal(await page.locator('.wiki-meta').first().getAttribute('class'),'wiki-meta');
  if(width===1440){for(const event of company){
   await page.getByRole('searchbox',{name:'Tìm sự kiện',exact:true}).fill(event.title);
   await page.locator('.wiki-event-row').first().click();await page.locator('.wiki-event-detail').waitFor();
   assert.equal(await page.locator('.wiki-event-detail>.wiki-event-detail-grid .wiki-notice').count(),1,`Current rule note for ${event.id}`);
  }}
  report.viewports.push({width,height,home:before,login:box,events:company.length,authPosts:posts.length});await context.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);
 report.checks=['Single hero fits five viewport sizes without hiding document overflow','Join input Enter validation and Wiki navigation','Compact login; loading, error, retry, cancel, Escape and focus restoration','Real GIS interface preserved; server token verification and create/login intents checked with fixtures','All 21 company events and current-rule notes accessible in Wiki; no horizontal overflow'];
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
