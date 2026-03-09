/**
 * ImageToTextOnline - Authentication Routes
 * 
 * Routes for user authentication (register, login, logout, account settings).
 * 
 * @version 1.1.0
 */

import express from 'express';
import multer from 'multer';
import { register, login, logout, getMe, checkEmail, updateUsername, updateEmail, updatePassword, verifyPassword, forgotPassword, resetPassword, uploadProfilePicture, deleteProfilePicture } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

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

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token from email
 * @access  Public
 */
router.post('/reset-password', resetPassword);

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
router.patch('/update-username', protect, updateUsername);

/**
 * @route   PATCH /api/auth/update-email
 * @desc    Update email
 * @access  Private
 */
router.patch('/update-email', protect, updateEmail);

/**
 * @route   PATCH /api/auth/update-password
 * @desc    Update password
 * @access  Private
 */
router.patch('/update-password', protect, updatePassword);

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

export default router;
