import fs from 'node:fs';
import path from 'node:path';
import {subjectFor} from './event-subjects.mjs';
export const root=path.resolve(import.meta.dirname,'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'backend/prisma/seed',name),'utf8'));
export const contexts=[
 {id:'input-shortage',title:'Nguồn đầu vào bị siết',subject:'parcelopen',action:'shortage',good:false},
 {id:'local-supplier',title:'Nhà cung cấp trong nước vào chuỗi',subject:'localfactory',action:'supply',good:true},
 {id:'port-delay',title:'Cảng và kho bãi ùn tắc',subject:'freightdelay',action:'delay',good:false},
 {id:'green-support',title:'Gói mua sắm xanh được duyệt',subject:'ecological',action:'support',good:true},
 {id:'credit-tightening',title:'Tín dụng thiết bị bị siết',subject:'creditlock',action:'credit',good:false},
 {id:'tech-transfer',title:'Chuyển giao thiết bị theo lô',subject:'partssupply',action:'transfer',good:true},
 {id:'new-standard',title:'Tiêu chuẩn đầu vào mới',subject:'quality',action:'inspection',good:false},
];
const generalSubjects={
 'nat-bao-do-bo':'stormroof','nat-mua-lon':'freightdelay','nat-lu-vao-xuong':'warehouse','nat-han-han':'droughtfield','nat-nang-nong':'temperaturefactory','nat-suong-mu':'fogport','nat-dong-dat':'quake','nat-nut-nen':'crackedsoil','nat-dich-ca':'groupstrike','nat-dich-nguon':'quarantine','nat-bao-duong-day':'windfarm','nat-ngap-tuyen':'road','nat-khoi-vuot':'smokestack','nat-chay-kho':'warehouse','nat-thieu-nuoc':'watermeter','nat-mua-keo-dai':'rainroof',
 'mkt-don-xuat':'globeparcel','mkt-gia-lao-doc':'graphdown','mkt-hop-dong-lon':'contract','mkt-huy-don':'contractcancel','mkt-gia-dien':'plug','mkt-vat-lieu-rot':'rawloss','mkt-doi-thu-giam':'pricecut','mkt-mo-xuong':'factoryexpansion','mkt-tra-cham':'timerpay','mkt-goi-thau':'tender','mkt-du-thua':'stockpile','mkt-duoc-gia':'wheat','mkt-no-keo-gia':'coinsgone','mkt-don-nha-nuoc':'ordermany','mkt-ty-gia':'coinexchange','mkt-sieu-thi':'bagoff',
 'pol-kiem-tra-mt':'certificateleaf','pol-trong-diem':'publicproject','pol-giay-phep':'permit','pol-thue-tang':'taxrise','pol-uu-dai':'taxcut','pol-siet-xa':'filter','pol-kiem-toan':'budget','pol-quy-hoach':'landmeasure','pol-fdi':'handshakefile','pol-co-phan':'documentshift','pol-han-ngach':'waterquota','pol-cam-xuat':'tradeban','pol-tieu-chuan':'certificate','pol-vay-uu-dai':'supportmoney',
 'tec-tan-cong-mang':'dataprotection','tec-ma-doc':'lostdata','tec-mat-dien':'powerbutton','tec-day-chuyen':'conveyor','tec-bang-sang-che':'patent','tec-may-hong':'crackedmachine','tec-ro-ri':'dataleak','tec-cong-nghe-moi':'newgear','tec-dut-mang':'cablebroken','tec-robot':'robotarm','tec-cam-bien':'gaugeoff','tec-phan-mem':'errorcode','tec-lo-nung':'chimney','tec-chay-lab':'flask','tec-phu-thuoc-dien':'pole','tec-doi-ky-su':'staffknowledge',
 'peo-dinh-cong':'groupstrike','peo-bai-cong':'crowdsign','peo-ky-su-nghi':'staffleave','peo-tuyen-duoc':'staffarrive','peo-to-cao':'newsalert','peo-so-suat':'crackedmachine','peo-ca-dem':'staffnight','peo-tai-nan':'emergencybag','peo-xuong-may':'shirtpair','peo-doi-gioi':'repair','peo-be-boi':'news','peo-thao-tac-dien':'plug','peo-cung-ung-dung':'partssupply','peo-them-ca':'staffshift','peo-om-dong':'sickleave','peo-thay-ca':'schedule',
 'luc-trung-thau':'contractaward','luc-doi-tac-pha-san':'bankrupt','luc-giai-thuong':'medal','luc-bao-doi-huong':'weatherwind','luc-tin-don':'balloonmessage','luc-dat-giao':'land','luc-phat-hien-lo-hong':'hygienic','luc-rung-nhe':'quakesoil','luc-don-bu':'refund','luc-mua-giai-han':'seedlingwater','luc-may-cu-chay':'repair','luc-gia-nhay':'chartprices','luc-lo-hang-nham':'parcelopen','luc-chay-nho':'extinguisher',
 'gen-uu-dai-thue':'taxdoc','gen-phan-mem-mo':'softcode','gen-lop-nghe':'classroom','gen-don-bat-ngo':'packagegift','gen-hang-nhai':'brandcopy','gen-mua-da':'hailroof','gen-thanh-tra':'inspection','gen-bang-sang-che':'patent',
};
const familySubjects={
 'fam-truong-tho':['oldperson','longevity','longevity'], 'fam-bao-benh':['patient','illness','illness'],
 'fam-dao-tao':['graduationperson','training','heir_trained'],'fam-tranh-chap':['gavel','dispute','inheritance_dispute'],
 'fam-quy':['vault','fund','family_fund'],'fam-bao-hiem':['shieldheart','insurance','life_insurance'],
 'fam-du-hoc':['booksplane','arrival','heir_abroad'],'fam-nghi-huu':['chairretire','retirement',null],
};
const systemEvents=[
 ['system-support-approved','Nhà nước chấp thuận hỗ trợ vốn','aidpermit','support','state-aid',true],
 ['system-support-used','Nhà nước cấp vốn khởi động lại','supportmoney','aid','state-aid',true],
 ['system-mortality','Chủ doanh nghiệp qua đời','memorial','mortality',null,false],
 ['system-centennial','Doanh nghiệp trăm năm','trophy','celebration','centennial',true],
 ['system-succession-bankrupt','Người thừa kế làm mất toàn bộ tài sản','bankrupt','bankrupt','inheritance_dispute',false],
 ['system-succession-loss','Người thừa kế làm mất tài sản','assetloss','fall','inheritance_dispute',false],
 ['system-succession-steady','Người thừa kế giữ nguyên tài sản','assetsteady','succession','enterprise',true],
 ['system-succession-growth','Người thừa kế làm tài sản tăng thêm','assetgrowth','growth','heir_trained',true],
 ['system-succession-multiply','Người thừa kế nhân tài sản','assetgrowth','celebration','heir_abroad',true],
];
export function actionFor(event) {
 const title=event.title.toLowerCase(),body=(event.description??event.body??'').toLowerCase();
 const rules=[
  [/hàng giả|thuốc giả|phân giả|làm giả|giả mạo|nhái|đội lốt/,'counterfeit'],[/chứng nhận|chứng chỉ|đạt chuẩn|cấp số|globalgap|vietgap|haccp|chỉ dẫn địa lý/,'certification'],
  [/tặc|mã độc|hack|ddos|ransom|trộm thiết kế|đánh cắp bản|lỗ hổng|dữ liệu.*rò|rò.*dữ liệu|lộ dữ liệu|trộm bản/,'cyber'],
  [/dập|khống chế.*cháy/,'extinguish'],[/cháy|bốc cháy|nổ đường|nổ kho/,'fire'],[/đình công|bãi công|ngừng việc|dừng một ca/,'strike'],
  [/nghỉ việc|săn.*kỹ sư|mất kỹ sư|công nhân nghỉ|thiếu.*(kỹ sư|kỹ thuật|lao động|thợ|nhân công|nhân lực|người hái)/,'staffloss'],
  [/về nước|kỹ sư.*về|chuyên gia|tuyển đủ|nhân tài|tuyển.*kíp/,'arrival'],
  [/rò.*khí|rò rỉ.*dung môi|tràn.*khí|chất thải|ô nhiễm|xả thải|hóa chất rò|nước thải|tảo nở|bụi|nước rỉ|phát thải|phạt xả/,'pollution'],
  [/động đất|rung chấn|rung lắc nhẹ|nứt nền|sạt lở/,'quake'],[/bão|lốc|sét đánh/,'storm'],[/lũ|lụt|ngập|triều cường/,'flood'],
  [/giải hạn|mưa.*đúng vụ/,'rain-relief'],[/sương muối|rét đậm/,'cold'],[/sương mù|sương.*chậm|sương.*luồng/,'fog'],
  [/mưa đá/,'hail'],[/mưa|nồm ẩm/,'rain'],[/hạn hán|hạn mặn|mùa khô|mặn làm|xâm nhập mặn|thiếu nước/,'drought'],
  [/nắng|quá nhiệt|nóng|nhiệt.*quá tải/,'heat'],[/mất điện|sụt áp|nhảy aptomat|nhảy.*điện|trạm điện.*nhảy|mạng truyền tải.*chập|lưới điện.*sụt/,'power'],
  [/dịch bệnh|ổ dịch|đại dịch|nghỉ vì ốm|nhiễm khuẩn|sâu bệnh|bọ xít|sâu đục|rầy|nấm hại|thối quả/,'illness'],
  [/thu hồi|hỏng|lỗi|máy.*sự cố|rung lắc|sai số|nứt khung|bị trả|lô hàng.*trả|điểm chết|phồng/,'breakdown'],
  [/thiếu|khan hiếm|mất nguồn|đứt nguồn|siết nguồn/,'shortage'],[/hủy|cắt hợp đồng|cắt chuyến|chuyển đi|hoãn mua|dừng nhập/,'cancellation'],
  [/cấm|hạn chế xuất|siết vùng bay|siết.*nhập|khống chế/,'ban'],[/kiện|bồi thường|tranh chấp/,'lawsuit'],
  [/kiểm tra|thanh tra|kiểm toán|điều tra|giám sát|khảo sát/,'inspection'],[/tố cáo|bê bối|tin đồn|phản ánh|khiếu nại|phản đối|sai phép|sai sự thật|quảng cáo.*sai/,'complaint'],
  [/trả tiền chậm|chậm thanh toán|chậm.*giải ngân|chậm.*thông quan|trễ chuyến|chậm giao|ùn tắc|tắc cảng|tắc kênh|hoãn|trễ lịch/,'delay'],
  [/giá.*(tăng|vọt|đắt|lập đỉnh|gấp)|tăng giá|cước.*tăng|phí.*tăng|đắt lên/,'rise'],
  [/giá.*(giảm|rớt|lao dốc|giảm sâu|thấp)|phá giá|giảm thuế|miễn thuế|ưu đãi thuế|giá rẻ|giảm.*chi phí/,'fall'],
  [/thuế.*tăng|thuế chống|thuế carbon|siết.*thuế/,'tax'],[/vay|tín dụng|lãi suất/,'credit'],
  [/hỗ trợ|tài trợ|giải ngân|quỹ đổi mới|cấp vốn|oda|ngân sách/,'aid'],[/giải thưởng|đoạt giải|đạt giải|được khen|trúng thầu/,'award'],
  [/học|đào tạo|tu nghiệp|lớp nghề|trường nghề|mở ngành/,'training'],[/làm chủ|bản quyền|chuyển giao|công nghệ|bằng sáng chế|license|phát hiện|thử nghiệm|nghiên cứu|đổi mới/,'research'],
  [/thêm ca|ca đêm|đổi ca/,'shift'],[/xuất khẩu|sang |châu âu|quốc tế|cptpp|evfta|vào chuỗi|rcep/,'export'],
  [/đơn |hợp đồng|mua |bao tiêu|chọn mua|đặt hàng|đặt \d+|khách|bán chạy|được giá|cầu.*tăng/,'contract'],
  [/mở rộng|mở thêm|khởi công|xây |quy hoạch|mặt bằng|đất được giao/,'expansion'],
 ];
 // The named incident takes precedence over incidental explanations in its body.
 // For example, a machine order must not become an inspection because its body mentions quality checks.
 for(const text of [title,body])for(const [pattern,action] of rules)if(pattern.test(text))return action;
 return {storm:'storm',rain:'rain',flood:'flood',drought:'drought',heatwave:'heat',earthquake:'quake',epidemic:'illness',fire:'fire',pollution:'pollution',cyber:'cyber',power_outage:'power',strike:'strike',scandal:'complaint',market_crash:'fall',boom:'contract',expansion:'research',none:'certification'}[event.visual]??'contract';
}
function sourceLine(action) {
 if(['staffloss','arrival','training','shift','strike','illness','complaint'].includes(action))return 'eng';
 if(['shortage','supply','counterfeit','contract','export','cancellation','rise','fall','ban'].includes(action))return 'sup';
 if(['delay','flood','storm','fog','hail','rain','expansion','aid','credit','tax','inspection','lawsuit'].includes(action))return 'inf';
 return 'mac';
}
function resourceFor(title) {
 const words=[[/wafer|quang khắc/,'wafer'],[/graphite|than cốc|than nhập|than đá/,'coal'],[/khí neon/,'oxygen'],[/kim loại|đất hiếm|thép|nhôm|titan|quặng|thiếc|đồng tăng|đồng tái chế|giá đồng/,'ingot'],[/sợi|cáp|vải|cuộn/,'rolls'],[/pin|cell /,'battery'],[/ô tô|xe điện|xe hybrid|xe buýt|taxi/,'car'],[/cá|tôm|hải sản/,'fish'],[/lúa|gạo|lúa mạch/,'wheat'],[/cà phê|trà |chè /,'cup'],[/nước|màng lọc/,'water'],[/sữa/,'milk'],[/điều thô|điều nhân|cacao/,'nut'],[/mía|rau|vườn/,'sprout'],[/thuốc|dược/,'pill'],[/hóa chất|axit|hóa mỹ phẩm|dung môi/,'flask'],[/năng lượng|điện /,'bolt'],[/rừng|cây|gỗ/,'tree'],[/máy chủ|gpu/,'server'],[/linh kiện|chip|vi mạch|bán dẫn/,'chip'],[/màn hình|oled|lcd/,'monitor']];
 return words.find(([pattern])=>new RegExp(`(?<!\\p{L})(?:${pattern.source.trim()})(?!\\p{L})`,'iu').test(title))?.[1]??null;
}
function countryFor(text) {
 const choices=[[/châu âu|evfta|\bEU\b/iu,'eu'],[/Trung Quốc/u,'cn'],[/Hàn Quốc|hãng Hàn|đối tác Hàn/iu,'kr'],[/Nhật|JAXA/u,'jp'],[/Mỹ(?!\p{L}| phẩm)|Silicon|Thung lũng Silicon/u,'us'],[/Thái Lan|sang Thái/u,'th'],[/Campuchia/u,'kh'],[/Singapore/u,'sg'],[/Indonesia/u,'id'],[/Philippines/u,'ph'],[/Úc(?!\p{L})|Australia/u,'au'],[/Đài Loan/u,'tw'],[/Ấn Độ/u,'in'],[/Canada/u,'ca'],[/Pháp(?!\p{L})/u,'fr'],[/Đức(?!\p{L})/u,'de'],[/Na Uy/u,'no'],[/Brazil/u,'br'],[/Qatar/u,'qa'],[/Israel/u,'il'],[/trong nước|nội địa|Việt Nam/u,'vn']];
 return choices.find(([pattern])=>pattern.test(text))?.[1]??null;
}
function modifier(icon) {return /-off$/.test(icon)?'off':/-x$/.test(icon)?'x':/-check$/.test(icon)?'check':/-plus$/.test(icon)?'plus':/-minus$/.test(icon)?'minus':'';}
function industrySubject(event,action,resource) {
 const title=event.title.toLowerCase();
 if(/động đất/.test(title))return 'quake';
 if(/quang khắc|wafer/.test(title))return /hỏng/.test(title)?'waferbroken':'wafer';
 if(/khí neon/.test(title))return 'oxygen';
 if(event.id==='may-cong-cu-07')return 'press'; // A CNC machine order, not the seed's generic car pictogram.
 if(/phần mềm|mã độc/.test(title)&&event.icon==='bug')return 'errorcode';
 if(action==='illness'&&/dịch bệnh|ổ dịch|nghỉ vì ốm|nhiễm khuẩn/.test(title))return 'virus';
 if(/hút ẩm.*mốc|mốc.*sản phẩm/.test(title))return 'mold';
 if(event.id==='linh-kien-dien-tu-04')return 'localfactory';
 if(event.id==='do-go-02')return 'forestcertificate';
 if(event.id==='do-go-05')return 'wood';
 if(/ùn tắc cửa khẩu/.test(title))return 'bordergoods';
 if(action==='strike')return 'groupstrike';
 if(action==='staffloss')return /thiếu/.test(title)?'person':'staffleave';
 if(action==='cyber'&&['shield-alert','bug','lock','database-zap'].includes(event.icon))return /dữ liệu|thiết kế|bản vẽ/.test(title)?'dataleak':'dataprotection';
 if(['rise','fall'].includes(action)&&['trending-up','trending-down','coins','chart-candlestick'].includes(event.icon)&&resource)return resource;
 return subjectFor(event.icon);
}
export function eventCatalog() {
 const industries=read('industries.seed.json').industries;
 const entries=[];
 for(const industry of industries)for(const event of industry.events){
  const action=actionFor(event),title=event.title.toLowerCase();
  const resource=event.id==='duong-sat-04'?'building':event.id==='duong-sat-07'?'mountain':resourceFor(event.title);
  let line=sourceLine(action);
  if(/máy |thiết bị|wafer|dây chuyền|bản vẽ|thiết kế|chip|vi mạch|bán dẫn/.test(title))line='mac';
  if(/cửa khẩu|cảng|logistics|vận chuyển|thông quan|kho |sân bay|cao tốc/.test(title))line='inf';
  entries.push({id:event.id,title:event.title,body:event.description,industry:industry.slug,industryName:industry.name,icon:event.icon,
   subject:industrySubject(event,action,resource),modifier:modifier(event.icon),resource,country:countryFor(event.title),
   action,good:event.tone==='good',visual:event.visual,line,art:`assets/investments/handdrawn-v1/${industry.slug}/${line}.webp`,source:'industry'});
 }
 for(const event of read('events.seed.json').events){
  if(!generalSubjects[event.id])throw Error(`General event needs an explicit subject: ${event.id}`);
  const action=actionFor(event),subject=generalSubjects[event.id];
  entries.push({id:event.id,title:event.title,body:event.body,subject,modifier:'',action,good:event.good,visual:event.visual,art:null,source:'general'});
  for(const [index,variant]of(event.variants??[]).entries())entries.push({id:`${event.id}--narration-${index+1}`,title:variant.title,body:variant.body,subject,modifier:'',action:actionFor({...event,title:variant.title,body:variant.body}),good:event.good,visual:event.visual,art:null,source:'narration',parent:event.id,region:variant.region,context:variant.context,resource:variant.context==='hạ tầng còn yếu'?'road':variant.context==='khủng hoảng'?'coinsgone':variant.region?'pin':null});
 }
 for(const event of read('family.seed.json').events){const [subject,action,painted]=familySubjects[event.id];entries.push({id:event.id,title:event.title,body:event.body,subject,action,painted,good:event.good,art:null,source:'family'});}
 for(const [id,title,subject,action,painted,good]of systemEvents)entries.push({id,title,subject,action,painted,good,art:null,source:'system'});
 return {industries:industries.map(i=>i.slug),entries,contexts};
}
