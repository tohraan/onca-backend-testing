/**
 * Rate Limiting Utility
 * Protects API routes from abuse using in-memory store
 * For production, replace with Redis-based solution (Upstash)
 */

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Max requests per window
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * Rate limit configurations for different route types
 */
export const RATE_LIMITS = {
    // Authentication routes - strict limits
    AUTH: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5
    },
    // Expensive operations (AI, OCR, Google Sheets sync)
    EXPENSIVE: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 10
    },
    // File uploads
    UPLOAD: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 20
    },
    // Standard CRUD operations
    STANDARD: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100
    },
    // Read-only operations
    READ: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 200
    }
} as const;

/**
 * Check if request exceeds rate limit
 * @param identifier - Unique identifier (IP, user ID, org ID)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and retry info
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
} {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // No entry or window expired - allow and create new entry
    if (!entry || now > entry.resetTime) {
        const resetTime = now + config.windowMs;
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime
        });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetTime
        };
    }

    // Within window - check count
    if (entry.count < config.maxRequests) {
        entry.count++;
        return {
            allowed: true,
            remaining: config.maxRequests - entry.count,
            resetTime: entry.resetTime
        };
    }

    // Exceeded limit
    return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000) // seconds
    };
}

/**
 * Get rate limit configuration based on route pattern
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig {
    // Auth routes
    if (pathname.startsWith('/api/auth') || pathname.includes('/login')) {
        return RATE_LIMITS.AUTH;
    }

    // Expensive operations
    if (
        pathname.includes('/sheets/sync') ||
        pathname.includes('/insights') ||
        pathname.includes('/ai/')
    ) {
        return RATE_LIMITS.EXPENSIVE;
    }

    // Upload routes
    if (pathname.includes('/upload') || pathname.includes('/ingest')) {
        return RATE_LIMITS.UPLOAD;
    }

    // Read operations (GET requests)
    if (pathname.includes('/api/') && pathname.match(/\/(list|get|fetch)/)) {
        return RATE_LIMITS.READ;
    }

    // Default to standard
    return RATE_LIMITS.STANDARD;
}

/**
 * Create rate limit identifier based on request context
 * Priority: org_id > user_id > IP address
 */
export function createRateLimitIdentifier(
    pathname: string,
    ip: string,
    userId?: string,
    orgId?: string
): string {
    // For auth routes, use IP only (no user context yet)
    if (pathname.startsWith('/api/auth')) {
        return `ip:${ip}:${pathname}`;
    }

    // For org-scoped expensive operations, use org_id
    if (orgId && (pathname.includes('/sheets/sync') || pathname.includes('/upload'))) {
        return `org:${orgId}:${pathname}`;
    }

    // For user-scoped operations, use user_id
    if (userId) {
        return `user:${userId}:${pathname}`;
    }

    // Fallback to IP
    return `ip:${ip}:${pathname}`;
}

/**
 * Helper to extract IP address from request
 */
export function getClientIp(request: Request): string {
    // Check common headers for IP (reverse proxy, CDN)
    const headers = request.headers;
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback (won't work in production behind proxy)
    return 'unknown';
}
