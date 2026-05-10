import { NextRequest } from "next/server";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;
const memoryStore = new Map<string, { count: number; resetAt: number }>();

async function rateLimitUpstash(ip: string) {
  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL!,
    token: process.env.UPSTASH_REDIS_TOKEN!,
  });

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "1 m"),
    analytics: false,
    prefix: "genesis-2k26",
  });

  return ratelimit.limit(ip);
}

function rateLimitMemory(ip: string) {
  const now = Date.now();
  const existing = memoryStore.get(ip);

  if (!existing || existing.resetAt <= now) {
    memoryStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true, remaining: MAX_REQUESTS - 1, reset: now + WINDOW_MS };
  }

  if (existing.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0, reset: existing.resetAt };
  }

  existing.count += 1;
  return { success: true, remaining: MAX_REQUESTS - existing.count, reset: existing.resetAt };
}

export async function checkRateLimit(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    try {
      return await rateLimitUpstash(ip);
    } catch {
      return rateLimitMemory(ip);
    }
  }

  return rateLimitMemory(ip);
}

