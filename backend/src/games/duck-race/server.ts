import { createAuthRouter } from '../../shared/auth-routes'
import { requireHostUser } from '../../shared/auth'
import { HttpError } from '../../shared/http-error'
import type { Server as HttpServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import Redis from 'ioredis'
import { z } from 'zod'
import { loadEnv } from '../../shared/load-env'
import { allowedOrigins } from '../../shared/server-config'
import { customizeRace, armStar, answerRace, attackRace, buyMove, finishRace, joinRace, jumpRace, playCard, RaceError, RULES, snapshot, startRace, steerRace, tickRace, type RaceRoom } from './engine'
import * as experience from './experience/engine'

loadEnv()
/** Own state and simulation; can be mounted beside another game on one HTTP port. */
export function createDuckGame(http: HttpServer) {
const app = express()
const origins = allowedOrigins()
app.use(cors({ origin: origins.includes('*') ? true : origins }))
app.use(express.json({ limit: '16kb' }))
// Canonical identity path is identical in combined and optional standalone mode.
app.use('/api/auth',createAuthRouter())
app.use('/api/duck-race/auth',createAuthRouter()) // Compatibility for older clients.
const io = new Server(http, { path: '/duck-socket', destroyUpgrade: false, cors: { origin: origins.includes('*') ? true : origins } })
const ns = io.of('/duck-race'), rooms = new Map<string, RaceRoom>(), locks = new Map<string, Promise<unknown>>()
const redis = process.env.DUCK_REDIS_URL ? new Redis(process.env.DUCK_REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 }) : undefined
redis?.on('error', error => console.error('[duck-race Redis]', error.message))
const key = (code: string) => `duck-race:v3:room:${code}`
const recent = new Map<string, { at: number; count: number }>()
app.use('/api/duck-race', (req, res, next) => {
  const credential = req.header('x-duck-token') || ''
  const id = `${req.ip || 'local'}:${/^[a-f0-9]{48}$/.test(credential) ? credential : 'entry'}`, now = Date.now(), old = recent.get(id)
  const bucket = !old || now - old.at > 60_000 ? { at: now, count: 0 } : old
  bucket.count++; recent.set(id, bucket)
  if (recent.size > 10000) for (const [k, v] of recent) if (now - v.at > 60_000) recent.delete(k)
  if (bucket.count > 900) return res.status(429).json({ error: 'Thao tác quá nhanh. Vui lòng thử lại sau.' })
  next()
})
async function save(room: RaceRoom) { if (redis) await redis.set(key(room.code), JSON.stringify(room), 'EX', 7200) }
async function find(code: string) {
  code = code.toUpperCase()
  if (!/^D[0-9A-F]{6}$/.test(code)) throw new RaceError('Mã phòng đua cần dạng D và 6 ký tự.', 404)
  let room = rooms.get(code)
  if (!room && redis) { const raw = await redis.get(key(code)); if (raw) { room = JSON.parse(raw); room!.lastTick = Date.now(); for (const p of room!.players) p.connected = false; rooms.set(code, room!) } }
  if (!room) throw new RaceError('Không tìm thấy phòng đua.', 404)
  return room
}
function viewer(room: RaceRoom, token: string) {
  if (token && room.hostToken === token) return undefined
  const p = room.players.find(p => p.token === token)
  if (!p) throw new RaceError('Phiên chơi không hợp lệ. Hãy vào lại phòng.', 403)
  return p
}
async function serial<T>(code: string, fn: () => Promise<T> | T): Promise<T> {
  const task = (locks.get(code) || Promise.resolve()).catch(() => {}).then(() => {
    const room = rooms.get(code); if (room) room.revision = (room.revision || 0) + 1
    return fn()
  }); locks.set(code, task)
  try { return await task } finally { if (locks.get(code) === task) locks.delete(code) }
}
function publish(room: RaceRoom) {
  for (const socket of ns.sockets.values()) if (socket.data.code === room.code) socket.emit('race:snapshot', roomSnapshot(room, socket.data.playerId))
}
const tickRoom=(room:RaceRoom,now=Date.now())=>experience.isExperience(room)?experience.tickExperience(room,now):tickRace(room,now)
const roomSnapshot=(room:RaceRoom,id?:string)=>experience.isExperience(room)?experience.snapshotExperience(room,id):snapshot(room,id)
const route = (fn: (req: express.Request, res: express.Response) => Promise<unknown> | unknown): express.RequestHandler => (req, res, next) => { Promise.resolve().then(() => fn(req, res)).catch(next) }
app.get('/api/duck-race/health', (_req, res) => res.json({ ok: true, game: 'duck-race', storage: redis ? 'redis' : 'memory' }))
app.post('/api/duck-race/rooms', route(async (req, res) => {
  await requireHostUser(req.header('x-host-session') || '')
  if (rooms.size >= 500) throw new RaceError('Máy chủ đã đủ phòng. Vui lòng thử lại sau.', 503)
  let room:RaceRoom = experience.createExperience(); while (rooms.has(room.code) || redis && await redis.exists(key(room.code))) room = experience.createExperience()
  room.storage = redis ? 'redis' : 'memory'; await save(room); rooms.set(room.code, room)
  res.json({ code: room.code, token: room.hostToken })
}))
app.post('/api/duck-race/rooms/:code/join', route(async (req, res) => {
  const body = z.object({ name: z.string(), color: z.string().max(16), model: z.enum(['duckee', 'ducky']), joinId:z.string().uuid().optional() }).parse(req.body)
  const code = String(req.params.code).toUpperCase()
  await serial(code, async () => { const room = await find(code); const p = experience.isExperience(room)?experience.joinExperience(room,body.name,body.color,Date.now(),body.joinId):joinRace(room, body.name, body.color, body.model); await save(room); publish(room); res.json({ code, token: p.token, id: p.id }) })
}))
app.get('/api/duck-race/rooms/:code/entry',route(async(req,res)=>{
 const room=await find(String(req.params.code));res.json(experience.roomEntry(room))
}))
app.get('/api/duck-race/rooms/:code', route(async (req, res) => {
  const code=String(req.params.code).toUpperCase()
  await serial(code,async()=>{const room=await find(code),p=viewer(room,req.header('x-duck-token')||'');tickRoom(room);res.json(roomSnapshot(room,p?.id))})
}))
app.post('/api/duck-race/rooms/:code/action', route(async (req, res) => {
  const body = z.object({ type: z.enum(['start', 'end', 'pause','resume','question','chest','target','answer', 'buy', 'star', 'card', 'jump', 'attack', 'customize']), color:z.string().max(16).optional(),model:z.string().max(16).optional(),glasses:z.string().max(16).optional(),scarf:z.string().max(16).optional(),targetId:z.string().max(80).optional(),gearHead:z.string().max(16).optional(),gearBody:z.string().max(16).optional(), questionId: z.string().max(80).optional(), choice: z.string().max(16).optional(), kind: z.string().max(16).optional(), index: z.number().int().min(0).max(2).optional() }).parse(req.body)
  const code = String(req.params.code).toUpperCase()
  await serial(code, async () => {
    const room = await find(code), p = viewer(room, req.header('x-duck-token') || '')
    if(experience.isExperience(room)){
      tickRoom(room)
      if(['start','end','pause','resume'].includes(body.type)){
        if(p)throw new RaceError('Chỉ chủ phòng được điều khiển trận.',403)
        if(body.type==='start')experience.startExperience(room)
        if(body.type==='end')experience.endExperience(room,'host')
        if(body.type==='pause'||body.type==='resume')experience.pauseExperience(room,body.type==='pause')
      }else{
        if(!p)throw new RaceError('Chủ phòng không tham gia trả lời.',403)
        switch(body.type){
          case 'question':experience.openQuestion(room,p);break
          case 'answer':experience.submitAnswer(room,p,body.questionId||'',body.choice||'');break
          case 'star':experience.armHope(room,p);break
          case 'chest':experience.chooseChest(room,p,body.kind||'');break
          case 'target':experience.chooseTarget(room,p,body.targetId||'');break
          case 'customize':experience.customizeExperience(room,p,body);break
          default:throw new RaceError('Phòng này dùng điểm để xếp vị trí, không còn điều khiển hoặc mua quãng đường.')
        }
      }
      await save(room);publish(room);res.json(roomSnapshot(room,p?.id));return
    }
    if (body.type === 'start' || body.type === 'end') {
      if (p) throw new RaceError('Chỉ chủ phòng được điều khiển ván đua.', 403)
      if (body.type === 'start') startRace(room); else finishRace(room, 'host')
    } else {
      if (!p) throw new RaceError('Chủ phòng không tham gia trả lời hoặc mua quãng đường.', 403)
      if(body.type==='customize')customizeRace(room,p,{color:body.color||'yellow',model:body.model||'duckee',gearHead:body.gearHead,gearBody:body.gearBody})
      if (body.type === 'answer') answerRace(room, p, body.questionId || '', body.choice || '')
      if (body.type === 'buy') buyMove(room, p, body.kind || '')
      if (body.type === 'star') armStar(room, p)
      if (body.type === 'card') playCard(room, p, body.index ?? -1)
      if (body.type === 'jump') jumpRace(room, p)
      if (body.type === 'attack') attackRace(room, p)
    }
    await save(room); publish(room); res.json(roomSnapshot(room, p?.id))
  })
}))
ns.use(async (socket, next) => {
  try {
    const { code, token } = z.object({ code: z.string().max(8), token: z.string().max(64) }).parse(socket.handshake.auth)
    const room = await find(code), p = viewer(room, token)
    socket.data.code = room.code; socket.data.playerId = p?.id; next()
  } catch (e) { next(new Error(e instanceof RaceError ? e.message : 'Không kết nối được phòng đua.')) }
})
ns.on('connection', socket => {
  const room = rooms.get(socket.data.code)!, p = room.players.find(p => p.id === socket.data.playerId)
  if (p) p.connected = true; publish(room)
  let lastInput = 0, lastDirections = ''
  socket.on('race:input', (input: unknown) => {
    const now = Date.now(); if (!p||experience.isExperience(room)) return
    const parsed = z.object({ x: z.number().int().min(-1).max(1), y: z.number().int().min(-1).max(1), crouch: z.boolean().optional(),guard:z.boolean().optional() }).safeParse(input)
    if (parsed.success) {
      const directions = `${parsed.data.x}:${parsed.data.y}:${!!parsed.data.crouch}:${!!parsed.data.guard}`
      if (directions === lastDirections && now - lastInput < 40) return
      lastInput = now; lastDirections = directions
      steerRace(room, p, parsed.data.x, parsed.data.y, now, parsed.data.crouch || false,parsed.data.guard||false)
    }
  })
  socket.on('disconnect', () => {
    const another = [...ns.sockets.values()].some(s => s.data.code === room.code && s.data.playerId === p?.id)
    if (p && !another) { p.connected = false; p.inputX = 0; p.inputY = 0; p.inputUntil = 0 }
    publish(room)
  })
})
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof Error && 'status' in err && err.status === 413) return res.status(413).json({ error: 'Dữ liệu phòng đua quá lớn.' })
  if (err instanceof RaceError || err instanceof HttpError) return res.status(err.status).json({ error: err.message })
  if (err instanceof z.ZodError) return res.status(400).json({ error: 'Dữ liệu phòng đua không hợp lệ.' })
  console.error('[duck-race]', err); res.status(503).json({ error: 'Máy chủ đua vịt tạm gián đoạn. Vui lòng thử lại.' })
})
let timer: ReturnType<typeof setInterval> | undefined
async function start() {
  if (timer) return
  if (redis) await redis.connect()
  let count = 0
  timer = setInterval(() => {
    const now = Date.now(); count++
    for (const [code, room] of rooms) {
      if (now - room.createdAt > 7200_000) { rooms.delete(code); continue }
      void serial(code, async () => { tickRoom(room, now); if (count % 2 === 0) publish(room); if (count % 20 === 0) await save(room) }).catch(e => console.error('[duck-race tick]', e))
    }
  }, RULES.tickMs)
}
function stop() { if (timer) clearInterval(timer); timer = undefined; redis?.disconnect() }
// In-process lifecycle/state handles also support isolated integration fixtures.
// They are never exposed as HTTP routes or socket messages.
return { app, io, start, stop, rooms }
}

