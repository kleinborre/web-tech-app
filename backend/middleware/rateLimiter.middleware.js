/**
 * ImageToTextOnline - Rate Limiter Middleware
 * 
 * Configures express-rate-limit for API protection.
 * - globalLimiter:      300 req / 15 min per IP (all API routes)
 * - authLimiter:        20 req / 15 min (register, forgot/reset password)
 * - strictAuthLimiter:  10 req / 15 min  (login — brute-force protection)
 *
 * All limiters return JSON error responses so the frontend can display
 * inline error toasts instead of navigating to raw JSON pages.
 *
 * @version 1.2.0
 */

import rateLimit from 'express-rate-limit';

/**
 * Custom handler that always returns JSON.
 * The frontend handles 429 status via fetch and shows a toast.
 */
const createRateLimitHandler = (errorMessage) => (req, res) => {
    res.status(429).json({
        success: false,
        error: errorMessage
    });
};

/* ==========================================================================
   GLOBAL API LIMITER
   ========================================================================== */

/**
 * Apply to all /api routes in server.js.
 * 300 requests per 15-minute window per IP.
 * 
 * Industry standard: generous enough for normal SPA usage
 * (each page load fires ~3-5 API calls: /me, /stats, /notifications, etc.)
 * while still protecting against abuse.
 */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 300,
    standardHeaders: true,      // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,       // Disable X-RateLimit-* headers
    handler: createRateLimitHandler('Too many requests. Please try again after 15 minutes.')
});

/* ==========================================================================
   AUTH ROUTE LIMITER
   ========================================================================== */

/**
 * Apply to register, forgot-password, reset-password.
 * 20 requests per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many attempts. Please try again after 15 minutes.')
});

/* ==========================================================================
   STRICT AUTH LIMITER (Login)
   ========================================================================== */

/**
 * Apply to login endpoint only.
 * 10 requests per 15-minute window per IP — brute-force protection.
 */
export const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many login attempts. Please try again after 15 minutes.')
});
