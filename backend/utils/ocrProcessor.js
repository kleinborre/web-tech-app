/**
 * ImageToTextOnline - OCR Processor Utility
 * 
 * Provides Tesseract.js OCR processing functionality.
 * Handles text extraction from image buffers.
 * 
 * @version 1.0.0
 */

import Tesseract from 'tesseract.js';

/* ==========================================================================
   OCR PROCESSOR
   ========================================================================== */

/**
 * Extracts text from an image buffer using Tesseract.js OCR.
 * 
 * @param {Buffer} imageBuffer - The image data as a buffer
 * @param {string} filename - Original filename for logging
 * @returns {Promise<Object>} Object containing extracted text and metadata
 */
export const extractTextFromImage = async (imageBuffer, filename) => {
    try {
        console.log(`[OCR] Processing: ${filename}`);
        const startTime = Date.now();

        // Perform OCR using Tesseract.js
        const result = await Tesseract.recognize(
            imageBuffer,
            'eng', // Language: English (can be extended to support multiple languages)
            {
                logger: (info) => {
                    // Log progress in development mode
                    if (process.env.NODE_ENV === 'development' && info.status === 'recognizing text') {
                        const progress = Math.round(info.progress * 100);
                        if (progress % 25 === 0) {
                            console.log(`[OCR] ${filename}: ${progress}%`);
                        }
                    }
                }
            }
        );

        const processingTime = Date.now() - startTime;
        console.log(`[OCR] Completed: ${filename} (${processingTime}ms)`);

        return {
            success: true,
            text: result.data.text.trim(),
            confidence: result.data.confidence,
            processingTime: processingTime
        };

    } catch (error) {
        console.error(`[OCR] Error processing ${filename}:`, error.message);

        return {
            success: false,
            text: '',
            error: error.message,
            processingTime: 0
        };
    }
};

/**
 * Processes multiple images concurrently.
 * 
 * @param {Array} files - Array of file objects with buffer and originalname
 * @returns {Promise<Array>} Array of OCR results
 */
export const processMultipleImages = async (files) => {
    console.log(`[OCR] Starting batch processing of ${files.length} file(s)`);

    // Process all files concurrently for better performance
    const results = await Promise.all(
        files.map(async (file) => {
            const ocrResult = await extractTextFromImage(file.buffer, file.originalname);

            return {
                filename: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                ...ocrResult
            };
        })
    );

    console.log(`[OCR] Batch processing complete`);
    return results;
};

export default {
    extractTextFromImage,
    processMultipleImages
};
