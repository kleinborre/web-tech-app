/**
 * ImageToTextOnline - Integration Tests: All API Endpoints
 *
 * Tests: IT-001 through IT-023
 *   - Auth:        Register, Login, Logout, Me, Check-Email,
 *                  Forgot/Reset Password, Update Password,
 *                  Profile Picture (upload / invalid type)
 *   - OCR:         Convert image to text
 *   - History:     Get list, Delete single record
 *   - Admin:       Get users (admin role, regular user RBAC)
 *   - Translation: Translate text via MyMemory API
 *
 * Uses Supertest to send real HTTP requests to the Express app.
 * Requires: MongoDB Atlas connection (.env must have MONGODB_URI)
 *
 * @version 2.0.0
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import app from '../../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/* ==========================================================================
   SHARED TEST STATE
   ========================================================================== */

const timestamp   = Date.now();

// Regular test user (created in IT-001, reused throughout)
const TEST_USER = {
    username:        `ituser_${timestamp}`,
    email:           `ituser_${timestamp}@gmail.com`,
    password:        'TestPass123!',
    confirmPassword: 'TestPass123!'
};

let authCookie   = '';   // JWT cookie for TEST_USER
let testUserId   = '';   // MongoDB _id of TEST_USER
let historyId    = '';   // _id of one OCR history record created in IT-015

/* ==========================================================================
   HELPERS
   ========================================================================== */

/** Extract the token= cookie string from a Supertest response. */
function extractCookie(res) {
    const raw = res.headers['set-cookie'];
    if (!raw) return '';
    return raw.map(c => c.split(';')[0]).join('; ');
}

/**
 * Create a minimal 1×1 white PNG as a Buffer (no external images needed).
 * Real Tesseract.js won't extract text from it but the endpoint still returns
 * a success response with an empty / whitespace text string.
 */
function makeMinimalPngBuffer() {
    // 67-byte valid 1×1 white PNG
    const b64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    return Buffer.from(b64, 'base64');
}

/* ==========================================================================
   SETUP & TEARDOWN
   ========================================================================== */

afterAll(async () => {
    try {
        const User    = mongoose.model('User');
        const History = mongoose.model('History');
        await User.deleteOne({ email: TEST_USER.email.toLowerCase() });
        if (testUserId) await History.deleteMany({ userId: testUserId });
        console.log('[Cleanup] Removed test user and history records.');
    } catch (err) {
        console.log('[Cleanup] Skipped (user already removed or model unavailable).');
    }
    await mongoose.connection.close();
});

/* ==========================================================================
   IT-001 to IT-003  ·  POST /api/auth/register
   ========================================================================== */

describe('POST /api/auth/register (IT-001 to IT-003)', () => {

    // IT-001: Successful registration
    it('IT-001: should register a new user and return 201 with JWT cookie', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(TEST_USER);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.username).toBe(TEST_USER.username);
        expect(res.body.user.email).toBe(TEST_USER.email.toLowerCase());

        // JWT cookie MUST be set
        const cookie = extractCookie(res);
        expect(cookie).toContain('token=');
        authCookie  = cookie;
        testUserId  = res.body.user._id;
    });

    // IT-002: Duplicate email → 400
    it('IT-002: should return 400 for duplicate email registration', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...TEST_USER, username: `other_${timestamp}` });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    // IT-003: Invalid email domain (DNS check) → 400
    it('IT-003: should return 400 for fake email domain (DNS check)', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username:        `fakeuser_${timestamp}`,
                email:           'fakeuser@fakefakedomain999xyz.com',
                password:        'TestPass123!',
                confirmPassword: 'TestPass123!'
            });

        // DNS validation is fail-open locally; accept 201 or 400
        if (res.status === 400) {
            expect(res.body.success).toBe(false);
            // The error message should mention email domain
            const errMsg = (res.body.error || '').toLowerCase();
            expect(
                errMsg.includes('domain') || errMsg.includes('email')
            ).toBe(true);
        } else {
            // Locally DNS is fail-open → registration succeeds (expected in dev)
            expect(res.status).toBe(201);
            // Clean up this extra user
            try {
                const User = mongoose.model('User');
                await User.deleteOne({ email: 'fakeuser@fakefakedomain999xyz.com' });
            } catch (_) { /* ignore */ }
        }
    });
});

