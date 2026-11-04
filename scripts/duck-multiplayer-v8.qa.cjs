const {chromium}=require('C:/Users/PHONG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const {io}=require('socket.io-client'),assert=require('node:assert/strict'),fs=require('node:fs')
const base='http://127.0.0.1:4525',apiBase='http://127.0.0.1:4608/api/duck-race',sockets=[]
async function api(path,body,token){const r=await fetch(apiBase+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(token?{'x-duck-token':token}:{})},body:body?JSON.stringify(body):undefined});const d=await r.json();assert.ok(r.ok,JSON.stringify(d));return d}
;(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Users/PHONG/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true}),errors=[]
 try{
 const r=await api('/rooms',{}),people=[];for(let i=0;i<50;i++)people.push(await api('/rooms/'+r.code+'/join',{name:'Người chơi tên dài '+i,color:['yellow','aqua','purple','green'][i%4],model:'duckee'}))
 for(const p of people.slice(1)){const s=io('http://127.0.0.1:4608/duck-race',{path:'/duck-socket',auth:{code:r.code,token:p.token},transports:['websocket']});sockets.push(s)}
 await Promise.all(sockets.map(s=>new Promise((resolve,reject)=>{s.once('connect',resolve);s.once('connect_error',reject)})))
 const host=await browser.newPage({viewport:{width:1440,height:900}}),player=await browser.newPage({viewport:{width:390,height:844}})
 for(const [page,token,role]of[[host,r.token,'host'],[player,people[0].token,'player']]){page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/duck-race');await page.evaluate(({code,token,role})=>localStorage.setItem('quiz-duck-race:v1:'+code,JSON.stringify({token,role})),{code:r.code,token,role});await page.goto(base+'/duck-race/'+(role==='host'?'host':'play')+'/'+r.code)}
 await api('/rooms/'+r.code+'/action',{type:'start'},r.token);await player.locator('.dq-playing').waitFor();await host.waitForFunction(()=>document.querySelector('.dq-track canvas')?.dataset.nameLabels==='50');await player.waitForFunction(()=>document.querySelector('.dq-track canvas')?.dataset.playerMarkers==='1')
 const own=player.locator('.dq-track canvas');assert.equal(await own.getAttribute('data-name-labels'),'0');assert.equal((await api('/rooms/'+r.code,undefined,people[0].token)).players.length,50)
 for(const [page,name]of[[host,'host-50'],[player,'player-50-390']]){await page.screenshot({path:'design-preview/duck-race-v8/'+name+'.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight))}
 assert.deepEqual(errors,[]);fs.writeFileSync('design-preview/duck-race-v8/multiplayer.json',JSON.stringify({players:50,livePlayerSockets:50,hostNameLabels:50,playerOpponentLabels:0,errors,code:r.code},null,2));console.log('PASS: 50 players, host shows every name, player only own marker, no page scroll or renderer errors')
 }finally{sockets.forEach(s=>s.disconnect());await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)})
