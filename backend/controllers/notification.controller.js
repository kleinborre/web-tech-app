/**
 * ImageToTextOnline - Notification Controller
 * 
 * Handles notification retrieval, read marking, and count queries.
 * 
 * @version 1.0.0
 */

import Notification from '../models/Notification.model.js';

/* ==========================================================================
   CONTROLLER METHODS
   ========================================================================== */

/**
 * @desc    Get notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const { notifications, pagination } = await Notification.getUserNotifications(
            req.user._id,
            page,
            limit
        );

        res.status(200).json({
            success: true,
            notifications,
            pagination
        });

    } catch (error) {
        console.error('[Notification] GetNotifications error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching notifications'
        });
    }
};

/**
 * @desc    Get unread notification count for the logged-in user
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.getUnreadCount(req.user._id);

        // Also get the timestamp of the newest unread notification
        // This allows the frontend to persist badge dismissal across page loads
        let latestUnreadAt = null;
        if (count > 0) {
            const latest = await Notification.findOne({ userId: req.user._id, read: false })
                .sort({ createdAt: -1 })
                .select('createdAt')
                .lean();
            if (latest) {
                latestUnreadAt = latest.createdAt;
            }
        }

        res.status(200).json({
            success: true,
            count,
            latestUnreadAt
        });

    } catch (error) {
        console.error('[Notification] GetUnreadCount error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching unread count'
        });
    }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            notification
        });

    } catch (error) {
        console.error('[Notification] MarkAsRead error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error while marking notification as read'
        });
    }
};

/**
 * @desc    Mark all notifications as read for the logged-in user
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { userId: req.user._id, read: false },
            { read: true }
        );

        res.status(200).json({
            success: true,
            message: `Marked ${result.modifiedCount} notification(s) as read`
        });

    } catch (error) {
        console.error('[Notification] MarkAllAsRead error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error while marking all notifications as read'
        });
    }
};
