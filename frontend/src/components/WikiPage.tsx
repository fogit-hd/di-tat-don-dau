import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import catalog from '../lib/wiki-catalog.json'
import { ArtText as T, PaintedArt as Art } from './ArtText'
import { factoryArt, investmentArt } from '../lib/art'

type Industry = typeof catalog.industries[number]
type EventRow = typeof catalog.events[number]
type Section = 'start' | 'industries' | 'upgrades' | 'production' | 'events' | 'risk'
const sections: { id: Section; label: string; art: string }[] = [
  {id:'start',label:'Bắt đầu',art:'/assets/landing-v2/book.webp'},
  {id:'industries',label:'64 ngành',art:'/assets/ui/static-events-v3/warehouse.webp'},
  {id:'upgrades',label:'Đầu tư & nâng cấp',art:'/assets/ui/static-events-v3/new-machinery.webp'},
  {id:'production',label:'Sản lượng & thu nhập',art:'/assets/ui/static-events-v3/market-recovery.webp'},
  {id:'events',label:'Sự kiện',art:'/assets/ui/static-events-v3/storm.webp'},
  {id:'risk',label:'Rủi ro & chuyển giao',art:'/assets/ui/static-events-v3/longevity.webp'},
]
const contexts = [
  {id:'base',title:'Sự kiện gốc',pct:0,years:0},
  {id:'input-shortage',title:'Nguồn đầu vào bị siết',pct:15,years:2},
  {id:'local-supplier',title:'Nhà cung cấp trong nước vào chuỗi',pct:-12,years:2},
  {id:'port-delay',title:'Cảng và kho bãi ùn tắc',pct:8,years:1},
  {id:'green-support',title:'Gói mua sắm xanh được duyệt',pct:-10,years:2},
  {id:'credit-tightening',title:'Tín dụng thiết bị bị siết',pct:6,years:1},
  {id:'tech-transfer',title:'Chuyển giao thiết bị theo lô',pct:-8,years:1},
  {id:'new-standard',title:'Tiêu chuẩn đầu vào mới',pct:10,years:2},
]
const groups=[...new Map(catalog.industries.map(i=>[i.group,i.groupName])).entries()]
const vn=(value:number,digits=2)=>value.toLocaleString('vi-VN',{maximumFractionDigits:digits})
const money=(value:number)=>Math.abs(value)>=1000?`${vn(value/1000)} tỷ`:`${vn(value)} triệu`
const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d')
const artwork=(name:string)=>`/assets/ui/static-events-v3/${name}.webp`
const replace=(text:string,industry:string)=>text.replaceAll('{{factory}}','doanh nghiệp của bạn').replaceAll('{{industry}}',industry).replaceAll('{{region}}','địa phương')

function Heading({title,body}:{title:string;body?:string}){
  return <div className="wiki-heading"><h1><T text={title} bold /></h1>{body&&<p><T text={body}/></p>}</div>
}
function Fold({title,children}:{title:string;children:React.ReactNode}){
  return <details className="wiki-fold"><summary><T text={title} bold/><span className="wiki-fold-arrow" aria-hidden="true"><T text="›"/></span></summary><div>{children}</div></details>
}
function Receipt({rows}:{rows:[string,string][]}){
  return <dl className="wiki-receipt">{rows.map(([label,value])=><div key={label}><dt><T text={label}/></dt><dd><T text={value} bold/></dd></div>)}</dl>
}
function Pager({page,total,onChange}:{page:number;total:number;onChange:(n:number)=>void}){
  return total>1?<div className="wiki-pages"><button type="button" disabled={page===0} onClick={()=>onChange(page-1)}><T text="Trước"/></button><T text={`${page+1} / ${total}`}/><button type="button" disabled={page>=total-1} onClick={()=>onChange(page+1)}><T text="Tiếp"/></button></div>:null
}

