import { apiBase } from '../lib/endpoints.ts'

export class ApiError extends Error {}

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; hostToken?: string; hostSession?: string; playerToken?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.hostToken) headers['x-host-token'] = opts.hostToken
  if (opts.hostSession) headers['x-host-session'] = opts.hostSession
  if (opts.playerToken) headers['x-player-token'] = opts.playerToken
  let res: Response
  try {
    res = await fetch(`${apiBase()}${path}`, {
      method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
  } catch {
    throw new ApiError('Không kết nối được máy chủ')
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new ApiError(data.error || 'Lỗi máy chủ')
  return data as T
}

export function apiUrl(path: string) {
  return `${apiBase()}${path}`
}

