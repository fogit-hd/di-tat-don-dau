const {chromium}=require('C:/Users/PHONG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const assert=require('node:assert/strict'),fs=require('node:fs')
const base='http://127.0.0.1:4525',api='http://127.0.0.1:4608/api/duck-race'
async function request(path,body,token){const r=await fetch(api+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(token?{'x-duck-token':token}:{})},body:body?JSON.stringify(body):undefined});const data=await r.json();assert.ok(r.ok,JSON.stringify(data));return data}
;(async()=>{
 const room=await request('/rooms',{}),joined=await request(`/rooms/${room.code}/join`,{name:'Motion QA',color:'purple',model:'duckee'})
 const browser=await chromium.launch({executablePath:'C:/Users/PHONG/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/duck-race')
 await page.evaluate(({code,token})=>localStorage.setItem('quiz-duck-race:v1:'+code,JSON.stringify({token,role:'player'})),{code:room.code,token:joined.token})
 await request(`/rooms/${room.code}/action`,{type:'start'},room.token);await page.goto(base+'/duck-race/play/'+room.code);await page.locator('.dq-controls').waitFor()
 const record=page.evaluate(()=>new Promise(resolve=>{const values=[],start=performance.now();function frame(){const c=document.querySelector('.dq-track canvas');if(c)values.push({at:performance.now()-start,x:Number(c.dataset.localX),y:Number(c.dataset.localY),pose:c.dataset.pose,frame:c.dataset.poseFrame,height:Number(c.dataset.jumpHeight),scale:Number(c.dataset.bodyScaleY)});if(performance.now()-start<3800)requestAnimationFrame(frame);else resolve(values)}requestAnimationFrame(frame)}))
 await page.keyboard.down('KeyD');await page.waitForTimeout(350)
 for(let i=0;i<4;i++){await page.keyboard.press('Space');await page.waitForTimeout(70)}
 await page.waitForTimeout(1450);await page.keyboard.down('ShiftLeft');await page.waitForTimeout(600);await page.keyboard.up('KeyD');await page.waitForTimeout(700);await page.keyboard.up('ShiftLeft')
 const samples=await record;const moving=samples.filter(s=>s.at<2450&&Number.isFinite(s.x));for(let i=1;i<moving.length;i++)assert.ok(moving[i].x>=moving[i-1].x-.1,'visual backward movement')
 for(const pose of ['jump','air','fall','crawl','crouch'])assert.ok(samples.some(s=>s.pose===pose),'missing '+pose)
 assert.ok(new Set(samples.filter(s=>s.pose==='crawl').map(s=>s.frame)).size>1,'crawl frames cycle')
 assert.ok(new Set(samples.filter(s=>s.pose==='crouch').map(s=>s.scale.toFixed(2))).size>2,'held crouch breathes')
 assert.equal(await page.getByRole('alert').count(),0);assert.deepEqual(errors,[])
 fs.mkdirSync('design-preview/duck-race-motion-v5',{recursive:true});fs.writeFileSync('design-preview/duck-race-motion-v5/motion.json',JSON.stringify({errors,samples},null,2));await page.screenshot({path:'design-preview/duck-race-motion-v5/motion-player.png'})
 await request(`/rooms/${room.code}/action`,{type:'end'},room.token);await browser.close();console.log('PASS: continuous free movement, no jump rewind, buffered jumps, purple air/fall, crawl cycle and crouch breathing')
})().catch(e=>{console.error(e);process.exit(1)})
