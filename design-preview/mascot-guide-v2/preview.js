(() => {
'use strict';
const byId = id => document.getElementById(id);
const canvas = byId('mascot');
const ctx = canvas.getContext('2d');
const rig = window.MASCOT_RIG;
const painting = new Image();
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const segments = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('vi', {granularity:'grapheme'}) : null;
const glyphs = text => segments ? Array.from(segments.segment(text), s => s.segment) : Array.from(text);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a,b,t) => a+(b-a)*t;
const damp = (a,b,k,dt) => lerp(a,b,1-Math.exp(-k*dt));
const ease = t => t*t*(3-2*t);
const steps = [
 {target:'tab-invest', text:'Chào bạn! Mình sẽ hướng dẫn năm đầu. Bấm Đầu tư để bắt đầu nhé.'},
 {target:'buy-cluster', text:'Đầu tiên, mở một cụm sản xuất. Bấm Mở 1 cụm ở thẻ máy móc.'},
 {target:'hire-crew', text:'Cụm này cần 5 công nhân. Bấm Tuyển 5 người để có đủ một tổ.'},
 {target:'tab-company', text:'Đủ người rồi! Bấm Doanh nghiệp để xem cụm đang hoạt động.'},
 {target:'next-year', text:'Mọi thứ đã sẵn sàng. Bấm Sang năm để chốt năm đầu và bước sang năm 2.'}
];
const state = {
 step:0, clusters:0, workers:0, cash:10000, year:1, pending:false, lab:null,
 t:0, speech:null, speechGlyph:'', mouth:0, mouthShape:'wide', speaking:false,
 opacity:0, entry:1, active:true, confirmUntil:0, waveUntil:0, exitAt:Infinity,
 head:0, left:[-96,-34], right:[96,-34], blink:1, blinkAt:2.6,
 pose:'welcome', returnFocus:false, ready:false, epoch:0, guideComplete:false, completingAt:Infinity, yearTwoStart:null,
 fingerCurl:0, handAngle:Math.PI/2, fingers:[.3,.4,.45,.5,.25],leftFingers:[.3,.4,.45,.5,.25],leftHandAngle:Math.PI/2
};
let frameId=0, last=0, viewport={width:0,height:0,dpr:1};
let locationCache=null;
const live = byId('speech-announcement');
function say(text) {
 byId('dialogue').hidden=false;
 const chars=glyphs(text), beats=[];
 let cursor=0;
 chars.forEach(char => {
   const duration = /[.!?]/.test(char)? .29 : /[,;:]/.test(char)? .15 : /\s/.test(char)? .045 : .043;
   beats.push({char,start:cursor,end:cursor+duration});
   cursor+=duration;
 });
 state.speech={text,chars,beats,clock:0,total:cursor,index:0};
 state.speaking=!reduceMotion.matches;
 state.speechGlyph='';
 byId('speech-text').textContent=reduceMotion.matches?text:'';
 live.textContent=text;
 if(reduceMotion.matches) finishSpeech();
 byId('show-all').hidden=true;
 byId('speech-state').textContent=reduceMotion.matches?'Chờ bạn thao tác':'Đang hướng dẫn…';
}
function finishSpeech() {
 if(state.speech) {
   state.speech.clock=state.speech.total;
   state.speech.index=state.speech.chars.length;
   byId('speech-text').textContent=state.speech.text;
 }
 state.speaking=false;
 state.speechGlyph='';
 byId('show-all').hidden=true;
 byId('speech-state').textContent=state.step>=5&&!state.lab?'Đã hoàn tất hướng dẫn':'Chờ bạn thao tác';
}
function updateSpeech(dt) {
 const sp=state.speech;
 if(!sp || !state.speaking)return;
 sp.clock+=dt;
 while(sp.index<sp.beats.length && sp.clock>=sp.beats[sp.index].start)sp.index++;
 const active=sp.beats[Math.max(0,sp.index-1)];
 state.speechGlyph=active?active.char:'';
 byId('speech-text').textContent=sp.chars.slice(0,sp.index).join('');
 if(sp.clock>=sp.total)finishSpeech();
}
function setPanel(company) {
 byId('company-panel').hidden=!company;
 byId('invest-panel').hidden=company;
 byId('tab-company').classList.toggle('selected',company);
 byId('tab-invest').classList.toggle('selected',!company);
}
function renderState() {
 byId('cash').textContent=state.cash===10000?'10 tỷ':(state.cash/1000).toLocaleString('vi-VN',{maximumFractionDigits:2})+' tỷ';
 byId('year').textContent=String(state.year);
 byId('cluster-state').textContent=state.clusters+' cụm';
 byId('worker-state').textContent=state.workers+'/5 công nhân';
 byId('stat-workers').textContent=String(state.workers);
 byId('stat-operating').textContent=String(Math.min(state.clusters,Math.floor(state.workers/5)));
 byId('operation-status').textContent=state.workers>=5?'Đang vận hành: 1 cụm':'Chưa vận hành';
 byId('scene-status').textContent=state.clusters+' cụm · '+state.workers+' công nhân'+(state.workers>=5?' · Đủ người vận hành':'');
 byId('step-count').textContent=state.step<5?(state.step+1)+'/5':'Hoàn tất';
 ['tab-invest','buy-cluster','hire-crew','tab-company','next-year'].forEach(id=>{
   const el=byId(id);
   el.disabled=state.pending||!!state.lab||(state.step>=5 ? id!=='next-year'||state.yearTwoStart===null||state.t-state.yearTwoStart<5 : steps[state.step].target!==id);
   el.classList.toggle('guide-target',!state.lab&&!state.pending&&state.step<5&&steps[state.step].target===id);
 });
 document.querySelectorAll('[data-motion]').forEach(el=>{el.setAttribute('aria-pressed',String(el.dataset.motion===state.lab));el.disabled=state.pending;});
 byId('return-guide').hidden=!state.lab;
 byId('next-year').querySelector('span').textContent=state.yearTwoStart===null?'Không có thời gian chờ':Math.ceil(Math.max(0,60-(state.t-state.yearTwoStart)))+'s';
 locationCache=null;
}
function currentTarget() {
 if(state.lab==='point')return byId('buy-cluster');
 return state.step<5?byId(steps[state.step].target):null;
}
function showStep() {
 state.active=true;state.exitAt=Infinity;state.lab=null;
 renderState();
 if(state.step>=5){
   say('Bạn đã bước sang năm 2! Từ đây, hãy tự quyết định hướng đi cho doanh nghiệp nhé.');
   state.waveUntil=state.t+20;
   return;
 }
 say(steps[state.step].text);
}
function restart() {
 state.epoch++;
 state.step=0;state.clusters=0;state.workers=0;state.cash=10000;state.year=1;
 state.lab=null;state.pending=false;state.active=true;state.exitAt=Infinity;
 state.entry=1;state.opacity=0;state.confirmUntil=0;state.waveUntil=state.t+1.8;
 state.guideComplete=false;state.completingAt=Infinity;state.yearTwoStart=null;
 setPanel(false);showStep();
}
async function interact(id) {
 if(state.guideComplete&&id==='next-year'&&state.t-state.yearTwoStart>=5){state.year++;state.yearTwoStart=state.t;renderState();return;}
 if(!state.ready||state.pending||state.lab||state.step>=5||steps[state.step].target!==id)return;
 const epoch=state.epoch;
 finishSpeech();state.pending=true;renderState();
 byId('speech-state').textContent='Đang xác nhận thao tác trong bản thử…';
 // Local mock acknowledgement only; this preview never calls the game API.
 await new Promise(resolve=>setTimeout(resolve,360));
 if(epoch!==state.epoch)return;
 if(id==='buy-cluster'){state.clusters=1;state.cash-=220;}
 if(id==='hire-crew'){state.workers=5;state.cash-=200;}
 if(id==='tab-company')setPanel(true);
 if(id==='next-year') {
   state.pending=false;state.step=5;state.completingAt=state.t+.9;state.confirmUntil=state.t+.9;
   state.speaking=false;state.speech=null;state.mouth=0;byId('dialogue').hidden=true;
   renderState();return;
 }
 state.pending=false;state.step++;state.confirmUntil=state.t+1.15;
 showStep();
}
function playMotion(kind) {
 state.lab=kind;state.active=true;state.exitAt=Infinity;
 state.opacity=Math.max(.1,state.opacity);
 byId('step-count').textContent='Thử chuyển động';
 if(kind==='welcome'){state.waveUntil=state.t+3;say('Chào bạn! Mình là người hướng dẫn. Cùng bắt đầu xây dựng doanh nghiệp nhé!');}
 else if(kind==='talk')say('Khi lời thoại đang hiện, miệng mình cử động. Hết lời, mình khép miệng và chờ bạn thao tác.');
 else if(kind==='point')say('Nhìn nút Mở 1 cụm bên kia nhé. Mình sẽ chỉ đúng hướng để bạn dễ nhận ra.');
 else if(kind==='think'){say('Mình sẽ chờ ở đây. Bạn cứ xem kỹ rồi hãy quyết định nhé.');}
 else if(kind==='confirm'){state.confirmUntil=state.t+3;say('Đúng rồi! Thao tác của bạn đã được xác nhận.');}
 else if(kind==='celebrate'){state.waveUntil=state.t+5;say('Tuyệt lắm! Bạn đã hoàn thành năm đầu tiên.');}
 else if(kind==='exit'){say('Hẹn gặp lại! Chúc doanh nghiệp của bạn ngày càng phát triển.');state.exitAt=state.t+3.9;}
 renderState();byId('step-count').textContent='Thử chuyển động';
}
function getLayout() {
 if(locationCache)return locationCache;
 const rect=byId('character-stage').getBoundingClientRect();
 const mobile=innerWidth<640;
 const compact=innerWidth<1024;
 const height=Math.min(compact?160:251,rect.height-23);
 const scale=height/466;
 const x=rect.left+(compact?58:Math.max(78,Math.min(rect.width*.20,104)));
 let y=clamp(rect.bottom-12,mobile?185:280,innerHeight-28);
 const bubble=byId('dialogue');
 const width=mobile?Math.min(250,innerWidth-rect.left-118):compact?rect.width-116:Math.min(325,innerWidth-rect.left-185);
 const left=compact?rect.left+112:rect.left+165;
 let top=clamp(rect.top+18,12,innerHeight-174);
 const target=currentTarget(),r=target?target.getBoundingClientRect():null;
 if(r&&r.top<top+155&&r.bottom>top-10&&r.right>left&&r.left<left+width){top=innerHeight-175;y=innerHeight-20;}
 bubble.style.left=left+'px';bubble.style.top=top+'px';bubble.style.width=width+'px';
 locationCache={x,y,scale,rect};
 return locationCache;
}
function resize() {
 const dpr=Math.min(devicePixelRatio||1,2);
 viewport={width:innerWidth,height:innerHeight,dpr};
 canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);
 locationCache=null;
}
function sprite(name,x,y,w,h) {
 const r=rig.parts[name];
 ctx.drawImage(painting,r[0],r[1],r[2],r[3],x,y,w,h);
}
function bone(name,a,b,pivot,end) {
 const r=rig.parts[name];
 const px=pivot[0]*r[2],py=pivot[1]*r[3];
 const ex=end[0]*r[2],ey=end[1]*r[3];
 const sourceLength=Math.hypot(ex-px,ey-py);
 const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
 ctx.save();ctx.translate(a[0],a[1]);
 ctx.rotate(Math.atan2(b[1]-a[1],b[0]-a[0])-Math.atan2(ey-py,ex-px));
 ctx.scale(length/sourceLength,length/sourceLength);
 ctx.drawImage(painting,r[0],r[1],r[2],r[3],-px,-py,r[2],r[3]);ctx.restore();
}
function solveArm(shoulder,wrist,side) {
 const l1=81,l2=70;
 const dx=wrist[0]-shoulder[0],dy=wrist[1]-shoulder[1];
 const distance=clamp(Math.hypot(dx,dy),14,l1+l2-.2);
 const direction=Math.atan2(dy,dx);
 const bend=Math.acos(clamp((l1*l1+distance*distance-l2*l2)/(2*l1*distance),-1,1));
 const theta=direction+side*bend;
 const elbow=[shoulder[0]+Math.cos(theta)*l1,shoulder[1]+Math.sin(theta)*l1];
 const hand=[shoulder[0]+Math.cos(direction)*distance,shoulder[1]+Math.sin(direction)*distance];
 return {shoulder,elbow,hand};
}
function paintArm(arm) {
 const a=arm.shoulder,b=arm.elbow,c=arm.hand;
 const skin=ctx.createLinearGradient(b[0]-16,b[1],b[0]+16,b[1]+20);skin.addColorStop(0,'#f6bb7e');skin.addColorStop(1,'#df9658');
 ctx.lineCap='round';ctx.lineJoin='round';
 ctx.beginPath();ctx.moveTo(b[0],b[1]);ctx.quadraticCurveTo((b[0]+c[0])*.5+2,(b[1]+c[1])*.5,c[0],c[1]);
 ctx.strokeStyle='#503124';ctx.lineWidth=33;ctx.stroke();ctx.strokeStyle=skin;ctx.lineWidth=28;ctx.stroke();
 const cloth=ctx.createLinearGradient(a[0]-20,a[1],a[0]+20,a[1]+30);cloth.addColorStop(0,'#fff0ca');cloth.addColorStop(1,'#dfbd83');
 ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo((a[0]+b[0])*.5,(a[1]+b[1])*.5-2,b[0],b[1]);
 ctx.strokeStyle='#503124';ctx.lineWidth=46;ctx.stroke();ctx.strokeStyle=cloth;ctx.lineWidth=41;ctx.stroke();
 ctx.save();ctx.translate(b[0],b[1]);ctx.rotate(Math.atan2(b[1]-a[1],b[0]-a[0])-Math.PI/2);
 ctx.fillStyle='#f6dfaf';ctx.strokeStyle='#6e4d30';ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(0,0,22,7,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
}
function hand(name,at,angle,wave) {
 const right=at[0]>0;
 const presets={relaxed:[.3,.4,.45,.5,.25],point:[0,1,1,1,.8],wave:[0,0,0,0,0],thumb:[1,1,1,1,0],fist:[1,1,1,1,1]};
 const curls=right?state.fingers:state.leftFingers;
 ctx.save();ctx.translate(at[0],at[1]);ctx.rotate(angle-Math.PI/2+(wave||0));
 if(!right)ctx.scale(-1,1);
 const skin=ctx.createLinearGradient(-18,0,20,40);skin.addColorStop(0,'#f6bb7e');skin.addColorStop(1,'#df9658');
 ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#503124';
 const bases=[[-11,18],[-4,23],[4,22],[11,18]],lengths=[28,32,30,24];
 bases.forEach((base,i)=>{
   const curl=curls[i],spread=[-.17,-.04,.05,.20][i];let x=base[0],y=base[1];
   ctx.beginPath();ctx.moveTo(x,y);
   for(let j=0;j<3;j++){
    const len=lengths[i]*[.43,.33,.24][j]*(1-curl*.62);
    const theta=spread+curl*j*.36;
    x+=Math.sin(theta)*len;y+=Math.cos(theta)*len;ctx.lineTo(x,y);
   }
   ctx.strokeStyle='#503124';ctx.lineWidth=9.6;ctx.stroke();ctx.strokeStyle=skin;ctx.lineWidth=6.4;ctx.stroke();
 });
 ctx.beginPath();ctx.moveTo(-9,-7);ctx.bezierCurveTo(-12,3,-18,7,-18,19);ctx.quadraticCurveTo(-15,30,0,31);ctx.quadraticCurveTo(17,29,17,17);ctx.quadraticCurveTo(16,4,9,-7);
 ctx.fillStyle=skin;ctx.fill();ctx.strokeStyle='#503124';ctx.lineWidth=2.6;ctx.stroke();
 const thumbLength=25*(1-curls[4]*.60),thumbAngle=name==='thumb'?.10:1.04+curls[4]*.25;
 ctx.beginPath();ctx.moveTo(13,8);ctx.quadraticCurveTo(18,12,13+Math.sin(thumbAngle)*thumbLength,8+Math.cos(thumbAngle)*thumbLength);
 ctx.strokeStyle='#503124';ctx.lineWidth=10;ctx.stroke();ctx.strokeStyle=skin;ctx.lineWidth=6.9;ctx.stroke();
 ctx.restore();
}
function eye(x,y,look,blink,happy) {
 ctx.save();ctx.translate(x,y);
 ctx.lineWidth=2.4;ctx.strokeStyle='#3b2019';ctx.lineCap='round';
 if(happy||blink<.12) {
  ctx.beginPath();ctx.moveTo(-11,1);ctx.quadraticCurveTo(0,happy?-12:4,11,1);ctx.stroke();
 } else {
  ctx.scale(1,Math.max(.10,blink));ctx.fillStyle='#fff8dd';
  ctx.beginPath();ctx.ellipse(0,0,11.5,16,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#2e211b';ctx.beginPath();ctx.ellipse(look,2,7,10.6,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fffbe9';ctx.beginPath();ctx.ellipse(look+2.1,-2.6,2.8,3.6,-.2,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
function face(t,look,pose) {
 const happy=pose==='confirm'||pose==='celebrate'||pose==='welcome';
 const talk=state.speaking && !reduceMotion.matches;
 // Features are vector facial controls on the generated raster head.
 const browLift=talk?1.4*Math.sin(t*4):0;
 ctx.strokeStyle='#38221b';ctx.lineWidth=5.1;ctx.lineCap='round';
 [-1,1].forEach(side=>{
  ctx.save();ctx.translate(side*31,-111-browLift);ctx.rotate(side*(pose==='think'?.12:-.035));
  ctx.beginPath();ctx.moveTo(-12,2);ctx.quadraticCurveTo(0,-4,13,0);ctx.stroke();ctx.restore();
 });
 eye(-31,-91,look,state.blink,happy&&!talk);
 eye(31,-91,look,state.blink,happy&&!talk);
 const open=state.mouth;
 ctx.save();ctx.translate(0,-39);ctx.lineWidth=2.5;ctx.strokeStyle='#57251e';
 if(open<.07) {
  ctx.beginPath();ctx.moveTo(-14,0);ctx.quadraticCurveTo(0,7.5,14,-1);ctx.stroke();
 } else {
  const rounded=state.mouthShape==='round';
  const width=rounded?13+open*8:24+open*13;
  const height=3+open*22;
  ctx.fillStyle='#59221f';ctx.beginPath();
  ctx.moveTo(-width/2,-2);ctx.quadraticCurveTo(0,1,width/2,-2);
  ctx.bezierCurveTo(width/2+2,height,-width/2-2,height,-width/2,-2);
  ctx.closePath();ctx.fill();ctx.stroke();
  ctx.save();ctx.clip();ctx.fillStyle='#fff0cd';ctx.fillRect(-width/2-1,-4,width+2,6);
  if(open>.38){ctx.fillStyle='#d67460';ctx.beginPath();ctx.ellipse(0,height*.73,width*.32,height*.22,0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }
 ctx.restore();
}
function setPose(dt) {
 const t=state.t;
 let pose=state.lab||'point';
 if(!state.lab && t<state.waveUntil && state.step===0)pose='welcome';
 if(!state.lab && state.step>=5)pose='celebrate';
 if(!state.lab && t<state.confirmUntil)pose='confirm';
 if(state.lab==='talk')pose='talk';
 if(state.lab==='exit')pose='wave';
 state.pose=pose;
 const normal=state.speechGlyph.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const voiced=state.speaking && !/[\s.,!?;:]/.test(normal) && normal!=='';
 const bilabial=/[mbp]/.test(normal);
 let mouthTarget=voiced&&!bilabial ? .18+.75*(.5+.5*Math.sin(t*Math.PI*2*5.4)) : 0;
 if(reduceMotion.matches)mouthTarget=0;
 state.mouth=damp(state.mouth,mouthTarget,32,dt);
 state.mouthShape=/[ou]/.test(normal)?'round':'wide';
 if(t>state.blinkAt+.22)state.blinkAt=t+2.6+1.1*(.5+.5*Math.sin(t*1.73));
 const blinkPhase=t-state.blinkAt;
 state.blink=blinkPhase>=0&&blinkPhase<=.22 ? Math.abs(blinkPhase-.11)/.11 : 1;
 if(reduceMotion.matches)state.blink=1;
 const nod=pose==='confirm'?.12*Math.sin(t*9.5):0;
 const tilt=pose==='think'?-.10:state.speaking?.015*Math.sin(t*5.6):0;
 state.head=damp(state.head,reduceMotion.matches?0:nod+tilt,12,dt);
 const left=[-107,-62],right=[107,-62];
 let rightKind='relaxed',leftKind='relaxed',angle=Math.PI/2,leftAngle=Math.PI/2;
 if(pose==='point'||pose==='talk') {
  if(pose==='point') {
   const target=currentTarget();
   const lay=getLayout();
   const box=target?target.getBoundingClientRect():null;
   const dx=box?(box.left+box.width*.5-lay.x)/lay.scale:350;
   const dy=box?(box.top+box.height*.5-lay.y)/lay.scale:-198;
   const a=clamp(Math.atan2(dy+198,dx-90),-.65,.70);
   const reach=innerWidth<1024?102:145;
   right[0]=90+Math.cos(a)*reach;right[1]=-198+Math.sin(a)*reach;
   const br=byId('dialogue').getBoundingClientRect();
   right[1]=Math.max(right[1],(br.bottom+16-lay.y)/lay.scale);
   rightKind='point';angle=Math.atan2(dy-right[1],dx-right[0]);
  } else {
   right[0]=143;right[1]=-218;rightKind='wave';angle=-.65;
  }
 } else if(pose==='welcome'||pose==='celebrate'||pose==='wave') {
  left[0]=-122;left[1]=-302;leftKind='wave';leftAngle=-Math.PI/2;
  if(pose==='celebrate'){right[0]=119;right[1]=-110;rightKind='fist';}
 } else if(pose==='confirm') {
  left[0]=-143;left[1]=-253;leftKind='thumb';leftAngle=-Math.PI/2;
 } else if(pose==='think') {
  right[0]=53;right[1]=-263;rightKind='fist';angle=-Math.PI/2;
 }
 for(let i=0;i<2;i++){
  state.left[i]=damp(state.left[i],left[i],8,dt);
  state.right[i]=damp(state.right[i],right[i],8,dt);
 }
 const curls={relaxed:[.3,.4,.45,.5,.25],point:[0,1,1,1,.8],wave:[0,0,0,0,0],thumb:[1,1,1,1,0],fist:[1,1,1,1,1]}[rightKind];
 const leftCurls={relaxed:[.3,.4,.45,.5,.25],point:[0,1,1,1,.8],wave:[0,0,0,0,0],thumb:[1,1,1,1,0],fist:[1,1,1,1,1]}[leftKind];
 state.fingers=state.fingers.map((v,i)=>damp(v,curls[i],10,dt));
 state.leftFingers=state.leftFingers.map((v,i)=>damp(v,leftCurls[i],10,dt));
 const delta=Math.atan2(Math.sin(angle-state.handAngle),Math.cos(angle-state.handAngle));
 state.handAngle+=delta*(1-Math.exp(-10*dt));
 const leftDelta=Math.atan2(Math.sin(leftAngle-state.leftHandAngle),Math.cos(leftAngle-state.leftHandAngle));
 state.leftHandAngle+=leftDelta*(1-Math.exp(-10*dt));
 return {pose,rightKind,leftKind,angle:state.handAngle,leftAngle:state.leftHandAngle};
}
function paint(dt) {
 const t=state.t,layout=getLayout(),spec=setPose(dt);
 state.opacity=damp(state.opacity,state.active?1:0,6,dt);
 state.entry=damp(state.entry,state.active?0:1,6,dt);
 ctx.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);
 ctx.clearRect(0,0,viewport.width,viewport.height);
 if(state.opacity<.005)return;
 ctx.save();ctx.globalAlpha=state.opacity;
 ctx.translate(layout.x-state.entry*38,layout.y+state.entry*30);
 ctx.scale(layout.scale,layout.scale);
 const breath=reduceMotion.matches?0:Math.sin(t*2.1)*1.6;
 ctx.translate(0,-breath);
 const left=solveArm([-90,-198],state.left,-1);
 const right=solveArm([90,-198],state.right,1);
 paintArm(left);paintArm(right);
 ctx.save();ctx.translate(0,-238);ctx.rotate(state.head);
 sprite('head',-105,-228,210,238);
 const target=currentTarget(),box=target?target.getBoundingClientRect():null;
 face(t,box?clamp((box.left-layout.x)/200,-2.4,2.4):0,spec.pose);
 ctx.restore();
 sprite('torso',-106,-245,212,245);
 const wave=(spec.pose==='welcome'||spec.pose==='celebrate'||spec.pose==='wave')&&!reduceMotion.matches?.23*Math.sin(t*7):0;
 hand(spec.leftKind,left.hand,spec.leftAngle,wave);
 hand(spec.rightKind,right.hand,spec.angle,0);
 ctx.restore();
}
function tick(timestamp) {
 if(!last)last=timestamp;
 const dt=clamp((timestamp-last)/1000,0,.05);last=timestamp;
 state.t+=dt;
 if(state.completingAt!==Infinity&&state.t>=state.completingAt){
  state.completingAt=Infinity;state.guideComplete=true;state.year=2;state.yearTwoStart=state.t;state.active=false;byId('dialogue').hidden=true;renderState();
 }
 if(state.yearTwoStart!==null){
  byId('next-year').querySelector('span').textContent=Math.ceil(Math.max(0,60-(state.t-state.yearTwoStart)))+'s';
  if(!state.lab)byId('next-year').disabled=state.t-state.yearTwoStart<5;
 }
 if(state.t>=state.exitAt)state.active=false;
 updateSpeech(dt);
 paint(dt);
 frameId=requestAnimationFrame(tick);
}
function start() {
 state.ready=true;resize();restart();
 byId('loading').hidden=true;
 frameId=requestAnimationFrame(tick);
}
['tab-invest','buy-cluster','hire-crew','tab-company','next-year'].forEach(id=>byId(id).addEventListener('click',()=>void interact(id)));
byId('show-all').addEventListener('click',finishSpeech);
byId('restart').addEventListener('click',restart);
byId('return-guide').addEventListener('click',()=>{setPanel(state.step>=4);showStep();});
document.querySelectorAll('[data-motion]').forEach(el=>el.addEventListener('click',()=>playMotion(el.dataset.motion)));
window.addEventListener('resize',resize);
window.addEventListener('scroll',()=>{locationCache=null;},{passive:true});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){cancelAnimationFrame(frameId);frameId=0;}
 else if(state.ready&&!frameId){last=0;frameId=requestAnimationFrame(tick);}
});
reduceMotion.addEventListener('change',()=>{if(reduceMotion.matches)finishSpeech();});
painting.onload=start;
painting.onerror=()=>{byId('loading').textContent='Không tải được nhân vật. Mở bản thử cùng thư mục assets.';};
painting.src=rig.image;
window.mascotPreview={
 debug:()=>({
  ready:state.ready,step:state.step,year:state.year,cash:state.cash,clusters:state.clusters,workers:state.workers,
  speaking:state.speaking,mouth:state.mouth,mouthShape:state.mouthShape,head:state.head,
  right:state.right.slice(),blink:state.blink,opacity:state.opacity,pose:state.pose,glyph:state.speechGlyph,
  text:byId('speech-text').textContent,fullText:state.speech?state.speech.text:'',lab:state.lab,
  target:currentTarget()?currentTarget().id:null,position:{...getLayout(),rect:undefined},guideComplete:state.guideComplete,yearTwoRemaining:state.yearTwoStart===null?null:Math.max(0,60-(state.t-state.yearTwoStart))
 })
};
})();
