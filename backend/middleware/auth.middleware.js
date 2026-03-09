/**
 * ImageToTextOnline - Authentication Middleware
 * 
 * Verifies JWT tokens and protects routes.
 * 
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

/**
 * Protect routes - verify JWT token.
 * Extracts token from cookie or Authorization header.
 * Attaches user to req.user if valid.
 */
export const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in cookie first
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        // Fallback to Authorization header
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Make sure token exists
        if (!token || token === 'none') {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Check if user is still active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    error: 'Account has been deactivated'
                });
            }

            // Attach user to request
            req.user = user;
            next();

        } catch (error) {
            console.error('[Auth Middleware] Token verification failed:', error.message);

            // Distinguish token error types for clearer client feedback
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expired. Please log in again.'
                });
            }

            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token. Please log in again.'
                });
            }

            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }

    } catch (error) {
        console.error('[Auth Middleware] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error in authentication'
        });
    }
};

/**
 * Optional auth - attaches user if token exists, but doesn't block.
 * Useful for routes that behave differently for logged-in users.
 */
export const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token && token !== 'none') {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);
                if (user && user.isActive) {
                    req.user = user;
                }
            } catch (error) {
                // Token invalid, but don't block - just continue without user
            }
        }

        next();

    } catch (error) {
        next();
    }
};
