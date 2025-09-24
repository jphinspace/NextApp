import { checkLimit, resetAll } from '../server/rateLimiter';

describe('rateLimiter unit tests', () => {
  afterEach(() => resetAll());

  test('allows up to limit then blocks and provides retryAfter', () => {
    const key = 'test-key';
    const limit = 3;
    const windowMs = 1000;
    const results = [];
    for (let i = 0; i < limit; i++) {
      results.push(checkLimit(key, limit, windowMs));
    }
    // first `limit` calls should be allowed
    expect(results.every((r) => r.allowed)).toBe(true);
    // next call should be blocked
    const last = checkLimit(key, limit, windowMs);
    expect(last.allowed).toBe(false);
    expect(typeof last.retryAfter).toBe('number');
  });
});
