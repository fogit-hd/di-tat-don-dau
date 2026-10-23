import { spawn } from 'child_process'
import { createRequire } from 'module'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { afterAll, expect, it } from 'vitest'
import { ensureDatabaseSchema } from './ensure-schema'
import { runMigrateDeploy } from './migrate-deploy'
import { adminUrl, prepareDatabaseEnv } from './postgres-url'

const require = createRequire(__filename)
const backendRoot = path.resolve(__dirname, '../..')
const schema = 'ditatdondau_test'
const base = 'postgresql://chip:chip@127.0.0.1:5432/chipgame'
const saved = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
}

function runSeed() {
  const tsx = require.resolve('tsx/cli')
  return new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, [tsx, 'prisma/seed.ts'], {
      cwd: backendRoot,
      env: process.env,
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('exit', (code) => resolve(code ?? 1))
  })
}

async function withAdmin<T>(run: (client: PrismaClient) => Promise<T>) {
  const client = new PrismaClient({ datasourceUrl: adminUrl(`${base}?schema=public`) })
  try {
    return await run(client)
  } finally {
    await client.$disconnect()
  }
}

it(
  'migrates and seeds into the schema named by the connection string',
  async (ctx) => {
    const probe = new PrismaClient({ datasourceUrl: `${base}?schema=public` })
    try {
      await probe.$queryRaw`SELECT 1`
    } catch {
      await probe.$disconnect()
      ctx.skip()
      return
    }
    await probe.$disconnect()

    const publicBefore = await withAdmin(async (client) => {
      const rows = await client.$queryRaw<Array<{ n: number }>>`SELECT COUNT(*)::int AS n FROM public."Industry"`
      return rows[0]?.n ?? 0
    })

    await withAdmin(async (client) => {
      await client.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
    })

    process.env.DATABASE_URL = `${base}?schema=${schema}`
    process.env.DIRECT_URL = `${base}?schema=${schema}`
    prepareDatabaseEnv()

    try {
      expect(await ensureDatabaseSchema()).toBe(schema)
      expect(await runMigrateDeploy()).toBe(0)

      const tables = await withAdmin(async (client) => {
        const rows = await client.$queryRaw<Array<{ n: number }>>`
          SELECT COUNT(*)::int AS n
          FROM information_schema.tables
          WHERE table_schema = ${schema} AND table_name = 'Industry'
        `
        return rows[0]?.n ?? 0
      })
      expect(tables).toBe(1)

      const game = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL })
      try {
        const searchPath = await game.$queryRaw<Array<{ search_path: string }>>`SHOW search_path`
        expect(searchPath[0]?.search_path ?? '').toContain(schema)
        expect(await game.industry.count()).toBe(0)
        expect(await runSeed()).toBe(0)
        expect(await game.industry.count()).toBe(64)
      } finally {
        await game.$disconnect()
      }

      const publicAfter = await withAdmin(async (client) => {
        const rows = await client.$queryRaw<Array<{ n: number }>>`SELECT COUNT(*)::int AS n FROM public."Industry"`
        return rows[0]?.n ?? 0
      })
      expect(publicAfter).toBe(publicBefore)
    } finally {
      await withAdmin(async (client) => {
        await client.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
      })
      if (saved.DATABASE_URL === undefined) delete process.env.DATABASE_URL
      else process.env.DATABASE_URL = saved.DATABASE_URL
      if (saved.DIRECT_URL === undefined) delete process.env.DIRECT_URL
      else process.env.DIRECT_URL = saved.DIRECT_URL
    }
  },
  120_000,
)

afterAll(() => {
  if (saved.DATABASE_URL === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = saved.DATABASE_URL
  if (saved.DIRECT_URL === undefined) delete process.env.DIRECT_URL
  else process.env.DIRECT_URL = saved.DIRECT_URL
})
