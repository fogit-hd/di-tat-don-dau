import fs from 'node:fs';
import path from 'node:path';
import {eventCatalog,root} from './event-art-catalog.mjs';

// Semantic assignment only: no thumbnails, symbol overlays, GIFs or invented per-roll files.
const actions={storm:'storm',rain:'rain','rain-relief':'seedling',hail:'snow',cold:'snow',fog:'rain',heat:'sun',drought:'drought',flood:'flood',quake:'earthquake',fire:'fire',extinguish:'extinguished-fire',pollution:'chemical-spill',power:'power-failure',cyber:'cyberattack',breakdown:'cnc-breakdown',shortage:'material-shortage',supply:'supplier-truck',cancellation:'cancelled-contract',ban:'customs',lawsuit:'inheritance-dispute',inspection:'new-standard',complaint:'environment-inspection',delay:'port-congestion',rise:'material-price',fall:'price-decline',tax:'tax-increase',credit:'credit-tightening',aid:'state-support',support:'state-support',award:'patent',training:'training',research:'research',shift:'training',export:'export-order',contract:'new-contract',expansion:'land-expansion',staffloss:'departing-engineer',arrival:'returning-graduate',strike:'strike',illness:'safety',counterfeit:'new-standard',certification:'new-standard'};
const explicit={
 'fam-truong-tho':'longevity','fam-bao-benh':'illness','fam-dao-tao':'training','fam-tranh-chap':'inheritance-dispute','fam-quy':'family-fund','fam-bao-hiem':'life-insurance','fam-du-hoc':'returning-graduate','fam-nghi-huu':'retirement',
 'system-support-approved':'state-support','system-support-used':'state-support','system-mortality':'mortality','system-centennial':'longevity','system-succession-bankrupt':'bankruptcy','system-succession-loss':'inheritance-loss','system-succession-steady':'inheritance-steady','system-succession-growth':'inheritance-growth','system-succession-multiply':'inheritance-growth',
};
export function illustrationFor(entry){
 if(explicit[entry.id])return explicit[entry.id];
 const t=entry.title.toLowerCase(), a=entry.action;
 if(/bằng sáng chế/.test(t))return 'patent';
 if(/robot/.test(t)&&!['fire','power'].includes(a))return 'robot';
 if(/bản vẽ|thiết kế/.test(t)&&['cyber','counterfeit','breakdown'].includes(a))return 'lost-design';
 if(/máy chủ(?! lực)|làm mát/.test(t)&&['heat','breakdown'].includes(a))return 'server-overheat';
 if(/đứt.*(mạng|cáp)|mạng.*đứt/.test(t))return 'network-failure';
 if(/thuế/.test(t)&&/miễn|giảm|ưu đãi/.test(t))return 'tax-relief';
 if(/liên doanh|fdi/.test(t))return 'joint-venture';
 if(/kiểm tra.*(môi trường|mt)|thanh tra.*(môi trường|xả)/.test(t))return 'environment-inspection';
 if(/phục hồi|hồi phục/.test(t))return 'market-recovery';
 if(a==='illness'&&/sâu|bọ xít|rầy|nấm|thối quả/.test(t))return 'pest';
 if(/chất bảo quản|nhiễm khuẩn|hóa chất|dư lượng/.test(t)&&['breakdown','illness','pollution'].includes(a))return 'environment-inspection';
 if(/kho lạnh/.test(t)&&!['fire','flood'].includes(a))return 'cold-storage';
 if(/máy bay|hàng không/.test(t)&&['export','contract','delay'].includes(a))return 'air-freight';
 if(/xe.*(thủng|xẹp)|thủng lốp/.test(t))return 'truck-breakdown';
 if(a==='breakdown'){
  if(/wafer|quang khắc|bán dẫn/.test(t)||entry.industry==='chip-ban-dan')return 'industry-wafer';
  if(/máy cưa|chế biến gỗ/.test(t)||entry.industry==='do-go')return 'industry-wood-saw';
  if(/máy sấy/.test(t)||entry.industry==='trai-cay-say')return 'industry-food-dryer';
  if(/ống nước|đường ống|màng lọc/.test(t)||entry.industry==='xu-ly-nuoc')return 'industry-water-pipe';
  if(/cẩu|móc/.test(t)||entry.industry==='cang-bien-logistics')return 'industry-port-hook';
  if(/cnc|máy tiện|máy phay/.test(t)||entry.industry==='may-cong-cu')return 'industry-cnc';
 }
 if(['contract','export'].includes(a)){
  if(/máy phay|máy tiện|máy cnc|trục chính|máy sấy/.test(t))return 'new-machinery';
  if(/chip|ecu|vi mạch|bán dẫn/.test(t))return 'order-auto-chips';
  if(/thuốc|dược/.test(t))return 'order-medicine';
  if(/may mặc|quần áo|áo sơ mi|dệt may/.test(t)||entry.industry==='det-may')return 'order-garments';
  if(/cà phê/.test(t))return 'order-coffee';
  if(/pin|cell/.test(t))return 'order-batteries';
  if(/tấm.*(quang|mặt trời)|điện mặt trời/.test(t))return 'order-solar';
 }
 return actions[a]??'new-contract';
}
const catalog=eventCatalog();
const art=Object.fromEntries(catalog.entries.map(e=>[e.id,illustrationFor(e)]));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'frontend/public/assets/ui/static-events-v3/manifest.json'),'utf8'));
const allowed=new Set(manifest.artworks.map(a=>a.id));
for(const [id,image]of Object.entries(art))if(!allowed.has(image))throw Error(`${id}: missing ${image}`);
const index={version:3,art,contexts:catalog.contexts.map(c=>c.id),narrations:catalog.entries.filter(e=>e.parent).map(e=>({id:e.id,parent:e.parent,title:e.title}))};
fs.writeFileSync(path.join(root,'frontend/src/lib/static-event-art-index.json'),JSON.stringify(index));
console.log(JSON.stringify({mappedOriginals:Object.keys(art).length,paintedIllustrations:allowed.size,industryCases:catalog.entries.filter(e=>e.source==='industry').length*8}));
