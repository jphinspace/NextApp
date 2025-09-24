jest.mock('pg');

describe('server/db', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('getAllSamplePoints returns rows', async () => {
    const mockRows = [{ id: 1, label: 'Jan', value: 10 }];
    const mQuery = jest.fn().mockResolvedValue({ rows: mockRows });
    const mockPool = { query: mQuery };
    const db = require('../server/db');
    db.setPoolForTests(mockPool as any);
    const points = await db.getAllSamplePoints();
    expect(points).toEqual(mockRows);
  });

  it('insertSamplePoint returns inserted row', async () => {
    const inserted = { id: 2, label: 'Feb', value: 20 };
    const mQuery = jest.fn().mockResolvedValue({ rows: [inserted] });
    const mockPool = { query: mQuery };
    const db = require('../server/db');
    db.setPoolForTests(mockPool as any);
    const row = await db.insertSamplePoint('Feb', 20);
    expect(row).toEqual(inserted);
  });
});
