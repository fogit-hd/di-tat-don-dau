const HOUR_MS = 60 * 60 * 1000

export function keepAliveEnabled(raw: string | undefined) {
  if (raw === undefined || raw.trim() === '') return true
  const value = raw.trim().toLowerCase()
  if (value === '0' || value === 'false' || value === 'off' || value === 'no') return false
  return true
}

export function keepAliveIntervalMs(raw: string | undefined) {
  const parsed = raw === undefined || raw.trim() === '' ? 18 : Number(raw)
  const hours = Number.isFinite(parsed) ? parsed : 18
  const clamped = Math.min(24, Math.max(12, hours))
  return { ms: clamped * HOUR_MS, hours: clamped, clamped: clamped !== hours }
}

type Timer = { unref?: () => void }

export function startDbKeepAlive(options?: {
  enabled?: boolean
  intervalMs?: number
  ping?: () => Promise<unknown>
  schedule?: (fn: () => void, ms: number) => Timer
}) {
  const enabled = options?.enabled ?? keepAliveEnabled(process.env.DB_KEEPALIVE)
  if (!enabled) return () => undefined
  const planned = keepAliveIntervalMs(process.env.DB_KEEPALIVE_HOURS)
  const intervalMs = options?.intervalMs ?? planned.ms
  const ping =
    options?.ping ??
    (async () => {
      const { prisma } = await import('../prisma')
      await prisma.$queryRaw`SELECT 1`
    })
  if (!options) {
    if (planned.clamped) console.log(`DB_KEEPALIVE_HOURS ngoài khoảng 12–24, dùng ${planned.hours}`)
    console.log(`DB keep-alive mỗi ${planned.hours} giờ`)
  }
  const schedule = options?.schedule ?? setInterval
  const timer = schedule(() => {
    void Promise.resolve()
      .then(ping)
      .catch((error: unknown) => {
        console.error('DB keep-alive lỗi', error)
      })
  }, intervalMs)
  timer.unref?.()
  return () => clearInterval(timer as ReturnType<typeof setInterval>)
}
