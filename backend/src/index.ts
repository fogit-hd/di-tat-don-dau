import { createBackend } from './server'

const backend = createBackend()
void backend.start().then(() => {
  console.log(`API listening on ${process.env.PORT || 4607}: Đi Tắt Đón Đầu + Quiz Duck Race`)
}).catch(async error => {
  console.error('[backend startup]', error)
  await backend.close()
  process.exitCode = 1
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void backend.close().finally(() => process.exit(0))
  })
}
