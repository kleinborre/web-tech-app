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

        // Check for special character in password
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain at least one special character'
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

    } catch (error) {
        console.error('[Auth] GetMe error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