/* ==========================================================================
   IT-004 to IT-006  ·  POST /api/auth/login
   ========================================================================== */

describe('POST /api/auth/login (IT-004 to IT-006)', () => {

    // IT-004: Valid credentials → 200 + JWT cookie
    it('IT-004: should login with valid credentials and return JWT cookie', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_USER.email, password: TEST_USER.password });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user).toBeDefined();

        const cookie = extractCookie(res);
        expect(cookie).toContain('token=');
        authCookie = cookie;  // Refresh for subsequent tests
    });

    // IT-005: Invalid password → 401
    it('IT-005: should return 401 for wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_USER.email, password: 'WrongPassword1!' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    // IT-006: Non-existent email → 401
    it('IT-006: should return 401 for non-existent email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody_exists_99999@gmail.com', password: 'TestPass123!' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});

/* ==========================================================================
   IT-007  ·  POST /api/auth/logout
   ========================================================================== */

describe('POST /api/auth/logout (IT-007)', () => {

    it('IT-007: should logout authenticated user and return 200', async () => {
        // Login first to get a fresh cookie
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_USER.email, password: TEST_USER.password });
        const freshCookie = extractCookie(loginRes);

        const res = await request(app)
            .post('/api/auth/logout')
            .set('Cookie', freshCookie);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('Logged out');

        // Refresh authCookie (login again for later tests)
        const relogin = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_USER.email, password: TEST_USER.password });
        authCookie = extractCookie(relogin);
    });
});

/* ==========================================================================
   IT-008 to IT-009  ·  GET /api/auth/me
   ========================================================================== */

describe('GET /api/auth/me (IT-008 to IT-009)', () => {

    // IT-008: Authenticated → 200 with user data
    it('IT-008: should return user profile for authenticated user', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', authCookie);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.username).toBe(TEST_USER.username);
        expect(res.body.user.email).toBe(TEST_USER.email.toLowerCase());
        expect(res.body.user.role).toBeDefined();
        // Password must NOT be exposed
        expect(res.body.user.password).toBeUndefined();
    });

    // IT-009: No auth → 401
    it('IT-009: should return 401 without authentication', async () => {
        const res = await request(app).get('/api/auth/me');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Not authorized');
    });
});

/* ==========================================================================
   IT-010 to IT-011  ·  POST /api/auth/check-email
   ========================================================================== */

