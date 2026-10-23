type AppConfig = {
  apiUrl?: string
  socketUrl?: string
}

declare global {
  interface Window {
    __APP_CONFIG__?: AppConfig
  }
}

function trimUrl(value: string | undefined) {
  return (value ?? '').trim().replace(/\/$/, '')
}

function runtimeConfig(): AppConfig {
  if (typeof window === 'undefined') return {}
  return window.__APP_CONFIG__ ?? {}
}

/** Empty means the page and the API share an origin. Runtime config wins over the Vite build values. */
export function apiBase() {
  return trimUrl(runtimeConfig().apiUrl) || trimUrl(import.meta.env.VITE_API_URL)
}

export function socketBase() {
  return trimUrl(runtimeConfig().socketUrl) || trimUrl(import.meta.env.VITE_SOCKET_URL) || apiBase()
}
