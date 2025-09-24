import { NextResponse } from 'next/server'
import { getSamplePointsPaginated, insertSamplePoint } from '../../../server/db'
import { checkLimit } from '../../../server/rateLimiter'

function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)
    const data = await getSamplePointsPaginated(page, limit)
    return NextResponse.json(data)
  } catch (err) {
    // dev logging
    // eslint-disable-next-line no-console
    console.error('GET /api/sample error', err)
    return jsonError('Failed to fetch data', 500)
  }
}

export async function POST(req: Request) {
  try {
    // simple per-IP limiter using request IP from headers (best-effort)
    const maybeHeaders: any = (req as any).headers
    const ip = maybeHeaders && typeof maybeHeaders.get === 'function'
      ? (maybeHeaders.get('x-forwarded-for') || maybeHeaders.get('x-real-ip'))
      : (req as any).ip || 'local'
    const limitCheck = checkLimit(ip, 10, 60_000)
    if (!limitCheck.allowed) {
      // include Retry-After header when rate limited
      return NextResponse.json({ error: `Rate limit exceeded, retry after ${limitCheck.retryAfter}s` }, { status: 429, headers: { 'retry-after': String(limitCheck.retryAfter) } })
    }

    const body = await req.json()
    const { label, value } = body
    if (typeof label !== 'string' || label.trim() === '' || typeof value !== 'number' || Number.isNaN(value)) {
      return jsonError('Invalid payload', 400)
    }
    const created = await insertSamplePoint(label.trim(), value)
    // include rate-limit headers so clients can know remaining quota
    const headers: Record<string, string> = {
      'x-ratelimit-limit': '10',
      'x-ratelimit-remaining': String(typeof limitCheck.remaining === 'number' ? limitCheck.remaining : '')
    }
    return NextResponse.json(created, { status: 201, headers })
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('POST /api/sample error', err)
    return jsonError(err?.message || 'Failed to create', 500)
  }
}
