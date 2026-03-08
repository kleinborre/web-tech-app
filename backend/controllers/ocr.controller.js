/**
 * ImageToTextOnline - OCR Controller
 * 
 * Handles OCR conversion requests and responses.
 * Processes uploaded images and returns extracted text.
 * 
 * @version 1.0.0
 */

import { processMultipleImages } from '../utils/ocrProcessor.js';
import ConversionLog from '../models/ConversionLog.model.js';
import Notification from '../models/Notification.model.js';

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

        // Save to ConversionLog if user is authenticated
        if (req.user) {
            try {
                const savePromises = results
                    .filter(r => r.success)
                    .map(r => ConversionLog.create({
                        userId: req.user._id,
                        originalFileName: r.filename,
                        extractedText: r.text || ''
                    }));
                await Promise.all(savePromises);
                console.log(`[OCR] Saved ${savePromises.length} conversion(s) for user ${req.user.username}`);

                // Send notification for successful conversion(s)
                try {
                    const fileNames = results.filter(r => r.success).map(r => r.filename);
                    const msg = fileNames.length === 1
                        ? `Successfully converted "${fileNames[0]}"`
                        : `Successfully converted ${fileNames.length} file(s)`;
                    await Notification.notify(req.user._id, 'conversion', msg);
                } catch (notifError) {
                    console.error('[OCR] Failed to send notification:', notifError.message);
                }
            } catch (logError) {
                console.error('[OCR] Failed to save conversion log:', logError.message);
            }
        }

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
