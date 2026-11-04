import type {Pending,TeamState} from './types'

export type QuestionVisit={id:string;answerId?:string;questionId:string;prompt:string;options:{id:string;text:string}[];correctOptionId?:string;explanation:string;year:number;chosenOptionId?:string;correct?:boolean;resolved:boolean}

export function rememberQuestion(state:TeamState,pending:Pending){
  if(pending.kind!=='question'||state.questionHistory?.some(q=>q.id===pending.id))return
  state.questionHistory=[...(state.questionHistory??[]),{id:pending.id,questionId:pending.questionId??pending.id,prompt:pending.body,options:pending.options.map(o=>({...o})),correctOptionId:pending.correctOptionId,explanation:pending.explanation,year:state.cycles, resolved:false}]
}
export function resolveQuestionReview(state:TeamState,pending:Pending,answerId:string){
  rememberQuestion(state,pending)
  const row=state.questionHistory?.find(q=>q.id===pending.id)
  if(row){row.answerId=answerId;row.chosenOptionId=pending.chosenOptionId;row.correct=Boolean(pending.correct);row.resolved=true}
}
/** Snapshot the actual shuffled options. Never consult a possibly edited catalog. */
export function quizStatistics(visits:QuestionVisit[]){
  const groups=new Map<string,{questionId:string;prompt:string;correct:number;total:number;appearances:number;unanswered:number;options:{id:string;text:string;count:number;correct:boolean}[]}>()
  for(const visit of visits){
    // Contextual variants keep their own text and option set; same question may be filled for different industries.
    const key=JSON.stringify([visit.questionId,visit.prompt,visit.options.map(o=>[o.id,o.text]).sort(),visit.correctOptionId])
    let row=groups.get(key)
    if(!row){row={questionId:key,prompt:visit.prompt,correct:0,total:0,appearances:0,unanswered:0,options:visit.options.map(o=>({...o,count:0,correct:o.id===visit.correctOptionId}))};groups.set(key,row)}
    row.appearances++
    if(visit.resolved){row.total++;if(visit.correct)row.correct++}
    if(!visit.chosenOptionId)row.unanswered++
    else {const option=row.options.find(o=>o.id===visit.chosenOptionId);if(option)option.count++}
  }
  return [...groups.values()]
}
