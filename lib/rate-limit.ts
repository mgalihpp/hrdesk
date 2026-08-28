type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (bucket.count < limit) {
    bucket.count += 1;
    return {
      allowed: true,
      remaining: limit - bucket.count,
      resetAt: bucket.resetAt,
    };
  }

  return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
}

export function resetRateLimit(key?: string): void {
  if (key) {
    buckets.delete(key);
  } else {
    buckets.clear();
  }
}

export function getRateLimitBucket(key: string): Bucket | undefined {
  return buckets.get(key);
}
