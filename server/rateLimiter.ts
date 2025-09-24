const map: Map<string, { count: number; resetAt: number }> = new Map();

export function checkLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || entry.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  map.set(key, entry);
  return { allowed: true, remaining: limit - entry.count };
}

export function resetAll() {
  map.clear();
}

export default { checkLimit, resetAll };
