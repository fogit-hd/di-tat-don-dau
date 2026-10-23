import { createServer } from 'http'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import { ZodError, z } from 'zod'
import {
  HttpError,
  answerPrompt,
  bootRooms,
  buildSnapshot,
  confirmIntro,
  createRoom,
  dismissPrompt,
  endRoom,
  getRoom,
  globalBoard,
  advanceTeamYear,
  investLine,
  joinRoom,
  listThemes,
  lobbyView,
  publicSetup,
  noteDisconnect,
  notifyRoom,
  pauseRoom,
  resumeRoom,
  setEmitter,
  setRoomEventEmitter,
  setSuccessionEmitter,
  startLoop,
  startRoom,
  touchTeam,
  updateRoom,
  withRoom,
  type Viewer,
} from './runtime'
import type { Line } from './game/types'
import { startDbKeepAlive } from './db/keep-alive'
import { loadEnv } from './load-env'

loadEnv()

const port = Number(process.env.PORT || 4607)
const app = express()
app.use(express.json({ limit: '1mb' }))
const origins = (process.env.CORS_ORIGINS || 'https://neoforcelab.com,http://localhost:4517,http://127.0.0.1:4517,http://localhost:4607,http://127.0.0.1:4607')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
app.use(
  cors({
    origin: origins.includes('*') ? true : origins,
    credentials: true,
  }),
)

app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() })
})
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() })
})

app.post('/api/content/reload', async (req, res, next) => {
  try {
    const expected = process.env.CONTENT_RELOAD_TOKEN
    if (!expected) return res.status(404).json({ error: 'Chưa bật tải lại nội dung' })
    if (req.header('x-reload-token') !== expected) return res.status(403).json({ error: 'Sai mã tải lại' })
    const { reloadCatalog } = await import('./game/catalog')
    const loaded = await reloadCatalog()
    res.json({
      ok: true,
      themes: loaded.themeCount,
      questions: loaded.questions.length,
      events: loaded.events.length,
      loadedAt: loaded.loadedAt,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/setup', (_req, res, next) => {
  try {
    res.json(publicSetup())
  } catch (error) {
    next(error)
  }
})

app.get('/api/themes', async (_req, res, next) => {
  try {
    res.json(await listThemes())
  } catch (error) {
    next(error)
  }
})

app.get('/api/leaderboard', async (req, res, next) => {
  try {
    const theme = typeof req.query.theme === 'string' ? req.query.theme : undefined
    res.json({ rows: await globalBoard(theme) })
  } catch (error) {
    next(error)
  }
})

const settings = z.object({
  hostName: z.string().trim().min(1).max(40).optional(),
  durationMin: z.number().int().min(1).max(45).optional(),
  startingCapital: z.number().min(2000).max(100000).optional(),
  cycleSeconds: z.number().int().min(10).max(180).optional(),
  yearMinSeconds: z.number().int().min(0).max(120).optional(),
  linePrices: z
    .object({
      eng: z.number().positive().max(100000),
      mac: z.number().positive().max(100000),
      sup: z.number().positive().max(100000),
      inf: z.number().positive().max(100000),
      grn: z.number().positive().max(100000),
    })
    .partial()
    .optional(),
})

app.post('/api/rooms', async (req, res, next) => {
  try {
    const body = settings
      .extend({
        hostName: z.string().trim().min(1).max(40),
        durationMin: z.number().int().min(1).max(45),
        startingCapital: z.number().min(2000).max(100000),
        debugFast: z.boolean().optional(),
        debugDeathYear: z.number().int().min(1).max(200).optional(),
        debugCentennialYear: z.number().int().min(1).max(200).optional(),
        debugForceDeath: z.boolean().optional(),
      })
      .parse(req.body)
    res.json(await createRoom(body))
  } catch (error) {
    next(error)
  }
})

app.get('/api/rooms/:code/exists', (req, res) => {
  const room = getRoom(param(req.params.code))
  if (!room) return res.status(404).json({ error: 'Không thấy phòng này' })
  return res.json({ ok: true, code: room.code, status: room.status, hostName: room.hostName })
})

app.get('/api/rooms/:code', (req, res) => {
  const room = getRoom(param(req.params.code))
  if (!room) return res.status(404).json({ error: 'Không thấy phòng' })
  return res.json(lobbyView(room))
})

app.patch('/api/rooms/:code', async (req, res, next) => {
  try {
    const code = param(req.params.code)
    const body = settings.parse(req.body)
    const token = hostToken(req)
    const room = await withRoom(code, () => updateRoom(code, token, body))
    res.json(room)
  } catch (error) {
    next(error)
  }
})

app.post('/api/rooms/:code/join', async (req, res, next) => {
  try {
    const code = param(req.params.code)
    const body = z.object({ teamName: z.string() }).parse(req.body)
    res.json(await withRoom(code, () => joinRoom(code, body.teamName)))
  } catch (error) {
    next(error)
  }
})

app.post('/api/rooms/:code/start', async (req, res, next) => {
  try {
    const code = param(req.params.code)
    res.json(await withRoom(code, () => startRoom(code, hostToken(req))))
  } catch (error) {
    next(error)
  }
})

app.post('/api/rooms/:code/pause', async (req, res, next) => {
  try {
    const code = param(req.params.code)
    res.json(await withRoom(code, () => pauseRoom(code, hostToken(req))))
  } catch (error) {
    next(error)
  }
})

app.post('/api/rooms/:code/resume', async (req, res, next) => {
  try {
    const code = param(req.params.code)
    res.json(await withRoom(code, () => resumeRoom(code, hostToken(req))))
  } catch (error) {
    next(error)
  }
})

app.post('/api/rooms/:code/end', async (req, res, next) => {
  try {
    const code = param(req.params.code)
    res.json(await withRoom(code, () => endRoom(code, hostToken(req))))
  } catch (error) {
    next(error)
  }
})

app.post('/api/rooms/:code/intro', async (req, res, next) => {
  try {
    const code = param(req.params.code)
    const body = z.object({ factoryName: z.string().max(40) }).parse(req.body)
    res.json(await withRoom(code, () => confirmIntro(code, playerToken(req), body.factoryName)))
  } catch (error) {
    next(error)
  }
})

app.post('/api/rooms/:code/year', async (req, res, next) => {
  try {
    const code = param(req.params.code)
    res.json(await withRoom(code, () => advanceTeamYear(code, playerToken(req))))
  } catch (error) {
    next(error)
  }
})

app.post('/api/rooms/:code/invest', async (req, res, next) => {
  try {
    const code = param(req.params.code)
    const body = z.object({ line: z.enum(['eng', 'mac', 'sup', 'inf', 'grn']) }).parse(req.body)
    res.json(await withRoom(code, () => investLine(code, playerToken(req), body.line as Line)))
  } catch (error) {
    next(error)
  }
})

app.post('/api/rooms/:code/answer', async (req, res, next) => {
  try {
    const code = param(req.params.code)
    const body = z.object({ optionId: z.string().min(1).max(40) }).parse(req.body)
    res.json(await withRoom(code, () => answerPrompt(code, playerToken(req), body.optionId)))
  } catch (error) {
    next(error)
  }
})

app.post('/api/rooms/:code/dismiss', async (req, res, next) => {
  try {
    const code = param(req.params.code)
    res.json(await withRoom(code, () => dismissPrompt(code, playerToken(req))))
  } catch (error) {
    next(error)
  }
})

app.get('/api/rooms/:code/leaderboard', (req, res) => {
  const room = getRoom(param(req.params.code))
  if (!room) return res.status(404).json({ error: 'Không thấy phòng' })
  const snap = buildSnapshot(room, { role: 'host', code: room.code })
  return res.json({ rows: snap.leaderboard })
})

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' })
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message })
  console.error(error)
  return res.status(500).json({ error: 'Lỗi máy chủ' })
})

