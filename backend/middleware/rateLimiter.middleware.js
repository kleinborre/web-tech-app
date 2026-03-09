/**
 * ImageToTextOnline - Rate Limiter Middleware
 * 
 * Configures express-rate-limit for API protection.
 * - globalLimiter:      100 req / 15 min per IP (all API routes)
 * - authLimiter:        10 req / 15 min (register, forgot/reset password)
 * - strictAuthLimiter:  5 req / 15 min  (login — brute-force protection)
 *
 * @version 1.0.0
 */

import rateLimit from 'express-rate-limit';

/* ==========================================================================
   GLOBAL API LIMITER
   ========================================================================== */

/**
 * Apply to all /api routes in server.js.
 * 100 requests per 15-minute window per IP.
 */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,
    standardHeaders: true,      // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,       // Disable X-RateLimit-* headers
    message: {
        success: false,
        error: 'Too many requests. Please try again after 15 minutes.'
    }
});

/* ==========================================================================
   AUTH ROUTE LIMITER
   ========================================================================== */

/**
 * Apply to register, forgot-password, reset-password.
 * 10 requests per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many attempts. Please try again after 15 minutes.'
    }
});

/* ==========================================================================
   STRICT AUTH LIMITER (Login)
   ========================================================================== */

/**
 * Apply to login endpoint only.
 * 5 requests per 15-minute window per IP — brute-force protection.
 */
export const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many login attempts. Please try again after 15 minutes.'
    }
});
