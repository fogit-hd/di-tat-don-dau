export type QuestionDef = {
  id: string
  topic: string
  section: string
  difficulty: number
  type: string
  typeTitle: string
  prompt: string
  options: { id: string; text: string }[]
  correctOptionId: string
  explanation: string
}