export function WikiPage(){
  const [params,setParams]=useSearchParams()
  const requested=params.get('section') as Section|null
  const section=sections.some(s=>s.id===requested)?requested!:'start'
  const industry=catalog.industries.find(i=>i.id===params.get('industry'))??catalog.industries[0]
  const [search,setSearch]=useState('')
  const [group,setGroup]=useState('')
  const [eventKind,setEventKind]=useState('all')
  const [tone,setTone]=useState('all')
  const [page,setPage]=useState(0)
  const [selectedEvent,setSelectedEvent]=useState<EventRow|null>(null)
  const [context,setContext]=useState('base')
  const navigate=(next:Section,id?:string)=>{
    setParams({section:next,...(id?{industry:id}:{})})
    setSearch('');setPage(0);setSelectedEvent(null);setContext('base')
    window.scrollTo({top:0,behavior:'smooth'})
  }
  const selectIndustry=(id:string)=>{setParams({section,industry:id});setSelectedEvent(null)}
  const openEvent=(row:EventRow)=>{
    setSelectedEvent(row);setContext('base')
    window.requestAnimationFrame(()=>{
      const detail=document.getElementById('wiki-event-detail')
      detail?.focus({preventScroll:true})
      detail?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})
    })
  }
  const filteredIndustries=catalog.industries.filter(i=>(!group||i.group===group)&&normalize(i.name).includes(normalize(search)))
  const filteredEvents=useMemo(()=>catalog.events.filter(e=>{
    const relevant=eventKind==='all'||(eventKind==='industry'?e.industry===industry.id:e.industry===eventKind)
    return relevant&&(tone==='all'||String(e.good)===tone)&&normalize(`${e.title} ${e.body}`).includes(normalize(search))
  }),[eventKind,industry.id,tone,search])
  const select=<label className="wiki-industry-selector"><span className="sr-only">Chọn ngành</span><select value={industry.id} onChange={e=>selectIndustry(e.target.value)}>{catalog.industries.map(i=><option value={i.id} key={i.id}>{i.name}</option>)}</select></label>
  return <main className="wiki-layout public-wrap" id="wiki-main">
    <aside className="wiki-sidebar painted-frame" data-painted-frame>
      <nav aria-label="Mục lục Wiki">{sections.map(s=><button type="button" key={s.id} className={section===s.id?'active':''} aria-current={section===s.id?'page':undefined} onClick={()=>navigate(s.id,industry.id)}><Art src={s.art}/><T text={s.label}/></button>)}</nav>
      <Art src="/assets/landing-v2/hero-art.webp" className="wiki-side-art"/>
    </aside>
    <section className="wiki-paper painted-frame" data-painted-frame aria-label="Nội dung Wiki">
      <div className="wiki-mobile-nav"><label><span className="sr-only">Mục lục Wiki</span><select value={section} onChange={e=>navigate(e.target.value as Section,industry.id)}>{sections.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label></div>
      {section==='start'&&<>
        <Heading title="Wiki trò chơi" body="Tra cứu ngành, nâng cấp và sự kiện"/>
        <form className="wiki-search" onSubmit={e=>{e.preventDefault();setParams({section:'events'});setPage(0)}}><input type="search" aria-label="Tìm trong Wiki" placeholder="Tìm ngành, nâng cấp, sự kiện…" value={search} onChange={e=>setSearch(e.target.value)}/><button type="submit" className="public-button"><T text="Tìm kiếm"/></button></form>
        <div className="wiki-entry-list">{[
          ['Mở cụm & tuyển người','Tìm hiểu vốn khởi động, tổ vận hành và giá riêng của từng ngành.','/assets/landing-v2/step-2.webp','industries'],
          ['Được gì sau mỗi năm?','Xem sản lượng, giá bán, chi phí và các khoản cộng trừ tiền mặt.','/assets/landing-v2/step-3.webp','production'],
          ['Hiểu tác động sự kiện','Tra cứu ảnh, tác động, thời hạn và tương tác giữa các sự kiện.',artwork('storm'),'events'],
        ].map(([title,body,src,next])=><button type="button" className="wiki-entry" key={title} onClick={()=>navigate(next as Section)}><Art src={src}/><div><h2><T text={title} bold/></h2><p><T text={body}/></p></div><span className="wiki-chevron" aria-hidden="true"><T text="›"/></span></button>)}</div>
        <div className="wiki-notice"><h2><T text="Gameplay: chỉ hiện kết quả" bold/></h2><p><T text="Trong game, theo dõi giá mua, lợi ích, số còn thiếu và tiền được/mất. Công thức, điều kiện và cách vận hành được tra cứu trong Wiki."/></p><p><T text="Thông tin theo mô hình cụm sản xuất mới. Lượt lưu cũ và cấu hình riêng của phòng có thể khác."/></p></div>
      </>}
      {section==='industries'&&<>
        <Heading title="Tra cứu 64 ngành" body="Giá cơ sở và định mức của cụm sản xuất đầu tiên"/>
        <div className="wiki-toolbar"><input type="search" placeholder="Tìm ngành…" aria-label="Tìm ngành" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}/><select aria-label="Nhóm ngành" value={group} onChange={e=>{setGroup(e.target.value);setPage(0)}}><option value="">Tất cả nhóm ngành</option>{groups.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></div>
        <div className="wiki-industry-head" aria-hidden="true">{['Ngành','Người / cụm','Tuyển 1 người','Mở 1 cụm','Vốn đủ tổ'].map(t=><T text={t} key={t}/>)}</div>
        <div className="wiki-industry-list">{filteredIndustries.slice(page*8,page*8+8).map(i=><button type="button" className={`wiki-industry-row ${i.id===industry.id?'selected':''}`} key={i.id} onClick={()=>selectIndustry(i.id)} aria-label={`Xem ${i.name}`}>
          <div className="wiki-industry-name"><Art src={factoryArt(i.id)}/><T text={i.name} bold/></div>
          <span><small><T text="Người / cụm"/></small><T text={String(i.crew)}/></span>
          <span><small><T text="Tuyển 1 người"/></small><T text={money(i.prices.eng)}/></span>
          <span><small><T text="Mở 1 cụm"/></small><T text={money(i.prices.mac)}/></span>
          <span><small><T text="Vốn đủ tổ"/></small><T text={money(i.prices.mac+i.crew*i.prices.eng)} bold/></span>
        </button>)}</div>
        {!filteredIndustries.length&&<p role="status"><T text="Không tìm thấy ngành phù hợp."/></p>}
        <Pager page={page} total={Math.ceil(filteredIndustries.length/8)} onChange={setPage}/>
        <div className="wiki-industry-summary"><Art src={factoryArt(industry.id)}/><div><h2><T text={industry.name} bold/></h2><p><T text="Giá cơ sở cho lượt mới; ưu đãi, số lần mua và cấu hình phòng làm thay đổi giá thực trả."/></p><div className="wiki-inline-actions"><button onClick={()=>navigate('production',industry.id)}><T text="Sản lượng & thu nhập"/></button><button onClick={()=>navigate('upgrades',industry.id)}><T text="Nâng cấp theo ngành"/></button><button onClick={()=>{navigate('events',industry.id);setEventKind('industry')}}><T text="Sự kiện liên quan"/></button></div></div></div>
      </>}
      {section==='production'&&<ProductionArticle industry={industry} selector={select}/>}
      {section==='upgrades'&&<UpgradeArticle industry={industry} selector={select}/>}
      {section==='events'&&<>
        <Heading title="Danh mục sự kiện" body="1.388 sự kiện gốc · 10.348 bản ghi sau mở rộng"/>
        <div className="wiki-toolbar"><input type="search" aria-label="Tìm sự kiện" placeholder="Tìm tên sự kiện, tác động…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);setSelectedEvent(null)}}/><select aria-label="Loại sự kiện" value={eventKind} onChange={e=>{setEventKind(e.target.value);setPage(0);setSelectedEvent(null)}}><option value="all">Tất cả sự kiện</option><option value="industry">Ngành đang chọn</option><option value="general">Sự kiện chung</option><option value="family">Gia đình & quản trị</option></select><select value={tone} aria-label="Sắc thái gốc" onChange={e=>{setTone(e.target.value);setPage(0);setSelectedEvent(null)}}><option value="all">Tất cả sắc thái gốc</option><option value="true">Gốc có lợi</option><option value="false">Gốc bất lợi</option></select></div>
        {eventKind==='industry'&&select}
        <p className="wiki-meta"><T text={`${filteredEvents.length} sự kiện gốc phù hợp. Biến thể ngữ cảnh được gom trong từng sự kiện.`}/></p>
        <div className="wiki-events-list">{filteredEvents.slice(page*8,page*8+8).map(e=><button type="button" key={e.id} className={`wiki-event-row ${selectedEvent?.id===e.id?'selected':''}`} onClick={()=>openEvent(e)}><Art src={artwork(e.art)}/><div><h2><T text={e.title} bold/></h2><p><T text={e.industry==='general'?'Sự kiện chung':e.industry==='family'?'Gia đình & quản trị':catalog.industries.find(i=>i.id===e.industry)?.name??''}/></p></div><span aria-hidden="true" className="wiki-chevron"><T text="›"/></span></button>)}</div>
        {!filteredEvents.length&&<p role="status"><T text="Không tìm thấy sự kiện phù hợp."/></p>}
        <Pager page={page} total={Math.ceil(filteredEvents.length/8)} onChange={setPage}/>
        {selectedEvent&&<EventDetail row={selectedEvent} context={context} setContext={setContext}/>}
        <Fold title="Sự kiện hệ thống và kết quả chuyển giao"><p><T text="Ngoài bộ bốc thường còn có tử vong, doanh nghiệp trăm năm, Nhà nước duyệt hỗ trợ, giải ngân khởi động lại và năm kết quả chuyển giao: phá sản, mất tài sản, giữ nguyên, tăng tài sản, nhân tài sản."/></p><div className="wiki-system-grid">{[['mortality','Tử vong'],['centennial','Doanh nghiệp trăm năm'],['state-support','Hỗ trợ vốn'],['bankruptcy','Phá sản'],['inheritance-loss','Mất tài sản'],['inheritance-steady','Giữ nguyên'],['inheritance-growth','Tăng tài sản']].map(([art,title])=><div key={title}><Art src={artwork(art==='mortality'?'illness':art==='centennial'?'patent':art)}/><T text={title}/></div>)}</div><p><T text="Thời hạn kinh tế tính theo năm. Các câu hỏi và hoạt cảnh mới dùng giây. Tử vong kết thúc lượt; chỉ phá sản trong chuyển giao và đã được duyệt hỗ trợ mới có thể khởi động lại."/></p></Fold>
      </>}
      {section==='risk'&&<RiskArticle/>}
    </section>
  </main>
}