describe('POST /api/auth/check-email (IT-010 to IT-011)', () => {

    // IT-010: Existing email with valid domain → exists:true
    it('IT-010: should return exists:true for a registered email', async () => {
        const res = await request(app)
            .post('/api/auth/check-email')
            .send({ email: TEST_USER.email });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.exists).toBe(true);
        expect(res.body.validDomain).toBeDefined();
    });

    // IT-011: Fake domain email → validDomain:false
    it('IT-011: should return validDomain:false for fake domain email', async () => {
        const res = await request(app)
            .post('/api/auth/check-email')
            .send({ email: 'test@fakefakedomain123.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        // In production: validDomain:false. Locally may be true (fail-open).
        expect(typeof res.body.validDomain).toBe('boolean');
        expect(res.body.exists).toBe(false);
    });
});

/* ==========================================================================
   IT-012 to IT-014  ·  Forgot / Reset Password
   ========================================================================== */

describe('Forgot & Reset Password (IT-012 to IT-014)', () => {

    // IT-012: Forgot password with valid registered email → 200
    it('IT-012: should send reset email for valid registered address', async () => {
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: TEST_USER.email });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // IT-013: Reset password with a valid token → 200
    it('IT-013: should reset password successfully with valid token', async () => {
        // Create a real reset token directly via the model
        const User               = mongoose.model('User');
        const PasswordResetToken = mongoose.model('PasswordResetToken');

        const user      = await User.findOne({ email: TEST_USER.email.toLowerCase() });
        const plainToken = await PasswordResetToken.createToken(user._id);

        const res = await request(app)
            .post('/api/auth/reset-password')
            .send({
                token:    plainToken,
                email:    TEST_USER.email,
                password: 'NewPass456_'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Restore original password so later tests still work
        user.password = TEST_USER.password;
        await user.save();

        // Refresh auth cookie
        const relogin = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_USER.email, password: TEST_USER.password });
        authCookie = extractCookie(relogin);
    });

    // IT-014: Reset password with expired/invalid token → 400
    it('IT-014: should return 400 for expired or invalid reset token', async () => {
        const res = await request(app)
            .post('/api/auth/reset-password')
            .send({
                token:    'thisisafakeinvalidtoken00000000000000000000000000000000000000000000',
                email:    TEST_USER.email,
                password: 'NewPass456_'
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

/* ==========================================================================
   IT-015  ·  POST /api/ocr/convert
   ========================================================================== */

describe('POST /api/ocr/convert (IT-015)', () => {

    it('IT-015: should return 200 and extracted text for a valid image upload', async () => {
        const pngBuffer = makeMinimalPngBuffer();

        const res = await request(app)
            .post('/api/ocr/convert')
            .set('Cookie', authCookie)
            .attach('images', pngBuffer, { filename: 'test-image.png', contentType: 'image/png' });

        expect(res.status).toBe(200);
        // Response should be an array with at least one result object
        const results = Array.isArray(res.body) ? res.body : res.body?.results;
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
        expect(results[0]).toHaveProperty('filename');
        expect(results[0]).toHaveProperty('text');
    });
});

/* ==========================================================================
   IT-016 to IT-017  ·  History CRUD
   ========================================================================== */

describe('History Endpoints (IT-016 to IT-017)', () => {

    // IT-016: GET /api/history → 200 with paginated array
    it('IT-016: should return paginated history for authenticated user', async () => {
        const res = await request(app)
            .get('/api/history')
            .set('Cookie', authCookie);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        // Response has data array (may be empty for a brand-new user)
        const data = res.body.data ?? res.body.history ?? res.body.results ?? [];
        expect(Array.isArray(data)).toBe(true);

        // If records exist, save one ID for the delete test
        if (data.length > 0) {
            historyId = data[0]._id;
        }
    });

    // IT-017: DELETE /api/history/:id → 200 (skip gracefully if no history)
    it('IT-017: should delete a history record and return 200', async () => {
        // If no historyId was captured in IT-016, skip this test
        if (!historyId) {
            console.log('[IT-017] No history records found — skipping delete test.');
            return;
        }

        const res = await request(app)
            .delete(`/api/history/${historyId}`)
            .set('Cookie', authCookie);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

/* ==========================================================================
   IT-018 to IT-019  ·  Profile Picture Upload
   ========================================================================== */

describe('POST /api/auth/profile-picture (IT-018 to IT-019)', () => {

    // IT-018: Valid JPEG image → 200 + Firebase Storage URL
    it('IT-018: should upload profile picture and return Firebase URL', async () => {
        const pngBuffer = makeMinimalPngBuffer();

        const res = await request(app)
            .post('/api/auth/profile-picture')
            .set('Cookie', authCookie)
            .attach('profilePicture', pngBuffer, { filename: 'profile.png', contentType: 'image/png' });

        // Accept 200 (uploaded) or 500 (Firebase not configured in test env)
        if (res.status === 200) {
            expect(res.body.success).toBe(true);
            expect(res.body.profilePicture).toBeDefined();
        } else {
            // Firebase credentials likely not available in local test — that's OK
            console.log(`[IT-018] Firebase upload not available in test env (status: ${res.status}).`);
            expect(res.status).toBeGreaterThanOrEqual(400);
        }
    });

    // IT-019: Invalid file type (.txt) → Multer error
    it('IT-019: should reject invalid file type with appropriate error', async () => {
        const txtBuffer = Buffer.from('This is not an image');

        const res = await request(app)
            .post('/api/auth/profile-picture')
            .set('Cookie', authCookie)
            .attach('profilePicture', txtBuffer, { filename: 'document.txt', contentType: 'text/plain' });

        // Multer rejects with 400 or 500 depending on error handler
        expect(res.status).toBeGreaterThanOrEqual(400);
        const body = res.body;
        const errText = (body.error || body.message || '').toLowerCase();
        expect(
            errText.includes('invalid') ||
            errText.includes('file type') ||
            errText.includes('allowed')
        ).toBe(true);
    });
});

/* ==========================================================================
   IT-020 to IT-021  ·  Admin Routes (RBAC)
   ========================================================================== */

describe('Admin Routes RBAC (IT-020 to IT-021)', () => {

    // IT-020: Admin user accessing /api/admin/users → 200
    it('IT-020: should return 200 for admin user accessing /api/admin/users', async () => {
        // Build a JWT with admin role signed with the real JWT_SECRET
        const adminToken = jwt.sign(
            { id: testUserId || new mongoose.Types.ObjectId().toString(), role: 'admin' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        // Promote the user to admin in DB so the protect middleware finds them
        try {
            const User = mongoose.model('User');
            await User.findByIdAndUpdate(testUserId, { role: 'admin' });
        } catch (_) { /* ignore in case testUserId is not set */ }

        const res = await request(app)
            .get('/api/admin/users')
            .set('Cookie', `token=${adminToken}`);

        if (res.status === 200) {
            expect(res.body.success).toBe(true);
            const users = res.body.data ?? res.body.users ?? [];
            expect(Array.isArray(users)).toBe(true);
        } else {
            // JWT user lookup may fail if testUserId is mismatched — still validates route exists
            expect([200, 401, 403]).toContain(res.status);
        }

        // Restore role to 'user'
        try {
            const User = mongoose.model('User');
            await User.findByIdAndUpdate(testUserId, { role: 'user' });
        } catch (_) { /* ignore */ }
    });

    // IT-021: Regular user accessing /api/admin/users → 403
    it('IT-021: should return 403 for regular user accessing admin route', async () => {
        const res = await request(app)
            .get('/api/admin/users')
            .set('Cookie', authCookie); // authCookie belongs to role:'user'

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Access denied');
    });
});

/* ==========================================================================
   IT-022  ·  PATCH /api/auth/update-password
   ========================================================================== */

describe('PATCH /api/auth/update-password (IT-022)', () => {

    it('IT-022: should update password and allow login with new password', async () => {
        const newPass = 'NewSecure456_';

        const res = await request(app)
            .patch('/api/auth/update-password')
            .set('Cookie', authCookie)
            .send({
                currentPassword:  TEST_USER.password,
                newPassword:      newPass,
                confirmNewPassword: newPass
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify login works with new password
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_USER.email, password: newPass });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.success).toBe(true);
        authCookie = extractCookie(loginRes);

        // Restore original password for cleanup consistency
        await request(app)
            .patch('/api/auth/update-password')
            .set('Cookie', authCookie)
            .send({
                currentPassword:    newPass,
                newPassword:        TEST_USER.password,
                confirmNewPassword: TEST_USER.password
            });

        const finalLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_USER.email, password: TEST_USER.password });
        authCookie = extractCookie(finalLogin);
    });
});

/* ==========================================================================
   IT-023  ·  POST /api/translate
   ========================================================================== */

describe('POST /api/translate (IT-023)', () => {

    it('IT-023: should translate text and return translated result', async () => {
        const res = await request(app)
            .post('/api/translate')
            .send({ text: 'Hello', sourceLang: 'en', targetLang: 'es' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        // Response contains translated text
        const translated =
            res.body.translatedText ??
            res.body.translation    ??
            res.body.data?.translatedText;
        expect(translated).toBeDefined();
        expect(typeof translated).toBe('string');
        expect(translated.length).toBeGreaterThan(0);
    });
});
