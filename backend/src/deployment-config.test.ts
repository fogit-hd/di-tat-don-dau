import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const shell = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : '/bin/sh'
const entrypoint = readFileSync(resolve(__dirname, '../../frontend/docker-entrypoint.sh'), 'utf8')
// Run only the actual variable-resolution lines, not nginx/file-writing startup.
const config = entrypoint.slice(entrypoint.indexOf('API_URL='), entrypoint.indexOf('\njs_escape()'))
function render(values: Record<string, string>) {
  const env = { ...process.env }
  for (const key of ['API_URL', 'SOCKET_URL', 'DUCK_API_URL', 'DUCK_SOCKET_URL', 'VITE_API_URL', 'VITE_SOCKET_URL', 'VITE_DUCK_API_URL', 'VITE_DUCK_SOCKET_URL']) env[key] = ''
  Object.assign(env, values)
  return execFileSync(shell, ['-s'], { env, input: config + '\nprintf "%s\\n" "$API_URL" "$SOCKET_URL" "$DUCK_API_URL" "$DUCK_SOCKET_URL"\n', encoding: 'utf8' }).trim().split(/\r?\n/)
}

describe.skipIf(!existsSync(shell))('frontend Docker runtime configuration', () => {
  it('points both games at the main backend when only existing Render settings are present', () => {
    expect(render({ API_URL: 'https://main.example', SOCKET_URL: 'https://socket.example' })).toEqual(['https://main.example', 'https://socket.example', 'https://main.example', 'https://socket.example'])
  })
  it('retains an explicit separate Duck API and socket override', () => {
    expect(render({ API_URL: 'https://main.example', DUCK_API_URL: 'https://duck.example' })).toEqual(['https://main.example', 'https://main.example', 'https://duck.example', 'https://duck.example'])
    expect(render({ API_URL: 'https://main.example', DUCK_API_URL: 'https://duck.example', DUCK_SOCKET_URL: 'https://duck-socket.example' })[3]).toBe('https://duck-socket.example')
  })
  it('uses existing build variables when runtime values are absent', () => {
    expect(render({ VITE_API_URL: 'https://build.example' })).toEqual(Array(4).fill('https://build.example'))
  })
})
