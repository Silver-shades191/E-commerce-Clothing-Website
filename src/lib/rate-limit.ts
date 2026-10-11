// Fixed-window in-memory rate limiter. Good for a single instance.
// For multi-instance production, back this with Redis (e.g. Upstash) instead.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }

  bucket.count += 1;
  return { ok: bucket.count <= max, remaining: Math.max(0, max - bucket.count) };
}
