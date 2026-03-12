/**
 * ImageToTextOnline - Translation Controller
 * 
 * Handles text translation via MyMemory API and CRUD operations
 * for saved translations.
 * 
 * @version 1.0.0
 */

import Translation from '../models/Translation.model.js';

/* ==========================================================================
   MYMEMORY API CONFIGURATION
   ========================================================================== */

const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';

/**
 * Supported languages for translation.
 */
const SUPPORTED_LANGUAGES = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    ja: 'Japanese',
    ko: 'Korean',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    ar: 'Arabic',
    hi: 'Hindi',
    nl: 'Dutch',
    sv: 'Swedish',
    pl: 'Polish',
    tr: 'Turkish',
    vi: 'Vietnamese',
    th: 'Thai',
    id: 'Indonesian',
    tl: 'Filipino'
};

/* ==========================================================================
   TRANSLATE TEXT (API Call)
   ========================================================================== */

/**
 * @desc    Translate text using MyMemory API
 * @route   POST /api/translate
 * @access  Public (optionalAuth — guests can translate, only auth users can save)
 */
export const translateText = async (req, res, next) => {
    try {
        const { text, sourceLang, targetLang } = req.body;

        // Validate languages
        if (sourceLang !== 'autodetect' && !SUPPORTED_LANGUAGES[sourceLang]) {
            return res.status(400).json({
                success: false,
                error: `Unsupported source language: ${sourceLang}`
            });
        }
        if (!SUPPORTED_LANGUAGES[targetLang]) {
            return res.status(400).json({
                success: false,
                error: `Unsupported target language: ${targetLang}`
            });
        }

        if (sourceLang !== 'autodetect' && sourceLang === targetLang) {
            return res.status(400).json({
                success: false,
                error: 'Source and target languages must be different'
            });
        }

        // Call MyMemory API — map 'autodetect' to 'auto' for MyMemory
        const apiSourceLang = sourceLang === 'autodetect' ? 'auto' : sourceLang;
        const langPair = `${apiSourceLang}|${targetLang}`;
        const textToTranslate = text.substring(0, 5000);
        const apiUrl = `${MYMEMORY_API_URL}?q=${encodeURIComponent(textToTranslate)}&langpair=${encodeURIComponent(langPair)}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            console.error(`[Translation] MyMemory API error: ${response.status}`);
            return res.status(502).json({
                success: false,
                error: 'Translation service is temporarily unavailable. Please try again.'
            });
        }

        const data = await response.json();

        if (!data.responseData || !data.responseData.translatedText) {
            console.error('[Translation] Invalid API response:', data);
            return res.status(502).json({
                success: false,
                error: 'Translation service returned an invalid response.'
            });
        }

        // Check for API quota exceeded
        if (data.responseStatus === 429) {
            return res.status(429).json({
                success: false,
                error: 'Translation limit reached. Please try again later.'
            });
        }

        res.json({
            success: true,
            data: {
                originalText: text,
                translatedText: data.responseData.translatedText,
                sourceLang,
                targetLang,
                sourceLanguage: SUPPORTED_LANGUAGES[sourceLang] || 'Auto Detect',
                targetLanguage: SUPPORTED_LANGUAGES[targetLang],
                match: data.responseData.match || null
            }
        });

        // Auto-save translation record for ALL users (guest + auth) — fire-and-forget
        // This ensures admin KPIs accurately track all translations in real-time
        Translation.create({
            userId: req.user ? req.user._id : null,
            originalText: text.substring(0, 5000),
            translatedText: data.responseData.translatedText,
            sourceLang: sourceLang === 'autodetect' ? 'auto' : sourceLang,
            targetLang
        }).catch(err => console.error('[Translation] Auto-save error:', err.message));

    } catch (error) {
        console.error('[Translation] Translate error:', error.message);
        next(error);
    }
};

/**
 * @desc    Get supported languages list
 * @route   GET /api/translate/languages
 * @access  Public
 */
export const getLanguages = (req, res) => {
    res.json({
        success: true,
        data: Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
            code,
            name
        }))
    });
};

/* ==========================================================================
   CRUD OPERATIONS
   ========================================================================== */

/**
 * @desc    Save a translation to database
 * @route   POST /api/translations
 * @access  Private
 */
export const saveTranslation = async (req, res, next) => {
    try {
        const { originalText, translatedText, sourceLang, targetLang, originalFileName } = req.body;

        const translation = await Translation.create({
            userId: req.user._id,
            originalText,
            translatedText,
            sourceLang,
            targetLang,
            originalFileName: originalFileName || ''
        });

        console.log(`[Translation] Saved translation ${translation._id} for user ${req.user.username}`);

        res.status(201).json({
            success: true,
            data: translation
        });

    } catch (error) {
        console.error('[Translation] Save error:', error.message);
        next(error);
    }
};

/**
 * @desc    Get user's saved translations (paginated)
 * @route   GET /api/translations
 * @access  Private
 */
export const getTranslations = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Translation.countDocuments({ userId: req.user._id });
        const translations = await Translation.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.json({
            success: true,
            data: translations,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('[Translation] Get translations error:', error.message);
        next(error);
    }
};

/**
 * @desc    Get single translation
 * @route   GET /api/translations/:id
 * @access  Private
 */
export const getTranslation = async (req, res, next) => {
    try {
        const translation = await Translation.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!translation) {
            return res.status(404).json({ success: false, error: 'Translation not found' });
        }

        res.json({ success: true, data: translation });

    } catch (error) {
        console.error('[Translation] Get translation error:', error.message);
        next(error);
    }
};

/**
 * @desc    Update a saved translation
 * @route   PATCH /api/translations/:id
 * @access  Private
 */
export const updateTranslation = async (req, res, next) => {
    try {
        const { translatedText } = req.body;

        const translation = await Translation.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { translatedText },
            { new: true, runValidators: true }
        );

        if (!translation) {
            return res.status(404).json({ success: false, error: 'Translation not found' });
        }

        console.log(`[Translation] Updated translation ${req.params.id} for user ${req.user.username}`);

        res.json({ success: true, data: translation });

    } catch (error) {
        console.error('[Translation] Update error:', error.message);
        next(error);
    }
};

/**
 * @desc    Delete a translation
 * @route   DELETE /api/translations/:id
 * @access  Private
 */
export const deleteTranslation = async (req, res, next) => {
    try {
        const translation = await Translation.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!translation) {
            return res.status(404).json({ success: false, error: 'Translation not found' });
        }

        console.log(`[Translation] Deleted translation ${req.params.id} for user ${req.user.username}`);

        res.json({ success: true, message: 'Translation deleted successfully' });

    } catch (error) {
        console.error('[Translation] Delete error:', error.message);
        next(error);
    }
};

/**
 * @desc    Bulk delete translations
 * @route   POST /api/translations/bulk-delete
 * @access  Private
 */
export const bulkDeleteTranslations = async (req, res, next) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, error: 'No IDs provided' });
        }

        const result = await Translation.deleteMany({
            _id: { $in: ids },
            userId: req.user._id
        });

        console.log(`[Translation] Bulk deleted ${result.deletedCount} translations for user ${req.user.username}`);

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} translations`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('[Translation] Bulk delete error:', error.message);
        next(error);
    }
};

/**
 * @desc    Clear all user translations
 * @route   DELETE /api/translations
 * @access  Private
 */
export const clearTranslations = async (req, res, next) => {
    try {
        const result = await Translation.deleteMany({ userId: req.user._id });

        console.log(`[Translation] Cleared ${result.deletedCount} translations for user ${req.user.username}`);

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} translations`
        });

    } catch (error) {
        console.error('[Translation] Clear error:', error.message);
        next(error);
    }
};
