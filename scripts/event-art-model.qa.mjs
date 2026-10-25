import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {eventCatalog,root} from './event-art-catalog.mjs';
import {eventArtwork} from '../frontend/src/lib/event-art.ts';
import {currentEventEntries,ongoingEventEntries} from '../frontend/src/lib/ongoing-events.ts';

const catalog=eventCatalog(),folder=path.join(root,'frontend/public/assets/ui/event-scenes-v2');
let expanded=0;
for(const entry of catalog.entries){
 const result=eventArtwork(entry.id,entry.title,entry.body);
 assert(result,entry.id);assert.equal(result.id,entry.id);
 for(const suffix of ['.gif','-poster.webp','.svg'])assert(fs.existsSync(path.join(folder,entry.id+suffix)),entry.id+suffix);
 if(entry.source==='industry'){
  expanded++;
  for(const context of catalog.contexts){
   const variant=eventArtwork(`${entry.id}--${context.id}`,`${entry.title} · ${context.title}`,entry.body);
   assert(variant);assert.equal(variant.id,entry.id);assert(variant.context.endsWith(`context-${context.id}`));
   for(const suffix of ['.gif','-poster.webp'])assert(fs.existsSync(path.join(folder,`context-${context.id}${suffix}`)));
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
const actions=new Map(catalog.entries.map(e=>[e.id,e.action]));
assert.equal(actions.get('trai-cay-say-03'),'rain'); // "giảm" must not match "giả".
assert.equal(actions.get('chip-ban-dan-18'),'cyber');
assert.equal(actions.get('man-hinh-20'),'strike');
const byId=new Map(catalog.entries.map(e=>[e.id,e]));
assert.equal(byId.get('may-cong-cu-07').subject,'press');
assert.equal(byId.get('xe-dien-03').subject,'errorcode');
assert.equal(byId.get('trai-cay-say-09').country,null);
assert.equal(byId.get('may-cong-cu-10').country,null);
assert.equal(byId.get('my-pham-10').country,null);
assert.notEqual(byId.get('gao-07').resource,'battery');
console.log(JSON.stringify({passed:true,industryOriginals:1280,generalOriginals:100,familyOriginals:8,narrationVariants:8,systemScenes:9,contextLayers:7,expandedIndustryCases:expanded,mappedSceneRecords:catalog.entries.length,randomPercentSharesArtwork:true,unknownIdsFallBack:true},null,2));
