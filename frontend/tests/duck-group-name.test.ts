import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { GroupName } from '../src/games/duck-race/experience/GroupName.tsx'

test('group labels preserve full Vietnamese, unbroken and decomposed names', () => {
  for (const name of [
    'Nhóm Khát Vọng Chinh Phục Đỉnh Cao',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345',
    'CÂU LẠC BỘ NHỮNG CHIẾN BINH'.normalize('NFD'),
    '👩🏽‍💻 Nhóm Vịt 🦆',
  ]) {
    const html = renderToStaticMarkup(createElement(GroupName, { name }))
    assert.ok(html.includes(name))
    assert.ok(!html.includes('…'))
    assert.match(html, /dir="auto"/)
  }
})

test('results scores have their own row, independent of the name clipping box', () => {
  const source = readFileSync(new URL('../src/games/duck-race/experience/results/HostResults.tsx', import.meta.url), 'utf8')
  assert.match(source, /<h1><GroupName name=\{focus.name\} \/><\/h1>/)
  assert.match(source, /className="q4-awards-heading-score">\{points\(focus.points\)\}/)
  assert.match(source, /aria-hidden=\{!visible\} inert=\{!visible\}/)
  assert.ok(!source.includes('`${focus.name} · ${points(focus.points)}`'))
})

test('name styling truncates one line and gives full-name popups a viewport bound', () => {
  const css = readFileSync(new URL('../src/games/duck-race/experience/group-name.css', import.meta.url), 'utf8')
  assert.match(css, /white-space: nowrap/)
  assert.match(css, /text-overflow: ellipsis/)
  assert.match(css, /calc\(100vw - 24px\)/)
  const results = readFileSync(new URL('../src/games/duck-race/experience/results/results.css', import.meta.url), 'utf8')
  assert.ok(!results.includes('width:25%'))
  assert.match(results, /\.q4-awards-remaining li>div\{min-width:0;flex:1\}/)
})
