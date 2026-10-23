const SCHEMA_NAME = /^[a-z_][a-z0-9_]*$/

function queryOf(url: string) {
  const index = url.indexOf('?')
  return index === -1 ? '' : url.slice(index + 1)
}

function baseOf(url: string) {
  const index = url.indexOf('?')
  return index === -1 ? url : url.slice(0, index)
}

export function assertSchemaName(schema: string) {
  if (!SCHEMA_NAME.test(schema)) {
    throw new Error(`Tên schema chỉ gồm chữ thường, số và gạch dưới: ${schema}`)
  }
}

export function schemaFromUrl(url: string | undefined) {
  if (!url) return 'public'
  const schema = new URLSearchParams(queryOf(url)).get('schema')?.trim() || 'public'
  assertSchemaName(schema)
  return schema
}

export function assertSameSchema(databaseUrl: string, directUrl: string) {
  const left = schemaFromUrl(databaseUrl)
  const right = schemaFromUrl(directUrl)
  if (left !== right) {
    throw new Error(`DATABASE_URL dùng schema ${left} nhưng DIRECT_URL dùng schema ${right}`)
  }
}

function hasSearchPath(options: string) {
  return /search_path/i.test(options)
}

export function withSearchPath(url: string) {
  const schema = schemaFromUrl(url)
  if (schema === 'public') return url
  const params = new URLSearchParams(queryOf(url))
  const options = params.get('options') ?? ''
  if (hasSearchPath(options)) return url
  params.set('options', options ? `${options} -c search_path=${schema}` : `-c search_path=${schema}`)
  return `${baseOf(url)}?${params.toString()}`
}

export function adminUrl(url: string) {
  const params = new URLSearchParams(queryOf(url))
  params.set('schema', 'public')
  const options = params.get('options')
  if (options && hasSearchPath(options)) {
    const cleaned = options.replace(/-c\s*search_path(?:=|\s+)\S+/gi, '').trim()
    if (cleaned) params.set('options', cleaned)
    else params.delete('options')
  }
  const query = params.toString()
  return query ? `${baseOf(url)}?${query}` : baseOf(url)
}

export function prepareDatabaseEnv(env: NodeJS.ProcessEnv = process.env) {
  if (!env.DIRECT_URL && env.DATABASE_URL) env.DIRECT_URL = env.DATABASE_URL
  if (env.DATABASE_URL && env.DIRECT_URL) assertSameSchema(env.DATABASE_URL, env.DIRECT_URL)
  if (env.DATABASE_URL) env.DATABASE_URL = withSearchPath(env.DATABASE_URL)
  if (env.DIRECT_URL) env.DIRECT_URL = withSearchPath(env.DIRECT_URL)
}
