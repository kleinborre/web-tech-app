/**
 * ImageToTextOnline - OCR Routes
 * 
 * Defines API endpoints for OCR operations.
 * 
 * @version 1.0.0
 */

import express from 'express';
import { convertImages } from '../controllers/ocr.controller.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';
import { validateFiles } from '../middleware/validateFile.middleware.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/* ==========================================================================
   OCR ROUTES
   ========================================================================== */

/**
 * POST /api/ocr/convert
 * 
 * Converts uploaded images to text using Tesseract.js OCR.
 * Uses optionalAuth to log conversions for authenticated users.
 * 
 * Request: multipart/form-data with 'images' field (max 5 files)
 * Response: JSON array of { filename, text, success }
 */
router.post('/convert', optionalAuth, uploadMiddleware, validateFiles, convertImages);

export default router;
