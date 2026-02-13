/**
 * ImageToTextOnline - OCR Processor Utility (Optimized)
 * 
 * High-performance Tesseract.js OCR using persistent worker pool.
 * Handles text extraction from image buffers with minimal latency.
 * Supports PDF text extraction (via unpdf) and HEIC conversion for OCR.
 * 
 * @version 2.4.0 - Replaced pdf-to-img/pdf-parse with unpdf (serverless compatible)
 */

import { createWorker, createScheduler } from 'tesseract.js';
import { extractText } from 'unpdf';
import convert from 'heic-convert';

/* ==========================================================================
   WORKER POOL CONFIGURATION
   ========================================================================== */

// Use fewer workers in serverless to reduce cold start time and memory
const WORKER_COUNT = process.env.VERCEL ? 1 : 2;

// Scheduler for managing worker pool
let scheduler = null;
let isInitialized = false;
let initPromise = null;

/**
 * Initialize the Tesseract worker pool.
 * Workers are pre-loaded with the English language model.
 * NOTE: In serverless (Vercel), workers initialize on first OCR request
 * instead of module load to avoid cold start timeouts.
 */
const initializeWorkers = async () => {
    if (isInitialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        console.log(`[OCR] Initializing ${WORKER_COUNT} Tesseract workers...`);
        const startTime = Date.now();

        scheduler = createScheduler();

        // Create and initialize workers in parallel
        const workerPromises = [];
        for (let i = 0; i < WORKER_COUNT; i++) {
            workerPromises.push(
                (async () => {
                    const worker = await createWorker('eng', 1, {
                        // Optimize for speed
                        cacheMethod: 'readOnly',
                        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
                    });

                    // Set parameters for faster recognition
                    await worker.setParameters({
                        tessedit_pageseg_mode: '3', // Fully automatic page segmentation
                        tessedit_ocr_engine_mode: '2', // Legacy + LSTM (balanced speed/accuracy)
                    });

                    scheduler.addWorker(worker);
                    console.log(`[OCR] Worker ${i + 1}/${WORKER_COUNT} ready`);
                })()
            );
        }

        await Promise.all(workerPromises);

        const initTime = Date.now() - startTime;
        console.log(`[OCR] All workers initialized in ${initTime}ms`);
        isInitialized = true;
    })();

    return initPromise;
};

// Only auto-initialize workers in non-serverless environments (local dev)
if (!process.env.VERCEL) {
    initializeWorkers().catch(err => {
        console.error('[OCR] Failed to initialize workers:', err.message);
    });
}

/* ==========================================================================
   PDF TEXT EXTRACTION
   ========================================================================== */

/**
 * Extracts text directly from a PDF buffer using unpdf.
 * Uses a bundled serverless-compatible PDF.js — no native canvas bindings needed.
 * 
 * @param {Buffer} pdfBuffer - The PDF file data as a buffer
 * @param {string} filename - Original filename for logging
 * @returns {Promise<Object>} Object containing extracted text and metadata
 */
const extractTextFromPdf = async (pdfBuffer, filename) => {
    const startTime = Date.now();

    try {
        console.log(`[OCR] Extracting text from PDF: ${filename}`);

        // Convert Buffer to Uint8Array for unpdf compatibility
        const uint8Array = new Uint8Array(pdfBuffer);

        // Extract text from all pages, merged into a single string
        const { totalPages, text } = await extractText(uint8Array, { mergePages: true });

        const processingTime = Date.now() - startTime;
        const extractedText = typeof text === 'string' ? text.trim() : (Array.isArray(text) ? text.join('\n').trim() : '');

        if (extractedText.length > 0) {
            console.log(`[OCR] PDF text extraction complete: ${filename} (${processingTime}ms, ${totalPages} pages)`);

            return {
                success: true,
                text: extractedText,
                confidence: 100, // Direct text extraction = 100% accuracy
                processingTime: processingTime,
                pageCount: totalPages
            };
        } else {
            // PDF has no embedded text (scanned/image-only PDF)
            console.log(`[OCR] PDF has no embedded text, likely a scanned document: ${filename}`);
            return {
                success: false,
                text: '',
                error: 'This PDF appears to be a scanned document with no selectable text. Please convert it to an image format (JPG, PNG) first, then upload the image for OCR processing.',
                processingTime: processingTime,
                pageCount: totalPages
            };
        }

    } catch (pdfError) {
        console.error(`[OCR] PDF extraction error:`, pdfError.message);
        return {
            success: false,
            text: '',
            error: `PDF text extraction failed: ${pdfError.message}`,
            processingTime: Date.now() - startTime
        };
    }
};

/* ==========================================================================
   OCR PROCESSOR
   ========================================================================== */

/**
 * Extracts text from an image buffer using Tesseract.js OCR.
 * If the file is a PDF, extracts embedded text directly using unpdf.
 * Uses pre-initialized worker pool for maximum speed.
 * 
 * @param {Buffer} imageBuffer - The image/PDF data as a buffer
 * @param {string} filename - Original filename for logging
 * @returns {Promise<Object>} Object containing extracted text and metadata
 */
export const extractTextFromImage = async (imageBuffer, filename) => {
    try {
        console.log(`[OCR] Processing: ${filename}`);
        const startTime = Date.now();

        // Check if file is PDF — use direct text extraction (no OCR needed)
        const isPdf = filename.toLowerCase().endsWith('.pdf') ||
            (imageBuffer[0] === 0x25 && imageBuffer[1] === 0x50 &&
                imageBuffer[2] === 0x44 && imageBuffer[3] === 0x46); // %PDF magic bytes

        if (isPdf) {
            return await extractTextFromPdf(imageBuffer, filename);
        }

        // Ensure Tesseract workers are initialized (for image OCR only)
        await initializeWorkers();

        // Check if file is HEIC and convert to JPEG
        const isHeic = filename.toLowerCase().endsWith('.heic') || filename.toLowerCase().endsWith('.heif');
        let processBuffer = imageBuffer;

        if (isHeic) {
            console.log(`[OCR] Detected HEIC file, converting to JPEG...`);
            try {
                processBuffer = await convert({
                    buffer: imageBuffer,
                    format: 'JPEG',
                    quality: 0.9
                });
                console.log(`[OCR] HEIC conversion complete`);
            } catch (heicError) {
                console.error(`[OCR] HEIC conversion error:`, heicError.message);
                return {
                    success: false,
                    text: '',
                    error: `HEIC conversion failed: ${heicError.message}`,
                    processingTime: Date.now() - startTime
                };
            }
        }

        // Regular image processing (includes converted HEIC)
        const result = await scheduler.addJob('recognize', processBuffer);
        const processingTime = Date.now() - startTime;
        console.log(`[OCR] Completed: ${filename} (${processingTime}ms)`);

        return {
            success: true,
            text: result.data.text.trim(),
            confidence: result.data.confidence,
            processingTime: processingTime,
            pageCount: 1
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
 * Processes multiple images concurrently using worker pool.
 * 
 * @param {Array} files - Array of file objects with buffer and originalname
 * @returns {Promise<Array>} Array of OCR results
 */
export const processMultipleImages = async (files) => {
    console.log(`[OCR] Starting batch processing of ${files.length} file(s)`);

    // Process all files concurrently - scheduler handles distribution
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

/**
 * Gracefully terminate all workers (for cleanup).
 */
export const terminateWorkers = async () => {
    if (scheduler) {
        await scheduler.terminate();
        scheduler = null;
        isInitialized = false;
        initPromise = null;
        console.log('[OCR] Workers terminated');
    }
};

export default {
    extractTextFromImage,
    processMultipleImages,
    terminateWorkers
};
