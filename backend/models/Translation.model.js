/**
 * ImageToTextOnline - Translation Model
 * 
 * Stores user translations from the MyMemory Translation API.
 * Each record links original OCR text to its translated version.
 * 
 * @version 1.0.0
 */

import mongoose from 'mongoose';

/* ==========================================================================
   TRANSLATION SCHEMA DEFINITION
   ========================================================================== */

const translationSchema = new mongoose.Schema({
    /**
     * Reference to the User who saved this translation.
     */
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },

    /**
     * Original text (typically from OCR extraction).
     */
    originalText: {
        type: String,
        required: [true, 'Original text is required'],
        trim: true,
        maxlength: [5000, 'Original text cannot exceed 5000 characters']
    },

    /**
     * Translated text returned from MyMemory API.
     */
    translatedText: {
        type: String,
        required: [true, 'Translated text is required'],
        trim: true,
        maxlength: [10000, 'Translated text cannot exceed 10000 characters']
    },

    /**
     * Source language code (e.g., 'en', 'es', 'fr').
     */
    sourceLang: {
        type: String,
        required: [true, 'Source language is required'],
        trim: true,
        maxlength: [10, 'Language code cannot exceed 10 characters']
    },

    /**
     * Target language code (e.g., 'es', 'fr', 'de').
     */
    targetLang: {
        type: String,
        required: [true, 'Target language is required'],
        trim: true,
        maxlength: [10, 'Language code cannot exceed 10 characters']
    },

    /**
     * Name of the original file the text was extracted from (optional).
     */
    originalFileName: {
        type: String,
        trim: true,
        maxlength: [255, 'File name cannot exceed 255 characters'],
        default: ''
    }
}, {
    timestamps: true,
    collection: 'translations'
});

/* ==========================================================================
   INDEXES
   ========================================================================== */

// Compound index for user translation queries (most recent first)
translationSchema.index({ userId: 1, createdAt: -1 });

// Index for sorting by creation date
translationSchema.index({ createdAt: -1 });

/* ==========================================================================
   EXPORT MODEL
   ========================================================================== */

const Translation = mongoose.model('Translation', translationSchema);

export default Translation;
