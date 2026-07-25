import { createHash } from "node:crypto";

const WINDOW_MS = 60 * 60 * 1000; // 1 giờ
const MAX_REQUESTS_ANON = 20;
const MAX_REQUESTS_AUTHED = 100;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT || "default-dev-salt";
  return createHash("sha256").update(ip + salt).digest("hex").slice(0, 32);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSec: number;
}

export function checkRateLimit(key: string, isAuthed: boolean): RateLimitResult {
  const now = Date.now();
  const limit = isAuthed ? MAX_REQUESTS_AUTHED : MAX_REQUESTS_ANON;

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }
  bucket.count += 1;

  const remaining = Math.max(0, limit - bucket.count);
  const resetInSec = Math.ceil((bucket.resetAt - now) / 1000);

  return {
    allowed: bucket.count <= limit,
    remaining,
    resetInSec,
  };
}

setInterval(() => {
  if (buckets.size < 5000) return;
  const now = Date.now();
  for (const [k, v] of buckets.entries()) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}, 5 * 60 * 1000);
