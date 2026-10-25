// Dev-only, resumable compiler: an actual GIF/poster/master for EACH authored event.
// Artwork provenance is explicit: existing AI-painted industry/trait art + original SVG object drawings.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {eventCatalog,root} from './event-art-catalog.mjs';
import {subjectSvg,subjectPaint} from './event-subjects.mjs';
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_MODULE||'sharp');
sharp.concurrency(1);
const folder=path.join(root,'frontend/public/assets/ui/event-scenes-v2');
const review=path.join(root,'design-preview/event-scenes-v2');
fs.mkdirSync(folder,{recursive:true});fs.mkdirSync(review,{recursive:true});
const catalog=eventCatalog(),SIZE=96,FRAMES=72,FPS=25,TAU=Math.PI*2,VERSION=2;
const entries=[...catalog.entries,...catalog.contexts.map(c=>({...c,id:`context-${c.id}`,source:'context',art:null}))];
const selected=process.env.EVENT_SCENE_IDS?new Set(process.env.EVENT_SCENE_IDS.split(',')):null;
const POSTERS=process.argv.includes('--posters'),FORCE=process.argv.includes('--force');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const n=x=>Number(x.toFixed(3));
const photoCache=new Map(),motionCache=new Map(),paintedCache=new Map();
const cropBounds={family_fund:[14,650,302,291],heir_abroad:[327,652,307,294],heir_trained:[649,649,297,296],inheritance_dispute:[949,650,309,298],longevity:[20,957,296,295],illness:[331,957,301,292],life_insurance:[646,943,302,309],'state-aid':[948,943,310,310],enterprise:[46,66,561,520],centennial:[38,681,581,529]};
async function painted(name){
 if(!paintedCache.has(name))paintedCache.set(name,(async()=>{
  const [left,top,width,height]=cropBounds[name];
  const source=path.join(root,'frontend/public/assets/ui/painted-icons-v1',name==='enterprise'||name==='centennial'?'utility.webp':'enterprise.webp');
  const normalized=await sharp(source).resize(1280,1280,{fit:'fill'}).png().toBuffer();
  return sharp(normalized).extract({left,top,width,height}).resize(78,78,{fit:'inside'}).png().toBuffer();
 })());
 return paintedCache.get(name);
}
async function photo(art){
 if(!photoCache.has(art))photoCache.set(art,sharp(path.join(root,'frontend/public',art)).resize(92,72,{fit:'cover',position:'attention'}).png().toBuffer());
 return photoCache.get(art);
}
function flag(country){
 if(!country)return '';
 const solid=(y,h,color)=>`<rect x="0" y="${y}" width="20" height="${h}" fill="${color}"/>`;
 let inside='';
 switch(country){
  case 'vn':case 'cn':inside=solid(0,13,'#bc3b2d')+`<path d="M10 2l1.5 3h3L12 7l1 4-3-2-3 2 1-4-2.5-2h3Z" fill="#f4ca67"/>`;break;
  case 'jp':inside=solid(0,13,'#fff0d0')+`<circle cx="10" cy="6.5" r="3.6" fill="#be3936"/>`;break;
  case 'fr':case 'de':case 'id':case 'th':case 'no':case 'sg':case 'in':case 'qa':case 'kh':case 'tw':case 'kr':case 'au':case 'us':case 'br':case 'ph':case 'ca':case 'il':case 'eu':
   if(country==='fr')inside='<path d="M0 0H7V13H0Z" fill="#416582"/><path d="M7 0H14V13H7Z" fill="#fff0d1"/><path d="M14 0H20V13H14Z" fill="#bd453a"/>';
   else if(country==='de')inside=solid(0,4.33,'#443c32')+solid(4.33,4.33,'#bb4536')+solid(8.66,4.34,'#e3b34b');
   else if(country==='id')inside=solid(0,6.5,'#b83d33')+solid(6.5,6.5,'#fff0ce');
   else if(country==='th')inside=solid(0,13,'#ad3530')+solid(2,9,'#fff0d2')+solid(4,5,'#3c4965');
   else if(country==='sg')inside=solid(0,6.5,'#b83d33')+solid(6.5,6.5,'#fff0ce')+'<circle cx="5" cy="3.5" r="2.4" fill="#fff0d2"/><circle cx="6.2" cy="3" r="1.9" fill="#b83d33"/>';
   else if(country==='in')inside=solid(0,4.33,'#d69344')+solid(4.33,4.33,'#fff0d1')+solid(8.66,4.34,'#668850')+'<circle cx="10" cy="6.5" r="1.5" fill="none" stroke="#48627a" stroke-width=".6"/>';
   else if(country==='ca')inside=solid(0,13,'#c14e3b')+'<path d="M5 0H15V13H5Z" fill="#fff0d2"/><path d="M10 3l1 2 2-1-1 3 2 1-3 1-1 3-1-3-3-1 2-1-1-3 2 1Z" fill="#bf4636"/>';
   else if(country==='il')inside=solid(0,13,'#fff0d2')+solid(2,1.5,'#476b8f')+solid(9.5,1.5,'#476b8f')+'<path d="M10 4 13 8H7ZM10 9 7 5H13Z" fill="none" stroke="#476b8f" stroke-width=".5"/>';
   else if(country==='br')inside=solid(0,13,'#4e7851')+'<path d="M10 1 19 6.5 10 12 1 6.5Z" fill="#e1bd5b"/><circle cx="10" cy="6.5" r="3" fill="#46647b"/>';
   else if(country==='eu')inside=solid(0,13,'#415e84')+Array.from({length:12},(_,i)=>`<circle cx="${10+4*Math.sin(i*TAU/12)}" cy="${6.5+4*Math.cos(i*TAU/12)}" r=".6" fill="#e9bf57"/>`).join('');
   else if(country==='kr')inside=solid(0,13,'#fff0d2')+'<circle cx="10" cy="6.5" r="3" fill="#47768b"/><path d="M7 6.5a3 3 0 0 1 6 0Z" fill="#bd4a3d"/><path d="M2 2h3M15 11h3M2 11h3M15 2h3" stroke="#44382c" stroke-width="1"/>';
   else if(country==='qa')inside=solid(0,13,'#803c45')+'<path d="M0 0H6L5 1.3 6 2.6 5 3.9 6 5.2 5 6.5 6 7.8 5 9.1 6 10.4 5 11.7 6 13H0Z" fill="#fff0d2"/>';
   else if(country==='kh')inside=solid(0,13,'#496781')+solid(3,7,'#b9473d')+'<path d="M7 8V5H9V4H11V5H13V8Z" fill="#fff0ce"/>';
   else if(country==='tw')inside=solid(0,13,'#bd493a')+'<path d="M0 0H10V7H0Z" fill="#49617a"/><circle cx="5" cy="3.5" r="2" fill="#fff0cf"/>';
   else if(country==='ph')inside=solid(0,6.5,'#4a6684')+solid(6.5,6.5,'#b44a3e')+'<path d="M0 0 10 6.5 0 13Z" fill="#fff0d2"/><circle cx="3" cy="6.5" r="1.4" fill="#dfb353"/>';
   else if(country==='no')inside=solid(0,13,'#ba4b3f')+'<path d="M6 0V13M0 6H20" stroke="#fff0d2" stroke-width="3"/><path d="M6 0V13M0 6H20" stroke="#435b77" stroke-width="1.5"/>';
   else if(country==='us')inside=solid(0,13,'#fff0d2')+Array.from({length:7},(_,i)=>solid(i*2,1,'#b74c3e')).join('')+'<path d="M0 0H9V7H0Z" fill="#49617c"/><path d="M2 2H7M2 4H7" stroke="#fff0d2" stroke-width="1"/>';
   else inside=solid(0,13,'#49617c')+'<path d="M0 0 10 7M10 0 0 7M5 0V7M0 3.5H10" stroke="#fff0d2" stroke-width="1.3"/><circle cx="15" cy="9" r="1.5" fill="#fff0d2"/>';
   break;
  default:throw Error('Undrawn destination '+country);
 }
 return `<g transform="translate(70 5)"><path d="M-1 -1H21V14H-1Z" fill="#fff0cf" stroke="#644429" stroke-width="1"/>${inside}</g>`;
}
async function baseSvg(entry){
 const good=entry.good;
 const palette=/tree|sprout|leaf|wheat|fruit|palm|salad/.test(entry.subject)?['#7d9660','#dbe1a8']:/chip|wafer|monitor|server|car|robot|battery|pipe|plane|ship|crane|gear|machine|data|credit/.test(entry.subject)?['#779598','#e1dfbf']:/heart|ill|patient|medical/.test(entry.subject)?['#bb7d63','#efcfac']:['#bb9356','#f3dfa9'];
 const [main,light]=palette;
 let art='';
 if(entry.art){const img=await photo(entry.art);art=`<defs><clipPath id="vignette"><path d="M3 9Q14 2 25 7L43 3 61 6 79 2 93 9 91 27 95 41 87 55 91 70 70 74 55 70 39 76 20 71 4 75 7 55 1 41 5 24Z"/></clipPath></defs><image href="data:image/png;base64,${img.toString('base64')}" x="2" y="4" width="92" height="72" clip-path="url(#vignette)"/><path d="M4 10Q18 4 31 7M65 6 85 5M91 46 88 58M8 73 23 72" fill="none" stroke="#cfa66f" stroke-width=".7" opacity=".7"/>`;}
 else if(entry.painted){const img=await painted(entry.painted);art=`<image href="data:image/png;base64,${img.toString('base64')}" x="0" y="1" width="76" height="76"/>`;}
 else if(entry.source!=='context')art=`<g transform="translate(1 7) scale(2.5)" opacity=".33" stroke="#82714d" stroke-width=".5" fill="#dac794"><path d="M1 25V13L8 8V14L15 8V25H23V2H29V25Z"/><path d="M4 17H7V20H4ZM10 17H13V20H10Z" fill="#ebdcae"/></g>`;
 const pos=entry.source==='context'?[9,8,3.1]:entry.art||entry.painted?[41,43,1.95]:[21,26,2.55];
 const subject=subjectSvg(entry.subject,{modifier:entry.modifier??'',accent:good?'#4e754c':'#b44d36'});
 const resource=entry.resource&&entry.resource!==entry.subject?`<g transform="translate(4 68) scale(.95)">${subjectSvg(entry.resource)}</g>`:'';
 // A fine ink duplicate gives the drawing irregular engraved edges without random jitter or filters.
 return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><defs>${subjectPaint(main,light)}</defs>${art}<path d="M${pos[0]-3} ${pos[1]+6}q-8 24 8 38q27 7 43-8l2-32q-24-11-53 2Z" fill="#fff0d0" opacity=".65"/><g transform="translate(${pos[0]} ${pos[1]}) scale(${pos[2]})">${subject}</g>${resource}${flag(entry.country)}</svg>`;
}
function overlaySvg(action,good,t){
 const a=TAU*t,s=Math.sin(a),gold=good?'#67844c':'#c3653d',cream='#f5dfa6';
 const pathD=(d,color=gold,width=1.3,opacity=1)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${n(opacity)}"/>`;
 const circle=(x,y,r,col,op)=>`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${col}" opacity="${n(op)}"/>`;
 const particles=(count,col,up=false,balls=false)=>Array.from({length:count},(_,k)=>{const p=(t+k/count)%1,fade=Math.sin(Math.PI*p)**2,x=8+k*14+Math.sin(p*TAU+k)*1.2,y=up?70-p*52:9+p*58;return balls?circle(x,y,1.4,col,fade*.8):pathD(`M${n(x)} ${n(y)}l-2.5 6`,col,1.3,fade*.85);}).join('');
 const arrow=(up)=>{const y=up?28-3*s:18+3*s;return pathD(`M14 ${n(y+18)}V${n(y)}m-5 ${up?5:13} 5 ${up?-5:5} 5 ${up?5:-5}`,gold,2,.7);};
 const ring=(type)=>`<g transform="translate(5 5)" stroke="${gold}" fill="#fff0d2" stroke-width="1.6"><circle cx="12" cy="12" r="11" opacity=".85"/>${type==='check'?'<path d="M5 12 10 18 20 6" fill="none"/>':type==='stop'?'<path d="M4 4 20 20"/>':'<path d="M12 5V14M12 18V19"/>'}</g>`;
 let overlay='';
 if(['rain','rain-relief','storm','hail'].includes(action)){
  overlay=particles(action==='storm'?6:5,action==='rain-relief'?'#63959d':'#7298ac',false,action==='hail');
  if(action==='storm')overlay+=pathD(`M5 ${n(25+2*s)}q12 -9 25 -2t27 -1`, '#a39379',1.4,.6);
 }else if(action==='flood'){
  for(let i=0;i<3;i++)overlay+=pathD(`M1 ${70+i*8}q8 ${n(3*s)} 16 0t16 0t16 0t16 0t16 0t16 0`,'#608f9b',1.7,.6);
 }else if(['fire','heat','pollution'].includes(action)){
  overlay=particles(4,action==='fire'?'#d17d40':action==='heat'?'#bd794e':'#8f936d',true,true);
  for(let i=0;i<3;i++)overlay+=pathD(`M${8+i*9} 29q${n(4*s)} -7 0 -12t0 -11`,action==='pollution'?'#8f886e':'#c99155',1.5,.45);
 }else if(['fog','cold','drought'].includes(action)){
  if(action==='cold')overlay=particles(5,'#9fb6b0',false,true);
  else if(action==='drought')overlay=pathD(`M3 68l8-7 5 8 8-13 7 10`,'#b58b51',1.4,.75)+particles(3,'#d4b56d',true,true);
  else for(let i=0;i<3;i++)overlay+=pathD(`M${n(2+2*s)} ${18+i*8}q14 -4 29 0t29 0`,'#acac98',2,.4);
 }else if(action==='quake'){
  overlay=pathD(`M44 2l-6 10 9 6-8 9 6 9`,'#8a6344',1.6,.7)+pathD(`M5 ${n(76+s)}q7 -4 14 0t14 0t14 0`,'#9b7e4f',1.2,.7);
 }else if(action==='power'){
  overlay=`<path d="M18 5 8 20H17L13 33 29 14H20L23 5Z" fill="#dbad50" stroke="#775238" stroke-width="1" opacity="${n(.7+.12*s)}"/>`+pathD('M7 7 28 31','#a34835',1.8,.9);
 }else if(['cyber','counterfeit'].includes(action)){
  overlay=pathD('M2 6H28V33H2Z','#738573',1,.6)+`<path d="M3 7H27V32H3Z" fill="none" stroke="${gold}" stroke-width="1.3" stroke-dasharray="4 4" stroke-dashoffset="${n(-8*t)}"/>`+pathD('M10 13l-4 5 4 5m10-10 4 5-4 5',gold,1.4,.85);
 }else if(['rise','growth','expansion','supply','aid','support'].includes(action))overlay=arrow(true)+particles(3,good?'#b8a75b':'#c58c53',true,true);
 else if(['fall','bankrupt','shortage','staffloss'].includes(action))overlay=arrow(false)+particles(3,good?'#b8a75b':'#c58c53',false,true);
 else if(['inspection','certification','research','training','policy','tax','credit','lawsuit'].includes(action)){
  const x=6+(1+Math.sin(a))*9;overlay=pathD(`M${n(x)} 7v23`,'#d4ba7a',2,.4)+ring(good||action==='certification'?'check':action==='credit'?'stop':'alert');
 }else if(['ban','cancellation','dispute','complaint','strike'].includes(action))overlay=ring(action==='ban'||action==='cancellation'||action==='strike'?'stop':'alert')+pathD('M6 29q10 3 18-1',gold,1,.55+.15*s);
 else if(['illness','insurance','longevity','mortality'].includes(action)){
  if(action==='mortality')overlay=`<path d="M15 30q${n(3*s)} -6 0 -11q-5 6 0 11Z" fill="#c89b54" opacity=".7"/>`;
  else overlay=pathD(`M2 20h6l3-7 4 14 4-10h8`,action==='illness'?'#be6656':'#719066',1.5,.65+.12*s)+circle(20+5*Math.cos(a),18+5*Math.sin(a),1.1,cream,.7);
 }else if(['award','celebration','fund'].includes(action)){
  overlay=Array.from({length:4},(_,k)=>{const q=a+k*TAU/4;return circle(17+13*Math.cos(q),18+13*Math.sin(q),.7+.6*(1+Math.sin(q))/2,'#c8a55a',.7);}).join('');
 }else if(['delay','retirement','shift'].includes(action))overlay=`<g stroke="#806343" stroke-width="1.2" fill="#fff0d2"><circle cx="17" cy="18" r="12" opacity=".9"/><path d="M17 18l${n(8*Math.sin(a))} ${n(-8*Math.cos(a))}M17 18l-5-3"/></g>`;
 else if(['export','arrival','transfer','contract','succession'].includes(action)){
  const x=8+6*Math.sin(a);overlay=pathD(`M${n(x)} 18h23m-7-5 7 5-7 5`,gold,1.7,.8)+particles(2,'#b8a36e',true,true);
 }else if(['breakdown','repair','extinguish'].includes(action))overlay=pathD('M6 5l22 23M28 5 6 28',action==='extinguish'?'#6e967f':'#b46141',1.3,.5+.1*s)+particles(3,cream,true,true);
 else throw Error(`Undrawn motion: ${action}`);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">${overlay}</svg>`;
}
async function motion(action,good){
 const key=`${action}:${good}`;
 if(!motionCache.has(key))motionCache.set(key,(async()=>{
  const frames=[];
  for(let f=0;f<FRAMES;f++){
   const pixels=await sharp(Buffer.from(overlaySvg(action,good,f/FRAMES))).ensureAlpha().raw().toBuffer();
   const changed=[];for(let at=0;at<pixels.length;at+=4)if(pixels[at+3])changed.push(at);
   frames.push({pixels,changed});
  }
  return frames;
 })());return motionCache.get(key);
}
function frameWith(base,layer){
 const frame=Buffer.from(base),{pixels,changed}=layer;
 for(const at of changed){const alpha=pixels[at+3]/255,old=frame[at+3]/255,out=alpha+old*(1-alpha);for(let channel=0;channel<3;channel++)frame[at+channel]=Math.round((pixels[at+channel]*alpha+frame[at+channel]*old*(1-alpha))/out);frame[at+3]=Math.round(out*255);}
 return frame;
}
async function encode(raw,dest){
 return new Promise((resolve,reject)=>{
  const args=['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size',`${SIZE}x${SIZE}`,'-framerate',String(FPS),'-i','pipe:0','-filter_complex','[0:v]split[a][b];[b]palettegen=max_colors=96:reserve_transparent=1:stats_mode=full[p];[a][p]paletteuse=dither=none:alpha_threshold=100','-loop','0',dest];
  const child=spawn('ffmpeg',args,{windowsHide:true,stdio:['pipe','ignore','pipe']});let error='';child.stderr.on('data',chunk=>error+=chunk);child.stdin.on('error',reject);child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(error)));child.stdin.end(raw);
 });
}
const ledgerPath=path.join(review,'generated.json');
const generated=fs.existsSync(ledgerPath)?JSON.parse(fs.readFileSync(ledgerPath,'utf8')):{};
const compilerHash=crypto.createHash('sha256').update(fs.readFileSync(import.meta.filename)).update(fs.readFileSync(path.join(root,'scripts/event-subjects.mjs'))).digest('hex').slice(0,12);
let done=0;
async function build(entry){
 const target=path.join(folder,entry.id),fingerprint=crypto.createHash('sha256').update(JSON.stringify(entry)+compilerHash).digest('hex');
 if(!FORCE&&generated[entry.id]?.fingerprint===fingerprint&&fs.existsSync(`${target}-poster.webp`)&&(POSTERS||fs.existsSync(`${target}.gif`))){done++;return;}
 const svg=await baseSvg(entry),base=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
 const layers=await motion(entry.action,entry.good),poster=frameWith(base,layers[0]);
 fs.writeFileSync(`${target}.svg`,svg);
 await sharp(poster,{raw:{width:SIZE,height:SIZE,channels:4}}).webp({quality:93,alphaQuality:100}).toFile(`${target}-poster.webp`);
 const posterHash=crypto.createHash('sha256').update(poster).digest('hex');
 if(!POSTERS){const raw=Buffer.concat(layers.map(layer=>frameWith(base,layer)));await encode(raw,`${target}.gif`);}
 generated[entry.id]={fingerprint,posterHash,bytes:fs.existsSync(`${target}.gif`)?fs.statSync(`${target}.gif`).size:0,source:entry.source,subject:entry.subject,action:entry.action};
 done++;
 if(done%25===0){fs.writeFileSync(ledgerPath,JSON.stringify(generated,null,2));console.log(`${done}/${entries.length}: ${entry.id}`);}
}
const queue=entries.filter(entry=>!selected||selected.has(entry.id));
let cursor=0;
await Promise.all(Array.from({length:Number(process.env.EVENT_SCENE_WORKERS||3)},async()=>{while(cursor<queue.length)await build(queue[cursor++]);}));
fs.writeFileSync(ledgerPath,JSON.stringify(generated,null,2));
fs.writeFileSync(path.join(review,'catalog.json'),JSON.stringify({version:VERSION,...catalog},null,2));
const available=entries.filter(e=>fs.existsSync(path.join(folder,`${e.id}.gif`)));
const index={version:VERSION,ids:available.filter(e=>e.source!=='context').map(e=>e.id),contexts:catalog.contexts.filter(e=>fs.existsSync(path.join(folder,`context-${e.id}.gif`))).map(e=>e.id),narrations:catalog.entries.filter(e=>e.source==='narration').map(e=>({id:e.id,parent:e.parent,title:e.title}))};
fs.writeFileSync(path.join(root,'frontend/src/lib/event-art-index.json'),JSON.stringify(index));
const duplicates=new Map();for(const [id,row]of Object.entries(generated)){const list=duplicates.get(row.posterHash)??[];list.push(id);duplicates.set(row.posterHash,list);}
const collisions=[...duplicates.values()].filter(group=>group.length>1);
fs.writeFileSync(path.join(review,'duplicate-posters.json'),JSON.stringify(collisions,null,2));
console.log(JSON.stringify({postersOnly:POSTERS,compiled:queue.length,availableGifs:available.length,expected:entries.length,duplicatePosterGroups:collisions.length,totalBytes:available.reduce((sum,e)=>sum+fs.statSync(path.join(folder,e.id+'.gif')).size,0)}));
