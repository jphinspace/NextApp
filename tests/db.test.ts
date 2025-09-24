jest.mock('pg')

// Mock the config to control in-memory vs postgres behavior
jest.mock('../lib/config', () => ({
  __esModule: true,
  default: {
    useInMemoryStore: false, // Default to postgres mode for these tests
    logDbOperations: false
  }
}))

describe('server/db', () => {
  beforeEach(() => {
    jest.resetModules()
    // Clear console mocks
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Postgres mode', () => {
    it('getAllSamplePoints returns rows', async () => {
      const mockRows = [{ id: 1, label: 'Jan', value: 10 }]
      const mQuery = jest.fn().mockResolvedValue({ rows: mockRows })
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      const points = await db.getAllSamplePoints()
      expect(points).toEqual(mockRows)
    })

    it('insertSamplePoint returns inserted row', async () => {
      const inserted = { id: 2, label: 'Feb', value: 20 }
      const mQuery = jest.fn().mockResolvedValue({ rows: [inserted] })
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      const row = await db.insertSamplePoint('Feb', 20)
      expect(row).toEqual(inserted)
    })

    it('getSamplePointsPaginated returns paginated rows', async () => {
      const mockRows = [{ id: 1, label: 'Jan', value: 10 }, { id: 2, label: 'Feb', value: 20 }]
      const mQuery = jest.fn().mockResolvedValue({ rows: mockRows })  
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      const points = await db.getSamplePointsPaginated(1, 5)
      expect(points).toEqual(mockRows)
      expect(mQuery).toHaveBeenCalledWith('SELECT id, label, value FROM sample_data ORDER BY id LIMIT $1 OFFSET $2', [5, 0])
    })

    it('getSamplePointsPaginated handles edge case parameters', async () => {
      const mockRows = [{ id: 1, label: 'Jan', value: 10 }]
      const mQuery = jest.fn().mockResolvedValue({ rows: mockRows })  
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      // Test with invalid page/limit values
      await db.getSamplePointsPaginated(-1, 200)
      expect(mQuery).toHaveBeenCalledWith('SELECT id, label, value FROM sample_data ORDER BY id LIMIT $1 OFFSET $2', [100, 0])
      
      // Test page 2
      await db.getSamplePointsPaginated(2, 10)
      expect(mQuery).toHaveBeenCalledWith('SELECT id, label, value FROM sample_data ORDER BY id LIMIT $1 OFFSET $2', [10, 10])
    })

    it('getAllSamplePoints handles ECONNREFUSED error', async () => {
      const dbError = new Error('connection refused')
      dbError.code = 'ECONNREFUSED'
      const mQuery = jest.fn().mockRejectedValue(dbError)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      await expect(db.getAllSamplePoints()).rejects.toThrow('Database connection refused (ECONNREFUSED). Is Postgres running and is DATABASE_URL configured?')
    })

    it('getAllSamplePoints handles ECONNREFUSED error in message', async () => {
      const dbError = new Error('ECONNREFUSED in message')
      const mQuery = jest.fn().mockRejectedValue(dbError)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      await expect(db.getAllSamplePoints()).rejects.toThrow('Database connection refused (ECONNREFUSED). Is Postgres running and is DATABASE_URL configured?')
    })

    it('getAllSamplePoints handles other database errors', async () => {
      const dbError = new Error('Some other error')
      const mQuery = jest.fn().mockRejectedValue(dbError)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      await expect(db.getAllSamplePoints()).rejects.toThrow('Some other error')
    })

    it('insertSamplePoint handles ECONNREFUSED error', async () => {
      const dbError = new Error('connection refused')
      dbError.code = 'ECONNREFUSED'
      const mQuery = jest.fn().mockRejectedValue(dbError)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      await expect(db.insertSamplePoint('test', 42)).rejects.toThrow('Database connection refused (ECONNREFUSED). Is Postgres running and is DATABASE_URL configured?')
    })

    it('insertSamplePoint handles ECONNREFUSED error in message', async () => {
      const dbError = new Error('ECONNREFUSED in message')
      const mQuery = jest.fn().mockRejectedValue(dbError)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      await expect(db.insertSamplePoint('test', 42)).rejects.toThrow('Database connection refused (ECONNREFUSED). Is Postgres running and is DATABASE_URL configured?')
    })

    it('insertSamplePoint handles other database errors', async () => {
      const dbError = new Error('Some other error')
      const mQuery = jest.fn().mockRejectedValue(dbError)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      await expect(db.insertSamplePoint('test', 42)).rejects.toThrow('Some other error')
    })

    it('getSamplePointsPaginated handles ECONNREFUSED error', async () => {
      const dbError = new Error('connection refused')
      dbError.code = 'ECONNREFUSED'
      const mQuery = jest.fn().mockRejectedValue(dbError)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      await expect(db.getSamplePointsPaginated(1, 10)).rejects.toThrow('Database connection refused (ECONNREFUSED). Is Postgres running and is DATABASE_URL configured?')
    })

    it('getSamplePointsPaginated handles ECONNREFUSED error in message', async () => {
      const dbError = new Error('ECONNREFUSED in message')
      const mQuery = jest.fn().mockRejectedValue(dbError)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      await expect(db.getSamplePointsPaginated(1, 10)).rejects.toThrow('Database connection refused (ECONNREFUSED). Is Postgres running and is DATABASE_URL configured?')
    })

    it('getAllSamplePoints handles falsy error', async () => {
      const mQuery = jest.fn().mockRejectedValue(null)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      await expect(db.getAllSamplePoints()).rejects.toBeNull()
    })

    it('insertSamplePoint handles falsy error', async () => {
      const mQuery = jest.fn().mockRejectedValue(null)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      await expect(db.insertSamplePoint('test', 42)).rejects.toBeNull()
    })

    it('getSamplePointsPaginated handles falsy error', async () => {
      const mQuery = jest.fn().mockRejectedValue(null)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      await expect(db.getSamplePointsPaginated(1, 10)).rejects.toBeNull()
    })

    it('getAllSamplePoints handles error with empty message', async () => {
      const dbError = new Error('')
      const mQuery = jest.fn().mockRejectedValue(dbError)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      await expect(db.getAllSamplePoints()).rejects.toThrow('')
    })

    it('insertSamplePoint handles error with empty message', async () => {
      const dbError = new Error('')
      const mQuery = jest.fn().mockRejectedValue(dbError)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      await expect(db.insertSamplePoint('test', 42)).rejects.toThrow('')
    })

    it('getSamplePointsPaginated handles error with empty message', async () => {
      const dbError = new Error('')
      const mQuery = jest.fn().mockRejectedValue(dbError)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      await expect(db.getSamplePointsPaginated(1, 10)).rejects.toThrow('')
    })

    it('getSamplePointsPaginated handles other database errors and logs them', async () => {
      // Enable logging for this test
      jest.doMock('../lib/config', () => ({
        __esModule: true,
        default: {
          useInMemoryStore: false,
          logDbOperations: true
        }
      }))
      
      const dbError = new Error('Some other error')
      const mQuery = jest.fn().mockRejectedValue(dbError)
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      
      await expect(db.getSamplePointsPaginated(1, 10)).rejects.toThrow('Some other error')
      // Check that both the operation log and error log were called
      expect(consoleSpy).toHaveBeenCalledWith('[DB] getSamplePointsPaginated [postgres]:', { page: 1, limit: 10 })
      expect(consoleSpy).toHaveBeenCalledWith('[DB] Query error::', dbError)
    })
  })

  describe('In-memory mode', () => {
    beforeEach(() => {
      // Mock config for in-memory mode
      jest.doMock('../lib/config', () => ({
        __esModule: true,
        default: {
          useInMemoryStore: true,
          logDbOperations: true
        }
      }))
    })

    it('getAllSamplePoints returns in-memory data', async () => {
      const db = require('../server/db')
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      
      const points = await db.getAllSamplePoints()
      expect(Array.isArray(points)).toBe(true)
      expect(points.length).toBeGreaterThan(0)
      expect(consoleSpy).toHaveBeenCalledWith('[DB] getAllSamplePoints [memory]:', { count: points.length })
    })

    it('insertSamplePoint adds to in-memory store', async () => {
      const db = require('../server/db')
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      
      const result = await db.insertSamplePoint('Test', 42)
      expect(result).toEqual({ id: expect.any(Number), label: 'Test', value: 42 })
      expect(consoleSpy).toHaveBeenCalledWith('[DB] insertSamplePoint [memory]:', result)
    })

    it('getSamplePointsPaginated returns paginated in-memory data', async () => {
      const db = require('../server/db')
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      
      const points = await db.getSamplePointsPaginated(1, 3)
      expect(Array.isArray(points)).toBe(true)
      expect(points.length).toBeLessThanOrEqual(3)
      expect(consoleSpy).toHaveBeenCalledWith('[DB] getSamplePointsPaginated [memory]:', { page: 1, limit: 3, count: points.length })
    })

    it('getSamplePointsPaginated handles pagination correctly in memory', async () => {
      const db = require('../server/db')
      
      // Get page 2 with limit 2
      const page2 = await db.getSamplePointsPaginated(2, 2)
      expect(Array.isArray(page2)).toBe(true)
      
      // Get page 1 with limit 2
      const page1 = await db.getSamplePointsPaginated(1, 2)
      expect(Array.isArray(page1)).toBe(true)
      
      // Pages should be different (assuming we have enough data)
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toEqual(page2[0].id)
      }
    })
  })

  describe('getPool function', () => {
    it('returns null in in-memory mode', () => {
      jest.doMock('../lib/config', () => ({
        __esModule: true,
        default: {
          useInMemoryStore: true,
          logDbOperations: false
        }
      }))
      
      const db = require('../server/db')
      const pool = db.getPool()
      expect(pool).toBeNull()
    })

    it('creates and returns pool in postgres mode', () => {
      jest.doMock('../lib/config', () => ({
        __esModule: true,
        default: {
          useInMemoryStore: false,
          logDbOperations: false
        }
      }))
      
      const mockPool = { query: jest.fn() }
      jest.doMock('pg', () => ({
        Pool: jest.fn().mockImplementation(() => mockPool)
      }))
      
      const db = require('../server/db')
      const pool = db.getPool()
      expect(pool).toBe(mockPool)
      
      // Should return same pool on subsequent calls
      const pool2 = db.getPool()
      expect(pool2).toBe(mockPool)
    })
  })

  describe('getSamplePointsPaginated default parameters', () => {
    beforeEach(() => {
      jest.doMock('../lib/config', () => ({
        __esModule: true,
        default: {
          useInMemoryStore: false,
          logDbOperations: false
        }
      }))
    })

    it('uses default parameters when called without arguments', async () => {
      const mockRows = [{ id: 1, label: 'Jan', value: 10 }]
      const mQuery = jest.fn().mockResolvedValue({ rows: mockRows })  
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      // Call without any parameters to test defaults
      const points = await db.getSamplePointsPaginated()
      expect(points).toEqual(mockRows)
      // Should use defaults: page=1, limit=10, so offset=0, limit=10
      expect(mQuery).toHaveBeenCalledWith('SELECT id, label, value FROM sample_data ORDER BY id LIMIT $1 OFFSET $2', [10, 0])
    })

    it('uses default page when only limit provided', async () => {
      const mockRows = [{ id: 1, label: 'Jan', value: 10 }]
      const mQuery = jest.fn().mockResolvedValue({ rows: mockRows })  
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      // Call with only limit parameter to test default page
      const points = await db.getSamplePointsPaginated(undefined, 5)
      expect(points).toEqual(mockRows)
      // Should use defaults: page=1, limit=5, so offset=0, limit=5
      expect(mQuery).toHaveBeenCalledWith('SELECT id, label, value FROM sample_data ORDER BY id LIMIT $1 OFFSET $2', [5, 0])
    })

    it('uses default limit when only page provided', async () => {
      const mockRows = [{ id: 1, label: 'Jan', value: 10 }]
      const mQuery = jest.fn().mockResolvedValue({ rows: mockRows })  
      const mockPool = { query: mQuery }
      const db = require('../server/db')
      db.setPoolForTests(mockPool as any)
      
      // Call with only page parameter to test default limit
      const points = await db.getSamplePointsPaginated(2)
      expect(points).toEqual(mockRows)
      // Should use defaults: page=2, limit=10, so offset=10, limit=10
      expect(mQuery).toHaveBeenCalledWith('SELECT id, label, value FROM sample_data ORDER BY id LIMIT $1 OFFSET $2', [10, 10])
    })
  })
})
