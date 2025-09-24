import config from '../lib/config'

// In-memory store for development mode
const memStore: SampleDataPoint[] = [
  { id: 1, label: 'Jan', value: 33 },
  { id: 2, label: 'Feb', value: 42 },
  { id: 3, label: 'Mar', value: 28 },
  { id: 4, label: 'Apr', value: 51 },
  { id: 5, label: 'May', value: 44 },
  { id: 6, label: 'Jun', value: 62 }
]
let nextId = memStore.length + 1

// Lazy-load pg Pool to avoid importing heavy native/crypto code during tests
let pool: any = null

export function getPool(): any {
  if (config.useInMemoryStore) {
    return null // Signal to use in-memory store
  }
  if (!pool) {
    // require here so tests can set pool before pg is loaded
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Pool } = require('pg')
    pool = new Pool()
  }
  return pool
}

// Expose setter for tests to inject a mock pool
export function setPoolForTests(p: any) {
  pool = p
}

export type SampleDataPoint = {
  id: number
  label: string
  value: number
}

function log(operation: string, ...args: any[]) {
  if (config.logDbOperations) {
    // eslint-disable-next-line no-console
    console.log(`[DB] ${operation}:`, ...args)
  }
}

export async function getAllSamplePoints(): Promise<SampleDataPoint[]> {
  const p = getPool()
  if (!p) {
    log('getAllSamplePoints [memory]', { count: memStore.length })
    return [...memStore]
  }
  try {
    const res = await p.query('SELECT id, label, value FROM sample_data ORDER BY id')
    return res.rows
  } catch (err: any) {
    if (err && (err.code === 'ECONNREFUSED' || /ECONNREFUSED/.test(String(err.message || '')))) {
      const e = new Error('Database connection refused (ECONNREFUSED). Is Postgres running and is DATABASE_URL configured?')
      // @ts-ignore
      e.code = 'ECONNREFUSED'
      throw e
    }
    throw err
  }
}

export async function insertSamplePoint(label: string, value: number): Promise<SampleDataPoint> {
  const p = getPool()
  if (!p) {
    const item = { id: nextId++, label, value }
    memStore.push(item)
    log('insertSamplePoint [memory]', item)
    return item
  }
  try {
    const res = await p.query('INSERT INTO sample_data(label, value) VALUES($1, $2) RETURNING id, label, value', [label, value])
    return res.rows[0]
  } catch (err: any) {
    if (err && (err.code === 'ECONNREFUSED' || /ECONNREFUSED/.test(String(err.message || '')))) {
      const e = new Error('Database connection refused (ECONNREFUSED). Is Postgres running and is DATABASE_URL configured?')
      // @ts-ignore
      e.code = 'ECONNREFUSED'
      throw e
    }
    throw err
  }
}

export async function getSamplePointsPaginated(page = 1, limit = 10) {
  const p = getPool()
  const safeLimit = Math.min(Math.max(limit, 1), 100)
  const safePage = Math.max(page, 1)
  const offset = (safePage - 1) * safeLimit

  if (!p) {
    const slice = memStore.slice(offset, offset + safeLimit)
    log('getSamplePointsPaginated [memory]', { page, limit, count: slice.length })
    return slice
  }

  log('getSamplePointsPaginated [postgres]', { page, limit })
  try {
    const res = await p.query('SELECT id, label, value FROM sample_data ORDER BY id LIMIT $1 OFFSET $2', [safeLimit, offset])
    return res.rows
  } catch (err: any) {
    if (err && (err.code === 'ECONNREFUSED' || /ECONNREFUSED/.test(String(err.message || '')))) {
      const e = new Error('Database connection refused (ECONNREFUSED). Is Postgres running and is DATABASE_URL configured?')
      // @ts-ignore
      e.code = 'ECONNREFUSED'
      throw e
    }
    log('Query error:', err)
    throw err
  }
}