const server = createServer(app)
const io = new Server(server, {
  cors: { origin: origins.includes('*') ? true : origins, credentials: true },
})

setRoomEventEmitter((code, event, payload) => {
  io.to(`room:${code}`).emit(event, payload)
})

setSuccessionEmitter((code, notice) => {
  void io.in(`room:${code}`).fetchSockets().then((sockets) => {
    for (const socket of sockets) {
      const view = socket.data.view as Viewer | undefined
      if (!view) continue
      const forHost = view.role === 'host'
      const forTeam = view.role === 'player' && view.teamId === notice.teamId
      if (forHost || forTeam) socket.emit('team:succession', notice)
    }
  })
})

setEmitter((code) => {
  const room = getRoom(code)
  if (!room) return
  void io.in(`room:${code}`).fetchSockets().then((sockets) => {
    for (const socket of sockets) {
      const view = socket.data.view as Viewer | undefined
      if (!view) continue
      socket.emit('snapshot', buildSnapshot(room, view))
    }
  })
})

io.on('connection', (socket) => {
  socket.on('hello', (payload: { code?: string; role?: string; token?: string }) => {
    const code = String(payload?.code || '').toUpperCase()
    void withRoom(code, async () => {
      const room = getRoom(code)
      if (!room) {
        socket.emit('problem', { error: 'Không thấy phòng' })
        return
      }
      if (payload.role === 'host') {
        const token = String(payload.token || '')
        const snap = buildSnapshot(room, { role: 'host', code })
        const check = await import('crypto').then((crypto) => crypto.createHash('sha256').update(token).digest('hex'))
        if (check !== room.hostTokenHash) {
          socket.emit('problem', { error: 'Sai quyền chủ phòng' })
          return
        }
        socket.data.view = { role: 'host', code } satisfies Viewer
        socket.join(`room:${code}`)
        socket.emit('snapshot', snap)
        return
      }
      const token = String(payload.token || '')
      const hash = (await import('crypto')).createHash('sha256').update(token).digest('hex')
      const team = room.teams.find((item) => item.tokenHash === hash)
      if (!team) {
        socket.emit('problem', { error: 'Không thấy đội trong phòng' })
        return
      }
      const gen = touchTeam(code, team.id)
      socket.data.view = { role: 'player', code, teamId: team.id } satisfies Viewer
      socket.data.teamId = team.id
      socket.data.gen = gen
      socket.data.code = code
      socket.join(`room:${code}`)
      socket.emit('snapshot', buildSnapshot(room, socket.data.view as Viewer))
      notifyRoom(code)
    })
  })

  socket.on('disconnect', () => {
    const code = socket.data.code as string | undefined
    const teamId = socket.data.teamId as string | undefined
    const gen = socket.data.gen as number | undefined
    if (code && teamId && gen) noteDisconnect(code, teamId, gen)
  })
})

async function main() {
  const { loadCatalog } = await import('./game/catalog')
  await loadCatalog()
  await bootRooms()
  startLoop()
  startDbKeepAlive()
  server.listen(port, '0.0.0.0', () => {
    console.log(`API listening on ${port}`)
  })
}

void main()

function hostToken(req: express.Request) {
  return String(req.header('x-host-token') || '')
}
function playerToken(req: express.Request) {
  return String(req.header('x-player-token') || '')
}
function param(value: string | string[]) {
  return String(Array.isArray(value) ? value[0] : value).toUpperCase()
}