function ProductionArticle({industry:i,selector}:{industry:Industry;selector:React.ReactNode}){
  const entry=i.prices.mac+i.crew*i.prices.eng,revenue=entry*.33,cost=entry*.11
  return <>
    <div className="wiki-article-top"><Heading title={i.name} body="Ví dụ cơ sở · chưa tính sự kiện và biến động"/>{selector}</div>
    <Art src={factoryArt(i.id)} className="wiki-article-hero"/>
    <h2><T text="Chi phí đầu tư ban đầu (1 cụm)" bold/></h2>
    <div className="wiki-cost-cards"><div><Art src={investmentArt(i.id,'mac')}/><T text={`1 cụm: ${money(i.prices.mac)}`} bold/></div><div><Art src={investmentArt(i.id,'eng')}/><T text={`${i.crew} công nhân × ${money(i.prices.eng)}`} bold/></div><div><Art src={artwork('market-recovery')}/><T text={`Tổng: ${money(entry)}`} bold/></div></div>
    <h2><T text="Quy trình tạo thu nhập (một chu kỳ sản xuất)" bold/></h2>
    <div className="wiki-process">{[[investmentArt(i.id,'eng'),'Đủ tổ vận hành'],[investmentArt(i.id,'mac'),'100 đơn vị sản phẩm'],[artwork('supplier-truck'),'Bán 90 đơn vị'],[artwork('market-recovery'),'Thu nhập sản xuất']].map(([src,title])=><div key={title}><Art src={src}/><T text={title} bold/></div>)}</div>
    <div className="wiki-article-columns"><div className="wiki-inset"><h2><T text="Thu nhập cơ sở một cụm" bold/></h2><Receipt rows={[["Doanh thu cơ sở",money(revenue)],["Chi phí vận hành",'−'+money(cost)],["Lãi sản xuất cơ sở",'+'+money(revenue-cost)]]}/><p><T text="Chưa trừ lạm phát tiền mặt, lãi vay và các khoản sự kiện. Đây là mốc giải thích, không phải thu nhập bảo đảm."/></p></div><div>
      <Fold title="Cách tính sản lượng"><p><T text="Cụm chạy = số nhỏ hơn giữa tổng số cụm và số tổ đủ người. Người dư không tự sinh sản lượng."/></p><p><T text="Sản lượng = cụm chạy × 100 × công nghệ × tay nghề × chất lượng × tình trạng máy × biến động × tác động sự kiện; làm tròn xuống."/></p><p><T text="Biến động nền 97–103% sản lượng, 98–102% giá bán; bốc theo % nguyên. Sự kiện giảm 10% sản lượng nhân hệ số 0,9 trước khi làm tròn."/></p></Fold>
      <Fold title="Giá bán & ô nhiễm"><p><T text={`Giá bán cơ sở mỗi sản phẩm: ${money(entry*.33/.9/100)}. Giá thực tế còn chịu biến động và sự kiện.`}/></p><p><T text="Ô nhiễm từ 0 đến 100. Trên 30 bắt đầu giảm giá bán, tối đa 35%. Công nghệ sạch giảm ô nhiễm, không tự tăng số cụm hay nhân lực."/></p><p><T text="Ô nhiễm năm mới = ô nhiễm cũ × 0,9 + phát thải sản xuất − xử lý xanh, giới hạn 0–100."/></p></Fold>
      <Fold title="Các khoản cộng trừ tiền mặt"><p><T text="Tiền cuối năm = tiền đầu năm − đầu tư + doanh thu − vận hành − lạm phát + lãi vay (âm nếu có nợ) + tiền hiệu ứng hằng năm + sự kiện tức thời."/></p><p><T text="Chi phí vận hành chia: đầu vào 65%, logistics 20%, khác 15%. Phụ trợ và hạ tầng giảm đúng phần chi phí tương ứng; các khoản không biến mất khi sản lượng bị giảm."/></p></Fold>
      <Fold title="Đọc dự báo và sổ từng năm"><p><T text="Thông số trong gameplay là dự báo kỳ tới với đầu tư và hiệu ứng đang biết. Khoảng thấp–cao phản ánh dao động sản xuất và giá; chưa bao gồm sự kiện mới. Dự báo sau nâng cấp không phải thu nhập được bảo đảm."/></p><p><T text="Lãi sản xuất là doanh thu bán hàng trừ chi phí vận hành. Lạm phát, lãi nợ, đầu tư và tiền sự kiện là các dòng riêng trong sổ; không cộng hoặc trừ một tác động hai lần. Hiệu ứng sản lượng, giá hoặc chi phí được phản ánh trong kết quả sản xuất, không phải một khoản tiền mặt riêng."/></p><p><T text="Sổ lưu số gốc của từng năm. Tổng tiền cuối năm dùng các khoản thực tế đã lưu; chỉ làm tròn để hiển thị triệu hoặc tỷ. Vì vậy các dòng tiền đã làm tròn có thể lệch rất nhỏ khi cộng tay. Kết quả năm cũ không được tính lại bằng nguồn lực hiện tại."/></p></Fold>
      <Fold title="Tài sản công ty và điểm xếp hạng"><p><T text="Định giá = tiền mặt + giá trị nhân lực + thiết bị + phụ trợ + hạ tầng + công nghệ sạch + thương hiệu − phạt ô nhiễm − phạt phụ thuộc; làm tròn và không thấp hơn 0. Phá sản có định giá 0."/></p><p><T text="Nhân lực = số người × giá tuyển cơ sở ngành × hệ số tay nghề × 0,74 × (1 + công nghệ × 0,05). Thiết bị = số cụm × giá cụm cơ sở × hệ số chất lượng × (0,4 + 0,6 × tỷ lệ đủ người) × tình trạng."/></p><p><T text="Phụ trợ = cấp × giá cơ sở × 0,9; hạ tầng dùng 0,86; công nghệ sạch dùng 0,84. Thương hiệu = tổng doanh thu đã tạo × 10%. Mỗi điểm ô nhiễm trừ 8 triệu, mỗi điểm phụ thuộc trừ 90 triệu theo cấu hình mặc định."/></p><p><T text="Đây là định giá, không phải tiền có thể chi ngay. Kết cục chuyển giao hoặc trăm năm có thể chốt điểm riêng; xem kết quả lượt."/></p></Fold>
    </div></div>
    <div className="wiki-notice"><T text="Hiện mọi ngành dùng 100 đơn vị đầu ra quy ước cho một cụm cơ sở; giá bán được cân theo vốn đủ tổ. Đây là quy tắc game, không phải sản lượng và chi phí doanh nghiệp ngoài đời."/></div>
  </>
}

