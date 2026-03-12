/**
 * ImageToTextOnline - Translation Routes
 * 
 * Routes for text translation (MyMemory API) and saved translation CRUD.
 * 
 * @version 1.0.0
 */

import express from 'express';
import {
    translateText,
    getLanguages,
    saveTranslation,
    getTranslations,
    getTranslation,
    updateTranslation,
    deleteTranslation,
    bulkDeleteTranslations,
    clearTranslations
} from '../controllers/translation.controller.js';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';
import {
    translateRules,
    saveTranslationRules,
    updateTranslationRules,
    mongoIdParam,
    handleValidationErrors
} from '../middleware/validate.middleware.js';

const router = express.Router();

/* ==========================================================================
   PUBLIC / OPTIONAL AUTH ROUTES
   ========================================================================== */

/**
 * @route   GET /api/translate/languages
 * @desc    Get list of supported languages
 */
router.get('/translate/languages', getLanguages);

/**
 * @route   POST /api/translate
 * @desc    Translate text using MyMemory API (guests + auth users)
 */
router.post('/translate', optionalAuth, translateRules, handleValidationErrors, translateText);

/* ==========================================================================
   AUTHENTICATED CRUD ROUTES
   ========================================================================== */

// All routes below require authentication
router.use('/translations', protect);

/**
 * @route   GET /api/translations
 * @desc    Get user's saved translations (paginated)
 */
router.get('/translations', getTranslations);

/**
 * @route   POST /api/translations
 * @desc    Save a translation
 */
router.post('/translations', saveTranslationRules, handleValidationErrors, saveTranslation);

/**
 * @route   POST /api/translations/bulk-delete
 * @desc    Bulk delete translations
 */
router.post('/translations/bulk-delete', bulkDeleteTranslations);

/**
 * @route   DELETE /api/translations
 * @desc    Clear all user translations
 */
router.delete('/translations', clearTranslations);

/**
 * @route   GET /api/translations/:id
 * @desc    Get single translation
 */
router.get('/translations/:id', mongoIdParam, handleValidationErrors, getTranslation);

/**
 * @route   PATCH /api/translations/:id
 * @desc    Update a translation
 */
router.patch('/translations/:id', mongoIdParam, updateTranslationRules, handleValidationErrors, updateTranslation);

/**
 * @route   DELETE /api/translations/:id
 * @desc    Delete a translation
 */
router.delete('/translations/:id', mongoIdParam, handleValidationErrors, deleteTranslation);

export default router;
