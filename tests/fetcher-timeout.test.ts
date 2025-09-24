import { fetcher } from '../lib/fetcher'
import { setFetchConfig, fetchConfig } from '../lib/fetchConfig'

describe('fetcher timeout', () => {
  const original = { ...fetchConfig }

  beforeEach(() => {
    // make timeout tiny for test speed
    setFetchConfig({ timeoutMs: 50, attempts: 1 })
  })
  afterEach(() => {
    setFetchConfig(original)
    // restore global fetch mock if any
    // @ts-ignore
    if (global.fetch && global.fetch._isMock) delete (global.fetch as any)
  })

  it('throws Request timed out when request takes too long', async () => {
    // mock fetch to never resolve but respect the AbortController signal
    // @ts-ignore
    global.fetch = jest.fn((input: any, init: any) => {
      return new Promise((_, reject) => {
        const signal = init && init.signal
        if (signal) {
          const onAbort = () => {
            const err: any = new Error('Aborted')
            err.name = 'AbortError'
            reject(err)
          }
          // some environments expose addEventListener, others use .onabort
          if (typeof signal.addEventListener === 'function') {
            signal.addEventListener('abort', onAbort)
          } else {
            signal.onabort = onAbort
          }
        }
        // otherwise never resolve
      })
    }) as any
    // tag the mock so cleanup knows about it
    // @ts-ignore
    global.fetch._isMock = true

    await expect(fetcher('/api/never')).rejects.toThrow('Request timed out')
  })
})
