import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { apiError } from "./api-response";

type RateLimitRule = {
  scope: string;
  limit: number;
  windowSeconds: number;
  identifier?: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

declare global {
  var _trackfyRateLimits: Map<string, RateLimitEntry> | undefined;
}

const store = global._trackfyRateLimits ?? new Map<string, RateLimitEntry>();

if (!global._trackfyRateLimits) {
  global._trackfyRateLimits = store;
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function keyPart(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

function pruneExpiredEntries(now: number): void {
  if (store.size < 10_000) return;

  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/**
 * Process-local rate limiter. Use a shared store (Redis/KV) when deploying
 * multiple application instances.
 */
export function enforceRateLimit(
  request: NextRequest,
  rule: RateLimitRule,
) {
  const now = Date.now();
  pruneExpiredEntries(now);
  const subject = `${clientIp(request)}:${rule.identifier ?? ""}`;
  const key = `${rule.scope}:${keyPart(subject)}`;
  const current = store.get(key);
  const resetAt = current && current.resetAt > now
    ? current.resetAt
    : now + rule.windowSeconds * 1_000;
  const count = current && current.resetAt > now ? current.count + 1 : 1;
  store.set(key, { count, resetAt });

  if (count <= rule.limit) return null;

  const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1_000));
  const response = apiError(
    "RATE_LIMITED",
    "Muitas tentativas. Aguarde alguns instantes e tente novamente.",
    429,
  );
  response.headers.set("Retry-After", String(retryAfter));
  return response;
}
