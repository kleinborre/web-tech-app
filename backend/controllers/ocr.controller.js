/**
 * ImageToTextOnline - OCR Controller
 * 
 * Handles OCR conversion requests and responses.
 * Processes uploaded images and returns extracted text.
 * 
 * @version 1.0.0
 */

import { processMultipleImages } from '../utils/ocrProcessor.js';

/* ==========================================================================
   OCR CONTROLLER
   ========================================================================== */

/**
 * Converts uploaded images to text using OCR.
 * 
 * @param {Object} req - Express request object with files array
 * @param {Object} res - Express response object
 */
export const convertImages = async (req, res) => {
    try {
        const files = req.files;
        console.log(`[Controller] Received ${files.length} file(s) for OCR processing`);

        // Process all uploaded images
        const results = await processMultipleImages(files);

        // Calculate summary statistics
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        const totalProcessingTime = results.reduce((sum, r) => sum + (r.processingTime || 0), 0);

        // Return successful response
        res.status(200).json({
            success: true,
            message: `Processed ${successCount} of ${files.length} file(s) successfully`,
            summary: {
                total: files.length,
                successful: successCount,
                failed: failCount,
                totalProcessingTime: `${totalProcessingTime}ms`
            },
            results: results.map(r => ({
                filename: r.filename,
                success: r.success,
                text: r.text,
                confidence: r.confidence,
                error: r.error || null
            }))
        });

    } catch (error) {
        console.error('[Controller] OCR processing error:', error);

        res.status(500).json({
            success: false,
            error: 'An error occurred while processing the images',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export default {
    convertImages
};
