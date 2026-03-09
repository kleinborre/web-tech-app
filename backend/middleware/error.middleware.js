/**
 * ImageToTextOnline - Centralized Error Handler Middleware
 * 
 * Catches all errors forwarded via next(error) and returns
 * consistent JSON responses with proper HTTP status codes.
 *
 * @version 1.0.0
 */

/* ==========================================================================
   CUSTOM ERROR CLASS
   ========================================================================== */

/**
 * Application-specific error with HTTP status code.
 * Usage: throw new AppError('Not found', 404);
 */
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/* ==========================================================================
   CENTRALIZED ERROR HANDLER
   ========================================================================== */

/**
 * Express error-handling middleware (must have 4 params).
 * Place after all routes in server.js.
 */
const errorHandler = (err, req, res, next) => {
    // Default values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';

    console.error(`[ERROR] ${statusCode} — ${message}`);
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    // ── Mongoose bad ObjectId ──
    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }

    // ── Mongoose duplicate key ──
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyPattern)[0];
        message = `${field} already exists`;
    }

    // ── Mongoose validation error ──
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(e => e.message).join(', ');
    }

    // ── JWT errors ──
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token. Please log in again.';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired. Please log in again.';
    }

    // ── Multer file size ──
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'File size exceeds the maximum limit of 10MB';
    }

    // ── Multer unexpected file ──
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        statusCode = 400;
        message = 'Maximum of 5 files allowed per request';
    }

    // ── SyntaxError from malformed JSON body ──
    if (err.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Malformed JSON in request body';
    }

    // Send response
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export default errorHandler;
