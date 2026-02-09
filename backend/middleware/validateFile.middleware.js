/**
 * ImageToTextOnline - File Validation Middleware
 * 
 * Validates uploaded files before processing.
 * Returns 400 error for invalid or missing files.
 * 
 * @version 1.0.0
 */

/* ==========================================================================
   VALIDATION MIDDLEWARE
   ========================================================================== */

/**
 * Validates uploaded files.
 * Ensures at least one file is provided and all files are valid.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateFiles = (req, res, next) => {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'No files uploaded. Please provide at least one image file.',
            code: 'NO_FILES'
        });
    }

    // Validate each file
    const validationErrors = [];
    const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

    req.files.forEach((file, index) => {
        // Check file size
        if (file.size > maxFileSize) {
            validationErrors.push({
                file: file.originalname,
                error: `File exceeds maximum size of ${maxFileSize / (1024 * 1024)}MB`
            });
        }

        // Check if buffer exists
        if (!file.buffer || file.buffer.length === 0) {
            validationErrors.push({
                file: file.originalname,
                error: 'File is empty or corrupted'
            });
        }
    });

    // Return errors if any validation failed
    if (validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'File validation failed',
            code: 'VALIDATION_ERROR',
            details: validationErrors
        });
    }

    // All files are valid, proceed to controller
    next();
};

export default validateFiles;
