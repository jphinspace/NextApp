jest.mock('../server/db', () => ({
  getSamplePointsPaginated: jest.fn().mockResolvedValue([{ id: 1, label: 'Jan', value: 10 }]),
  insertSamplePoint: jest.fn().mockResolvedValue({ id: 2, label: 'New', value: 20 }),
}));

// Mock next/server to avoid loading Next internals in Jest environment
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, opts?: any) => ({ json: async () => data, status: opts?.status || 200 }),
  },
}));

const { GET, POST } = require('../app/api/sample/route');

describe('API /api/sample', () => {
  it('GET returns 200 and an array (paginated)', async () => {
    const req: any = { url: 'http://localhost/api/sample?page=1&limit=5' };
    const res = await GET(req);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThanOrEqual(1);
  });

  it('POST validates payload and returns created item', async () => {
    const body = { label: 'New', value: 20 };
    const req: any = { url: 'http://localhost/api/sample', json: async () => body };
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toHaveProperty('id');
  });

  it('POST rejects invalid payload', async () => {
    const req: any = {
      url: 'http://localhost/api/sample',
      json: async () => ({ label: '', value: 'x' }),
    };
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
