/**
 * ImageToTextOnline - Admin Routes
 * 
 * Routes for admin panel functionality.
 * 
 * @version 1.1.0
 */

import express from 'express';
import { getUsers, getUser, getStats, toggleUserStatus, changeUserRole } from '../controllers/admin.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly, superadminOnly } from '../middleware/admin.middleware.js';
import { mongoIdParam, handleValidationErrors } from '../middleware/validate.middleware.js';

const router = express.Router();

// All routes require authentication + admin role
router.use(protect);
router.use(adminOnly);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (paginated)
 */
router.get('/users', getUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user details
 */
router.get('/users/:id', mongoIdParam, handleValidationErrors, getUser);

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Toggle user active status
 */
router.patch('/users/:id/status', mongoIdParam, handleValidationErrors, toggleUserStatus);

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Change user role (superadmin only)
 */
router.patch('/users/:id/role', superadminOnly, mongoIdParam, handleValidationErrors, changeUserRole);

export default router;
