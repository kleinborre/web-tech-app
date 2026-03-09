/**
 * ImageToTextOnline - History Controller
 * 
 * Handles user conversion history CRUD operations.
 * 
 * @version 1.1.0
 */

import ConversionLog from '../models/ConversionLog.model.js';
import Notification from '../models/Notification.model.js';

/**
 * @desc    Get user's conversion history (paginated)
 * @route   GET /api/history
 * @access  Private
 */
export const getHistory = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const total = await ConversionLog.countDocuments({ userId: req.user._id });
        const history = await ConversionLog.find({ userId: req.user._id })
            .sort({ conversionDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.json({
            success: true,
            data: history,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('[History] Get error:', error.message);
        next(error);
    }
};

/**
 * @desc    Get single history item
 * @route   GET /api/history/:id
 * @access  Private
 */
export const getHistoryItem = async (req, res, next) => {
    try {
        const item = await ConversionLog.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!item) {
            return res.status(404).json({ success: false, error: 'Record not found' });
        }

        res.json({ success: true, data: item });

    } catch (error) {
        console.error('[History] Get item error:', error.message);
        next(error);
    }
};

/**
 * @desc    Delete a conversion record + related notifications
 * @route   DELETE /api/history/:id
 * @access  Private
 */
export const deleteHistory = async (req, res, next) => {
    try {
        const item = await ConversionLog.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!item) {
            return res.status(404).json({ success: false, error: 'Record not found' });
        }

        // Remove this ID from notification referenceIds and clean up empty ones
        try {
            const deletedId = item._id;

            // Pull the deleted ID from referenceIds arrays
            await Notification.updateMany(
                { userId: req.user._id, type: 'conversion', referenceIds: deletedId },
                { $pull: { referenceIds: deletedId } }
            );

            // Delete notifications that now have empty referenceIds
            await Notification.deleteMany({
                userId: req.user._id,
                type: 'conversion',
                referenceIds: { $exists: true, $size: 0 }
            });

            // Legacy fallback: regex match for old notifications without referenceIds
            const filename = item.originalFileName || '';
            if (filename) {
                await Notification.deleteMany({
                    userId: req.user._id,
                    type: 'conversion',
                    $or: [
                        { referenceIds: { $exists: false } },
                        { referenceIds: null }
                    ],
                    message: { $regex: filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
                });
            }
        } catch (notifError) {
            console.error('[History] Notification cleanup error:', notifError.message);
        }

        console.log(`[History] Deleted record ${req.params.id} for user ${req.user.username}`);

        res.json({ success: true, message: 'Record deleted successfully' });

    } catch (error) {
        console.error('[History] Delete error:', error.message);
        next(error);
    }
};

/**
 * @desc    Clear all user history
 * @route   DELETE /api/history
 * @access  Private
 */
export const clearHistory = async (req, res, next) => {
    try {
        const result = await ConversionLog.deleteMany({ userId: req.user._id });

        // Also clean up all conversion notifications
        try {
            await Notification.deleteMany({ userId: req.user._id, type: 'conversion' });
        } catch (e) { /* ignore */ }

        console.log(`[History] Cleared ${result.deletedCount} records for user ${req.user.username}`);

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} records`
        });

    } catch (error) {
        console.error('[History] Clear error:', error.message);
        next(error);
    }
};

/**
 * @desc    Bulk delete selected conversion records + related notifications
 * @route   POST /api/history/bulk-delete
 * @access  Private
 */
export const bulkDeleteHistory = async (req, res, next) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, error: 'No IDs provided' });
        }

        const result = await ConversionLog.deleteMany({
            _id: { $in: ids },
            userId: req.user._id
        });

        // Clean up notifications by referenceIds
        try {
            // Pull all deleted IDs from referenceIds arrays
            await Notification.updateMany(
                { userId: req.user._id, type: 'conversion', referenceIds: { $in: ids } },
                { $pull: { referenceIds: { $in: ids } } }
            );

            // Delete notifications with empty referenceIds
            await Notification.deleteMany({
                userId: req.user._id,
                type: 'conversion',
                referenceIds: { $exists: true, $size: 0 }
            });
        } catch (e) {
            console.error('[History] Bulk notification cleanup error:', e.message);
        }

        console.log(`[History] Bulk deleted ${result.deletedCount} records for user ${req.user.username}`);

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} records`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('[History] Bulk delete error:', error.message);
        next(error);
    }
};
