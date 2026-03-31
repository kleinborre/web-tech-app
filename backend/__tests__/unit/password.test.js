/**
 * ImageToTextOnline - Unit Tests: Password Validation
 * 
 * Tests: UT-001 through UT-003 (bcrypt hashing/comparison)
 *        UT-009 through UT-012 (password complexity validation)
 * 
 * @version 1.0.0
 */

import { describe, it, expect } from '@jest/globals';
import bcrypt from 'bcrypt';

/* ==========================================================================
   UT-001 to UT-003: Password Hashing with bcrypt
   ========================================================================== */

describe('Password Hashing (UT-001 to UT-003)', () => {
    const plainPassword = 'TestPass123!';
    let hashedPassword;

    // UT-001: Verify password hashing
    it('UT-001: should hash a password with bcrypt', async () => {
        hashedPassword = await bcrypt.hash(plainPassword, 10);

        expect(hashedPassword).toBeDefined();
        expect(typeof hashedPassword).toBe('string');
        expect(hashedPassword).not.toBe(plainPassword);
        expect(hashedPassword.startsWith('$2b$')).toBe(true);
    });

    // UT-002: Verify password comparison - correct password
    it('UT-002: should return true for correct password comparison', async () => {
        hashedPassword = await bcrypt.hash(plainPassword, 10);
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

        expect(isMatch).toBe(true);
    });

    // UT-003: Verify password comparison - wrong password
    it('UT-003: should return false for wrong password comparison', async () => {
        hashedPassword = await bcrypt.hash(plainPassword, 10);
        const isMatch = await bcrypt.compare('WrongPass999!', hashedPassword);

        expect(isMatch).toBe(false);
    });
});

/* ==========================================================================
   UT-009 to UT-012: Password Complexity Validation
   ========================================================================== */

// Replicate the exact validation logic from the app
const PASSWORD_SPECIAL_REGEX = /[!@#$%^&*(),.?":{}\|<>_\-]/;

function validatePassword(password) {
    if (!password || password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!PASSWORD_SPECIAL_REGEX.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character (. _ - ! @ # $ etc.)' };
    }
    return { valid: true, message: 'Password is valid' };
}

describe('Password Complexity Validation (UT-009 to UT-012)', () => {
    // UT-009: Valid password with underscore (the bug we fixed!)
    it('UT-009: should accept "Xiaomi0123_" as a valid password', () => {
        const result = validatePassword('Xiaomi0123_');
        expect(result.valid).toBe(true);
    });

    // Additional: Valid password with hyphen
    it('UT-009b: should accept "TestPass1-" as a valid password (hyphen)', () => {
        const result = validatePassword('TestPass1-');
        expect(result.valid).toBe(true);
    });

    // Additional: Valid password with period
    it('UT-009c: should accept "TestPass1." as a valid password (period)', () => {
        const result = validatePassword('TestPass1.');
        expect(result.valid).toBe(true);
    });

    // UT-010: Missing uppercase
    it('UT-010: should reject password missing uppercase letter', () => {
        const result = validatePassword('xiaomi0123_');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('uppercase');
    });

    // UT-011: Missing special character  
    it('UT-011: should reject password missing special character', () => {
        const result = validatePassword('Xiaomi0123');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('special character');
    });

    // UT-012: Too short
    it('UT-012: should reject password shorter than 8 characters', () => {
        const result = validatePassword('Ab1_x');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('8 characters');
    });

    // Edge case: Missing lowercase
    it('UT-012b: should reject password missing lowercase letter', () => {
        const result = validatePassword('XIAOMI0123_');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('lowercase');
    });

    // Edge case: Missing number
    it('UT-012c: should reject password missing number', () => {
        const result = validatePassword('XiaomiTest_');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('number');
    });
});
