import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PreviewSimulation } from '../frontend/src/games/duck-race/phaser/bridge/PreviewSimulation'
import { SnapshotSource } from '../frontend/src/games/duck-race/phaser/bridge/SimulationBridge'
import { BODY_SCALE, GROUND_BASELINE, frameFor, groundPose, viewportLayout } from '../frontend/src/games/duck-race/phaser/presentation'
const tests: string[] = []
function test(name: string, run: () => void) { run(); tests.push(name) }
function tick(sim: PreviewSimulation, duration: number, delta = 1000 / 60) { for (let t = 0; t < duration; t += delta) sim.advance(delta) }
const direction = (x = 0, y = 0, crouch = false, guard = false) => ({ x, y, crouch, guard })
test('No passive drift; releasing keys stops both axes', () => {
  const sim = new PreviewSimulation(), x = sim.me.x
  tick(sim, 1000); assert.equal(sim.me.x, x)
  sim.move(direction(1, .37)); tick(sim, 600)
  assert.ok(sim.me.x > x); assert.ok(sim.me.y > 500 && sim.me.y < 550)
  sim.move(direction()); const stopped = { x: sim.me.x, y: sim.me.y }
  tick(sim, 500); assert.equal(sim.me.x, stopped.x); assert.equal(sim.me.y, stopped.y)
})
test('Fixed step is independent of presentation frame rate', () => {
  const a = new PreviewSimulation(), b = new PreviewSimulation()
  a.move(direction(1)); b.move(direction(1)); tick(a, 1000, 20); tick(b, 1000, 50)
  assert.ok(Math.abs(a.me.x - b.me.x) < 1e-5)
})
test('Ground depth clamps continuously; guard roots and A/D turns only', () => {
  const sim = new PreviewSimulation(); sim.move(direction(0, 1)); tick(sim, 2000)
  assert.equal(sim.me.y, 584)
  const x = sim.me.x, y = sim.me.y
  sim.move(direction(-1, -1, false, true)); tick(sim, 1000)
  assert.equal(sim.me.x, x); assert.equal(sim.me.y, y); assert.equal(sim.me.facingX, -1)
})
test('Native jump has constant body scale and independent Z; second jump uses air pose', () => {
  const sim = new PreviewSimulation(), groundY = sim.me.y
  sim.action('jump'); tick(sim, 250)
  assert.ok(groundPose(sim.me, sim.now).z > 20); assert.equal(sim.me.y, groundY)
  sim.action('jump'); tick(sim, 60)
  assert.equal(groundPose(sim.me, sim.now).pose, 'double_jump')
  const until = sim.me.jumpUntil; sim.action('jump'); assert.equal(sim.me.jumpUntil, until)
  tick(sim, 1200); assert.equal(groundPose(sim.me, sim.now).z, 0); assert.equal(sim.me.y, groundY)
  assert.equal(BODY_SCALE, 3.2); assert.equal(GROUND_BASELINE, 48)
})
test('Paid roll consumes integer funds once, retains manual intent and original roll pose', () => {
  const sim = new PreviewSimulation(); sim.action('roll'); assert.equal(sim.me.points, 350)
  tick(sim, 500); assert.equal(sim.me.x, 220)
  sim.move(direction(1)); tick(sim, 1000)
  assert.ok(sim.me.x > 590); assert.equal(groundPose(sim.me, sim.now).pose, 'roll')
  sim.move(direction()); const x = sim.me.x; tick(sim, 500); assert.equal(sim.me.x, x)
})
test('Holding crouch selects one static crouch, moving selects crawl', () => {
  const sim = new PreviewSimulation(); sim.move(direction(0, 0, true)); tick(sim, 50)
  assert.equal(groundPose(sim.me, sim.now).pose, 'crouch')
  sim.move(direction(1, 0, true)); tick(sim, 50)
  assert.equal(groundPose(sim.me, sim.now).pose, 'crawl')
  assert.equal(frameFor('crouch', 1, 900), 0)
})
test('Answering once, rapid duplicate clicks and clock continue independently of movement', () => {
  const sim = new PreviewSimulation(), points = sim.me.points
  sim.answer(sim.question.correct); const earned = sim.me.points
  assert.ok(earned > points); sim.answer(sim.question.correct); assert.equal(sim.me.points, earned)
  sim.move(direction()); const before = sim.remaining; tick(sim, 3000)
  assert.ok(sim.remaining < before - 2900); assert.equal(sim.questionIndex, 1)
})
test('Native source frames remain registered and present; no legacy duck substitution', () => {
  const atlas = JSON.parse(fs.readFileSync('frontend/public/assets/duck-race/ducks-v12.json', 'utf8'))
  for (const [key, frames] of Object.entries(atlas.animations) as [string, string[]][]) if (key.startsWith('duckee/')) {
    assert.ok(frames.length)
    for (const name of frames) { const f = atlas.frames[name]; assert.equal(f.sourceSize.w, 64); assert.equal(f.sourceSize.h, 64); assert.equal(f.trimmed, false) }
  }
})
test('Snapshot adapter interpolates ground position and forwards intents without local rewards', () => {
  const sim = new PreviewSimulation(), sent: unknown[] = [], source = new SnapshotSource(i => sent.push(i), a => sent.push(a))
  const p = { ...sim.me }; source.push({ now: 100, players: [p], me: p.id, running: false })
  source.push({ now: 200, players: [{ ...p, x: p.x + 10 }], me: p.id, running: false })
  assert.equal(source.read().players[0].x, p.x + 10)
  source.move(direction(1)); source.action('roll'); assert.equal(sent.length, 2); assert.equal(source.read().players[0].points, p.points)
})
test('Viewport changes do not alter world length or body scale', () => {
  for (const [w, h] of [[1440, 900], [1366, 768], [768, 1024], [390, 844], [360, 800]]) {
    const view = viewportLayout(w, h); assert.equal(view.worldWidth, 60000); assert.ok(view.zoom >= .78 && view.zoom <= 1.5)
  }
})
test('Preview ends after ten minutes without leaving a moving or floating body', () => {
  const sim = new PreviewSimulation(); sim.move(direction(1)); tick(sim, 599800, 100)
  sim.action('jump'); tick(sim, 500, 50)
  assert.equal(sim.remaining, 0); assert.equal(sim.me.speed, 0); assert.equal(groundPose(sim.me, sim.now).z, 0)
  const x = sim.me.x; tick(sim, 1000); assert.equal(sim.me.x, x)
})
console.log(JSON.stringify({ passed: tests.length, tests }, null, 2))
