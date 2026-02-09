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

const router = express.Router();

/* ==========================================================================
   OCR ROUTES
   ========================================================================== */

/**
 * POST /api/ocr/convert
 * 
 * Converts uploaded images to text using Tesseract.js OCR.
 * 
 * Request: multipart/form-data with 'images' field (max 5 files)
 * Response: JSON array of { filename, text, success }
 */
router.post('/convert', uploadMiddleware, validateFiles, convertImages);

export default router;
