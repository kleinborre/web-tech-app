/**
 * ImageToTextOnline - History Routes
 * 
 * Routes for user conversion history management.
 * 
 * @version 1.0.0
 */

import express from 'express';
import { getHistory, getHistoryItem, deleteHistory, clearHistory } from '../controllers/history.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/history
 * @desc    Get user's conversion history (paginated)
 */
router.get('/', getHistory);

/**
 * @route   GET /api/history/:id
 * @desc    Get single history item
 */
router.get('/:id', getHistoryItem);

/**
 * @route   DELETE /api/history/:id
 * @desc    Delete a conversion record
 */
router.delete('/:id', deleteHistory);

/**
 * @route   DELETE /api/history
 * @desc    Clear all user history
 */
router.delete('/', clearHistory);

export default router;
