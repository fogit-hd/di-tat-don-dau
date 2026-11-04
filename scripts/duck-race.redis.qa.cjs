const { spawn } = require('node:child_process'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path')
const root = path.resolve(__dirname, '..'), port = 4611, base = `http://127.0.0.1:${port}/api/duck-race`
let child
const delay = ms => new Promise(r => setTimeout(r, ms))
async function launch() {
  child = spawn(process.execPath, ['--import', 'tsx', 'backend/src/games/duck-race/server.ts'], { cwd: root, windowsHide: true, env: { ...process.env, DUCK_PORT: String(port), DUCK_REDIS_URL: 'redis://127.0.0.1:6398' }, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''; child.stdout.on('data', d => output += d); child.stderr.on('data', d => output += d)
  for (let i = 0; i < 40; i++) { try { const r = await fetch(base + '/health'); if (r.ok) return } catch {} if (child.exitCode !== null) throw new Error(output); await delay(250) }
  throw new Error('Redis test API did not start: ' + output)
}
async function stop() { if (child && child.exitCode === null) { const exit = new Promise(r => child.once('exit', r)); child.kill(); await exit } }
async function api(route, body, token) { const r = await fetch(base + route, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', ...(token ? { 'x-duck-token': token } : {}) }, body: body ? JSON.stringify(body) : undefined }); const data = await r.json(); assert.ok(r.ok, JSON.stringify(data)); return data }
async function main() {
  await launch(); const health = await api('/health'); assert.equal(health.storage, 'redis')
  const host = await api('/rooms', {}), player = await api(`/rooms/${host.code}/join`, { name: 'Kiểm thử khôi phục', color: 'blue', model: 'ducky' })
  await api(`/rooms/${host.code}/action`, { type: 'start' }, host.token); await delay(3200)
  const before = await api(`/rooms/${host.code}`, undefined, player.token)
  assert.equal(before.phase, 'racing'); await delay(1100); await stop(); await launch()
  const restored = await api(`/rooms/${host.code}`, undefined, player.token)
  assert.equal(restored.me.id, before.me.id); assert.equal(restored.me.points, before.me.points); assert.equal(restored.me.x, before.me.x); assert.equal(restored.endsAt, before.endsAt); assert.equal(restored.storage, 'redis'); assert.equal(restored.players.length, 1)
  await api(`/rooms/${host.code}/action`, { type: 'end' }, host.token)
  await stop(); fs.writeFileSync(path.join(root, 'design-preview/duck-race-v1/redis-qa.json'), JSON.stringify({ passed: true, restoredRoom: host.code, preserved: ['player identity', 'host authorization', 'balance', 'world position', 'absolute end deadline'], storage: 'local Redis', scope: 'one API process, kill and restart' }, null, 2)); console.log('Redis room recovery after API restart: PASS')
}
main().catch(async e => { console.error(e); await stop(); process.exitCode = 1 })
