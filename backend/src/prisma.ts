import { createRequire } from 'module'
import { loadEnv } from './load-env'
import { prepareDatabaseEnv } from './db/postgres-url'

loadEnv()
prepareDatabaseEnv()

const require = createRequire(__filename)
const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client')

export const prisma = new PrismaClient()
