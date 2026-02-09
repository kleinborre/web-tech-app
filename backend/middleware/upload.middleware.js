/**
 * ImageToTextOnline - Upload Middleware
 * 
 * Configures Multer for handling file uploads.
 * Uses memory storage for processing files without writing to disk.
 * 
 * @version 1.0.0
 */

import multer from 'multer';

/* ==========================================================================
   MULTER CONFIGURATION
   ========================================================================== */

/**
 * Storage Configuration
 * Uses memory storage to keep files in buffer for direct processing.
 */
const storage = multer.memoryStorage();

/**
 * File Filter
 * Validates file types before accepting uploads.
 */
const fileFilter = (req, file, cb) => {
    // Allowed MIME types for OCR processing
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'application/pdf'
    ];

    // Check file extension as fallback for JFIF and HEIC
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.jfif', '.heic', '.webp', '.bmp', '.pdf'];
    const fileExtension = '.' + file.originalname.split('.').pop().toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: JPG, PNG, GIF, JFIF, HEIC, PDF`), false);
    }
};

/**
 * Multer Upload Instance
 * Configured with size limits, file count limits, and file filtering.
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
        files: parseInt(process.env.MAX_FILES) || 5 // 5 files max
    }
});

/**
 * Upload Middleware Export
 * Accepts multiple files under the 'images' field name.
 */
export const uploadMiddleware = upload.array('images', 5);

export default upload;
