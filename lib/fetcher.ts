import { fetchConfig } from './fetchConfig'

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetcher(input: RequestInfo, init?: RequestInit, attempts?: number): Promise<any> {
  const cfgAttempts = attempts ?? fetchConfig.attempts
  let lastErr: any = null

  for (let i = 0; i < cfgAttempts; i++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), fetchConfig.timeoutMs)
    try {
      const res = await fetch(input, { signal: controller.signal, ...(init || {}) })
      clearTimeout(timeout)
      const text = await res.text()
      let data
      try {
        data = text ? JSON.parse(text) : null
      } catch (err) {
        throw new Error('Invalid JSON from server')
      }
      if (!res.ok) {
        const msg = data && data.error ? data.error : 'Request failed'
        const err: any = new Error(msg)
        err.status = res.status
        // Retry on 5xx
        if (res.status >= 500 && i < cfgAttempts - 1) {
          lastErr = err
          const backoff = Math.min(fetchConfig.baseDelayMs * 2 ** i, fetchConfig.maxDelayMs)
          await wait(backoff)
          continue
        }
        throw err
      }
      return data
    } catch (err: any) {
      clearTimeout(timeout)
      // If aborted, make a clearer error message
      if (err && err.name === 'AbortError') {
        err = new Error('Request timed out')
      }
      lastErr = err
      if (i < cfgAttempts - 1) {
        const backoff = Math.min(fetchConfig.baseDelayMs * 2 ** i, fetchConfig.maxDelayMs)
        await wait(backoff)
        continue
      }
      throw lastErr
    }
  }
}

