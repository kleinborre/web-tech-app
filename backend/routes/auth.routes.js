/**
 * ImageToTextOnline - Authentication Routes
 * 
 * Routes for user authentication (register, login, logout).
 * 
 * @version 1.0.0
 */

import express from 'express';
import { register, login, logout, getMe, checkEmail } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

/* ==========================================================================
   PUBLIC ROUTES
   ========================================================================== */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/check-email
 * @desc    Check if email exists (for forgot password)
 * @access  Public
 */
router.post('/check-email', checkEmail);

/* ==========================================================================
   PROTECTED ROUTES
   ========================================================================== */

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, getMe);

export default router;
