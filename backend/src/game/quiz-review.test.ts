import {describe,it,expect} from 'vitest'
import {rememberQuestion,resolveQuestionReview,quizStatistics} from './quiz-review'
import type {Pending,TeamState} from './types'
const pending=(id:string):Pending=>({id,questionId:'q',kind:'question',phase:'open',title:'',body:'Câu hỏi tiếng Việt?',options:['a','b','c','d'].map(id=>({id,text:'Đáp án '+id})),correctOptionId:'b',explanation:'Giải thích.',expiresAt:1000})
describe('immutable quiz review and option selection statistics',()=>{
 it('keeps original text and shuffled options, without double-recording a visit',()=>{
  const s={cycles:1} as TeamState,p=pending('one');rememberQuestion(s,p);rememberQuestion(s,p);p.options[0].text='Đã sửa';p.body='Đổi nội dung'
  expect(s.questionHistory).toHaveLength(1);expect(s.questionHistory![0].options[0].text).toBe('Đáp án a');expect(s.questionHistory![0].prompt).toBe('Câu hỏi tiếng Việt?')
  p.chosenOptionId='a';p.correct=false;resolveQuestionReview(s,p,'ans');expect(s.questionHistory![0]).toMatchObject({chosenOptionId:'a',correct:false,answerId:'ans',resolved:true})
 })
 it('counts repeated presentations, wrong answers and unanswered timeouts; merges shuffled variants',()=>{
  const s={cycles:2} as TeamState
  for(let i=0;i<3;i++){const p=pending(String(i));if(i===1)p.options.reverse();rememberQuestion(s,p);p.chosenOptionId=i===2?undefined:i===1?'b':'a';p.correct=i===1;resolveQuestionReview(s,p,'answer'+i)}
  const [r]=quizStatistics(JSON.parse(JSON.stringify(s.questionHistory)))
  expect(r).toMatchObject({appearances:3,total:3,correct:1,unanswered:1});expect(r.options.find(o=>o.id==='a')?.count).toBe(1);expect(r.options.find(o=>o.id==='b')).toMatchObject({correct:true,count:1});expect(r.options).toHaveLength(4)
  const variant={...s.questionHistory![0],prompt:'Ngành khác?',id:'different'};expect(quizStatistics([...s.questionHistory!,variant])).toHaveLength(2)
 })
})