function UpgradeArticle({industry:i,selector}:{industry:Industry;selector:React.ReactNode}){
  const [chosen,setChosen]=useState('inf')
  const rows=[
    {id:'eng',title:'Tuyển công nhân',body:'Bổ sung người vận hành.',price:i.prices.eng,detail:`Mỗi lần thêm 1 người. Một cụm ngành này cần ${i.crew} người. Đủ tổ mới vận hành thêm cụm; tuyển dư không tự tăng sản lượng.`},
    {id:'mac',title:'Mở cụm sản xuất',body:'Thêm công suất khi đủ tổ.',price:i.prices.mac,detail:'Mỗi lần thêm 1 cụm nguyên. Thiếu người thì cụm chờ vận hành và vẫn có chi phí duy trì. Ưu đãi giá không làm giảm đơn vị nhận được.'},
    {id:'sup',title:'Phụ trợ',body:'Giảm chi phí đầu vào, giảm tác động thiếu vật tư.',price:i.prices.sup,detail:'Giảm phần chi phí đầu vào và mức bất lợi của cú sốc vật tư đã được phân loại. Lợi ích tăng chậm dần, không tự sinh sản phẩm. Không bảo vệ mọi loại sự kiện.'},
    {id:'inf',title:'Hạ tầng',body:'Giao được nhiều hàng hơn, giảm chi phí vận chuyển.',price:i.prices.inf,detail:'Hạ tầng không tự tạo sản phẩm. Tỷ lệ giao hàng tăng từ 90% và tiến dần tới 100%; chi phí logistics giảm dần, tối đa 30% phần logistics.'},
    {id:'grn',title:'Công nghệ sạch',body:'Giảm ô nhiễm, bảo vệ giá bán.',price:i.prices.grn,detail:'Giảm ô nhiễm ngay khi nâng cấp và tăng khả năng xử lý mỗi năm. Ô nhiễm cao làm giảm giá bán và định giá; lợi ích xanh phụ thuộc mức ô nhiễm thực.'},
  ] as const
  const selected=rows.find(r=>r.id===chosen)??rows[3]
  return <><div className="wiki-article-top"><Heading title="Đầu tư để được gì?"/>{selector}</div><div className="wiki-upgrade-list">{rows.map(r=><button type="button" className={`wiki-upgrade-row ${chosen===r.id?'selected':''}`} key={r.id} onClick={()=>setChosen(r.id)}><Art src={investmentArt(i.id,r.id)}/><div><h2><T text={r.title} bold/></h2><p><T text={r.body}/></p></div><T text={money(r.price)} bold/></button>)}</div>
    <div className="wiki-article-columns"><div className="wiki-inset"><h2><T text={selected.title} bold/></h2><p><T text={selected.detail}/></p><Fold title="Giới hạn và công thức"><p><T text="Phụ trợ: giảm đầu vào = 30% × (1 − exp(−0,35 × cấp)); bảo vệ sốc vật tư = 50% × (1 − exp(−0,25 × cấp))."/></p><p><T text="Hạ tầng: giảm logistics = 30% × (1 − exp(−0,4 × cấp)); giao hàng = 90% + 10% × (1 − exp(−0,35 × cấp))."/></p></Fold></div>
    <div className="wiki-inset"><h2><T text="Chất lượng & bảo dưỡng" bold/></h2>{[['training','Đào tạo tay nghề','Thêm 5% hệ số tay nghề mỗi cấp, tối đa cấp 5.'],['new-machinery','Cải tiến thiết bị','Thêm 8% hệ số chất lượng mỗi cấp, tối đa cấp 5.'],['cnc-breakdown','Bảo dưỡng','Khôi phục tình trạng máy về 100%; không thêm cụm.']].map(([art,title,body])=><div className="wiki-quality" key={title}><Art src={artwork(art)}/><div><h3><T text={title} bold/></h3><p><T text={body}/></p></div></div>)}<p><T text="Đào tạo và cải tiến mở khi có 3 cụm đang vận hành. Bảo dưỡng cần có cụm và tình trạng máy dưới 99%."/></p></div></div>
    <Fold title="Vì sao giá nâng cấp tăng?"><p><T text="Giá cơ sở riêng theo ngành. Giá mua tăng sau các gói đã mua, thêm bậc quy mô; tuyển người tăng theo tổ. Mua ×5, ×10 hoặc Tối đa là tổng giá từng gói, không nhân giá gói đầu cho tất cả."/></p><p><T text="Gọi P là giá một gói sau hệ số phòng và ưu đãi; n là số gói đã mua; b là số người mỗi tổ khi tuyển, các hạng mục khác b = 1. Giá gói tiếp = P + max(1, làm tròn P × 4%) × floor(n / b) + max(1, làm tròn P × 20%) × floor(n / (10 × b))²."/></p><p><T text="Giá đào tạo = (20 + số người × giá tuyển ngành × 10%) × (1 + cấp hiện tại × 0,6). Giá cải tiến = (50 + số cụm × giá cụm ngành × 12%) × (1 + cấp hiện tại × 0,6). Giá bảo dưỡng = 15 + số cụm × giá cụm ngành × 2,5%. Các số tiền trong công thức là triệu VNĐ; làm tròn lên trước khi áp ưu đãi mua."/></p><p><T text="Giá đào tạo phụ thuộc số người và cấp; cải tiến phụ thuộc số cụm và cấp; bảo dưỡng phụ thuộc số cụm. Hóa đơn còn chịu hệ số giá phòng và sự kiện."/></p></Fold>
  </>
}

