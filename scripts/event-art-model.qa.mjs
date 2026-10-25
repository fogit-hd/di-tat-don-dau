import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {eventCatalog,root} from './event-art-catalog.mjs';
import {eventArtwork,fallbackEventArt} from '../frontend/src/lib/event-art.ts';
import {currentEventEntries,ongoingEventEntries} from '../frontend/src/lib/ongoing-events.ts';

const catalog=eventCatalog(),folder=path.join(root,'frontend/public/assets/ui/static-events-v3');
const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));
assert.equal(manifest.artworks.length,84);
assert.equal(new Set(manifest.artworks.map(art=>art.id)).size,84);
for(const art of manifest.artworks)assert(fs.existsSync(path.join(folder,art.file)),art.id);
let expanded=0;
for(const entry of catalog.entries){
 const result=eventArtwork(entry.id,entry.title,entry.body);
 assert(result,entry.id);assert.equal(result.id,entry.id);
 assert(fs.existsSync(path.join(folder,path.basename(result.base)+'.webp')),entry.id);
 assert(!result.context,'No pasted context symbols');
 if(entry.source==='industry'){
  expanded++;
  for(const context of catalog.contexts){
   const variant=eventArtwork(`${entry.id}--${context.id}`,`${entry.title} · ${context.title}`,entry.body);
   assert(variant);assert.equal(variant.id,entry.id);assert.equal(variant.base,result.base);assert(!variant.context);
   expanded++;
  }
 }
}
assert.equal(expanded,10240);
assert.notEqual(eventArtwork('chip-ban-dan-01').base,eventArtwork('chip-ban-dan-02').base);
assert.notEqual(eventArtwork('chip-ban-dan-01').base,eventArtwork('trai-cay-say-01').base);
assert.equal(eventArtwork('chip-ban-dan-01--not-real'),undefined);
assert.equal(eventArtwork('../../bad'),undefined);
assert.equal(eventArtwork('arbitrary-new-admin-event'),undefined);
assert.equal(eventArtwork('second-life-used-123').id,'system-support-used');
assert.equal(eventArtwork('second-life-3').id,'system-support-approved');
assert.equal(eventArtwork('mortality-33').id,'system-mortality');
assert.equal(eventArtwork('succession-4','','Người thừa kế làm mất 100% tài sản.').id,'system-succession-bankrupt');
assert.equal(eventArtwork('succession-4','','Người thừa kế làm mất 49% tài sản.').id,'system-succession-loss');
assert.equal(eventArtwork('succession-4','','Người thừa kế làm mất 12% tài sản.').id,'system-succession-loss');
assert.equal(eventArtwork('succession-4','','Người thừa kế làm tài sản tăng thêm 20%').id,'system-succession-growth');
assert.equal(eventArtwork('succession-4','','Người thừa kế làm tài sản tăng thêm 100%').id,'system-succession-multiply');
assert.equal(eventArtwork('succession-4','','Người thừa kế giữ nguyên tài sản').id,'system-succession-steady');
for(const entry of catalog.entries.filter(e=>e.source==='narration'))assert.equal(eventArtwork(entry.parent,entry.title).id,entry.id);
const event={year:3,eventId:'trai-cay-say-01--port-delay',title:'Ùn tắc cửa khẩu · Cảng và kho bãi ùn tắc',icon:'traffic-cone',body:'',good:false,effect:''};
assert.equal(currentEventEntries([event])[0].eventId,event.eventId);
const effect={id:'runtime-effect',eventId:event.eventId,title:event.title,icon:event.icon,visual:'market_crash',economic:true,yearsLeft:2,body:'',startedAt:1,endsAt:10000,year:3};
assert.equal(ongoingEventEntries({effects:[],timed:[effect],traits:[],events:[event],now:50})[0].eventId,event.eventId);
assert(eventArtwork('fam-bao-benh').base.endsWith('/illness'));
assert(eventArtwork('fam-truong-tho').base.endsWith('/longevity'));
assert(eventArtwork('fam-nghi-huu').base.endsWith('/retirement'));
assert(eventArtwork('mortality-33').base.endsWith('/mortality'));
assert(eventArtwork('may-cong-cu-03').base.endsWith('/industry-cnc'));
assert(eventArtwork('may-cong-cu-07').base.endsWith('/new-machinery'));
assert(eventArtwork('tec-may-hong').base.endsWith('/cnc-breakdown')); // Máy chủ lực is not a server.
assert(eventArtwork('trai-cay-say-04--green-support','Gói mua sắm xanh được duyệt').base.endsWith('/context-green-support'));
assert(eventArtwork('trai-cay-say-16').base.endsWith('/industry-food-dryer'));
assert(eventArtwork('chip-ban-dan-02').base.endsWith('/order-auto-chips'));
assert(fallbackEventArt('heart','Chủ xưởng Bạo bệnh').endsWith('/illness'));
assert(fallbackEventArt('sun','Trường thọ').endsWith('/longevity'));
console.log(JSON.stringify({passed:true,paintedStaticIllustrations:84,industryOriginals:1280,generalOriginals:100,familyOriginals:8,narrationVariants:8,systemScenes:9,contextVariants:7,expandedIndustryCases:expanded,mappedSceneRecords:catalog.entries.length,randomPercentSharesArtwork:true,noContextOverlays:true,unknownIdsFallBack:true},null,2));
