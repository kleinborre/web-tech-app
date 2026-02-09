/**
 * ImageToTextOnline - History Controller
 * 
 * Handles user conversion history CRUD operations.
 * 
 * @version 1.0.0
 */

import ConversionLog from '../models/ConversionLog.model.js';

/**
 * @desc    Get user's conversion history (paginated)
 * @route   GET /api/history
 * @access  Private
 */
export const getHistory = async (req, res) => {
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
        res.status(500).json({ success: false, error: 'Failed to fetch history' });
    }
};

/**
 * @desc    Get single history item
 * @route   GET /api/history/:id
 * @access  Private
 */
export const getHistoryItem = async (req, res) => {
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
        res.status(500).json({ success: false, error: 'Failed to fetch record' });
    }
};

/**
 * @desc    Delete a conversion record
 * @route   DELETE /api/history/:id
 * @access  Private
 */
export const deleteHistory = async (req, res) => {
    try {
        const item = await ConversionLog.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!item) {
            return res.status(404).json({ success: false, error: 'Record not found' });
        }

        console.log(`[History] Deleted record ${req.params.id} for user ${req.user.username}`);

        res.json({ success: true, message: 'Record deleted successfully' });

    } catch (error) {
        console.error('[History] Delete error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to delete record' });
    }
};

/**
 * @desc    Clear all user history
 * @route   DELETE /api/history
 * @access  Private
 */
export const clearHistory = async (req, res) => {
    try {
        const result = await ConversionLog.deleteMany({ userId: req.user._id });

        console.log(`[History] Cleared ${result.deletedCount} records for user ${req.user.username}`);

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} records`
        });

    } catch (error) {
        console.error('[History] Clear error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to clear history' });
    }
};
