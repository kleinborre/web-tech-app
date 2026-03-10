/**
 * ImageToTextOnline - Express Server Entry Point
 * 
 * Main server configuration and initialization.
 * Serves the frontend and provides OCR API endpoints.
 * 
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import { initializePassport } from './config/passport.js';

// Route imports
import ocrRoutes from './routes/ocr.routes.js';
import authRoutes from './routes/auth.routes.js';
import historyRoutes from './routes/history.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import { globalLimiter } from './middleware/rateLimiter.middleware.js';
import errorHandler from './middleware/error.middleware.js';

// Database connection
import connectDB from './config/db.js';

// Load environment variables
dotenv.config();

// Initialize Passport strategies (must be after dotenv.config)
initializePassport();

// ES Module directory resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express application
const app = express();

// Server configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/* ==========================================================================
   MIDDLEWARE CONFIGURATION
   ========================================================================== */

/**
 * Compression Middleware
 * Gzip/Brotli compress all responses.
 * Reduces payload sizes by 60-80% for HTML, CSS, JS, JSON.
 */
app.use(compression());

/**
 * CORS Configuration
 * Allows cross-origin requests for API access.
 */
app.use(cors({
    origin: NODE_ENV === 'production'
        ? ['https://web-tech-app.vercel.app', 'https://kleinborre.github.io']
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

/**
 * Helmet.js Security Headers
 * Sets various HTTP headers to secure the app.
 * CSP disabled to allow inline scripts in the frontend.
 */
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

/**
 * Body Parser Middleware
 * Parses JSON and URL-encoded request bodies.
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Cookie Parser Middleware
 * Parses cookies for authentication.
 */
app.use(cookieParser());

/**
 * Passport Middleware
 * Initializes Passport for Google OAuth.
 */
app.use(passport.initialize());

/**
 * Database Connection Middleware
 * Ensures MongoDB is connected before handling any request.
 * Critical for Vercel serverless cold starts.
 */
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('[Database] Connection failed:', error.message);
        res.status(503).json({ error: 'Database connection failed. Please try again.' });
    }
});

/**
 * Request Logging Middleware
 * Logs incoming requests in development mode.
 */
if (NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

/* ==========================================================================
   STATIC FILE SERVING
   ========================================================================== */

/**
 * Anti-cache headers for HTML pages.
 * Prevents bfcache and browser caching of auth-sensitive pages.
 * Industry standard: no-store + no-cache + must-revalidate + max-age=0.
 */
const setNoCacheHeaders = (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
};

/**
 * Serve Frontend Static Files
 * Cache static assets (CSS, JS, images) for faster subsequent loads.
 * HTML files get anti-cache headers to prevent bfcache.
 */
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            setNoCacheHeaders(res);
        }
    }
}));

/* ==========================================================================
   API ROUTES
   ========================================================================== */

/**
 * OCR API Routes
 * Handles image-to-text conversion requests.
 */
app.use('/api/ocr', ocrRoutes);

// Apply global rate limiter to all API routes below
app.use('/api', globalLimiter);

/**
 * Auth API Routes
 * Handles authentication (register, login, logout).
 */
app.use('/api/auth', authRoutes);

/**
 * History API Routes
 * Handles user conversion history.
 */
app.use('/api/history', historyRoutes);

/**
 * Admin API Routes
 * Handles admin panel functionality.
 */
app.use('/api/admin', adminRoutes);

/**
 * Notification API Routes
 * Handles user notification management.
 */
app.use('/api/notifications', notificationRoutes);

/**
 * Health Check Endpoint
 * Returns server status for monitoring.
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV
    });
});

/* ==========================================================================
   PAGE ROUTES (Clean URLs - RESTful)
   ========================================================================== */

/**
 * Authentication Pages
 * Serves auth-related HTML pages using clean URLs.
 */
app.get('/auth/login', (req, res) => {
    setNoCacheHeaders(res);
    res.sendFile(path.join(frontendPath, 'auth', 'login.html'));
});

app.get('/auth/register', (req, res) => {
    setNoCacheHeaders(res);
    res.sendFile(path.join(frontendPath, 'auth', 'register.html'));
});

app.get('/auth/forgot-password', (req, res) => {
    setNoCacheHeaders(res);
    res.sendFile(path.join(frontendPath, 'auth', 'forgot-password.html'));
});

app.get('/auth/update-password', (req, res) => {
    setNoCacheHeaders(res);
    res.sendFile(path.join(frontendPath, 'auth', 'update-password.html'));
});

/**
 * Admin Pages
 * Serves admin panel HTML pages using clean URLs.
 */
app.get('/admin/dashboard', (req, res) => {
    setNoCacheHeaders(res);
    res.sendFile(path.join(frontendPath, 'admin', 'dashboard.html'));
});

app.get('/admin/users', (req, res) => {
    setNoCacheHeaders(res);
    res.sendFile(path.join(frontendPath, 'admin', 'users.html'));
});

app.get('/admin/settings', (req, res) => {
    setNoCacheHeaders(res);
    res.sendFile(path.join(frontendPath, 'admin', 'settings.html'));
});

/**
 * Authenticated Home Page
 * OCR page with dashboard-style navigation for logged-in users.
 */
app.get('/home', (req, res) => {
    setNoCacheHeaders(res);
    res.sendFile(path.join(frontendPath, 'home.html'));
});

/* ==========================================================================
   FRONTEND ROUTING (SPA Support)
   ========================================================================== */

/**
 * Serve index.html for unmatched routes.
 * This enables client-side routing.
 * Note: Express 5 requires named wildcards.
 */
app.get('/{*splat}', (req, res, next) => {
    // Only serve HTML for non-API routes
    if (req.url.startsWith('/api')) {
        return next();
    }
    setNoCacheHeaders(res);
    res.sendFile(path.join(frontendPath, 'index.html'));
});

/* ==========================================================================
   ERROR HANDLING
   ========================================================================== */

/**
 * 404 Handler
 * Catches requests to undefined API endpoints.
 */
app.use('/api/{*splat}', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});

/**
 * Centralized Error Handler
 * Catches all errors forwarded via next(error) from controllers.
 */
app.use(errorHandler);

/* ==========================================================================
   SERVER INITIALIZATION
   ========================================================================== */

// Only start listening when running locally (not on Vercel serverless)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log('  ImageToTextOnline Server');
        console.log('='.repeat(60));
        console.log(`  Environment: ${NODE_ENV}`);
        console.log(`  Server:      http://localhost:${PORT}`);
        console.log(`  API:         http://localhost:${PORT}/api`);
        console.log(`  Health:      http://localhost:${PORT}/api/health`);
        console.log('='.repeat(60));
    });
}

export default app;
