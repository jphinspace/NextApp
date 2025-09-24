jest.mock('../server/db', () => ({
  getSamplePointsPaginated: jest.fn().mockResolvedValue([{ id: 1, label: 'Jan', value: 10 }]),
  insertSamplePoint: jest.fn().mockResolvedValue({ id: 2, label: 'New', value: 20 })
}))

// Mock next/server to avoid loading Next internals in Jest environment
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, opts?: any) => ({ 
      json: async () => data, 
      status: opts?.status || 200,
      headers: opts?.headers || {}
    })
  }
}))

const { GET, POST } = require('../app/api/sample/route')
const db = require('../server/db')

describe('API /api/sample', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET endpoint', () => {
    it('GET returns 200 and an array (paginated)', async () => {
      const req: any = { url: 'http://localhost/api/sample?page=1&limit=5' }
      const res = await GET(req)
      const json = await res.json()
      expect(Array.isArray(json)).toBe(true)
      expect(json.length).toBeGreaterThanOrEqual(1)
    })

    it('GET handles missing page/limit parameters with defaults', async () => {
      const req: any = { url: 'http://localhost/api/sample' }
      const res = await GET(req)
      const json = await res.json()
      expect(Array.isArray(json)).toBe(true)
      expect(db.getSamplePointsPaginated).toHaveBeenCalledWith(1, 10)
    })

    it('GET handles database errors', async () => {
      db.getSamplePointsPaginated.mockRejectedValueOnce(new Error('Database error'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const req: any = { url: 'http://localhost/api/sample?page=1&limit=5' }
      const res = await GET(req)
      
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json).toEqual({ error: 'Failed to fetch data' })
      expect(consoleSpy).toHaveBeenCalledWith('GET /api/sample error', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('POST endpoint', () => {
    it('POST validates payload and returns created item', async () => {
      const body = { label: 'New', value: 20 }
      const req: any = { url: 'http://localhost/api/sample', json: async () => body }
      const res = await POST(req)
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json).toHaveProperty('id')
    })

    it('POST rejects invalid payload', async () => {
      const req: any = { url: 'http://localhost/api/sample', json: async () => ({ label: '', value: 'x' }) }
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('POST rejects payload with empty label', async () => {
      const req: any = { url: 'http://localhost/api/sample', json: async () => ({ label: '', value: 20 }) }
      const res = await POST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json).toEqual({ error: 'Invalid payload' })
    })

    it('POST rejects payload with non-string label', async () => {
      const req: any = { url: 'http://localhost/api/sample', json: async () => ({ label: 123, value: 20 }) }
      const res = await POST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json).toEqual({ error: 'Invalid payload' })
    })

    it('POST rejects payload with non-number value', async () => {
      const req: any = { url: 'http://localhost/api/sample', json: async () => ({ label: 'test', value: 'not-a-number' }) }
      const res = await POST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json).toEqual({ error: 'Invalid payload' })
    })

    it('POST rejects payload with NaN value', async () => {
      const req: any = { url: 'http://localhost/api/sample', json: async () => ({ label: 'test', value: NaN }) }
      const res = await POST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json).toEqual({ error: 'Invalid payload' })
    })

    it('POST handles database errors', async () => {
      db.insertSamplePoint.mockRejectedValueOnce(new Error('Database insertion failed'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const body = { label: 'Test', value: 42 }
      const req: any = { url: 'http://localhost/api/sample', json: async () => body }
      const res = await POST(req)
      
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json).toEqual({ error: 'Database insertion failed' })
      expect(consoleSpy).toHaveBeenCalledWith('POST /api/sample error', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('POST handles database errors with no message', async () => {
      const dbError = new Error()
      dbError.message = ''
      db.insertSamplePoint.mockRejectedValueOnce(dbError)
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const body = { label: 'Test', value: 42 }
      const req: any = { url: 'http://localhost/api/sample', json: async () => body }
      const res = await POST(req)
      
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json).toEqual({ error: 'Failed to create' })
      
      consoleSpy.mockRestore()
    })

    it('POST extracts IP from x-forwarded-for header', async () => {
      const body = { label: 'Test', value: 42 }
      const req: any = { 
        url: 'http://localhost/api/sample', 
        json: async () => body,
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-forwarded-for') return '192.168.1.1'
            return null
          })
        }
      }
      const res = await POST(req)
      expect(res.status).toBe(201)
    })

    it('POST extracts IP from x-real-ip header when x-forwarded-for is not available', async () => {
      const body = { label: 'Test', value: 42 }
      const req: any = { 
        url: 'http://localhost/api/sample', 
        json: async () => body,
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-real-ip') return '192.168.1.2'
            return null
          })
        }
      }
      const res = await POST(req)
      expect(res.status).toBe(201)
    })

    it('POST falls back to req.ip when headers are not available', async () => {
      const body = { label: 'Test', value: 42 }
      const req: any = { 
        url: 'http://localhost/api/sample', 
        json: async () => body,
        ip: '10.0.0.1'
      }
      const res = await POST(req)
      expect(res.status).toBe(201)
    })

    it('POST uses "local" as default IP when no IP sources available', async () => {
      const body = { label: 'Test', value: 42 }
      const req: any = { 
        url: 'http://localhost/api/sample', 
        json: async () => body,
        headers: null
      }
      const res = await POST(req)
      expect(res.status).toBe(201)
    })

    it('POST handles rate limit check with non-number remaining', async () => {
      // Mock checkLimit to return an object with remaining as undefined
      const mockCheckLimit = require('../server/rateLimiter').checkLimit
      jest.spyOn(require('../server/rateLimiter'), 'checkLimit').mockReturnValueOnce({
        allowed: true,
        remaining: undefined
      })

      const body = { label: 'Test', value: 42 }
      const req: any = { url: 'http://localhost/api/sample', json: async () => body }
      const res = await POST(req)
      
      expect(res.status).toBe(201)
      expect(res.headers['x-ratelimit-remaining']).toBe('')
    })

    it('POST includes rate limit headers in response', async () => {
      const body = { label: 'Test', value: 42 }
      const req: any = { url: 'http://localhost/api/sample', json: async () => body }
      const res = await POST(req)
      
      expect(res.status).toBe(201)
      // Check that headers are included in the response
      expect(res).toEqual(expect.objectContaining({
        status: 201,
        headers: expect.objectContaining({
          'x-ratelimit-limit': '10',
          'x-ratelimit-remaining': expect.any(String)
        })
      }))
    })
  })

  describe('jsonError function', () => {
    it('uses default status 500 when not provided', async () => {
      // Force an error that doesn't provide a custom status
      db.getSamplePointsPaginated.mockRejectedValueOnce(new Error('Generic error'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const req: any = { url: 'http://localhost/api/sample' }
      const res = await GET(req)
      
      expect(res.status).toBe(500) // Should use default status from jsonError
      const json = await res.json()
      expect(json).toEqual({ error: 'Failed to fetch data' })
      
      consoleSpy.mockRestore()
    })

    it('uses explicit status when provided', async () => {
      // Reset the rate limiter for this test
      const { resetAll } = require('../server/rateLimiter')
      resetAll()
      
      // This will test the 400 status path which uses explicit status
      const req: any = { url: 'http://localhost/api/sample', json: async () => ({ label: '', value: 'x' }) }
      const res = await POST(req)
      expect(res.status).toBe(400) // Uses explicit status 400
    })
  })
})