function EventDetail({row,context,setContext}:{row:EventRow;context:string;setContext:(s:string)=>void}){
  const isIndustry=row.industry!=='general'&&row.industry!=='family'
  const variant=contexts.find(c=>c.id===context)??contexts[0]
  const effect={...row.effect} as Record<string,number|number[]>
  if(isIndustry&&context!=='base'){effect.investmentPct=variant.pct;effect.years=Math.max(Number(effect.years??1),variant.years)}
  const labels:Record<string,string>={revenuePct:'Doanh thu',costPct:'Chi phí',assetsPct:'Tài sản (tức thời)',cashPerYear:'Tiền mỗi năm',investmentPct:'Giá đầu tư',outputMul:'Sản lượng',priceMul:'Giá bán',inflationMul:'Hệ số lạm phát',cash:'Tiền tức thời',machinesAdd:'Cụm tăng sau làm tròn',machinesPct:'Số cụm',engineersAdd:'Nhân lực theo ngành',engineersPct:'Nhân lực',pollution:'Ô nhiễm',tech:'Công nghệ',support:'Phụ trợ',dependency:'Phụ thuộc'}
  const impacts=Object.entries(effect).filter(([key,value])=>key in labels&&(Array.isArray(value)?value.some(v=>v!==(key.endsWith('Mul')?1:0)):value!==0)).map(([key,value])=>{
    const neutral=key.endsWith('Mul')?1:0
    const [a,b]=Array.isArray(value)?value:[value,value]
    const low=a===b?neutral+(a-neutral)*.8:a,high=a===b?neutral+(b-neutral)*1.2:b
    const bounds=[low,high].sort((x,y)=>x-y)
    const pct=key.endsWith('Pct')||key.endsWith('Mul')
    const num=(n:number)=>key.endsWith('Mul')?vn(Math.round((n-1)*100)):['machinesPct','engineersPct','cashPct'].includes(key)?vn(Math.round(n*100)):pct?vn(Math.round(n)):['cash','cashPerYear'].includes(key)?money(Math.round(n)):key==='machinesAdd'?vn(Math.round(n)):vn(n)
    return [labels[key],`${num(bounds[0])} đến ${num(bounds[1])}${pct?'%':''}`] as [string,string]
  })
  const nonNeutral=impacts.filter(([,value])=>value!=='0 đến 0%')
  const years=Number(effect.years??1)
  return <article className="wiki-event-detail" id="wiki-event-detail" tabIndex={-1} aria-label={`Chi tiết ${row.title}`}>
    <h2><T text={row.title+(isIndustry&&context!=='base'?' · '+variant.title:'')} bold/></h2>
    {isIndustry&&<label><span className="sr-only">Biến thể ngữ cảnh</span><select aria-label="Biến thể ngữ cảnh" value={context} onChange={e=>setContext(e.target.value)}>{contexts.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>}
    <div className="wiki-event-detail-grid"><Art src={artwork(row.art)}/><div><p><T text={replace(row.body,catalog.industries.find(i=>i.id===row.industry)?.name??'ngành của bạn')}/></p>
      {nonNeutral.length?<Receipt rows={nonNeutral}/>:<p><T text="Chưa có tác động kinh tế trực tiếp được khai báo cho sự kiện gốc này."/></p>}
      {row.trait&&<p className="wiki-notice"><T text={traitText(row.trait)}/></p>}
      <p><T text={`Hiệu ứng kinh tế áp dụng từ năm kế tiếp, kéo dài ${Math.max(1,Math.floor(years*.8))}–${Math.ceil(years*1.2)} năm sau bốc. Thay đổi tiền/tài sản/nhân lực tức thời xảy ra ngay khi nhận sự kiện.`}/></p>
    </div></div>
    <Fold title="Phạm vi, ngẫu nhiên & cộng dồn"><p><T text="Các khoảng trên là dải bốc quanh mốc dữ liệu, chưa áp bảo vệ phụ trợ và quy mô. % tác động được làm tròn nguyên; số người/cụm được làm tròn sau quy đổi. Mức cuối cùng được lưu khi sự kiện xuất hiện, không bốc lại khi mở xem."/></p><p><T text="Hệ số đang hiệu lực được nhân với nhau. Tác động gốc vẫn được giữ khi thêm ngữ cảnh giá đầu tư; vì vậy một biến thể có thể vừa có lợi vừa có hại."/></p><p><T text="Sự kiện kinh tế được bốc theo CEO; cơ chế hiện tại còn có khả năng lan sự kiện đầu sang các CEO khác. Trait gia đình theo CEO và giữ đến khi thay đổi lượt; nghỉ hưu có thể chuyển giao ngay."/></p></Fold>
    {row.narrations.length>0&&<Fold title="Lời dẫn theo địa phương và bối cảnh">{row.narrations.map((n:{title:string;body:string},index:number)=><p key={index}><T text={replace(n.title+' — '+n.body,'ngành của bạn')}/></p>)}</Fold>}
    <p className="wiki-meta"><T text={`Mã dữ liệu: ${row.id}${context==='base'?'':'--'+context}`}/></p>
  </article>
}
function traitText(trait:string){
  return ({longevity:'Trường thọ khóa rủi ro ở mức thấp: tử vong 0,5%, chuyển giao 1% mỗi năm; không tăng theo năm hoặc cộng Bạo bệnh.',illness:'Bạo bệnh: mức rủi ro bổ sung được bốc một lần cho CEO, rồi áp tại mỗi lần chốt năm; không cộng chồng mức bệnh qua từng năm.',heir_trained:'Tăng trọng số kết quả phát đạt khi chuyển giao.',inheritance_dispute:'Tăng trọng số kết quả mất tài sản khi chuyển giao.',family_fund:'Chặn kết quả phá sản khi chuyển giao. Tử vong vẫn kết thúc lượt.',life_insurance:'Khi tử vong, chi trả bảo hiểm theo quy mô và hệ số đã bốc, rồi chốt kết quả lượt.',heir_abroad:'Tăng trọng số kết quả nhân tài sản khi chuyển giao.',early_retirement:'Kích hoạt chuyển giao ngay. Kết quả có thể chốt lượt; chỉ phá sản có hỗ trợ đã duyệt mới đủ điều kiện làm lại.'} as Record<string,string>)[trait]??trait
}
function RiskArticle(){
  return <><Heading title="Hiểu rủi ro trước khi chốt năm" body="Phân biệt kết thúc lượt, chuyển giao và hỗ trợ khởi động lại"/>
    <div className="wiki-article-columns wiki-risk-pair">{[['retirement','Tử vong','Kết thúc lượt chơi. Tài sản được chốt theo quy tắc hiện tại; bảo hiểm có thể cộng tiền trước khi chốt.'],['handover','Chuyển giao điều hành','Bốc kết quả tài sản. Không đổi người chơi. Đa số kết quả chốt lượt; phá sản chỉ được làm lại khi đã có hỗ trợ được duyệt.']].map(([art,title,body])=><div className="wiki-inset" key={title}><Art src={artwork(art)}/><h2><T text={title} bold/></h2><p><T text={body}/></p></div>)}</div>
    <div className="wiki-notice"><h2><T text="Lộ trình tăng rủi ro" bold/></h2><p><T text="Mốc tăng phụ thuộc độ dài phiên và số giây mỗi năm. Sau mốc này: tử vong tăng 0,2 điểm %/năm; chuyển giao tăng 0,25 điểm %/năm, có giới hạn. Đây là luật cộng theo năm, không làm tròn thành % nguyên."/></p><p><T text="Trường thọ khóa rủi ro thấp. Bạo bệnh là phần cộng riêng tại mỗi lần chốt năm, không phải bệnh tự nặng thêm từng năm."/></p></div>
    {[['longevity','Trường thọ','longevity'],['illness','Bạo bệnh','illness'],['family-fund','Quỹ gia tộc','family_fund'],['life-insurance','Bảo hiểm nhân thọ','life_insurance']].map(([art,title,trait])=><div className="wiki-quality" key={title}><Art src={artwork(art)}/><div><h2><T text={title} bold/></h2><p><T text={traitText(trait)}/></p></div></div>)}
    <Fold title="Các kết quả tài sản sau chuyển giao"><Receipt rows={[["Phá sản","0% tài sản"],["Mất tài sản","Mất 10–60%"],["Giữ nguyên","100%"],["Phát đạt","Tăng 20–100%"],["Nhân tài sản","Bằng 2–3 lần"]]}/><p><T text="Xác suất không đồng đều và còn phụ thuộc trait. % tài sản được bốc nguyên và hiện kết quả cụ thể; mốc giữa trong dữ liệu cũ không phải mức cố định."/></p></Fold>
    <Fold title="Khi nào được Nhà nước cấp vốn làm lại?"><p><T text="Quyết định chấp thuận có thể xuất hiện hiếm trước giai đoạn rủi ro tăng. Chỉ được giải ngân nếu công ty phá sản trong chuyển giao và quyền hỗ trợ chưa dùng. Tử vong không được khởi động lại."/></p></Fold>
    <Fold title="Cách bốc rủi ro và câu hỏi"><p><T text="Mỗi lần chốt năm có thể bốc sự kiện kinh tế, sau đó kiểm tra các nhánh đặc biệt, rủi ro và câu hỏi. Trần sự kiện thường mặc định là 2 trong một lần chốt; các trait và kết quả đặc biệt là nhánh riêng. Túi bốc tránh lặp đúng mã cho đến khi hết túi, nhưng các biến thể cùng gốc vẫn là mã khác nhau."/></p><p><T text="Mặc định chuyển giao bắt đầu từ 1% và bị giới hạn mức nền 4%; tử vong bắt đầu từ 0,5% và giới hạn mức nền 2%. Bạo bệnh có phần cộng riêng; trường thọ khóa hai mức 1% và 0,5%. Cấu hình quản trị hoặc phiên cũ có thể khác; tỷ lệ thực của CEO được hiển thị trong tab Rủi ro."/></p><p><T text="Khi có câu hỏi chưa giải quyết, đồng hồ năm của CEO được giữ lại; đồng hồ chung của phiên và thời hạn trả lời vẫn chạy. Không mở chồng câu hỏi mới khi câu trước còn chờ. Thưởng câu đúng trong mô hình mới là tiền bốc trong khoảng 32–48 triệu, không tự tặng công nhân."/></p></Fold>
  </>
}
