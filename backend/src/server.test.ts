import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { AddressInfo } from 'node:net'
const auth = vi.hoisted(() => ({ signInGoogle: vi.fn(), requireHostUser: vi.fn(), revokeHostSession: vi.fn() }))
vi.mock('./shared/auth', () => auth)
import { createBackend } from './server'
import { HttpError } from './shared/http-error'

describe('one Render service for both games', () => {
  const user = { id: 'host', name: 'Host', email: 'qa@example.invalid', picture: null }
  let backend: ReturnType<typeof createBackend>, base: string
  let sessionActive = false
  beforeAll(async () => {
    vi.stubEnv('CORS_ORIGINS', 'https://ditatdondau.neoforcelab.com')
    vi.stubEnv('DUCK_REDIS_URL', '')
    auth.signInGoogle.mockImplementation(async () => { sessionActive = true; return { token: 'same-session', user } })
    auth.requireHostUser.mockImplementation(async token => {
      if (!sessionActive || token !== 'same-session') throw new HttpError(401, 'Hãy đăng nhập Google để tạo phòng')
      return user
    })
    auth.revokeHostSession.mockImplementation(async () => { sessionActive = false })
    backend = createBackend()
    // Only DB bootstrap is excluded; actual Express handlers and both Socket.IO servers run.
    vi.spyOn(backend.factory, 'start').mockResolvedValue()
    await backend.start(0, '127.0.0.1')
    base = `http://127.0.0.1:${(backend.server.address() as AddressInfo).port}`
  })
  afterAll(async () => { await backend?.close(); vi.restoreAllMocks(); vi.unstubAllEnvs() })

  it('serves both health/auth prefixes and shares the account session without changing factory routes', async () => {
    expect(await (await fetch(base + '/health')).json()).toMatchObject({ ok: true })
    expect(await (await fetch(base + '/api/duck-race/health')).json()).toMatchObject({ ok: true, game: 'duck-race' })
    for (const prefix of ['/api/auth', '/api/duck-race/auth']) {
      const login = await fetch(base + prefix + '/google', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ credential: 'test-google-credential-not-a-real-token' }) })
      expect(login.status).toBe(200)
      expect(await login.json()).toEqual({ token: 'same-session', user })
      expect(await (await fetch(base + prefix + '/me', { headers: { 'x-host-session': 'same-session' } })).json()).toEqual({ user })
      const invalid = await fetch(base + prefix + '/google', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      expect(invalid.status).toBe(400) // Must reach validation, never the static site's 405.
      const preflight = await fetch(base + prefix + '/google', { method: 'OPTIONS', headers: { origin: 'https://ditatdondau.neoforcelab.com', 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type,x-host-session' } })
      expect(preflight.status).toBe(204)
      expect(preflight.headers.get('access-control-allow-origin')).toBe('https://ditatdondau.neoforcelab.com')
      expect((await fetch(base + prefix + '/logout', { method: 'POST', headers: { 'x-host-session': 'same-session' } })).status).toBe(200)
      const other = prefix === '/api/auth' ? '/api/duck-race/auth' : '/api/auth'
      expect((await fetch(base + other + '/me', { headers: { 'x-host-session': 'same-session' } })).status).toBe(401)
    }
    expect((await fetch(base + '/api/rooms', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status).toBe(400)
    expect((await fetch(base + '/api/duck-race/rooms', { method: 'POST' })).status).toBe(401)
  })

  it('isolates payload limits and supports both polling transports on the same port', async () => {
    // Duck has a 16KB body limit; factory keeps its existing 1MB limit.
    const body = JSON.stringify({ padding: 'x'.repeat(20_000) })
    expect((await fetch(base + '/api/rooms', { method: 'POST', headers: { 'content-type': 'application/json' }, body })).status).toBe(400)
    expect((await fetch(base + '/api/duck-race/rooms', { method: 'POST', headers: { 'content-type': 'application/json' }, body })).status).toBe(413)
    const sessions = []
    for (const path of ['/socket.io/', '/duck-socket/']) {
      const response = await fetch(base + path + '?EIO=4&transport=polling')
      expect(response.status).toBe(200)
      const open = await response.text()
      expect(open[0]).toBe('0')
      const session = JSON.parse(open.slice(1)); sessions.push(session.sid)
      expect(session.upgrades).toContain('websocket')
      await fetch(base + path + '?EIO=4&transport=polling&sid=' + session.sid, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '1' })
    }
    expect(sessions[0]).not.toBe(sessions[1])
  })

  it('keeps factory and Duck namespaces connected simultaneously over WebSocket', async () => {
    await fetch(base + '/api/auth/google', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ credential: 'test-google-credential-not-a-real-token' }) })
    const room = await (await fetch(base + '/api/duck-race/rooms', { method: 'POST', headers: { 'x-host-session': 'same-session' } })).json() as { code: string }
    const player = await (await fetch(base + '/api/duck-race/rooms/' + room.code + '/join', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'QA', color: 'yellow', model: 'duckee' }) })).json() as { token: string }
    const factory = socketMessages(base.replace('http:', 'ws:') + '/socket.io/?EIO=4&transport=websocket')
    const duck = socketMessages(base.replace('http:', 'ws:') + '/duck-socket/?EIO=4&transport=websocket')
    try {
      await Promise.all([factory.next(text => text.startsWith('0')), duck.next(text => text.startsWith('0'))])
      factory.ws.send('40')
      duck.ws.send('40/duck-race,' + JSON.stringify({ code: room.code, token: player.token }))
      await factory.next(text => text.startsWith('40'))
      await duck.next(text => text.startsWith('40/duck-race,'))
      expect(await duck.next(text => text.startsWith('42/duck-race,'))).toContain('race:snapshot')
      factory.ws.send('42' + JSON.stringify(['hello', { code: 'ZZZZZ', role: 'host', token: 'invalid' }]))
      expect(await factory.next(text => text.startsWith('42'))).toContain('problem')
      expect(factory.ws.readyState).toBe(WebSocket.OPEN)
      expect(duck.ws.readyState).toBe(WebSocket.OPEN)
    } finally { factory.ws.close(); duck.ws.close() }
  })
})

function socketMessages(url: string) {
  const ws = new WebSocket(url), queue: string[] = []
  type Waiter = { match: (text: string) => boolean; done: (text: string) => void }
  const waiting: Waiter[] = []
  ws.addEventListener('message', event => {
    const text = String(event.data)
    if (text === '2') { ws.send('3'); return }
    const index = waiting.findIndex(waiter => waiter.match(text))
    if (index >= 0) waiting.splice(index, 1)[0].done(text)
    else queue.push(text)
  })
  return { ws, next(match: (text: string) => boolean): Promise<string> {
    const index = queue.findIndex(match)
    if (index >= 0) return Promise.resolve(queue.splice(index, 1)[0])
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { const index = waiting.indexOf(waiter); if (index >= 0) waiting.splice(index, 1); reject(new Error('WebSocket packet timed out: ' + url)) }, 3000)
      const waiter: Waiter = { match, done: text => { clearTimeout(timer); resolve(text) } }
      waiting.push(waiter)
    })
  } }
}
