/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Per-process by design — suitable for the single-instance Node server that
 * accompanies this static site. Keys are client IPs.
 */
export interface RateLimitConfig {
  windowMs: number
  max: number
}

export interface RateLimiter {
  allow(key: string): boolean
}

export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  const hits = new Map<string, number[]>()

  return {
    allow(key) {
      const now = Date.now()
      const cutoff = now - config.windowMs
      const previous = (hits.get(key) ?? []).filter((t) => t >= cutoff)

      if (previous.length >= config.max) {
        hits.set(key, previous)
        return false
      }

      previous.push(now)
      hits.set(key, previous)
      return true
    },
  }
}