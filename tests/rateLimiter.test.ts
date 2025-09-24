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

  test('uses default parameters when not provided', () => {
    // Test with no parameters (using defaults: limit=10, windowMs=60_000)
    const result = checkLimit('test-key-defaults');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9); // Default limit is 10, so remaining should be 9
    expect(result.retryAfter).toBeUndefined(); // Only present when not allowed
  });

  test('uses default limit when only key provided', () => {
    // Test with only windowMs provided, limit should default to 10
    const result = checkLimit('test-key-limit', undefined, 5000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9); // Default limit is 10
    expect(result.retryAfter).toBeUndefined(); // Only present when not allowed
  });

  test('uses default windowMs when only limit provided', () => {
    // Test with only limit provided, windowMs should default to 60_000
    const result = checkLimit('test-key-window', 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4); // Limit is 5
    expect(result.retryAfter).toBeUndefined(); // Only present when not allowed
  });
});
