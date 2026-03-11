/**
 * ImageToTextOnline - Authentication Routes
 * 
 * Routes for user authentication (register, login, logout, account settings).
 * 
 * @version 2.0.0
 */

import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import passport from '../config/passport.js';
import { register, login, logout, getMe, checkEmail, updateUsername, updateEmail, updatePassword, verifyPassword, forgotPassword, resetPassword, uploadProfilePicture, deleteProfilePicture } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authLimiter, strictAuthLimiter } from '../middleware/rateLimiter.middleware.js';
import {
    registerRules,
    loginRules,
    checkEmailRules,
    forgotPasswordRules,
    resetPasswordRules,
    updateUsernameRules,
    updateEmailRules,
    updatePasswordRules,
    handleValidationErrors
} from '../middleware/validate.middleware.js';

const router = express.Router();

// Multer config for profile picture (memory storage, 2MB limit)
const profileUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP'), false);
        }
    }
});

/* ==========================================================================
   PUBLIC ROUTES
   ========================================================================== */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, registerRules, handleValidationErrors, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', strictAuthLimiter, loginRules, handleValidationErrors, login);

/**
 * @route   POST /api/auth/check-email
 * @desc    Check if email exists (for forgot password)
 * @access  Public
 */
router.post('/check-email', checkEmailRules, handleValidationErrors, checkEmail);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', authLimiter, forgotPasswordRules, handleValidationErrors, forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token from email
 * @access  Public
 */
router.post('/reset-password', authLimiter, resetPasswordRules, handleValidationErrors, resetPassword);

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

/**
 * @route   PATCH /api/auth/update-username
 * @desc    Update username
 * @access  Private
 */
router.patch('/update-username', protect, updateUsernameRules, handleValidationErrors, updateUsername);

/**
 * @route   PATCH /api/auth/update-email
 * @desc    Update email
 * @access  Private
 */
router.patch('/update-email', protect, updateEmailRules, handleValidationErrors, updateEmail);

/**
 * @route   PATCH /api/auth/update-password
 * @desc    Update password
 * @access  Private
 */
router.patch('/update-password', protect, updatePasswordRules, handleValidationErrors, updatePassword);

/**
 * @route   POST /api/auth/verify-password
 * @desc    Verify current password (for real-time validation)
 * @access  Private
 */
router.post('/verify-password', protect, verifyPassword);

/**
 * @route   POST /api/auth/profile-picture
 * @desc    Upload or update profile picture
 * @access  Private
 */
router.post('/profile-picture', protect, profileUpload.single('profilePicture'), uploadProfilePicture);

/**
 * @route   DELETE /api/auth/profile-picture
 * @desc    Delete profile picture
 * @access  Private
 */
router.delete('/profile-picture', protect, deleteProfilePicture);

/* ==========================================================================
   GOOGLE OAUTH ROUTES
   ========================================================================== */

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth consent flow
 * @access  Public
 */
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
}));

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback - create JWT and redirect
 * @access  Public
 */
router.get('/google/callback',
    (req, res, next) => {
        passport.authenticate('google', { session: false }, (err, user, info) => {
            if (err) {
                console.error('[Auth] Google OAuth error:', err.message);
                return res.redirect('/auth/login?error=oauth_failed');
            }

            if (!user) {
                console.error('[Auth] Google OAuth: No user returned', info);
                return res.redirect('/auth/login?error=oauth_failed');
            }

            try {
                // Generate JWT token
                const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRE || '7d'
                });

                // Set HTTPOnly cookie (sameSite must be 'lax' for OAuth redirects)
                const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE) || 7;
                res.cookie('token', token, {
                    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                });

                console.log(`[Auth] Google OAuth login: ${user.username} (${user.email})`);

                // Redirect to dashboard after OAuth (ViewManager handles role-based content)
                res.redirect('/dashboard?login=success');

            } catch (error) {
                console.error('[Auth] Google callback error:', error.message);
                res.redirect('/auth/login?error=oauth_failed');
            }
        })(req, res, next);
    }
);

export default router;
