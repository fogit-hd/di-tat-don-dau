// Exercise the actual renderer, serving local files only; no account or backend.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'design-preview/living-hero-v5/verification');fs.mkdirSync(out,{recursive:true});let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});const page=await browser.newPage();
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());if(u.hostname!=='harbor.test')return route.abort();
  if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body style="margin:0;background:#fff1d6"><canvas id="scene"></canvas></body></html>'});
  if(u.pathname==='/renderer.js'){
   let source=fs.readFileSync(path.join(root,'frontend/src/lib/living-hero.ts'),'utf8');
   source=source.replace("import poses from './porter-sprites-v4.json'",'const poses='+fs.readFileSync(path.join(root,'frontend/src/lib/porter-sprites-v4.json'),'utf8'));
   source=source.replace("import { groundedRoute, groundedStep, walkingProgress } from './grounded-walk'",fs.readFileSync(path.join(root,'frontend/src/lib/grounded-walk.ts'),'utf8'));
   return route.fulfill({contentType:'application/javascript',body:require('typescript').transpileModule(source,{compilerOptions:{target:9,module:99}}).outputText});
  }
  return route.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(root,'frontend/public',u.pathname))});
 });
 await page.goto('http://harbor.test/');const results=[];
 for(const mobile of [false,true]){
  const width=mobile?600:1340,height=mobile?800:754;await page.setViewportSize({width,height});
  const data=await page.evaluate(async({width,height,mobile})=>{
   const m=await import('/renderer.js'),load=async name=>{const im=new Image();im.src=m.heroAssetUrl(name);await im.decode();return im};
   const sprites=Object.fromEntries(await Promise.all(m.HERO_SPRITES.map(async key=>[key,await load(key)]))),bg=await load(mobile?'scene-mobile':'scene-desktop');
   const c=document.getElementById('scene');c.width=width;c.height=height;const ctx=c.getContext('2d'),frames=[];
   for(const time of [0,1,2.1,3.3,4.39,4.4,4.8,5.2,5.5,5.8,6,6.3,6.6,7.2,8,8.7,9.2,9.6,10.2,10.8,12,13.5,14,14.8,15.2,15.8,16.5,18,19,20.5,22,23.99,24]){m.paintHero(ctx,width,height,bg,sprites,time,mobile);frames.push({time,png:c.toDataURL()});}
   const checks={continuous:true,craneWaitsForHands:true,moored:true,verticalCable:true};
   for(const boundary of [6.6,8.6,10.6,13]){const a=m.heroMotion(boundary-1e-6,mobile),b=m.heroMotion(boundary+1e-6,mobile);checks.continuous&&=Math.hypot(a.cargo[0]-b.cargo[0],a.cargo[1]-b.cargo[1])<1e-5;}
   for(let t=0;t<24;t+=.02){const s=m.heroMotion(t,mobile),l=m.heroLayout(mobile);
    checks.craneWaitsForHands&&=s.owner!=='crane'||t>=6.6;
    checks.moored&&=t<4||t>=16||s.boatX===l.boatDock;
    checks.verticalCable&&=Math.abs(s.anchor[0]-s.hookX)<1e-10&&s.anchor[1]<s.hookY;
   }
   const meta=await fetch('/assets/living-hero-v4/porter.json').then(r=>r.json()),contact=m.heroMotion(13.6,mobile),layout=m.heroLayout(mobile),aspect=bg.naturalWidth/bg.naturalHeight;
   checks.receiverContact=Math.hypot(contact.receiver[0]+meta.receiverContact[0]*layout.receiverHeight/aspect-contact.hookX,contact.receiver[1]+meta.receiverContact[1]*layout.receiverHeight-contact.hookY)<.00001;
   checks.releaseBeforeDeparture=m.heroMotion(15,mobile).sling===0&&m.heroMotion(16.1,mobile).owner==='boat';
   checks.warehouseConcealsReset=m.heroMotion(0,mobile).inside&&m.heroMotion(23.99,mobile).inside;
   const start=m.heroMotion(0,mobile),end=m.heroMotion(23.99,mobile);
   checks.truckResetsOffscreen=start.tyreX+start.truckWidth<0&&end.tyreX+end.truckWidth<0&&m.heroMotion(12,mobile).tyreX>1;
   checks.truckOnPavedLane=true;checks.truckReturnsFacingLeft=true;checks.boatLocalFloor=true;
   for(let t=0;t<24;t+=.02){
    const s=m.heroMotion(t,mobile),l=m.heroLayout(mobile);
    checks.truckReturnsFacingLeft&&=t<13||s.truckDirection===-1;
    const tw=s.truckWidth*bg.naturalWidth,th=tw*514/1016,dx=(.165-.604)*tw,dy=(.916-.984)*th;
    const slope=l.road[1]/aspect,shear=slope*s.truckDirection-dy/dx;
    const rearX=s.tyreX+s.truckDirection*dx/bg.naturalWidth,rearY=s.tyreY+(shear*dx+dy)/bg.naturalHeight;
    checks.truckOnPavedLane&&=Math.abs(rearY-(l.road[0]+l.road[1]*rearX))<1e-10;
    if(t>=13){const u=(s.cargo[0]-s.boatX)/l.boatWidth+.5,v=(s.cargo[1]-(l.boatBase+s.boatBob-l.boatHeight))/l.boatHeight;
     checks.boatLocalFloor&&=Math.abs(u-.43)<1e-10&&Math.abs(v-.74)<1e-10;
    }
   }
   checks.turnsBeforeDeparture=true;checks.walkPhaseNeverResets=true;checks.walkRootContinuous=true;
   for(let t=0;t<24;t+=.01){const s=m.heroMotion(t,mobile),next=m.heroMotion(t+.005,mobile);
    if(t>=16)checks.turnsBeforeDeparture&&=s.receiverClip==='turn'&&s.receiverFrame===7;
    if(s.clip===next.clip&&['carry','return'].includes(s.clip)){
     checks.walkPhaseNeverResets&&=next.walkSample>=s.walkSample;
     checks.walkRootContinuous&&=Math.hypot(next.porter[0]-s.porter[0],next.porter[1]-s.porter[1])<.001;
    }
   }
   const a=m.heroMotion(6,mobile),b=m.heroMotion(6.59,mobile);
   checks.noStandingSlide=a.clip==='pivot'&&b.clip==='pivot'&&Math.hypot(a.porter[0]-b.porter[0],a.porter[1]-b.porter[1])<1e-10;
   return {frames,checks};
  },{width,height,mobile});
  assert.equal(data.frames[0].png,data.frames.at(-1).png,'Pixel-identical endpoints');
  for(const [key,value]of Object.entries(data.checks))assert(value,key);
  for(const f of data.frames)fs.writeFileSync(path.join(out,(mobile?'portrait':'landscape')+'-'+f.time+'.png'),Buffer.from(f.png.split(',')[1],'base64'));
  results.push({mobile,width,height,...data.checks,frames:data.frames.length,endpointPixelIdentical:true});
 }
 fs.writeFileSync(path.join(out,'delivery-report.json'),JSON.stringify({results},null,2));console.log(JSON.stringify(results));await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});

