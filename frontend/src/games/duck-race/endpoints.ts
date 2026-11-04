import { apiBase, socketBase } from '../../shared/http/endpoints'

declare global {
  interface Window { __DUCK_CONFIG__?: { apiUrl?: string; socketUrl?: string } }
}
const clean = (value?: string) => (value || '').trim().replace(/\/$/, '')

function separateApi() {
  return clean(window.__DUCK_CONFIG__?.apiUrl) || clean(import.meta.env.VITE_DUCK_API_URL)
}

/** A separate Duck backend is optional. By default both games use the main API. */
export function duckApiBase() { return separateApi() || apiBase() }
export function duckSocketBase() {
  return clean(window.__DUCK_CONFIG__?.socketUrl) || clean(import.meta.env.VITE_DUCK_SOCKET_URL) || separateApi() || socketBase()
}
