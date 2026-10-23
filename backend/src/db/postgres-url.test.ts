import { describe, expect, it } from 'vitest'
import { adminUrl, prepareDatabaseEnv, schemaFromUrl, withSearchPath } from './postgres-url'

const pooled =
  'postgresql://postgres.project:secret@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=ditatdondau'
const direct = 'postgresql://postgres:secret@db.project.supabase.co:5432/postgres?schema=ditatdondau'

describe('schemaFromUrl', () => {
  it('defaults to public', () => {
    expect(schemaFromUrl(undefined)).toBe('public')
    expect(schemaFromUrl('postgresql://chip:chip@127.0.0.1:5432/chipgame')).toBe('public')
    expect(schemaFromUrl('postgresql://chip:chip@127.0.0.1:5432/chipgame?schema=public')).toBe('public')
  })

  it('reads a lowercase schema name', () => {
    expect(schemaFromUrl(pooled)).toBe('ditatdondau')
    expect(schemaFromUrl(direct)).toBe('ditatdondau')
  })

  it('rejects names that Postgres would fold or that break the identifier', () => {
    expect(() => schemaFromUrl('postgresql://localhost/db?schema=DiTat')).toThrow(/chữ thường/)
    expect(() => schemaFromUrl('postgresql://localhost/db?schema=public.game')).toThrow(/chữ thường/)
  })
})

describe('withSearchPath', () => {
  it('leaves public urls unchanged', () => {
    const url = 'postgresql://chip:chip@127.0.0.1:5432/chipgame?schema=public'
    expect(withSearchPath(url)).toBe(url)
  })

  it('adds search_path once for a custom schema', () => {
    const once = withSearchPath(pooled)
    expect(once).toContain('schema=ditatdondau')
    expect(once).toContain('search_path%3Dditatdondau')
    expect(withSearchPath(once)).toBe(once)
  })

  it('keeps an existing search_path', () => {
    const url = 'postgresql://localhost/db?schema=ditatdondau&options=-c%20search_path%3Dditatdondau'
    expect(withSearchPath(url)).toBe(url)
  })
})

describe('adminUrl', () => {
  it('connects through public so the schema can be created first', () => {
    const url = adminUrl(withSearchPath(direct))
    expect(schemaFromUrl(url)).toBe('public')
    expect(url).not.toContain('search_path')
  })
})

describe('prepareDatabaseEnv', () => {
  it('copies the runtime url and requires both urls to name the same schema', () => {
    const env: NodeJS.ProcessEnv = { DATABASE_URL: pooled }
    prepareDatabaseEnv(env)
    expect(schemaFromUrl(env.DIRECT_URL)).toBe('ditatdondau')
    expect(schemaFromUrl(env.DATABASE_URL)).toBe('ditatdondau')
    expect(() =>
      prepareDatabaseEnv({
        DATABASE_URL: pooled,
        DIRECT_URL: 'postgresql://localhost/db?schema=public',
      }),
    ).toThrow(/DIRECT_URL/)
  })
})
