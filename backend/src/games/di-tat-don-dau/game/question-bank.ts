import { QUESTIONS } from './questions.data'
import type { QuestionDef } from './types'

const legacyPrompts:Record<string,string>={
 q16:'Khái niệm Cách mạng công nghiệp 4.0 được nêu tại Hội chợ Hannover (Đức) năm 2011.',
 q17:'CNH-HĐH ở Việt Nam cần tách biệt hoàn toàn khỏi kinh tế thế giới để giữ độc lập.',
 q18:'Nhập máy móc hiện đại mà thiếu người làm chủ thì chưa phải là công nghiệp hóa, hiện đại hóa.',
}

/** Add newly shipped questions without requiring a destructive database reseed.
 * Database edits and explicit inactive flags always take precedence. Existing
 * saved answers retain their own question/option snapshot and stable IDs.
 */
export function mergeQuestionBank(stored:(QuestionDef&{active:boolean})[]):QuestionDef[]{
 const known=new Set(stored.map(q=>q.id)),authored=new Map(QUESTIONS.map(q=>[q.id,q]))
 const active=stored.filter(q=>q.active).map(({active:_,...q})=>{
  if(q.type==='tf'&&q.options.length===2&&q.prompt===legacyPrompts[q.id])return {...authored.get(q.id)!,typeTitle:'Câu hỏi ôn tập'}
  return q
 })
 return [...active,...QUESTIONS.filter(q=>!known.has(q.id)).map(q=>({...q,typeTitle:q.typeTitle||'Câu hỏi ôn tập'}))]
}
