(() => {
'use strict';
const $=id=>document.getElementById(id), canvas=$('mascot'), ctx=canvas.getContext('2d'), geometry=window.MASCOT_SPRITES,clips=geometry.clips;
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const segmenter=new Intl.Segmenter('vi',{granularity:'grapheme'});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const steps=[
 ['tab-invest','Chào bạn! Bấm Đầu tư để bắt đầu. Mình sẽ hướng dẫn từng bước.'],
 ['buy-cluster','Bấm Mở 1 cụm để có nơi bắt đầu sản xuất.'],
 ['hire-crew','Cụm này cần 5 người. Bấm Tuyển 5 người để có đủ một tổ.'],
 ['tab-company','Đã đủ người! Bấm Doanh nghiệp để xem cụm đang hoạt động.'],
 ['next-year','Sẵn sàng rồi! Bấm Sang năm để hoàn thành năm 1.']
];
const state={step:0,t:0,speaking:false,speech:null,mode:'wait',replayPoint:false,lab:null,
 cash:10000,clusters:0,workers:0,year:1,yearStarted:null,pending:false,epoch:0,completeAt:Infinity,complete:false,ready:false,frame:0,clip:'talk',opacity:1,pointProgress:0,pointName:'point',autoHint:false,hintUntil:Infinity,hintRequested:null,idleSince:0,cameraScale:1,worldAnchor:null};
const images={},bitmaps=Object.fromEntries(Object.keys(clips).map(name=>[name,[]]));let raf=0,last=0;
const gestureTiming={wave:{in:.52,hold:.55,out:.42},blink:{in:.40,hold:0,out:0},think:{in:.62,hold:Infinity,out:.40},confirm:{in:.58,hold:.38,out:.40},celebrate:{in:.64,hold:.65,out:.44}};
let gesture=null,queuedGesture=null;
function requestGesture(name){
 state.autoHint=false;state.hintRequested=null;
 if(reduced.matches)return;
 if(gesture)gesture.phase='out';
 queuedGesture=name;state.mode='wait';state.replayPoint=false;
}
function settleGesture(){queuedGesture=null;if(gesture)gesture.phase='out';}
function animateGesture(dt){
 if(!gesture&&queuedGesture&&state.pointProgress===0){gesture={name:queuedGesture,progress:0,phase:'in',held:0};queuedGesture=null;}
 if(!gesture)return;
 const g=gesture,timing=gestureTiming[g.name];
 if(reduced.matches){gesture=null;queuedGesture=null;return;}
 if(g.phase==='in'){g.progress=clamp(g.progress+dt/timing.in,0,1);if(g.progress===1)g.phase='hold';}
 else if(g.phase==='hold'){g.held+=dt;if(g.held>=timing.hold)g.phase='out';}
 else{g.progress=timing.out?clamp(g.progress-dt/timing.out,0,1):0;if(g.progress===0)gesture=null;}
}
function say(text,preserveGesture=false) {
 state.autoHint=false;state.hintRequested=null;
 text=text.normalize('NFC');if(!preserveGesture)settleGesture();
 state.replayPoint=false;
 const chars=Array.from(segmenter.segment(text),x=>x.segment);let cursor=0;
 const beats=chars.map(char=>{const start=cursor;cursor+=/[.!?]/.test(char)?.30:/[,;:]/.test(char)?.15:.048;return {char,start};});
 state.speech={text,chars,beats,total:cursor,time:0,index:0};state.speaking=!reduced.matches;state.mode='talk';
 $('dialogue').hidden=false;$('speech-text').textContent=reduced.matches?text:'';$('speech-announcement').textContent=text;
 if(reduced.matches)endSpeech();
}
function endSpeech() {
 const wasSpeaking=state.speaking;
 if(state.speech)$('speech-text').textContent=state.speech.text;
 state.speaking=false;state.mode='wait';state.idleSince=state.t;
 if(wasSpeaking&&!state.lab&&state.step<5&&!reduced.matches){state.pointName=targetDirection();state.autoHint=true;state.hintUntil=state.t+geometry.pointDuration+1.1;state.mode='point';}
 // No step change, automatic departure, timer start or gesture replay here.
}
function target(){return state.step<5?$(steps[state.step][0]):null;}
function panel(company){$('company-panel').hidden=!company;$('invest-panel').hidden=company;$('tab-invest').classList.toggle('selected',!company);$('tab-company').classList.toggle('selected',company);}
function render(){
 $('cash').textContent=state.cash===10000?'10 tỷ':(state.cash/1000).toLocaleString('vi-VN',{maximumFractionDigits:2})+' tỷ';
 $('year').textContent=String(state.year);$('cluster-state').textContent=state.clusters+' cụm';$('worker-state').textContent=state.workers+'/5 công nhân';
 $('stat-workers').textContent=String(state.workers);$('stat-operating').textContent=String(state.workers>=5?1:0);
 $('scene-status').textContent=state.clusters+' cụm · '+state.workers+' công nhân';
 $('operation-status').textContent=state.workers>=5?'Đang vận hành: 1 cụm':'Chưa vận hành';
 ['tab-invest','buy-cluster','hire-crew','tab-company','next-year'].forEach(id=>{
 const el=$(id),current=state.step<5&&id===steps[state.step][0];
 el.disabled=state.pending||!!state.lab||(state.step<5?!current:id!=='next-year'||!state.complete||state.t-state.yearStarted<5);
 el.classList.toggle('guide-target',current&&!state.lab&&!state.pending);
 });
 $('return-guide').hidden=!state.lab;
 document.querySelectorAll('[data-motion]').forEach(el=>{el.disabled=state.pending;el.setAttribute('aria-pressed',String(el.dataset.motion===state.lab));});
 $('next-year').querySelector('span').textContent=state.yearStarted===null?'Không có thời gian chờ':Math.ceil(Math.max(0,60-state.t+state.yearStarted))+'s';
}
function showStep(){state.lab=null;render();if(state.step<5)say(steps[state.step][1],gesture?.name==='confirm'||queuedGesture==='confirm');else{$('dialogue').hidden=true;state.opacity=0;}}
function restart(){state.epoch++;gesture=null;queuedGesture=null;Object.assign(state,{step:0,cash:10000,clusters:0,workers:0,year:1,yearStarted:null,pending:false,completeAt:Infinity,complete:false,opacity:1,lab:null,pointProgress:0,pointName:'point',autoHint:false,hintRequested:null,idleSince:state.t,replayPoint:false});panel(false);showStep();requestGesture('wave');}
async function click(id){
 if(state.complete&&id==='next-year'&&state.t-state.yearStarted>=5){state.year++;state.yearStarted=state.t;render();return;}
 if(state.pending||state.lab||state.step>=5||id!==steps[state.step][0])return;
 const epoch=state.epoch;endSpeech();state.pending=true;requestGesture('confirm');render();
 await new Promise(r=>setTimeout(r,300));if(epoch!==state.epoch)return;
 if(id==='buy-cluster'){state.clusters=1;state.cash-=220;}
 if(id==='hire-crew'){state.workers=5;state.cash-=200;}
 if(id==='tab-company')panel(true);
 state.pending=false;state.step++;
 if(id==='next-year'){state.speech=null;requestGesture('celebrate');state.completeAt=state.t+(reduced.matches?.1:2.4);$('dialogue').hidden=true;render();return;}
 showStep();
}
function lab(kind){
 state.lab=kind;state.opacity=1;
 state.autoHint=false;state.hintRequested=null;state.idleSince=state.t;
 settleGesture();
 if(kind==='talk')say('Mình đang nói bằng các khung hình nguyên nhân vật. Hết lời, mình sẽ khép miệng và chờ bạn bấm.');
 else if(gestureTiming[kind]){state.speaking=false;state.speech=null;requestGesture(kind);$('dialogue').hidden=false;$('speech-text').textContent=({wave:'Chào bạn! Mình sẽ cùng bạn bắt đầu năm đầu tiên.',blink:'Mình vẫn ở đây và chờ bạn thao tác.',think:'Bạn cứ chọn khi đã sẵn sàng. Mình sẽ chờ.',confirm:'Đúng rồi! Bạn đã hoàn thành thao tác này.',celebrate:'Tuyệt vời! Bạn đã hoàn thành năm đầu tiên.'})[kind];}
 else if(kind.startsWith('point')){state.speaking=false;state.speech=null;state.replayPoint=state.pointProgress>0;state.hintRequested=kind;state.mode=state.replayPoint?'wait':'point';if(!state.replayPoint)state.pointName=kind;$('dialogue').hidden=false;$('speech-text').textContent='Mắt và đầu nhìn theo hướng tay. Thu tay về trước khi đổi hướng chỉ.';}
 else{state.speech=null;state.speaking=false;state.mode='wait';state.replayPoint=false;$('dialogue').hidden=false;$('speech-text').textContent='Mình đang chờ bạn thao tác. Không tự chuyển bước.';}
 render();
}
function layout(){
 const rect=$('character-stage').getBoundingClientRect(),compact=innerWidth<1024;
 const plate=$('advisor-nameplate'),plateHeight=compact?33:39;
 const bounds=geometry.actorBounds||{above:.9,below:.14};
 const height=Math.min(compact?145:225,(rect.height-plateHeight-24)/(bounds.above+bounds.below));
 const x=rect.left+(compact?100:170);
 const extraAbove=Math.max(0,bounds.above-geometry.waistFraction)*height;
 const bodyBottom=(geometry.waistFraction+bounds.below)*height;
 let top=clamp(rect.top+14,14+extraAbove,innerHeight-bodyBottom-plateHeight-22);
 const bubble=$('dialogue'),width=Math.min(rect.width,innerWidth-rect.left-12),left=Math.max(8,rect.left);
 const r=target()?.getBoundingClientRect();
 const plateWidth=compact?174:210;
 // Keep the whole actor and its plaque out of the current button's hit area.
 if(r&&r.right>x-plateWidth/2&&r.left<x+plateWidth/2&&r.bottom>top-extraAbove&&r.top<top+bodyBottom+plateHeight+8){top=r.top>innerHeight*.5?14+extraAbove:innerHeight-bodyBottom-plateHeight-22;}
 const plateTop=top+height-2;
 plate.hidden=state.opacity<=0;plate.style.left=clamp(x-plateWidth/2,8,innerWidth-plateWidth-8)+'px';plate.style.top=plateTop+'px';
 bubble.style.width=width+'px';
 const bubbleHeight=Math.max(90,bubble.getBoundingClientRect().height);
 let bubbleTop=clamp(Math.max(rect.bottom+5,plateTop+plateHeight+8),12,innerHeight-bubbleHeight-12);
 if(r&&r.top<bubbleTop+bubbleHeight+8&&r.bottom>bubbleTop-8&&r.right>left&&r.left<left+width){
  bubbleTop=r.top-bubbleHeight-12>plateTop+plateHeight? r.top-bubbleHeight-12 : clamp(r.bottom+12,12,innerHeight-bubbleHeight-12);
 }
 bubble.style.left=left+'px';bubble.style.top=bubbleTop+'px';bubble.style.width=width+'px';
 return {x,top,height,plateTop,origin:[x,top+height*.43]};
}
function directionFor(dx,dy){const side=dx<0?'left':'right';return dy < -Math.abs(dx)*.55?(side==='right'?'point':'point-up-left'):dy>Math.abs(dx)*.65?'point-down-'+side:'point-'+side;}
function targetDirection(){const r=target()?.getBoundingClientRect();if(!r)return 'point-right';const box=layout();return directionFor(r.left+r.width/2-box.origin[0],r.top+r.height/2-box.origin[1]);}
function draw(){
 const dpr=Math.min(devicePixelRatio||1,2);
 if(canvas.width!==Math.round(innerWidth*dpr)||canvas.height!==Math.round(innerHeight*dpr)){canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);
 if(state.opacity<=0){$('advisor-nameplate').hidden=true;return;}
 const box=layout();let name='talk',index=0;
 if(gesture){name=gesture.name;index=Math.min(7,Math.floor(gesture.progress*8));}
 else if(state.pointProgress>0){
 name=state.pointName;
 const keys=[0,.0625,1/6,7/24,7/16,29/48,19/24,1];
 for(let i=1;i<keys.length;i++)if(state.pointProgress+1e-6>=keys[i])index=i;
 }else if(state.speaking&&!reduced.matches){
 const sequence=[0,1,2,1,0,4,1,0];index=sequence[Math.floor(state.speech.time*7)%sequence.length];
 const beat=state.speech.beats[Math.max(0,state.speech.index-1)];if(beat&&/[\s.!?,;:]/.test(beat.char))index=0;
 }else if(!reduced.matches){name='breathe';index=Math.floor(((state.t-state.idleSince)%4.2)/4.2*8);}
 let frame=clips[name].frames[index];
 if(frame.shared){const [asset,n]=frame.shared.split(':');frame=clips[asset].frames[Number(n)];}
 const scale=box.height/geometry.referenceHeight*frame.cameraScale;
 // One isolated whole-actor bitmap. Transparent margins cannot sample any neighbouring frame.
 // Common waist coordinates keep the torso steady while the authored head is free to look up.
 const waistY=box.top+box.height*geometry.waistFraction;
 const x=box.x-frame.anchor[0]*scale,y=waistY-frame.anchor[1]*scale;
 ctx.save();ctx.globalAlpha=state.opacity;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(bitmaps[name][index],x,y,frame.rect[2]*scale,frame.rect[3]*scale);ctx.restore();
 state.frame=index;state.clip=name;state.cameraScale=frame.cameraScale;state.worldAnchor=[box.x,waistY];
}
function tick(now){
 const dt=last?clamp((now-last)/1000,0,.12):0;last=now;state.t+=dt;
 if(state.autoHint&&state.mode==='point'){
  const desired=targetDirection();
  if(desired!==state.pointName){state.hintRequested=desired;state.mode='wait';}
  else if(state.t>=state.hintUntil){state.autoHint=false;state.mode='wait';state.idleSince=state.t;}
 }
 const towardPoint=state.mode==='point'&&!gesture&&!queuedGesture;
 state.pointProgress=reduced.matches?(towardPoint?1:0):clamp(state.pointProgress+(towardPoint?dt/geometry.pointDuration:-dt/geometry.returnDuration),0,1);
 if((state.replayPoint||state.hintRequested)&&state.pointProgress===0){state.replayPoint=false;if(state.hintRequested){state.pointName=state.hintRequested;state.hintRequested=null;}state.mode='point';state.hintUntil=state.t+geometry.pointDuration+1.1;}
 animateGesture(dt);
 if(state.speaking&&state.pointProgress===0&&!gesture&&!queuedGesture){const sp=state.speech;sp.time+=dt;while(sp.index<sp.beats.length&&sp.time>=sp.beats[sp.index].start)sp.index++;$('speech-text').textContent=sp.chars.slice(0,sp.index).join('');if(sp.time>=sp.total)endSpeech();}
 if(state.completeAt!==Infinity&&state.t>=state.completeAt){state.completeAt=Infinity;state.complete=true;state.year=2;state.yearStarted=state.t;state.opacity=0;render();}
 if(state.yearStarted!==null){$('next-year').querySelector('span').textContent=Math.ceil(Math.max(0,60-state.t+state.yearStarted))+'s';if(!state.lab)$('next-year').disabled=state.t-state.yearStarted<5;}
 draw();raf=requestAnimationFrame(tick);
}
['tab-invest','buy-cluster','hire-crew','tab-company','next-year'].forEach(id=>$(id).addEventListener('click',()=>void click(id)));
$('restart').addEventListener('click',restart);$('return-guide').addEventListener('click',()=>{panel(state.step>=4);showStep();});
$('dialogue').addEventListener('click',endSpeech);
document.querySelectorAll('[data-motion]').forEach(el=>el.addEventListener('click',()=>lab(el.dataset.motion)));
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else if(!raf&&state.ready){last=0;raf=requestAnimationFrame(tick);}});
Promise.all(Object.keys(clips).map(name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[name]=im;resolve();};im.onerror=reject;im.src=clips[name].src;})))
.then(async()=>{
 for(const name of Object.keys(clips))for(let i=0;i<clips[name].frames.length;i++){
  const f=clips[name].frames[i];if(f.shared)continue;
  bitmaps[name][i]=await createImageBitmap(images[name],...f.rect);
 }
 for(const name of Object.keys(clips))for(let i=0;i<clips[name].frames.length;i++){const shared=clips[name].frames[i].shared;if(shared){const [asset,n]=shared.split(':');bitmaps[name][i]=bitmaps[asset][Number(n)];}}
 state.ready=true;$('loading').hidden=true;restart();raf=requestAnimationFrame(tick);
}).catch(()=>{$('loading').textContent='Không mở được các ảnh nguyên nhân vật.';});
window.mascotPreview={directionFor,debug:()=>({gesture:gesture?{...gesture}:null,queuedGesture,ready:state.ready,step:state.step,year:state.year,cash:state.cash,clusters:state.clusters,workers:state.workers,speaking:state.speaking,frame:state.frame,clip:state.clip,mode:state.mode,opacity:state.opacity,complete:state.complete,yearTwoRemaining:state.yearStarted===null?null:Math.max(0,60-state.t+state.yearStarted),text:$('speech-text').textContent,target:target()?.id,lab:state.lab,wholeCharacter:true,pointProgress:state.pointProgress,pointDuration:geometry.pointDuration,returnDuration:geometry.returnDuration,sharedIdle:bitmaps.point[0]===bitmaps.talk[0],cameraScale:state.cameraScale,worldAnchor:state.worldAnchor,pointName:state.pointName,autoHint:state.autoHint,expectedDirection:targetDirection(),idleSince:state.idleSince,t:state.t})};
})();
