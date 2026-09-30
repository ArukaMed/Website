import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Serverless Redis client for edge caching & counters
 */
export const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

/**
 * Edge Rate Limiter for Lead & Inquiries API routes
 * Allows 5 requests per 10-second sliding window per IP
 */
export const leadRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 s"),
      analytics: true,
      prefix: "ratelimit:lead",
    })
  : null;

/**
 * Edge Rate Limiter for Credit Applications & Auth
 * Allows 3 requests per 60-second sliding window per IP
 */
export const strictRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "60 s"),
      analytics: true,
      prefix: "ratelimit:strict",
    })
  : null;
