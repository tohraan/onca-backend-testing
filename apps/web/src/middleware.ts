import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
    checkRateLimit,
    getRateLimitConfig,
    createRateLimitIdentifier,
    getClientIp
} from './lib/rate-limit' // Assuming rate-limit is in lib
import { updateSession } from './lib/supabase/middleware' // Keep existing import

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Apply rate limiting to all API routes
    if (pathname.startsWith('/api/')) {
        const ip = getClientIp(request);

        // Get user/org context if available (for better rate limiting)
        let userId: string | undefined;
        let orgId: string | undefined;

        // Try to extract user context from session
        try {
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return request.cookies.getAll()
                        },
                        setAll() {
                            // No-op for middleware
                        },
                    },
                }
            );

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                userId = user.id;
                // Optionally fetch org_id from profiles table
                // For now, we'll use userId for rate limiting
            }
        } catch (error) {
            // Continue without user context
        }

        // Check rate limit
        const config = getRateLimitConfig(pathname);
        const identifier = createRateLimitIdentifier(pathname, ip, userId, orgId);
        const rateLimit = checkRateLimit(identifier, config);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Please try again in ${rateLimit.retryAfter} seconds.`,
                    retryAfter: rateLimit.retryAfter
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(rateLimit.retryAfter),
                        'X-RateLimit-Limit': String(config.maxRequests),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(rateLimit.resetTime)
                    }
                }
            );
        }

        // Add rate limit headers to successful responses
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
        response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
        response.headers.set('X-RateLimit-Reset', String(rateLimit.resetTime));

        return response;
    }

    // Continue with normal request for non-API routes, applying session update
    return await updateSession(request)
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
