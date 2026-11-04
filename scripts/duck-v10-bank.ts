import {writeFileSync,mkdirSync} from 'node:fs'
import {QUESTIONS} from '../backend/src/shared/questions/bank'
mkdirSync('design-preview/duck-race-v10',{recursive:true})
writeFileSync('design-preview/duck-race-v10/qa-bank.json',JSON.stringify(QUESTIONS.map(q=>({prompt:q.prompt,correct:q.options.find(o=>o.id===q.correctOptionId)?.text}))))
