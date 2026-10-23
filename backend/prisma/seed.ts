import type { Prisma } from '@prisma/client'
import { ensureDatabaseSchema } from '../src/db/ensure-schema'
import { prisma } from '../src/prisma'
import { balance } from './seed/balance'
import { seedOfficial } from './seed/official'
import { seedEventTypes } from './seed/event-types'
import { seedSuccession } from './seed/succession'
import { QUESTIONS } from './seed/pack'
import { ENDINGS, LINES, QUESTION_TYPES, TEMPLATES } from './seed/rules'

async function main() {
  await ensureDatabaseSchema()
  const official = await seedOfficial(prisma)
  const eventTypes = await seedEventTypes(prisma)
  const succession = await seedSuccession(prisma)
  for (const type of QUESTION_TYPES) {
    await prisma.questionType.upsert({
      where: { id: type.id },
      create: type,
      update: { title: type.title, sort: type.sort },
    })
  }
  for (const line of LINES) {
    await prisma.investmentLine.upsert({
      where: { id: line.id },
      create: line,
      update: { label: line.label, hint: line.hint, log: line.log, sort: line.sort },
    })
  }
  for (const [key, value] of Object.entries(TEMPLATES)) {
    await prisma.copyTemplate.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    })
  }

  for (const question of QUESTIONS) {
    const data = {
      topic: question.topic,
      section: question.section,
      difficulty: question.difficulty,
      typeId: question.type,
      prompt: question.prompt,
      explanation: question.explanation,
      correctOptionId: question.correctOptionId,
      active: true,
    }
    await prisma.question.upsert({
      where: { id: question.id },
      create: { id: question.id, ...data },
      update: data,
    })
    await prisma.questionOption.deleteMany({ where: { questionId: question.id } })
    for (const [sort, option] of question.options.entries()) {
      await prisma.questionOption.create({
        data: { questionId: question.id, key: option.id, text: option.text, sort },
      })
    }
  }

  for (const ending of ENDINGS) {
    await prisma.ending.upsert({
      where: { id: ending.id },
      create: ending,
      update: ending,
    })
  }
  await prisma.balanceConfig.upsert({
    where: { id: 'default' },
    create: { id: 'default', payload: balance as unknown as Prisma.InputJsonValue },
    update: { payload: balance as unknown as Prisma.InputJsonValue },
  })

  console.log(
    `Đã nạp ${official.industries} ngành, ${official.regions} vùng, ${official.themes} chủ đề ghép, ${QUESTIONS.length} câu hỏi, ${official.events} sự kiện ngành, ${eventTypes} loại sự kiện, ${ENDINGS.length} kết cục, ${succession.reasons} lý do chuyển giao.`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
