/**
 * In-process rate limiter backed by a plain Map.
 *
 * Limitations:
 *  - State resets on server restart (bursts are not persisted).
 *  - Does not work across multiple replicas.
 *
 * Upgrade path for multi-replica deployments: replace the Map with a
 * Redis sliding-window counter (INCR + EXPIRE via a Lua script). The
 * `checkRateLimit` signature stays identical so callers don't change.
 * Set REDIS_URL in the environment and swap the implementation here.
 */

const _store = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true if the request is within the allowed rate, false if the limit
 * has been exceeded. The window is fixed (resets at `resetAt`).
 *
 * @param key     Unique identifier for the rate-limit bucket (e.g. `"claude:userId"`)
 * @param limit   Maximum number of requests allowed per window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  // Evict expired entries when the store grows large to avoid unbounded memory use
  if (_store.size > 1000) {
    for (const [k, v] of _store) {
      if (now > v.resetAt) _store.delete(k);
    }
  }
  const entry = _store.get(key);
  if (!entry || now > entry.resetAt) {
    _store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
