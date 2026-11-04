import { afterEach, describe, expect, it, vi } from 'vitest'

// Dynamic path keeps browser sources out of the backend Docker TypeScript root.
const clientPath = '../../frontend/src/games/duck-race/endpoints'
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('Duck deployment URL resolution', () => {
  it('uses the configured main backend when the deployed Duck config is empty', async () => {
    vi.stubGlobal('window', { __APP_CONFIG__: { apiUrl: 'https://main-api.example/', socketUrl: 'https://main-socket.example/' }, __DUCK_CONFIG__: { apiUrl: '', socketUrl: '' } })
    vi.stubEnv('VITE_DUCK_API_URL', ''); vi.stubEnv('VITE_DUCK_SOCKET_URL', '')
    const endpoints = await import(clientPath)
    expect(endpoints.duckApiBase()).toBe('https://main-api.example')
    expect(endpoints.duckSocketBase()).toBe('https://main-socket.example')
  })
  it('preserves an explicitly separate Duck deployment and its socket override', async () => {
    vi.stubGlobal('window', { __APP_CONFIG__: { apiUrl: 'https://main.example' }, __DUCK_CONFIG__: { apiUrl: ' https://duck.example/ ', socketUrl: '' } })
    vi.stubEnv('VITE_DUCK_API_URL', ''); vi.stubEnv('VITE_DUCK_SOCKET_URL', '')
    const endpoints = await import(clientPath)
    expect(endpoints.duckApiBase()).toBe('https://duck.example')
    expect(endpoints.duckSocketBase()).toBe('https://duck.example')
    vi.stubGlobal('window', { __DUCK_CONFIG__: { apiUrl: 'https://duck.example', socketUrl: 'https://duck-socket.example/' } })
    expect(endpoints.duckSocketBase()).toBe('https://duck-socket.example')
  })
  it('supports the same-origin proxy and build-time main API settings', async () => {
    vi.stubGlobal('window', {})
    for (const name of ['VITE_API_URL', 'VITE_SOCKET_URL', 'VITE_DUCK_API_URL', 'VITE_DUCK_SOCKET_URL']) vi.stubEnv(name, '')
    const endpoints = await import(clientPath)
    expect(endpoints.duckApiBase()).toBe(''); expect(endpoints.duckSocketBase()).toBe('')
    vi.stubEnv('VITE_API_URL', 'https://build-main.example/')
    expect(endpoints.duckApiBase()).toBe('https://build-main.example')
    expect(endpoints.duckSocketBase()).toBe('https://build-main.example')
  })
})
