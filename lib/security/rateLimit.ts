/**
 * Rate Limiting Utility
 *
 * Simple in-memory rate limiter for API routes.
 * In production, consider using Redis for distributed rate limiting.
 */

interface RequestLog {
  timestamps: number[];
  lastCleanup: number;
}

// In-memory storage for rate limiting
const requestStore = new Map<string, RequestLog>();

// Cleanup interval: 1 hour
const CLEANUP_INTERVAL = 60 * 60 * 1000;

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param limit - Maximum number of requests allowed in the time window
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or create request log
  let requestLog = requestStore.get(identifier);

  if (!requestLog) {
    requestLog = {
      timestamps: [],
      lastCleanup: now
    };
    requestStore.set(identifier, requestLog);
  }

  // Periodic cleanup of old entries (prevent memory bloat)
  if (now - requestLog.lastCleanup > CLEANUP_INTERVAL) {
    cleanupOldEntries();
    requestLog.lastCleanup = now;
  }

  // Filter out timestamps outside the current window
  requestLog.timestamps = requestLog.timestamps.filter(
    timestamp => timestamp > windowStart
  );

  // Check if limit exceeded
  if (requestLog.timestamps.length >= limit) {
    return false; // Rate limited
  }

  // Record this request
  requestLog.timestamps.push(now);
  return true; // Allowed
}

/**
 * Clean up old entries from the request store
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [identifier, log] of requestStore.entries()) {
    // Remove entries with no recent requests
    if (log.timestamps.length === 0 ||
        (log.timestamps[log.timestamps.length - 1] < now - maxAge)) {
      requestStore.delete(identifier);
    }
  }
}

/**
 * Get remaining requests for an identifier
 *
 * @param identifier - Unique identifier
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Number of requests remaining in the current window
 */
export function getRemainingRequests(
  identifier: string,
  limit: number,
  windowMs: number
): number {
  const now = Date.now();
  const windowStart = now - windowMs;

  const requestLog = requestStore.get(identifier);
  if (!requestLog) {
    return limit;
  }

  const recentRequests = requestLog.timestamps.filter(
    timestamp => timestamp > windowStart
  );

  return Math.max(0, limit - recentRequests.length);
}

/**
 * Reset rate limit for an identifier (useful for testing)
 *
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  requestStore.delete(identifier);
}

/**
 * Clear all rate limit data (useful for testing)
 */
export function clearAllRateLimits(): void {
  requestStore.clear();
}

// Common rate limit presets
export const RateLimitPresets = {
  // Very restrictive: 10 requests per minute
  STRICT: { limit: 10, windowMs: 60 * 1000 },

  // Standard API limit: 100 requests per minute
  STANDARD: { limit: 100, windowMs: 60 * 1000 },

  // Generous limit: 1000 requests per hour
  GENEROUS: { limit: 1000, windowMs: 60 * 60 * 1000 },

  // AI endpoints (expensive): 20 requests per minute
  AI_ENDPOINT: { limit: 20, windowMs: 60 * 1000 },

  // File upload: 50 uploads per hour
  FILE_UPLOAD: { limit: 50, windowMs: 60 * 60 * 1000 },
} as const;
