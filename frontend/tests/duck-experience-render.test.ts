import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { panoramaTiles } from '../src/games/duck-race/experience/panorama.ts'
import { boltGeometry, LIGHTNING_MS } from '../src/games/duck-race/experience/race-fx-layout.ts'
import { SHEETS } from '../src/games/duck-race/experience/results/motion.ts'
import { EXPERIENCE_RULES as R } from '../src/games/duck-race/experience-contracts.ts'

const assets = new URL('../public/assets/duck-race/', import.meta.url)
test('four distinct paintings ship with the same 8-minute / 2-minute schedule as the server', () => {
  const manifest = JSON.parse(readFileSync(new URL('experience-v6/eras/manifest.json', assets), 'utf8'))
  assert.equal(manifest.matchSeconds * 1000, R.durationMs)
  assert.equal(manifest.secondsPerEra * 1000, R.eraMs)
  assert.equal(manifest.eras.length, R.eraCount)
  assert.equal(R.eraCount, 4)
  const hashes = manifest.eras.map((era: { file: string; road: number[] }) => {
    assert.ok(era.road[0] > .6 && era.road[1] < 1 && era.road[1] > era.road[0])
    return createHash('sha256').update(readFileSync(new URL('experience-v6/eras/' + era.file, assets))).digest('hex')
  })
  assert.equal(new Set(hashes).size, 4)
})

test('whole-painting tiles cover all viewports, keep aspect ratio and follow camera motion', () => {
  for (const [width, height, zoom] of [[390, 280, .66], [768, 480, .85], [1440, 650, 1]]) {
    for (const camera of [-150, 0, 100, 1234567]) {
      const tiles = panoramaTiles(camera, width, height, zoom, 1642, 941)
      assert.ok(tiles[0].x <= 0)
      assert.ok(tiles.at(-1)!.x + tiles.at(-1)!.width >= width)
      for (const [index, tile] of tiles.entries()) {
        assert.ok(Math.abs(tile.width / tile.height - 1642 / 941) < 1e-10)
        if (index) assert.ok(Math.abs(tile.x - (tiles[index - 1].x + tile.width)) < 1e-8)
      }
    }
    const before = panoramaTiles(0, width, height, zoom, 1642, 941)[0]
    const after = panoramaTiles(100, width, height, zoom, 1642, 941)[0]
    assert.ok(Math.abs(after.x - before.x + 100 * zoom) < 1e-8)
  }
})

test('lightning reaches from above the viewport to the original impact pixel in under 200ms', () => {
  assert.ok(LIGHTNING_MS < 200)
  for (const [x, y, height, scale] of [[150, 250, 300, 2.15], [1000, 600, 700, 2.7]]) {
    const rect = boltGeometry(x, y, height, scale)
    assert.ok(rect.y < 0)
    assert.ok(Math.abs(rect.x + (243 - 104) / 288 * rect.width - x) < 1e-8)
    assert.ok(Math.abs(rect.y + (395 - 120) / 296 * rect.height - y) < 1e-8)
  }
})

test('all painted weather cels and notification SVGs are packaged for production', () => {
  for (const kind of ['lightning', 'wind', 'shield', 'rain', 'dust-air', 'swap']) {
    for (let frame = 0; frame < 6; frame++) assert.ok(existsSync(new URL(`experience-v6/fx/${kind}/${frame}.webp`, assets)))
  }
  for (const kind of ['lightning', 'wind', 'shield', 'rain', 'dust', 'gain', 'loss', 'swap']) assert.ok(existsSync(new URL(`experience-v6/icons/${kind}.svg`, assets)))
})

test('wardrobe sheets cover every ceremony cel, gaze and native bow at the matching cell size', () => {
  const sheets = { ...SHEETS, idle: { frames: 4, cell: 64 }, land: { frames: 2, cell: 64 }, crouch: { frames: 2, cell: 64 } }
  for (const item of ['brass', 'dark', 'red', 'teal']) for (const [name, spec] of Object.entries(sheets)) {
    const file = readFileSync(new URL(`results-v1/cosmetics/${item}/${name}.png`, assets))
    const columns = 'columns' in spec ? spec.columns : spec.frames
    assert.equal(file.readUInt32BE(16), columns * spec.cell)
    assert.equal(file.readUInt32BE(20), Math.ceil(spec.frames / columns) * spec.cell)
  }
})
