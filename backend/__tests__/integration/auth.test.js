/**
 * ImageToTextOnline - Integration Tests: Authentication API Endpoints
 * 
 * Tests: IT-001 through IT-014 (Register, Login, Logout, Check-Email,
 *        Forgot/Reset Password, Profile, Me endpoint)
 * 
 * Uses Supertest to send real HTTP requests to the Express app.
 * Requires: MongoDB Atlas connection (.env must have MONGODB_URI)
 * 
 * @version 1.0.0
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';

// Test user data - use unique email to avoid conflicts
const timestamp = Date.now();
const TEST_USER = {
    username: `testuser_${timestamp}`,
    email: `testuser_${timestamp}@gmail.com`,
    password: 'TestPass123!',
    confirmPassword: 'TestPass123!'
};

let authCookie = ''; // Stores the JWT cookie from login

/* ==========================================================================
   SETUP & TEARDOWN
   ========================================================================== */

afterAll(async () => {
    // Clean up test user from database
    try {
        const User = mongoose.model('User');
        await User.deleteOne({ email: TEST_USER.email.toLowerCase() });
        console.log(`[Test Cleanup] Removed test user: ${TEST_USER.email}`);
    } catch (error) {
        console.log('[Test Cleanup] User may not exist or already cleaned up');
    }

    // Close database connection
    await mongoose.connection.close();
});

/* ==========================================================================
   IT-001 to IT-003: Registration Endpoint
   ========================================================================== */

describe('POST /api/auth/register (IT-001 to IT-003)', () => {
    // IT-001: Successful registration
    it('IT-001: should register a new user with valid data', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(TEST_USER);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.username).toBe(TEST_USER.username);
        expect(res.body.user.email).toBe(TEST_USER.email.toLowerCase());

        // Verify JWT cookie is set
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        
        // Store cookie for subsequent tests
        if (cookies) {
            authCookie = cookies.map(c => c.split(';')[0]).join('; ');
        }
    });

    // IT-002: Duplicate email registration
    it('IT-002: should reject registration with duplicate email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(TEST_USER);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    // IT-003: Registration with invalid data (missing password)
    it('IT-003: should reject registration with missing password', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'baduser',
                email: `baduser_${timestamp}@gmail.com`
                // password is missing
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

/* ==========================================================================
   IT-004 to IT-006: Login Endpoint
   ========================================================================== */

describe('POST /api/auth/login (IT-004 to IT-006)', () => {
    // IT-004: Successful login
    it('IT-004: should login with valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: TEST_USER.email,
                password: TEST_USER.password
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user).toBeDefined();

        // Store fresh cookie
        const cookies = res.headers['set-cookie'];
        if (cookies) {
            authCookie = cookies.map(c => c.split(';')[0]).join('; ');
        }
    });

    // IT-005: Invalid password
    it('IT-005: should reject login with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: TEST_USER.email,
                password: 'WrongPassword1!'
            });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    // IT-006: Non-existent email
    it('IT-006: should reject login with non-existent email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nobody_exists_12345@gmail.com',
                password: 'TestPass123!'
            });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});

/* ==========================================================================
   IT-008 to IT-009: Protected Route - GET /api/auth/me
   ========================================================================== */

describe('GET /api/auth/me (IT-008 to IT-009)', () => {
    // IT-008: Authenticated user
    it('IT-008: should return user profile for authenticated user', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', authCookie);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.username).toBe(TEST_USER.username);
        expect(res.body.user.email).toBe(TEST_USER.email.toLowerCase());
    });

    // IT-009: No authentication
    it('IT-009: should return 401 without authentication', async () => {
        const res = await request(app)
            .get('/api/auth/me');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Not authorized');
    });
});

/* ==========================================================================
   IT-010 to IT-011: Check Email Endpoint
   ========================================================================== */

describe('POST /api/auth/check-email (IT-010 to IT-011)', () => {
    // IT-010: Check existing email
    it('IT-010: should return exists:true for registered email', async () => {
        const res = await request(app)
            .post('/api/auth/check-email')
            .send({ email: TEST_USER.email });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.exists).toBe(true);
        expect(res.body.validDomain).toBeDefined();
    });

    // IT-011: Check non-existent email
    it('IT-011: should return exists:false for unregistered email', async () => {
        const res = await request(app)
            .post('/api/auth/check-email')
            .send({ email: `nonexistent_${timestamp}@gmail.com` });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.exists).toBe(false);
    });
});

/* ==========================================================================
   IT-007: Logout Endpoint
   ========================================================================== */

describe('POST /api/auth/logout (IT-007)', () => {
    // IT-007: Successful logout
    it('IT-007: should logout authenticated user', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .set('Cookie', authCookie);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
