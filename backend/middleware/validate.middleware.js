/**
 * ImageToTextOnline - Input Validation Middleware
 * 
 * Centralised express-validator rules for every API endpoint.
 * Import the relevant rule set and `handleValidationErrors` into routes.
 *
 * @version 1.0.0
 */

import { body, param, validationResult } from 'express-validator';

/* ==========================================================================
   VALIDATION ERROR HANDLER
   ========================================================================== */

/**
 * Middleware that checks validation results and returns 400 with
 * structured error messages when validation fails.
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: errors.array().map(e => e.msg).join(', '),
            errors: errors.array().map(e => ({
                field: e.path,
                message: e.msg
            }))
        });
    }
    next();
};

/* ==========================================================================
   AUTH VALIDATION RULES
   ========================================================================== */

/**
 * POST /api/auth/register
 */
export const registerRules = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>_]/).withMessage('Password must contain at least one special character'),
    body('confirmPassword')
        .notEmpty().withMessage('Password confirmation is required')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
];

/**
 * POST /api/auth/login
 * Accepts either username or email for login.
 */
export const loginRules = [
    body().custom((value, { req }) => {
        if (!req.body.email && !req.body.username) {
            throw new Error('Email or username is required');
        }
        return true;
    }),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Please provide a valid email address'),
    body('password')
        .notEmpty().withMessage('Password is required')
];

/**
 * POST /api/auth/check-email
 */
export const checkEmailRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
];

/**
 * POST /api/auth/forgot-password
 */
export const forgotPasswordRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
];

/**
 * POST /api/auth/reset-password
 */
export const resetPasswordRules = [
    body('token')
        .trim()
        .notEmpty().withMessage('Reset token is required'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>_]/).withMessage('Password must contain at least one special character')
];

/* ==========================================================================
   PROFILE UPDATE VALIDATION RULES
   ========================================================================== */

/**
 * PATCH /api/auth/update-username
 */
export const updateUsernameRules = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores')
];

/**
 * PATCH /api/auth/update-email
 */
export const updateEmailRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail()
];

/**
 * PATCH /api/auth/update-password
 */
export const updatePasswordRules = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>_]/).withMessage('Password must contain at least one special character')
];

/* ==========================================================================
   PARAM VALIDATION RULES
   ========================================================================== */

/**
 * Validates that :id route parameter is a valid MongoDB ObjectId.
 */
export const mongoIdParam = [
    param('id')
        .isMongoId().withMessage('Invalid ID format')
];

/* ==========================================================================
   TRANSLATION VALIDATION RULES
   ========================================================================== */

/**
 * POST /api/translate
 */
export const translateRules = [
    body('text')
        .trim()
        .notEmpty().withMessage('Text to translate is required')
        .isLength({ max: 5000 }).withMessage('Text cannot exceed 5000 characters'),
    body('sourceLang')
        .trim()
        .notEmpty().withMessage('Source language is required')
        .isLength({ min: 2, max: 10 }).withMessage('Invalid language code'),
    body('targetLang')
        .trim()
        .notEmpty().withMessage('Target language is required')
        .isLength({ min: 2, max: 10 }).withMessage('Invalid language code')
];

/**
 * POST /api/translations (save)
 */
export const saveTranslationRules = [
    body('originalText')
        .trim()
        .notEmpty().withMessage('Original text is required')
        .isLength({ max: 5000 }).withMessage('Original text cannot exceed 5000 characters'),
    body('translatedText')
        .trim()
        .notEmpty().withMessage('Translated text is required')
        .isLength({ max: 10000 }).withMessage('Translated text cannot exceed 10000 characters'),
    body('sourceLang')
        .trim()
        .notEmpty().withMessage('Source language is required'),
    body('targetLang')
        .trim()
        .notEmpty().withMessage('Target language is required')
];

/**
 * PATCH /api/translations/:id
 */
export const updateTranslationRules = [
    body('translatedText')
        .trim()
        .notEmpty().withMessage('Translated text is required')
        .isLength({ max: 10000 }).withMessage('Translated text cannot exceed 10000 characters')
];
