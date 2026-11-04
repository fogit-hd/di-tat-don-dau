const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/PHONG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
require('tsx/cjs'); const { QUESTIONS } = require('../backend/src/games/di-tat-don-dau/game/questions.data.ts')
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict')
const out = path.resolve('design-preview/duck-race-ui-v6'); fs.mkdirSync(out, { recursive: true })
const base = 'http://127.0.0.1:4525', errors = [], checks = []
const { io } = require('socket.io-client')
async function api(url, body, token) {
  const r = await fetch(`http://127.0.0.1:4608/api/duck-race${url}`, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', ...(token ? { 'x-duck-token': token } : {}) }, body: body ? JSON.stringify(body) : undefined }); const data = await r.json(); assert.equal(r.ok, true, JSON.stringify(data)); return data
}
async function dimensions(page) { return page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, height: innerHeight })) }
async function waitState(code, token, predicate, label) { for(let i=0;i<40;i++){const state=await api(`/rooms/${code}`,undefined,token);if(predicate(state))return state;await new Promise(r=>setTimeout(r,100))}throw new Error('Timed out: '+label) }
async function capture(page, name) { assert.equal(await page.locator('[data-art-missing]').count(),0,name+': missing outlined word'); await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true }); const d = await dimensions(page); assert.ok(d.scroll <= d.width, name + ': horizontal overflow'); checks.push({ name, ...d }) }
async function main() {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Users/PHONG/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  context.on('page', p => p.on('pageerror', e => errors.push(e.stack)))
  const page = await context.newPage(); await page.goto(base + '/duck-race'); await page.locator('.dq-track canvas').waitFor(); await page.waitForTimeout(2000)
  await page.getByPlaceholder('Bạn tên là gì?').focus();await page.waitForFunction(()=>document.querySelectorAll('.dq-field-focus[data-active=\"true\"] canvas').length===1);await page.waitForTimeout(200);assert.equal(await page.getByPlaceholder('Bạn tên là gì?').evaluate(e=>getComputedStyle(e).outlineStyle),'none');await capture(page,'input-focus-pixi');await page.getByPlaceholder('Bạn tên là gì?').blur();await capture(page, 'home-1440')
  for (const width of [390, 768]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 1024 }); await page.waitForTimeout(300); await capture(page, 'home-' + width) }
  await page.setViewportSize({ width: 1440, height: 900 }); await page.getByRole('button', { name: 'Tạo đường đua' }).click()
  await page.waitForURL('**/duck-race/host/**'); await page.locator('.dq-room-code').waitFor(); const code = await page.locator('.dq-room-code').innerText()
  const playerCtx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const player = await playerCtx.newPage(); player.on('pageerror', e => errors.push(e.stack))
  await player.goto(base + '/duck-race/play/' + code); await player.getByPlaceholder('Bạn tên là gì?').fill('CEO tên rất dài nhưng chỉ một dòng');
  // Boundary validation is server-authoritative, including a clearly displayed name counter.
  await player.getByRole('button', { name: 'Vào đường đua', exact: true }).click(); await player.getByRole('alert').waitFor(); assert.match(await player.getByRole('alert').innerText(), /32/)
  await player.getByPlaceholder('Bạn tên là gì?').fill('Vịt siêu dài Nguyễn Ánh Dương'); await player.getByRole('button', { name: 'Vào đường đua', exact: true }).click(); await player.locator('.dq-lobby').waitFor()
  const people = []
  for (let i = 0; i < 49; i++) people.push(await api(`/rooms/${code}/join`, { name: `Người chơi ${i + 2} · tên rất dài`, color: ['yellow', 'red', 'purple', 'aqua'][i % 4], model: i % 5 === 0 ? 'ducky' : 'duckee' }))
  const clients = people.map(p => io('http://127.0.0.1:4608/duck-race', { path: '/duck-socket', auth: { code, token: p.token }, transports: ['websocket'] }))
  await Promise.all(clients.map(s => new Promise((resolve,reject)=>{s.once('connect',resolve);s.once('connect_error',reject);setTimeout(()=>reject(new Error('bot socket timeout')),10000).unref()})))
  await page.waitForFunction(() => document.querySelectorAll('.dq-roster-person').length === 50)
  await capture(page, 'host-lobby-50'); await capture(player, 'player-lobby-390')
  await page.getByRole('button', { name: 'Bắt đầu cuộc đua' }).click(); await page.locator('.dq-countdown').waitFor(); await capture(page, 'countdown')
  await player.locator('.dq-answers button').first().waitFor(); await player.waitForTimeout(1800); assert.equal(await player.locator('.dq-track canvas').getAttribute('data-name-labels'),'0');assert.equal(await player.locator('.dq-track canvas').getAttribute('data-player-markers'),'1');assert.equal(await page.locator('.dq-track canvas').getAttribute('data-name-labels'),'50');await capture(player, 'player-race-390'); await capture(page, 'host-race-50'); assert.equal(await page.locator('.dq-track canvas').getAttribute('data-world-width'),'40000'); assert.ok(Number(await page.locator('.dq-track canvas').getAttribute('data-visible-world-width'))<3000)
  const token = await player.evaluate(code => JSON.parse(localStorage.getItem('quiz-duck-race:v1:' + code)).token, code)
  const hostToken = await page.evaluate(code => JSON.parse(localStorage.getItem('quiz-duck-race:v1:' + code)).token, code)
  const before = await api(`/rooms/${code}`, undefined, token)
  assert.ok(!JSON.stringify(before.players).includes('token')); assert.equal(before.question.correctOptionId, undefined)
  // Click a real answer in the real interface; no fake balance or injected snapshot.
  const correct = QUESTIONS.find(q => q.id === before.question.id).correctOptionId; await player.locator('.dq-answers button').nth(before.question.options.findIndex(o => o.id === correct)).click(); await player.locator('.dq-answer-feedback').waitFor(); const after = await api(`/rooms/${code}`, undefined, token); assert.equal(after.me.answered, 1)
  if (after.me.points >= 50) { const bought = player.waitForResponse(r=>r.url().endsWith('/action') && r.request().postData()?.includes('"type":"buy"')); await player.getByRole('button', { name: /Lăn ngắn/ }).click(); assert.equal((await bought).ok(),true); const moved = await api(`/rooms/${code}`, undefined, token); assert.equal(moved.me.points, after.me.points - 50); assert.ok(moved.me.target > moved.me.progress) }
  assert.ok(after.me.points >= 100)
  const stationary = await api(`/rooms/${code}`, undefined, token); await player.waitForTimeout(500)
  const stationaryAfter = await api(`/rooms/${code}`, undefined, token); assert.equal(stationary.me.x, stationaryAfter.me.x); assert.equal(stationary.me.y, stationaryAfter.me.y)
  await player.keyboard.down('KeyD'); await player.waitForTimeout(900); await player.keyboard.up('KeyD'); await player.waitForTimeout(450)
  const walking = await api(`/rooms/${code}`, undefined, token); assert.ok(Math.hypot(walking.me.x - stationary.me.x, walking.me.y - stationary.me.y) > 2)
  assert.equal(walking.me.speed, 0); assert.equal(walking.me.lane, undefined)
  const jumpReply=player.waitForResponse(r=>r.url().endsWith('/action')&&r.request().postData()?.includes('"type":"jump"')); await player.keyboard.press('Space'); assert.equal((await jumpReply).ok(),true); const jumping = await api(`/rooms/${code}`, undefined, token); assert.ok(jumping.me.jumpUntil > walking.me.jumpUntil, 'Jump accepted: '+JSON.stringify(jumping.me))
  await waitState(code,token,s=>s.serverTime>jumping.me.jumpUntil,'jump finished'); await player.keyboard.down('ShiftLeft'); await waitState(code,token,s=>s.me.crouching,'Shift crouch'); await player.keyboard.up('ShiftLeft'); await waitState(code,token,s=>!s.me.crouching,'Shift released')
  const attackReply=player.waitForResponse(r=>r.url().endsWith('/action')&&r.request().postData()?.includes('"type":"attack"')); await player.keyboard.press('KeyF'); assert.equal((await attackReply).ok(),true); const attacking = await api(`/rooms/${code}`, undefined, token); assert.ok(attacking.me.attackingUntil > jumping.me.attackingUntil, 'Attack accepted')
  const newer = await api(`/rooms/${code}`, undefined, token)
  if (!newer.answer) { const q = QUESTIONS.find(q => q.id === newer.question.id); await player.locator('.dq-answers button').nth(newer.question.options.findIndex(o => o.id === q.correctOptionId)).click(); await player.locator('.dq-answer-feedback').waitFor() }
  await player.waitForTimeout(200); const wallet = await api(`/rooms/${code}`, undefined, token)
  if (wallet.me.points >= 150) { const rollReply=player.waitForResponse(r=>r.url().endsWith('/action')&&r.request().postData()?.includes('"type":"buy"')); await player.keyboard.press('KeyE'); assert.equal((await rollReply).ok(),true); const bought = await api(`/rooms/${code}`, undefined, token); assert.equal(bought.me.points, wallet.me.points - 150) }
  await player.keyboard.down('KeyD'); await player.waitForTimeout(1200); await player.keyboard.up('KeyD'); await player.waitForTimeout(300)
  checks.push({ name: 'real-keyboard-WASD-release-jump-crouch-combat-roll', reward: after.me.points })
  await page.getByRole('button', { name: 'Spotlight quỹ cao nhất' }).click(); await page.waitForTimeout(250)
  const hostView = await api(`/rooms/${code}`, undefined, hostToken), wealthy = [...hostView.players].sort((a,b)=>b.points-a.points)[0]
  assert.equal(await page.locator('.dq-track canvas').getAttribute('data-camera-target'), wealthy.id)
  assert.equal(await player.locator('.dq-track canvas').getAttribute('data-camera-target'), before.me.id)
  await page.getByRole('button', { name: 'Bám dẫn đầu' }).click(); await page.waitForTimeout(250)
  await player.reload(); await player.locator('.dq-controls').waitFor(); assert.equal((await api(`/rooms/${code}`, undefined, token)).me.id, before.me.id)
  for (const width of [768, 1440]) { await player.setViewportSize({ width, height: width === 768 ? 1024 : 900 }); await player.waitForTimeout(500); await capture(player, 'player-race-' + width) }
  const health = await api('/health'); assert.equal(health.ok, true)
  await api(`/rooms/${code}/action`, { type: 'end' }, hostToken); await player.locator('.dq-personal-result').waitFor(); await page.locator('.dq-podium').waitFor(); await capture(page, 'host-results'); await player.setViewportSize({ width: 390, height: 844 }); await capture(player, 'player-results-390')
  await page.goto(base + '/'); await page.locator('.game-portal').waitFor()
  assert.equal(await page.locator('.portal-games>a').count(),2)
  assert.equal(await page.title(),'Chọn trò chơi')
  assert.equal(await page.locator('.portal-factory').getAttribute('href'),'/di-tat-don-dau')
  assert.equal(await page.locator('.portal-duck').getAttribute('href'),'/duck-race')
  for(const width of [1440,768,390]){
    await page.setViewportSize({width,height:width===1440?900:width===768?1024:844});await page.evaluate(()=>document.fonts.ready);await capture(page,'portal-'+width)
    assert.equal(await page.locator('.game-portal img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0)),true)
    if(width===1440) assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),'portal fits desktop')
  }
  await page.locator('.portal-duck').click();await page.waitForURL('**/duck-race');await page.locator('.dq-join').waitFor();assert.equal(await page.evaluate(()=>scrollY),0);assert.match(await page.title(),/Quiz Duck Race/)
  await page.getByRole('link',{name:'Đổi game'}).click();await page.waitForURL(base+'/')
  await page.locator('.portal-factory').click();await page.waitForURL('**/di-tat-don-dau');await page.locator('.public-brand').waitFor()
  assert.equal(await page.locator('.public-brand').getAttribute('href'),'/di-tat-don-dau')
  assert.equal(await page.title(),'Đi Tắt Đón Đầu')
  await page.setViewportSize({width:1440,height:900});await capture(page,'factory-landing-new-route')
  await page.getByRole('link',{name:'Chọn game',exact:true}).click();await page.locator('.game-portal').waitFor()
  await page.goto(base+'/?code=ABCDE');await page.waitForURL('**/di-tat-don-dau?code=ABCDE')
  await page.goto(base+'/games');await page.locator('.game-portal').waitFor();await capture(page,'selector-alias')
  checks.push({name:'root-selector-both-games-home-links-legacy-qr-alias'})
  fs.writeFileSync(path.join(out, 'qa.json'), JSON.stringify({ checks, errors, players: 50, concurrentPlayerSockets: 50, code, storage: health.storage }, null, 2)); clients.forEach(s=>s.disconnect()); await browser.close(); assert.deepEqual(errors, []); console.log(JSON.stringify({ checks: checks.length, errors, players: 50, concurrentPlayerSockets:50 }))
}
main().catch(e => { console.error(e); process.exit(1) })

