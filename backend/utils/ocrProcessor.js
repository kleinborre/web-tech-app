/**
 * ImageToTextOnline - OCR Processor Utility (Optimized)
 * 
 * High-performance Tesseract.js OCR using persistent worker pool.
 * Handles text extraction from image buffers with minimal latency.
 * 
 * @version 2.0.0 - Optimized with worker pool
 */

import { createWorker, createScheduler } from 'tesseract.js';

/* ==========================================================================
   WORKER POOL CONFIGURATION
   ========================================================================== */

// Number of concurrent workers (adjust based on server CPU cores)
const WORKER_COUNT = 2;

// Scheduler for managing worker pool
let scheduler = null;
let isInitialized = false;
let initPromise = null;

/**
 * Initialize the Tesseract worker pool.
 * Workers are pre-loaded with the English language model.
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

// Initialize workers on module load
initializeWorkers().catch(err => {
    console.error('[OCR] Failed to initialize workers:', err.message);
});

/* ==========================================================================
   OCR PROCESSOR
   ========================================================================== */

/**
 * Extracts text from an image buffer using Tesseract.js OCR.
 * Uses pre-initialized worker pool for maximum speed.
 * 
 * @param {Buffer} imageBuffer - The image data as a buffer
 * @param {string} filename - Original filename for logging
 * @returns {Promise<Object>} Object containing extracted text and metadata
 */
export const extractTextFromImage = async (imageBuffer, filename) => {
    try {
        // Ensure workers are initialized
        await initializeWorkers();

        console.log(`[OCR] Processing: ${filename}`);
        const startTime = Date.now();

        // Use scheduler to process with available worker
        const result = await scheduler.addJob('recognize', imageBuffer);

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
 * Processes multiple images concurrently using worker pool.
 * 
 * @param {Array} files - Array of file objects with buffer and originalname
 * @returns {Promise<Array>} Array of OCR results
 */
export const processMultipleImages = async (files) => {
    console.log(`[OCR] Starting batch processing of ${files.length} file(s)`);

    // Ensure workers are initialized
    await initializeWorkers();

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
