// Dev-only asset compiler: generated painted source atlases -> SVG motion frames -> GIF/poster.
// Uses installed Sharp and FFmpeg tools; adds no application dependency.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const require=createRequire(import.meta.url);
const sharp=require(process.env.SHARP_MODULE || 'sharp');
sharp.concurrency(1);
const root=path.resolve(import.meta.dirname,'..');
const sources=path.join(root,'design-preview/event-animation-sources-v1');
const output=path.join(root,'frontend/public/assets/ui/event-loops-v1');
const qa=path.join(root,'.tmp/event-loops-v1');
fs.mkdirSync(output,{recursive:true});fs.mkdirSync(qa,{recursive:true});
const SIZE=96,FRAMES=72,FPS=25,TAU=Math.PI*2;
const sheets={
 weather:{names:['rain','storm','sun','fire','water','snow','leaf','wheat','bug','box','coinsUp','coinsDown'],
   bounds:[[18,18,362,363],[379,15,742,365],[768,15,1107,365],[1130,12,1448,365],[0,375,425,713],[425,373,739,713],[756,374,1110,713],[1113,366,1448,715],[12,715,368,1063],[389,720,742,1063],[757,710,1108,1063],[1108,704,1448,1063]]},
 industry:{names:['truck','plane','ship','factory','bolt','people','chart','chip','flask','wrench','globe','home'],
   bounds:[[8,65,368,365],[375,65,738,365],[735,65,1092,365],[1092,60,1448,365],[30,377,343,710],[362,373,740,710],[745,380,1090,710],[1102,373,1448,710],[39,712,329,1055],[373,707,741,1055],[750,708,1105,1055],[1102,713,1448,1055]]},
 institutions:{names:['shield','alert','gavel','heart','school','lock','megaphone','clock','spark','receipt','report','gift'],
   bounds:[[12,15,360,355],[389,15,724,355],[738,15,1100,355],[1110,15,1448,355],[12,367,362,707],[407,367,704,707],[738,367,1087,707],[1110,360,1448,707],[18,715,360,1065],[401,715,726,1065],[754,701,1105,1065],[1100,714,1448,1065]]},
};
const extras=new Set(['receipt','report','gift']);
const num=n=>Number(n.toFixed(4));
function motionSvg(kind,t,uri) {
 const a=TAU*t,s=Math.sin(a),c=Math.cos(a),image=`<image href="${uri}" width="96" height="96"/>`;
 const defs=`<defs><mask id="art">${image}</mask><linearGradient id="topfade" x2="0" y2="1"><stop offset=".64" stop-color="white"/><stop offset=".79" stop-color="black"/></linearGradient><mask id="upper"><rect width="96" height="96" fill="url(#topfade)"/></mask><mask id="lower"><rect width="96" height="96" fill="white"/><rect width="96" height="96" fill="url(#topfade)" style="mix-blend-mode:difference"/></mask><clipPath id="water"><rect x="5" y="68" width="86" height="23"/></clipPath></defs>`;
 let base=image,detail='';
 const add=svg=>{detail+=svg};
 const droplet=(x,y,opacity,color='#5597b3')=>`<path d="M${num(x)} ${num(y)}l-2.1 5" stroke="${color}" stroke-width="1.6" stroke-linecap="round" opacity="${num(opacity)}"/>`;
 const shine=(color='#fff0ac',opacity=.18)=>`<g mask="url(#art)"><path d="M${num(-28+152*t)} -12l-29 120h9L${num(-19+152*t)} -12z" fill="${color}" opacity="${num(Math.sin(Math.PI*t)**2*opacity)}"/></g>`;
 const rotate=(angle,cx=48,cy=48)=>`<g transform="rotate(${num(angle)} ${cx} ${cy})">${image}</g>`;
 const wind=angle=>`<g mask="url(#lower)">${image}</g><g mask="url(#upper)" transform="rotate(${num(angle)} 48 80)">${image}</g>`;
 const particles=(count,color,up=false)=>{
  for(let k=0;k<count;k++) {const p=(t+k/count)%1,fade=Math.sin(Math.PI*p)**2;const x=24+(k*13)%48+Math.sin(p*TAU+k)*1.8,y=up?75-p*39:47+p*34;
   add(up?`<circle cx="${num(x)}" cy="${num(y)}" r="${num(.8+k%2*.4)}" fill="none" stroke="${color}" stroke-width="1" opacity="${num(fade*.65)}"/>`:droplet(x,y,fade*.8,color)); }
 };
 switch(kind) {
  case 'rain': particles(7,'#4e92b3');break;
  case 'storm': particles(4,'#6e9fa7');add(shine('#ffe7a0',.11));break;
  case 'sun': base=rotate(1.6*s);add(shine('#fff5cb',.14));break;
  case 'fire': base=wind(1.15*s+.25*Math.sin(2*a));particles(4,'#edb45c',true);break;
  case 'water':case 'ship': {
   if(kind==='ship')base=rotate(.65*s,48,71);
   for(let k=0;k<3;k++) add(`<g clip-path="url(#water)"><path d="M4 ${74+k*5}q9 ${num(2*s)} 18 0t18 0t18 0t18 0t18 0" fill="none" stroke="${k%2?'#a9d7df':'#e9f0d9'}" stroke-width="1" opacity="${num(.3+.12*Math.sin(a+k))}" transform="translate(${num(2*Math.sin(a+k))} 0)"/></g>`);
   break;
  }
  case 'snow':base=rotate(2*s);particles(4,'#d6edf1');break;
  case 'leaf':case 'wheat':base=wind(1.2*s);break;
  case 'bug':base=rotate(.6*s);particles(3,'#8aa55b',true);break;
  case 'coinsUp':add(shine());particles(3,'#d4a447',true);break;
  case 'coinsDown':add(shine('#ffdf9a',.14));particles(3,'#bd8540');break;
  case 'truck': {
   for(const [i,cx,cy,r] of [[0,28,67,9],[1,76,67,9]]) add(`<defs><clipPath id="wheel${i}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs><g clip-path="url(#wheel${i})"><g transform="rotate(${num(360*t)} ${cx} ${cy})">${image}</g></g>`);
   break;
  }
  case 'plane':base=rotate(.9*s);add(`<path d="M9 67q9 ${num(2*s)} 17 0" fill="none" stroke="#a9bdbf" stroke-width="1" opacity="${num(.15+.10*c)}"/>`);break;
  case 'factory':case 'home':
   for(let k=0;k<3;k++){const p=(t+k/3)%1;add(`<ellipse cx="${num(63+3*Math.sin(p*TAU+k))}" cy="${num(26-p*18)}" rx="${num(2+p*2.8)}" ry="${num(1.7+p*2)}" fill="#aaa89b" opacity="${num(Math.sin(Math.PI*p)**2*.3)}"/>`)}
   add(shine('#ffeabc',.09));break;
  case 'bolt':case 'shield':case 'alert':case 'box':case 'receipt':case 'report':case 'gift':add(shine());break;
  case 'people':base=`<g transform="translate(0 ${num(.3*s)})">${image}</g>`;add(shine('#fff3c9',.05));break;
  case 'chart':
   for(let k=0;k<3;k++){const x=13+k*23;add(`<g mask="url(#art)"><rect x="${x}" y="${num(24+18*(1+Math.sin(a+k))/2)}" width="17" height="1.5" fill="#fff0b0" opacity=".25"/></g>`)}break;
  case 'chip': {
   const p=t*4,side=Math.floor(p),q=p-side;const x=side===0?18+60*q:side===1?78:side===2?78-60*q:18,y=side===0?18:side===1?18+60*q:side===2?78:78-60*q;
   add(`<circle cx="${num(x)}" cy="${num(y)}" r="1.8" fill="#ffe5a0" opacity=".8"/>`);break;
  }
  case 'flask':particles(5,'#b1e1ca',true);break;
  case 'wrench':base=rotate(1.4*s,48,62);break;
  case 'gavel':base=wind(1.8*s);break;
  case 'globe':add(shine('#dcf1df',.15));break;
  case 'heart':base=`<g transform="translate(48 48) scale(${num(1+.012*s+.004*Math.sin(2*a))}) translate(-48 -48)">${image}</g>`;break;
  case 'school':add(shine('#fff1b6',.12));break;
  case 'lock':add(shine());break;
  case 'megaphone':
   for(let k=0;k<2;k++){const p=(t+k/2)%1;add(`<path d="M${num(77+12*p)} ${num(35-3*p)}q${num(7*p)} 12 0 ${num(23+6*p)}" fill="none" stroke="#ba8b43" stroke-width="1.1" opacity="${num(Math.sin(Math.PI*p)**2*.6)}"/>`)}break;
  case 'clock':add(`<path d="M48 55l${num(21*Math.sin(a))} ${num(-21*Math.cos(a))}" stroke="#914a28" stroke-width="1.15" stroke-linecap="round"/>`);break;
  case 'spark':add(shine('#fff6c7',.32));break;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="96" height="96" viewBox="0 0 96 96">${defs}${base}${detail}</svg>`;
}
const manifest={version:1,format:'gif',size:SIZE,frames:FRAMES,fps:FPS,durationMs:FRAMES*1000/FPS,loop:0,icons:{},source:'AI generated painted atlases; deterministic periodic SVG motion; global-palette GIF encoding'};
const thumb=[];
for(const [sheet,spec] of Object.entries(sheets)) {
 const source=path.join(sources,`${sheet}.png`);
 for(let index=0;index<spec.names.length;index++) {
  const kind=spec.names[index],[x,y,right,bottom]=spec.bounds[index];
  const crop=await sharp(source).extract({left:x,top:y,width:right-x,height:bottom-y}).png().toBuffer();
  const icon=await sharp(crop).trim().resize(80,80,{fit:'inside'}).png().toBuffer();
  const meta=await sharp(icon).metadata();
  const painted=await sharp({create:{width:SIZE,height:SIZE,channels:4,background:'#00000000'}}).composite([{input:icon,left:Math.round((SIZE-meta.width)/2),top:Math.round((SIZE-meta.height)/2)}]).png().toBuffer();
  let isolated=painted;
  if(kind==='globe') {
   // The source sheet has a detached fragment from the neighboring house. Pack only the globe component.
   const data=await sharp(painted).ensureAlpha().raw().toBuffer();const seen=new Uint8Array(SIZE*SIZE);let largest=[];
   for(let pixel=0;pixel<SIZE*SIZE;pixel++) {if(seen[pixel]||data[pixel*4+3]<8)continue;const group=[pixel];seen[pixel]=1;
    for(let n=0;n<group.length;n++){const v=group[n],x=v%SIZE;for(const next of [x>0?v-1:-1,x<SIZE-1?v+1:-1,v-SIZE,v+SIZE])if(next>=0&&next<SIZE*SIZE&&!seen[next]&&data[next*4+3]>=8){seen[next]=1;group.push(next)}}
    if(group.length>largest.length)largest=group;
   }
   const keep=new Set(largest);for(let pixel=0;pixel<SIZE*SIZE;pixel++)if(!keep.has(pixel))data[pixel*4+3]=0;
   isolated=await sharp(data,{raw:{width:SIZE,height:SIZE,channels:4}}).png().toBuffer();
  }
  const uri=`data:image/png;base64,${isolated.toString('base64')}`;
  fs.writeFileSync(path.join(output,`${kind}.svg`),motionSvg(kind,0,uri));
  await sharp(isolated).webp({quality:93,alphaQuality:100}).toFile(path.join(output,`${kind}-poster.webp`));
  thumb.push({input:isolated,left:(thumb.length%6)*128+16,top:Math.floor(thumb.length/6)*128+8});
  if(extras.has(kind))continue;
  const frames=[];
  for(let frame=0;frame<FRAMES;frame++) frames.push(await sharp(Buffer.from(motionSvg(kind,frame/FRAMES,uri))).ensureAlpha().raw().toBuffer());
  const raw=Buffer.concat(frames);
  const encoded=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size',`${SIZE}x${SIZE}`,'-framerate',String(FPS),'-i','pipe:0','-filter_complex','[0:v]split[a][b];[b]palettegen=max_colors=128:reserve_transparent=1:stats_mode=full[p];[a][p]paletteuse=dither=none:alpha_threshold=100','-loop','0',path.join(output,`${kind}.gif`)],{input:raw,maxBuffer:8*1024*1024,windowsHide:true});
  if(encoded.status!==0)throw new Error(`${kind}: ${encoded.stderr}`);
  const metadata=await sharp(path.join(output,`${kind}.gif`),{animated:true}).metadata();
  manifest.icons[kind]={gif:`${kind}.gif`,poster:`${kind}-poster.webp`,master:`${kind}.svg`,bytes:fs.statSync(path.join(output,`${kind}.gif`)).size,frames:metadata.pages,loop:metadata.loop};
  // Store reference raw frames for the quantitative seam check, outside public assets.
  fs.writeFileSync(path.join(qa,`${kind}.rgba`),raw);
  console.log(`${kind}: ${metadata.pages} frames, ${manifest.icons[kind].bytes} bytes`);
 }
}
await sharp({create:{width:768,height:768,channels:4,background:'#fff1d6'}}).composite(thumb).png().toFile(path.join(qa,'contact.png'));
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({icons:Object.keys(manifest.icons).length,totalGifBytes:Object.values(manifest.icons).reduce((sum,icon)=>sum+icon.bytes,0)}));
