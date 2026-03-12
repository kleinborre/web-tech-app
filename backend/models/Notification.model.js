/**
 * ImageToTextOnline - Notification Model
 * 
 * Stores user notifications for real-time bell icon updates.
 * Supports role-based triggers (conversion, profile, new user).
 * 
 * @version 1.0.0
 */

import mongoose from 'mongoose';

/* ==========================================================================
   NOTIFICATION SCHEMA DEFINITION
   ========================================================================== */

const notificationSchema = new mongoose.Schema({
    /**
     * Reference to the User who receives the notification.
     */
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },

    /**
     * Notification type for categorization and frontend routing.
     * - conversion: successful OCR image conversion
     * - profile_update: username, email, or password changed
     * - password_reset: password reset via forgot password
     * - new_user: a new user registered (admin/superadmin only)
     */
    type: {
        type: String,
        required: [true, 'Notification type is required'],
        enum: {
            values: ['conversion', 'profile_update', 'password_reset', 'new_user'],
            message: 'Invalid notification type'
        }
    },

    /**
     * Human-readable notification message.
     */
    message: {
        type: String,
        required: [true, 'Notification message is required'],
        trim: true,
        maxlength: [500, 'Message cannot exceed 500 characters']
    },

    /**
     * Whether the notification has been read by the user.
     */
    read: {
        type: Boolean,
        default: false,
        index: true
    },

    /**
     * Optional array of related document IDs (e.g. ConversionLog IDs).
     * Used to clean up notifications when referenced items are deleted.
     */
    referenceIds: [{
        type: mongoose.Schema.Types.ObjectId
    }],

    /**
     * Notification creation timestamp.
     */
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'notifications'
});

/* ==========================================================================
   INDEXES
   ========================================================================== */

// Compound index for fetching unread notifications per user (most common query)
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// TTL index: auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

/* ==========================================================================
   STATIC METHODS
   ========================================================================== */

/**
 * Get unread notification count for a user.
 * 
 * @param {ObjectId} userId - User ID
 * @returns {Promise<number>} Unread count
 */
notificationSchema.statics.getUnreadCount = function (userId) {
    return this.countDocuments({ userId, read: false });
};

/**
 * Get notifications for a user with pagination.
 * 
 * @param {ObjectId} userId - User ID
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} { notifications, pagination }
 */
notificationSchema.statics.getUserNotifications = async function (userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const total = await this.countDocuments({ userId });

    const notifications = await this.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        notifications,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Create a notification for a specific user.
 * 
 * @param {ObjectId} userId - Target user ID
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @returns {Promise<Notification>} Created notification
 */
notificationSchema.statics.notify = async function (userId, type, message, referenceIds = []) {
    return this.create({ userId, type, message, referenceIds });
};

/**
 * Create notifications for all admin and superadmin users.
 * Used for events like new user registration.
 * 
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {ObjectId} [excludeUserId] - Optional user ID to exclude
 */
notificationSchema.statics.notifyAdmins = async function (type, message, excludeUserId = null) {
    // Import User model dynamically to avoid circular dependency
    const User = mongoose.model('User');

    const query = { role: { $in: ['admin', 'superadmin'] }, isActive: true };
    if (excludeUserId) {
        query._id = { $ne: excludeUserId };
    }

    const admins = await User.find(query).select('_id').lean();

    if (admins.length > 0) {
        const notifications = admins.map(admin => ({
            userId: admin._id,
            type,
            message
        }));

        await this.insertMany(notifications);
        console.log(`[Notification] Sent '${type}' to ${admins.length} admin(s)`);
    }
};

/* ==========================================================================
   EXPORT MODEL
   ========================================================================== */

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
