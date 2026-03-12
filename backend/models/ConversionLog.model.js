/**
 * ImageToTextOnline - ConversionLog Model
 * 
 * Tracks OCR conversion history for users.
 * References User model for proper 3NF normalization.
 * 
 * @version 1.0.0
 */

import mongoose from 'mongoose';

/* ==========================================================================
   CONVERSION LOG SCHEMA DEFINITION
   ========================================================================== */

const conversionLogSchema = new mongoose.Schema({
    /**
     * Reference to the User who performed the conversion.
     * Required for logged-in users, null for anonymous conversions.
     */
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },

    /**
     * Original name of the uploaded file.
     */
    originalFileName: {
        type: String,
        required: [true, 'Original file name is required'],
        trim: true,
        maxlength: [255, 'File name cannot exceed 255 characters']
    },

    /**
     * MIME type of the original file.
     */
    mimeType: {
        type: String,
        trim: true
    },

    /**
     * Size of the original file in bytes.
     */
    fileSize: {
        type: Number,
        min: [0, 'File size cannot be negative']
    },

    /**
     * Text extracted from the image via OCR.
     */
    extractedText: {
        type: String,
        default: ''
    },

    /**
     * Confidence score from OCR (0-100).
     */
    confidence: {
        type: Number,
        min: 0,
        max: 100
    },

    /**
     * Time taken to process the OCR in milliseconds.
     */
    processingTime: {
        type: Number,
        min: 0
    },

    /**
     * Whether the conversion was successful.
     */
    success: {
        type: Boolean,
        default: true
    },

    /**
     * Error message if conversion failed.
     */
    errorMessage: {
        type: String,
        trim: true
    },

    /**
     * Translated text from MyMemory API (if user translated this item).
     */
    translatedText: {
        type: String,
        default: ''
    },

    /**
     * Source language code for translation (e.g., 'en', 'autodetect').
     */
    sourceLang: {
        type: String,
        trim: true,
        default: ''
    },

    /**
     * Target language code for translation (e.g., 'es', 'fr').
     */
    targetLang: {
        type: String,
        trim: true,
        default: ''
    },

    /**
     * Firebase Storage URL of the compressed original image.
     */
    imageUrl: {
        type: String,
        default: ''
    },

    /**
     * Date and time of the conversion.
     */
    conversionDate: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true,
    collection: 'conversion_logs'
});

/* ==========================================================================
   INDEXES
   ========================================================================== */

// Compound index for user history queries
conversionLogSchema.index({ userId: 1, conversionDate: -1 });

// Index for recent conversions
conversionLogSchema.index({ conversionDate: -1 });

// Index for success status filtering
conversionLogSchema.index({ success: 1 });

/* ==========================================================================
   STATIC METHODS
   ========================================================================== */

/**
 * Get conversion history for a specific user.
 * 
 * @param {ObjectId} userId - User ID to query
 * @param {number} limit - Maximum number of records
 * @returns {Promise<Array>} Array of conversion logs
 */
conversionLogSchema.statics.getUserHistory = function (userId, limit = 50) {
    return this.find({ userId })
        .sort({ conversionDate: -1 })
        .limit(limit)
        .lean();
};

/**
 * Get aggregated stats for a user.
 * 
 * @param {ObjectId} userId - User ID to query
 * @returns {Promise<Object>} Stats object
 */
conversionLogSchema.statics.getUserStats = async function (userId) {
    const stats = await this.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalConversions: { $sum: 1 },
                successfulConversions: {
                    $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] }
                },
                averageConfidence: { $avg: '$confidence' },
                averageProcessingTime: { $avg: '$processingTime' }
            }
        }
    ]);

    return stats[0] || {
        totalConversions: 0,
        successfulConversions: 0,
        averageConfidence: 0,
        averageProcessingTime: 0
    };
};

/* ==========================================================================
   EXPORT MODEL
   ========================================================================== */

const ConversionLog = mongoose.model('ConversionLog', conversionLogSchema);

export default ConversionLog;
