// Mock DB insert to be a no-op success so POSTs succeed until rate limit reached
jest.mock('../server/db', () => ({
  insertSamplePoint: jest.fn().mockResolvedValue({ id: 1, label: 'ok', value: 1 }),
  getSamplePointsPaginated: jest.fn().mockResolvedValue([]),
}));

// Mock NextResponse.json to capture status and headers
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, opts?: any) => ({
      json: async () => data,
      status: opts?.status || 200,
      headers: opts?.headers || {},
    }),
  },
}));

const routeModule = require('../app/api/sample/route');

describe('POST rate limiting', () => {
  test('returns 429 and retry-after header after limit exceeded', async () => {
    const reqTemplate: any = {
      url: 'http://localhost/api/sample',
      json: async () => ({ label: 'A', value: 1 }),
      headers: { get: () => '127.0.0.1' },
    };
    // call POST limit times (limit is 10 by default) then one extra
    for (let i = 0; i < 10; i++) {
      const res = await routeModule.POST(reqTemplate);
      expect(res.status).toBe(201);
    }
    const res2 = await routeModule.POST(reqTemplate);
    expect(res2.status).toBe(429);
    // expect retry-after header present
    expect(res2.headers).toHaveProperty('retry-after');
  });
});
