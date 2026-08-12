const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const buckets = new Map<string, number[]>();

let lastSweepAt = Date.now();

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

function sweepExpiredBuckets(now: number) {
  if (now - lastSweepAt < WINDOW_MS && buckets.size < 5000) return;

  const cutoff = now - WINDOW_MS;

  for (const [key, timestamps] of buckets) {
    const activeTimestamps = timestamps.filter((timestamp) => timestamp > cutoff);

    if (activeTimestamps.length === 0) {
      buckets.delete(key);
    } else {
      buckets.set(key, activeTimestamps);
    }
  }

  lastSweepAt = now;
}

export function checkContactRateLimit(key: string, now = Date.now()): RateLimitResult {
  sweepExpiredBuckets(now);

  const cutoff = now - WINDOW_MS;
  const timestamps = (buckets.get(key) ?? []).filter((timestamp) => timestamp > cutoff);

  if (timestamps.length >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((timestamps[0] + WINDOW_MS - now) / 1000)),
    };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);

  return { allowed: true };
}

export function getContactClientKey(request: Request): string {
  // Only trust X-Real-IP: nginx overwrites it with $remote_addr, so clients
  // cannot forge it. CF-Connecting-IP and X-Forwarded-For are client-supplied
  // and would let an attacker rotate the rate-limit key on every request
  // since this deployment sits behind plain nginx, not Cloudflare.
  const address = request.headers.get('x-real-ip')?.trim() || 'unknown';

  return address.slice(0, 100);
}
