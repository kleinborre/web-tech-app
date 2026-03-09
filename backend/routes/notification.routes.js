/**
 * ImageToTextOnline - Notification Routes
 * 
 * Routes for notification management (get, read, mark all).
 * 
 * @version 1.1.0
 */

import express from 'express';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { mongoIdParam, handleValidationErrors } from '../middleware/validate.middleware.js';

const router = express.Router();

/* ==========================================================================
   ALL ROUTES REQUIRE AUTHENTICATION
   ========================================================================== */

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for the logged-in user (paginated)
 * @access  Private
 */
router.get('/', protect, getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', protect, getUnreadCount);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/read-all', protect, markAllAsRead);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
router.patch('/:id/read', protect, mongoIdParam, handleValidationErrors, markAsRead);

export default router;
