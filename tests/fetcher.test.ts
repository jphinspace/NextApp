import { fetcher } from '../lib/fetcher'
import { setFetchConfig, fetchConfig } from '../lib/fetchConfig'

describe('fetcher additional coverage', () => {
  const original = { ...fetchConfig }

  beforeEach(() => {
    // Reset config to defaults
    setFetchConfig(original)
    // Clear any existing fetch mocks and reset implementation
    jest.clearAllMocks()
    // @ts-ignore - explicitly reset fetch mock
    delete (global as any).fetch
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('throws error for invalid JSON response', async () => {
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => 'invalid json {'
    })

    await expect(fetcher('/test')).rejects.toThrow('Invalid JSON from server')
  })

  it('handles empty response body as null', async () => {
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => ''
    })

    const result = await fetcher('/test')
    expect(result).toBeNull()
  })

  it('retries on 5xx server errors with exponential backoff', async () => {
    let callCount = 0
    // @ts-ignore
    global.fetch = jest.fn().mockImplementation(() => {
      callCount++
      return Promise.resolve({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ error: 'Server error' })
      })
    })

    // Set shorter retry config for faster tests
    setFetchConfig({ attempts: 2, baseDelayMs: 10, maxDelayMs: 100, timeoutMs: 1000 })

    const start = Date.now()
    await expect(fetcher('/test')).rejects.toThrow('Server error')
    const elapsed = Date.now() - start

    expect(callCount).toBe(2) // Should retry once
    expect(elapsed).toBeGreaterThan(9) // Should have waited at least 10ms
  })

  it('handles 5xx errors differently than other errors - retrying within response handling', async () => {
    const responses = [
      { ok: false, status: 500, text: async () => JSON.stringify({ error: 'Server error' }) },
      { ok: true, text: async () => JSON.stringify({ success: true }) }
    ]
    let callCount = 0
    
    // @ts-ignore
    global.fetch = jest.fn().mockImplementation(() => {
      const response = responses[callCount] || responses[responses.length - 1]
      callCount++
      return Promise.resolve(response)
    })

    setFetchConfig({ attempts: 2, baseDelayMs: 10, maxDelayMs: 100, timeoutMs: 1000 })

    // First call fails with 500, second succeeds
    const result = await fetcher('/test')
    expect(result).toEqual({ success: true })
    expect(callCount).toBe(2)
  })

  it('retries on 4xx client errors due to outer catch block', async () => {
    let callCount = 0
    // @ts-ignore
    global.fetch = jest.fn().mockImplementation(() => {
      callCount++
      return Promise.resolve({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: 'Bad request' })
      })
    })

    setFetchConfig({ attempts: 2, baseDelayMs: 10, maxDelayMs: 100, timeoutMs: 1000 })

    await expect(fetcher('/test')).rejects.toThrow('Bad request')
    expect(callCount).toBe(2) // Retries due to outer catch block
  })

  it('throws 4xx error immediately but still retries in outer catch', async () => {
    const responses = [
      { ok: false, status: 400, text: async () => JSON.stringify({ error: 'Bad request' }) },
      { ok: true, text: async () => JSON.stringify({ success: true }) }
    ]
    let callCount = 0
    
    // @ts-ignore
    global.fetch = jest.fn().mockImplementation(() => {
      const response = responses[callCount] || responses[responses.length - 1]
      callCount++
      return Promise.resolve(response)
    })

    setFetchConfig({ attempts: 2, baseDelayMs: 10, maxDelayMs: 100, timeoutMs: 1000 })

    // First call fails with 400, second succeeds
    const result = await fetcher('/test')
    expect(result).toEqual({ success: true })
    expect(callCount).toBe(2)
  })

  it('handles error response without error field', async () => {
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ message: 'Not found' })
    })

    await expect(fetcher('/test')).rejects.toThrow('Request failed')
  })

  it('retries on network errors with exponential backoff', async () => {
    let callCount = 0
    // @ts-ignore
    global.fetch = jest.fn().mockImplementation(() => {
      callCount++
      return Promise.reject(new Error('Network error'))
    })

    // Set shorter retry config for faster tests
    setFetchConfig({ attempts: 3, baseDelayMs: 10, maxDelayMs: 100, timeoutMs: 1000 })

    const start = Date.now()
    await expect(fetcher('/test')).rejects.toThrow('Network error')
    const elapsed = Date.now() - start

    expect(callCount).toBe(3) // Should retry 2 times (3 attempts total)
    expect(elapsed).toBeGreaterThan(29) // Should have waited 10ms + 20ms = 30ms minimum
  })

  it('respects maxDelayMs for exponential backoff', async () => {
    let callCount = 0
    // @ts-ignore
    global.fetch = jest.fn().mockImplementation(() => {
      callCount++
      return Promise.reject(new Error('Network error'))
    })

    // Set config where baseDelayMs * 2^attempt would exceed maxDelayMs
    setFetchConfig({ attempts: 3, baseDelayMs: 100, maxDelayMs: 150, timeoutMs: 1000 })

    const delays: number[] = []
    const originalWait = require('../lib/fetcher')
    
    // We can't easily mock the internal wait function, so let's just test that it doesn't take too long
    const start = Date.now()
    await expect(fetcher('/test')).rejects.toThrow('Network error')
    const elapsed = Date.now() - start

    expect(callCount).toBe(3)
    // Total delay should be roughly: 100ms (first retry) + 150ms (second retry, capped) = 250ms minimum
    expect(elapsed).toBeGreaterThan(240)
  })

  it('returns successful response data', async () => {
    const responseData = { success: true, data: [1, 2, 3] }
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(responseData)
    })

    const result = await fetcher('/test')
    expect(result).toEqual(responseData)
  })

  it('uses custom attempts parameter', async () => {
    let callCount = 0
    // @ts-ignore
    global.fetch = jest.fn().mockImplementation(() => {
      callCount++
      return Promise.reject(new Error('Network error'))
    })

    // Override attempts via parameter
    await expect(fetcher('/test', {}, 1)).rejects.toThrow('Network error')
    expect(callCount).toBe(1) // Should only try once
  })

  it('passes through request init options', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true })
    })
    // @ts-ignore
    global.fetch = fetchSpy

    await fetcher('/test', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    })

    expect(fetchSpy).toHaveBeenCalledWith('/test', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
      signal: expect.any(AbortSignal)
    }))
  })
})