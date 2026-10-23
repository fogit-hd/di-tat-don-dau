import { spawn } from 'child_process'
import { createRequire } from 'module'
import { loadEnv } from '../load-env'
import { ensureDatabaseSchema } from './ensure-schema'
import { prepareDatabaseEnv } from './postgres-url'

const require = createRequire(__filename)

export function runMigrateDeploy() {
  const cli = require.resolve('prisma/build/index.js')
  return new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, [cli, 'migrate', 'deploy'], {
      stdio: 'inherit',
      env: process.env,
    })
    child.on('error', reject)
    child.on('exit', (code) => resolve(code ?? 1))
  })
}

async function main() {
  loadEnv()
  prepareDatabaseEnv()
  if (!process.env.DATABASE_URL) {
    console.error('Thiếu DATABASE_URL')
    process.exit(1)
  }
  const schema = await ensureDatabaseSchema()
  if (schema !== 'public') console.log(`Schema ${schema} đã sẵn sàng`)
  const code = await runMigrateDeploy()
  process.exit(code)
}

if (process.argv[1] && /migrate-deploy\.ts$/.test(process.argv[1])) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
