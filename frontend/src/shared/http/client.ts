import { apiBase } from './endpoints.ts'

export class ApiError extends Error {
  readonly status?: number
  constructor(message:string,status?:number){super(message);this.status=status}
}

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; hostToken?: string; hostSession?: string; playerToken?: string; baseUrl?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.hostToken) headers['x-host-token'] = opts.hostToken
  if (opts.hostSession) headers['x-host-session'] = opts.hostSession
  if (opts.playerToken) headers['x-player-token'] = opts.playerToken
  let res: Response
  try {
    res = await fetch(`${opts.baseUrl ?? apiBase()}${path}`, {
      method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
  } catch {
    throw new ApiError('Không kết nối được máy chủ')
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new ApiError(data.error || 'Lỗi máy chủ',res.status)
  return data as T
}

export function apiUrl(path: string) {
  return `${apiBase()}${path}`
}

