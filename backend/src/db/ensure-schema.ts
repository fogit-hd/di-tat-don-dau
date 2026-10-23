import { PrismaClient } from '@prisma/client'
import { adminUrl, schemaFromUrl } from './postgres-url'

export async function ensureDatabaseSchema(url = process.env.DIRECT_URL || process.env.DATABASE_URL) {
  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) process.env.DIRECT_URL = process.env.DATABASE_URL
  if (!url) throw new Error('Thiếu DATABASE_URL')
  const schema = schemaFromUrl(url)
  if (schema === 'public') return schema
  const client = new PrismaClient({ datasourceUrl: adminUrl(url) })
  try {
    await client.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)
  } finally {
    await client.$disconnect()
  }
  return schema
}
