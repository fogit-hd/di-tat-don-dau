import { useMemo, useState } from 'react'
import questions from '../lib/wiki-questions.json'
import { PublicArtText as T } from './PublicArtText'
import { PAGE_SIZE } from '../lib/pagination'
import { PageControls } from './PageControls'
import './wiki-questions.css'

const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase()
const example=(text:string)=>text.replaceAll('{{industry}}','ngành được phân cho CEO').replaceAll('{{region}}','địa phương').replaceAll('{{leap}}','Tiếp thu và làm chủ công nghệ ở khâu có lợi thế').replaceAll('{{worker}}','nhân lực kỹ thuật')

export function WikiQuestions(){
 const [search,setSearch]=useState(''),[section,setSection]=useState(''),[page,setPage]=useState(0)
 const filtered=useMemo(()=>questions.filter(q=>(!section||q.section===section)&&normalize(q.prompt+' '+q.options.map(o=>o.text).join(' ')+' '+q.explanation).includes(normalize(search))),[search,section])
 const current=Math.min(page,Math.max(0,Math.ceil(filtered.length/PAGE_SIZE)-1))
 return <section className="wiki-questions" aria-label="Ngân hàng câu hỏi">
  <div className="wiki-heading"><h1><T text="Câu hỏi & đáp án" bold/></h1><p><T text={`${questions.length} câu ôn tập · Công nghiệp hóa, hiện đại hóa ở Việt Nam`}/></p></div>
  <p className="wiki-question-scope">Phạm vi 6.1.1–6.1.2 trong đề cương thuyết trình. Nước A và mục tiêu 50.000 kỹ sư là tình huống giả định. Câu hỏi theo ngành được thay ngữ cảnh phù hợp với CEO trong trò chơi.</p>
  <div className="wiki-toolbar"><input type="search" aria-label="Tìm câu hỏi" placeholder="Tìm câu hỏi, đáp án, giải thích…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}/><select aria-label="Phạm vi câu hỏi" value={section} onChange={e=>{setSection(e.target.value);setPage(0)}}><option value="">Toàn bộ 6.1.1–6.1.2</option><option value="6.1.1">6.1.1 · CMCN và công nghiệp hóa</option><option value="6.1.2">6.1.2 · Tất yếu và nội dung CNH-HĐH</option></select></div>
  <p role="status" className="wiki-meta">{filtered.length} câu phù hợp · tối đa {PAGE_SIZE} câu/trang</p>
  <div className="wiki-question-list">{filtered.slice(current*PAGE_SIZE,(current+1)*PAGE_SIZE).map((q,index)=><details className="wiki-question-card" key={q.id}>
   <summary><span className="wiki-question-number">{current*PAGE_SIZE+index+1}</span><span><b>{example(q.prompt)}</b><small>Mục {q.section}</small></span><span className="wiki-question-expand" aria-hidden="true">⌄</span></summary>
   <div className="wiki-question-answer"><ol>{q.options.map((option,i)=><li key={option.id} className={option.id===q.correctOptionId?'is-correct':''}><b>{'ABCD'[i]}</b><span>{example(option.text)}</span>{option.id===q.correctOptionId&&<strong>Đáp án đúng</strong>}</li>)}</ol><p><b>Giải thích: </b>{example(q.explanation)}</p></div>
  </details>)}</div>
  {!filtered.length&&<p>Không tìm thấy câu hỏi phù hợp.</p>}
  <PageControls page={current} count={filtered.length} onChange={setPage} label="Trang ngân hàng câu hỏi"/>
  <details className="wiki-fold wiki-question-sources"><summary>Nguồn và phạm vi biên soạn</summary><p>Câu hỏi được biên soạn để ôn tập, không chép nguyên văn hay nhận là đề thi chính thức. Phạm vi theo đề cương và tình huống thuyết trình được cung cấp.</p><p>Giáo trình: Bộ Giáo dục và Đào tạo, Kinh tế chính trị Mác–Lênin, hệ không chuyên lý luận chính trị, 2021; phạm vi đọc trang 224–259 theo đề cương. <a href="https://thuvienso.tnut.edu.vn/handle/123456789/594?locale=vi" target="_blank" rel="noreferrer">Thông tin thư mục giáo trình</a>.</p><p>Tài liệu đối chiếu bổ sung về kết hợp tuần tự với đi tắt đón đầu và nhân lực: <a href="https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-29-nq-tw-ve-tiep-tuc-day-manh-cong-nghiep-hoa-hien-dai-hoa-dat-nuoc-den-nam-2030-119221129121112971.htm" target="_blank" rel="noreferrer">Nghị quyết 29-NQ/TW (2022)</a>. Đây là tài liệu bổ sung, không phải nội dung mới cần học ngoài phạm vi thuyết trình.</p></details>
 </section>
}
