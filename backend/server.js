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
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

// Route imports
import ocrRoutes from './routes/ocr.routes.js';
import authRoutes from './routes/auth.routes.js';
import historyRoutes from './routes/history.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Database connection
import connectDB from './config/db.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

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
 * Serve Frontend Static Files
 * The frontend folder is served at the root URL.
 */
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

/* ==========================================================================
   API ROUTES
   ========================================================================== */

/**
 * OCR API Routes
 * Handles image-to-text conversion requests.
 */
app.use('/api/ocr', ocrRoutes);

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
    res.sendFile(path.join(frontendPath, 'auth', 'login.html'));
});

app.get('/auth/register', (req, res) => {
    res.sendFile(path.join(frontendPath, 'auth', 'register.html'));
});

app.get('/auth/forgot-password', (req, res) => {
    res.sendFile(path.join(frontendPath, 'auth', 'forgot-password.html'));
});

/**
 * Admin Pages
 * Serves admin panel HTML pages using clean URLs.
 */
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(frontendPath, 'admin', 'dashboard.html'));
});

app.get('/admin/users', (req, res) => {
    res.sendFile(path.join(frontendPath, 'admin', 'users.html'));
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
 * Global Error Handler
 * Catches and processes all unhandled errors.
 */
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    console.error(err.stack);

    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            error: 'File size exceeds the maximum limit of 10MB'
        });
    }

    // Multer file count error
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            success: false,
            error: 'Maximum of 5 files allowed per request'
        });
    }

    // Generic server error
    res.status(err.status || 500).json({
        success: false,
        error: NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

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
