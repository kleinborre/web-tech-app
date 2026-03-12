/**
 * ImageToTextOnline - OCR Controller
 * 
 * Handles OCR conversion requests and responses.
 * Processes uploaded images, compresses them via sharp, uploads
 * to Firebase Storage, and returns extracted text.
 * 
 * @version 2.0.0
 */

import sharp from 'sharp';
import { processMultipleImages } from '../utils/ocrProcessor.js';
import { uploadToFirebase } from '../utils/firebase.js';
import ConversionLog from '../models/ConversionLog.model.js';
import Notification from '../models/Notification.model.js';

/* ==========================================================================
   IMAGE COMPRESSION UTILITY
   ========================================================================== */

/**
 * Compresses an image buffer using sharp.
 * Converts to JPEG at 60% quality, max 800px width.
 * @param {Buffer} buffer - Original image buffer.
 * @param {string} mimetype - Original file mimetype.
 * @returns {Promise<{buffer: Buffer, mimetype: string}|null>}
 */
const compressImage = async (buffer, mimetype) => {
    try {
        // Skip compression for PDFs - they are not image files
        if (mimetype === 'application/pdf') {
            return null;
        }

        const compressed = await sharp(buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 60 })
            .toBuffer();

        return { buffer: compressed, mimetype: 'image/jpeg' };
    } catch (error) {
        console.error('[OCR] Image compression error:', error.message);
        return null;
    }
};

/* ==========================================================================
   OCR CONTROLLER
   ========================================================================== */

/**
 * Converts uploaded images to text using OCR.
 * For authenticated users: compresses images, uploads to Firebase,
 * and stores the URL alongside the conversion log.
 * 
 * @param {Object} req - Express request object with files array
 * @param {Object} res - Express response object
 */
export const convertImages = async (req, res, next) => {
    try {
        const files = req.files;
        console.log(`[Controller] Received ${files.length} file(s) for OCR processing`);

        // Process all uploaded images
        const results = await processMultipleImages(files);

        // Calculate summary statistics
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        const totalProcessingTime = results.reduce((sum, r) => sum + (r.processingTime || 0), 0);

        // Save to ConversionLog for ALL users (auth + guest)
        // Guest conversions use userId: null for accurate KPI tracking
        try {
            const savePromises = results.map(async (r, index) => {
                const file = files[index];
                let imageUrl = '';

                // Compress and upload image to Firebase for ALL users (auth + guest)
                if (r.success) {
                    try {
                        const compressed = await compressImage(file.buffer, file.mimetype);
                        if (compressed) {
                            const timestamp = Date.now();
                            const userFolder = req.user ? req.user._id : 'guest';
                            const filePath = `conversions/${userFolder}/${timestamp}_${index}.jpg`;
                            imageUrl = await uploadToFirebase(
                                compressed.buffer,
                                filePath,
                                compressed.mimetype
                            );
                            console.log(`[OCR] Uploaded compressed image to Firebase: ${filePath}`);
                        }
                    } catch (uploadError) {
                        console.error('[OCR] Firebase upload error:', uploadError.message);
                    }
                }

                return ConversionLog.create({
                    userId: req.user ? req.user._id : null,
                    originalFileName: r.filename,
                    extractedText: r.text || '',
                    confidence: r.confidence || 0,
                    processingTime: r.processingTime || 0,
                    mimeType: file.mimetype || '',
                    fileSize: file.size || 0,
                    success: r.success,
                    errorMessage: r.error || '',
                    imageUrl
                });
            });

            const savedLogs = await Promise.all(savePromises);
            const successLogs = savedLogs.filter((_, i) => results[i].success);
            console.log(`[OCR] Saved ${savedLogs.length} conversion(s) (${req.user ? req.user.username : 'guest'})`);

            // Send notification for authenticated users only
            if (req.user && successLogs.length > 0) {
                try {
                    const logIds = successLogs.map(log => log._id);
                    const fileNames = results.filter(r => r.success).map(r => r.filename);
                    const msg = fileNames.length === 1
                        ? `Successfully converted "${fileNames[0]}"`
                        : `Successfully converted ${fileNames.length} file(s)`;
                    await Notification.notify(req.user._id, 'conversion', msg, logIds);
                } catch (notifError) {
                    console.error('[OCR] Failed to send notification:', notifError.message);
                }
            }
        } catch (logError) {
            console.error('[OCR] Failed to save conversion log:', logError.message);
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
        console.error('[Controller] OCR processing error:', error.message);
        next(error);
    }
};

export default {
    convertImages
};
