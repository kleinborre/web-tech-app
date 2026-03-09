/**
 * ImageToTextOnline - Authentication Controller
 * 
 * Handles user registration, login, logout, and profile retrieval.
 * Uses JWT tokens stored in HTTPOnly cookies.
 * 
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import PasswordResetToken from '../models/PasswordResetToken.model.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { uploadToFirebase, deleteFromFirebase, getFilePathFromUrl } from '../utils/firebase.js';

/* ==========================================================================
   HELPER FUNCTIONS
   ========================================================================== */

/**
 * Generate JWT token for a user.
 * 
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

/**
 * Send token response with HTTPOnly cookie.
 * 
 * @param {Object} user - User document
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);

    const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE) || 7;
    const cookieOptions = {
        expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    // Remove password from output
    const userResponse = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profilePicture: user.profilePicture || '',
        createdAt: user.createdAt
    };

    res
        .status(statusCode)
        .cookie('token', token, cookieOptions)
        .json({
            success: true,
            token,
            user: userResponse
        });
};

/* ==========================================================================
   CONTROLLER METHODS
   ========================================================================== */

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide username, email, and password'
            });
        }

        // Check password confirmation
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Passwords do not match'
            });
        }

        // Check password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters'
            });
        }

        // Check for uppercase letter
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain at least one uppercase letter'
            });
        }

        // Check for lowercase letter
        if (!/[a-z]/.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain at least one lowercase letter'
            });
        }

        // Check for number
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain at least one number'
            });
        }

        // Check for special character in password (including . and _)
        if (!/[!@#$%^&*(),.?":{}|<>_]/.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain at least one special character (. _ ! @ # $ etc.)'
            });
        }

        // Check if username already exists
        const existingUsername = await User.findOne({ username: username.toLowerCase() });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                error: 'Username already exists'
            });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                error: 'Email already registered'
            });
        }

        // Create user (password hashed by pre-save middleware)
        const user = await User.create({
            username,
            email,
            password,
            role: 'user' // Default role for registration
        });

        console.log(`[Auth] New user registered: ${user.username}`);

        // Notify all admins/superadmins about the new registration
        try {
            await Notification.notifyAdmins(
                'new_user',
                `New user registered: ${user.username} (${user.email})`
            );
        } catch (notifError) {
            console.error('[Auth] Failed to send admin notification:', notifError.message);
        }

        sendTokenResponse(user, 201, res);

    } catch (error) {
        console.error('[Auth] Registration error:', error.message);

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                error: `${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server error during registration'
        });
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check for username/email and password
        if ((!username && !email) || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide username/email and password'
            });
        }

        // Find user by username or email (include password for comparison)
        let user;
        if (username) {
            user = await User.findByUsernameWithPassword(username.toLowerCase());
        } else {
            user = await User.findByEmailWithPassword(email.toLowerCase());
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is deactivated. Please contact support.'
            });
        }

        // Check if user has a password (Google-only users won't)
        if (!user.password) {
            return res.status(401).json({
                success: false,
                error: 'This account uses Google Sign In. Please sign in with Google.'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        console.log(`[Auth] User logged in: ${user.username} (${user.role})`);

        sendTokenResponse(user, 200, res);

    } catch (error) {
        console.error('[Auth] Login error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
    try {
        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000), // 10 seconds
            httpOnly: true
        });

        console.log(`[Auth] User logged out: ${req.user?.username || 'unknown'}`);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('[Auth] Logout error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error during logout'
        });
    }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
    try {
        // User is attached by auth middleware
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Need to check password field separately since it's select: false
        const userWithPassword = await User.findById(req.user.id).select('+password');

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                profilePicture: user.profilePicture || '',
                hasPassword: !!userWithPassword?.password,
                isGoogleUser: !!user.googleId,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('[Auth] GetMe error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

/**
 * @desc    Check if email exists (for forgot password)
 * @route   POST /api/auth/check-email
 * @access  Public
 */
export const checkEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                exists: false,
                error: 'Email is required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        res.status(200).json({
            success: true,
            exists: !!user
        });

    } catch (error) {
        console.error('[Auth] CheckEmail error:', error.message);
        res.status(500).json({
            success: false,
            exists: false,
            error: 'Server error'
        });
    }
};

/* ==========================================================================
   ACCOUNT SETTINGS METHODS
   ========================================================================== */

/**
 * @desc    Update username
 * @route   PATCH /api/auth/update-username
 * @access  Private
 */
export const updateUsername = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Username is required'
            });
        }

        const trimmed = username.trim();

        if (trimmed.length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Username must be at least 3 characters'
            });
        }

        if (trimmed.length > 30) {
            return res.status(400).json({
                success: false,
                error: 'Username cannot exceed 30 characters'
            });
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
            return res.status(400).json({
                success: false,
                error: 'Username can only contain letters, numbers, underscores, and hyphens'
            });
        }

        // Check if username already taken by another user
        const existing = await User.findOne({
            username: trimmed.toLowerCase(),
            _id: { $ne: req.user.id }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Username already taken'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { username: trimmed },
            { new: true, runValidators: true }
        );

        console.log(`[Auth] Username updated for user: ${user._id}`);

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });

        // Send notification (after response to avoid delay)
        try {
            await Notification.notify(user._id, 'profile_update', `Username updated to "${user.username}"`);
        } catch (notifError) {
            console.error('[Auth] Notification error:', notifError.message);
        }

    } catch (error) {
        console.error('[Auth] UpdateUsername error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error while updating username'
        });
    }
};

/**
 * @desc    Update email
 * @route   PATCH /api/auth/update-email
 * @access  Private
 */
export const updateEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || email.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        const trimmed = email.trim().toLowerCase();

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address'
            });
        }

        // Check if email already taken by another user
        const existing = await User.findOne({
            email: trimmed,
            _id: { $ne: req.user.id }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Email already registered to another account'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { email: trimmed },
            { new: true, runValidators: true }
        );

        console.log(`[Auth] Email updated for user: ${user._id}`);

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });

        // Send notification (after response)
        try {
            await Notification.notify(user._id, 'profile_update', `Email updated to "${user.email}"`);
        } catch (notifError) {
            console.error('[Auth] Notification error:', notifError.message);
        }

    } catch (error) {
        console.error('[Auth] UpdateEmail error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error while updating email'
        });
    }
};

/**
 * @desc    Update password
 * @route   PATCH /api/auth/update-password
 * @access  Private
 */
export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current password and new password are required'
            });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                error: 'New passwords do not match'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 6 characters'
            });
        }

        // Check for special character
        if (!/[!@#$%^&*(),.?":{}<>]/.test(newPassword)) {
            return res.status(400).json({
                success: false,
                error: 'New password must contain at least one special character'
            });
        }

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Set new password (pre-save hook will hash it)
        user.password = newPassword;
        await user.save();

        console.log(`[Auth] Password updated for user: ${user._id}`);

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });

        // Send notification (after response)
        try {
            await Notification.notify(user._id, 'profile_update', 'Your password was updated successfully');
        } catch (notifError) {
            console.error('[Auth] Notification error:', notifError.message);
        }

    } catch (error) {
        console.error('[Auth] UpdatePassword error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error while updating password'
        });
    }
};

/**
 * @desc    Verify current password (for real-time validation)
 * @route   POST /api/auth/verify-password
 * @access  Private
 */
export const verifyPassword = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                error: 'Password is required'
            });
        }

        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const isMatch = await user.comparePassword(password);

        res.status(200).json({
            success: true,
            valid: isMatch
        });

    } catch (error) {
        console.error('[Auth] VerifyPassword error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error while verifying password'
        });
    }
};

/* ==========================================================================
   PASSWORD RESET (FORGOT PASSWORD)
   ========================================================================== */

/**
 * @desc    Send password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Return success anyway to prevent email enumeration
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a reset link has been sent.'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                error: 'This account has been deactivated. Contact an administrator.'
            });
        }

        // Generate token
        const plainToken = await PasswordResetToken.createToken(user._id);

        // Build reset URL (use Origin header for proper domain on Vercel/browser, fallback for Postman/API)
        const origin = req.get('origin') || req.get('referer')?.replace(/\/+$/, '') || `${req.protocol}://${req.get('host')}`;
        const baseUrl = origin.replace(/\/+$/, '');
        const resetUrl = `${baseUrl}/auth/update-password?token=${plainToken}&email=${encodeURIComponent(user.email)}`;

        // Send email
        await sendPasswordResetEmail(user.email, resetUrl, user.username);

        console.log(`[Auth] Password reset email sent to: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Password reset link has been sent to your email.'
        });

    } catch (error) {
        console.error('[Auth] ForgotPassword error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error while processing password reset request'
        });
    }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
    try {
        const { token, email, password } = req.body;

        if (!token || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Token, email, and new password are required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters'
            });
        }
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain at least one uppercase letter'
            });
        }
        if (!/[a-z]/.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain at least one lowercase letter'
            });
        }
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain at least one number'
            });
        }
        if (!/[!@#$%^&*(),.?":{}|<>_]/.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain at least one special character (. _ ! @ # $ etc.)'
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token'
            });
        }

        // Verify token
        const tokenDoc = await PasswordResetToken.verifyToken(token, user._id);

        if (!tokenDoc) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token. Please request a new one.'
            });
        }

        // Update password
        user.password = password;
        await user.save();

        // Delete the used token
        await PasswordResetToken.deleteMany({ userId: user._id });

        console.log(`[Auth] Password reset successful for user: ${user._id}`);

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. You can now log in.'
        });

        // Send notification (after response)
        try {
            await Notification.notify(user._id, 'profile_update', 'Your password was reset successfully via email link');
        } catch (notifError) {
            console.error('[Auth] Notification error:', notifError.message);
        }

    } catch (error) {
        console.error('[Auth] ResetPassword error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error while resetting password'
        });
    }
};

/* ==========================================================================
   PROFILE PICTURE
   ========================================================================== */

/**
 * @desc    Upload or update profile picture
 * @route   POST /api/auth/profile-picture
 * @access  Private
 */
export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file provided'
            });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP'
            });
        }

        // Validate file size (2MB max)
        if (req.file.size > 2 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                error: 'File size exceeds 2MB limit'
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Delete old profile picture from Firebase if exists
        if (user.profilePicture) {
            const oldPath = getFilePathFromUrl(user.profilePicture);
            if (oldPath) {
                await deleteFromFirebase(oldPath);
            }
        }

        // Upload new picture to Firebase
        const ext = req.file.originalname.split('.').pop().toLowerCase();
        const filePath = `profile-pictures/${user._id}/${Date.now()}.${ext}`;
        const publicUrl = await uploadToFirebase(req.file.buffer, filePath, req.file.mimetype);

        // Update user record
        user.profilePicture = publicUrl;
        await user.save();

        console.log(`[Auth] Profile picture updated for user: ${user.username}`);

        res.status(200).json({
            success: true,
            profilePicture: publicUrl
        });

    } catch (error) {
        console.error('[Auth] UploadProfilePicture error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error while uploading profile picture'
        });
    }
};

/**
 * @desc    Delete profile picture
 * @route   DELETE /api/auth/profile-picture
 * @access  Private
 */
export const deleteProfilePicture = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (!user.profilePicture) {
            return res.status(400).json({
                success: false,
                error: 'No profile picture to delete'
            });
        }

        // Delete from Firebase
        const filePath = getFilePathFromUrl(user.profilePicture);
        if (filePath) {
            await deleteFromFirebase(filePath);
        }

        // Clear from user record
        user.profilePicture = '';
        await user.save();

        console.log(`[Auth] Profile picture deleted for user: ${user.username}`);

        res.status(200).json({
            success: true,
            message: 'Profile picture removed'
        });

    } catch (error) {
        console.error('[Auth] DeleteProfilePicture error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error while deleting profile picture'
        });
    }
};
