import { PAGE_SIZE } from '../lib/pagination'
import {useState} from 'react'
import type {QuestionReview} from '../api/types'
import './quiz-review.css'

export function PlayerQuestionReview({rows}:{rows:QuestionReview[]}){
 const [page,setPage]=useState(0),current=Math.min(page,Math.max(0,Math.ceil(rows.length/PAGE_SIZE)-1))
 return <section className="quiz-review" aria-label="Câu trả lời của bạn"><h2>Câu trả lời của bạn</h2>
 {!rows.length?<p>Chưa có dữ liệu đáp án cho phiên này.</p>:<>{rows.slice(current*PAGE_SIZE,current*PAGE_SIZE+PAGE_SIZE).map((q,i)=><article className="quiz-review-card" key={q.id}>
  <header><span>Câu {current*PAGE_SIZE+i+1} · Năm {q.year}</span><b className={q.correct?'up':'down'}>{!q.chosenOptionId?'Chưa trả lời':q.correct?'Trả lời đúng':'Trả lời sai'}</b></header>
  <h3>{q.prompt}</h3><ol className="quiz-options">{q.options.map((o,index)=>{const correct=o.id===q.correctOptionId,chosen=o.id===q.chosenOptionId;return <li key={o.id} className={`${correct?'is-correct':''} ${chosen&&!correct?'is-wrong':''}`}><span className="quiz-option-letter">{'ABCD'[index]}</span><span>{o.text}</span><b>{correct?(chosen?'Bạn chọn · Đúng':'Đáp án đúng'):chosen?'Bạn đã chọn':''}</b></li>})}</ol>
  {q.explanation&&<p className="quiz-explanation">{q.explanation}</p>}
 </article>)}<nav className="session-pagination" aria-label="Trang câu trả lời"><button type="button" className="session-button secondary" disabled={!current} onClick={()=>setPage(current-1)}>Trước</button><span>{current+1}/{Math.ceil(rows.length/PAGE_SIZE)}</span><button type="button" className="session-button secondary" disabled={(current+1)*PAGE_SIZE>=rows.length} onClick={()=>setPage(current+1)}>Sau</button></nav></>}
 </section>
}
