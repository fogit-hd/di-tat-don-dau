import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { QUESTIONS } from './questions.data'
import { mergeQuestionBank } from './question-bank'
import { drawQuestion } from './engine'
import { makeRng } from './rng'
import type { TeamState } from './types'

describe('presentation question bank',()=>{
 it('ships 80 unique, in-scope, four-option questions with one answer and an explanation',()=>{
  expect(QUESTIONS).toHaveLength(80);expect(new Set(QUESTIONS.map(q=>q.id)).size).toBe(80)
  for(const q of QUESTIONS){
   expect(['6.1.1','6.1.2']).toContain(q.section);expect(q.options).toHaveLength(4)
   expect(new Set(q.options.map(o=>o.id)).size).toBe(4);expect(new Set(q.options.map(o=>o.text)).size).toBe(4)
   expect(q.options.filter(o=>o.id===q.correctOptionId)).toHaveLength(1);expect(q.explanation.length).toBeGreaterThan(25)
   expect(q.prompt).toBe(q.prompt.normalize('NFC'))
  }
 })
 it('keeps Wiki and the runtime/seed bank identical',()=>{
  const wiki=JSON.parse(readFileSync(resolve(__dirname,'../../../frontend/src/lib/wiki-questions.json'),'utf8'))
  expect(wiki).toEqual(QUESTIONS)
 })
 it('adds shipped questions without overwriting custom questions or resurrecting inactive IDs',()=>{
  const custom={...QUESTIONS[0],prompt:'Câu hỏi quản trị đã sửa',active:true},disabled={...QUESTIONS[1],active:false}
  const merged=mergeQuestionBank([custom,disabled])
  expect(merged).toHaveLength(79);expect(merged.find(q=>q.id===custom.id)?.prompt).toBe(custom.prompt);expect(merged.find(q=>q.id===disabled.id)).toBeUndefined()
 })
 it('draws the entire bank without repeating an already seen ID',()=>{
  const state={seenQuestions:[]} as unknown as TeamState,rng=makeRng(12)
  for(let i=0;i<80;i++){const q=drawQuestion(state,QUESTIONS,rng)!;expect(q).not.toBeNull();expect(state.seenQuestions).not.toContain(q.id);state.seenQuestions.push(q.id)}
  expect(drawQuestion(state,QUESTIONS,rng)).toBeNull()
 })
})
