/**
 * ImageToTextOnline - Admin Controller
 * 
 * Handles admin operations: user management and statistics.
 * 
 * @version 1.0.0
 */

import User from '../models/User.model.js';
import ConversionLog from '../models/ConversionLog.model.js';

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await User.countDocuments();
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.json({
            success: true,
            data: users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error('[Admin] Get users error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
};

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getStats = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // User counts
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const adminCount = await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } });

        // Conversion stats
        const totalConversions = await ConversionLog.countDocuments();
        const recentConversions = await ConversionLog.countDocuments({
            conversionDate: { $gte: sevenDaysAgo }
        });

        // Daily conversions for chart (last 7 days)
        const dailyConversions = await ConversionLog.aggregate([
            { $match: { conversionDate: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$conversionDate' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // New users this week
        const newUsers = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        res.json({
            success: true,
            data: {
                users: { total: totalUsers, active: activeUsers, admins: adminCount, new: newUsers },
                conversions: { total: totalConversions, recent: recentConversions, daily: dailyConversions }
            }
        });

    } catch (error) {
        console.error('[Admin] Get stats error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
    }
};

/**
 * @desc    Toggle user active status
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private/Admin
 */
export const toggleUserStatus = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);

        if (!targetUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Can't deactivate superadmin
        if (targetUser.role === 'superadmin') {
            return res.status(403).json({ success: false, error: 'Cannot modify superadmin status' });
        }

        // Can't deactivate yourself
        if (targetUser._id.toString() === req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Cannot modify your own status' });
        }

        targetUser.isActive = !targetUser.isActive;
        await targetUser.save();

        console.log(`[Admin] ${req.user.username} ${targetUser.isActive ? 'activated' : 'deactivated'} user ${targetUser.username}`);

        res.json({
            success: true,
            message: `User ${targetUser.isActive ? 'activated' : 'deactivated'} successfully`,
            data: { isActive: targetUser.isActive }
        });

    } catch (error) {
        console.error('[Admin] Toggle status error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to update user status' });
    }
};

/**
 * @desc    Change user role
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private/SuperAdmin
 */
export const changeUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['user', 'admin'];

        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid role. Must be user or admin' });
        }

        const targetUser = await User.findById(req.params.id);

        if (!targetUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Can't change superadmin role
        if (targetUser.role === 'superadmin') {
            return res.status(403).json({ success: false, error: 'Cannot modify superadmin role' });
        }

        // Only superadmin can change roles
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, error: 'Only superadmin can change user roles' });
        }

        // Can't change own role
        if (targetUser._id.toString() === req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Cannot modify your own role' });
        }

        const oldRole = targetUser.role;
        targetUser.role = role;
        await targetUser.save();

        console.log(`[Admin] ${req.user.username} changed ${targetUser.username} role from ${oldRole} to ${role}`);

        res.json({
            success: true,
            message: `User role changed to ${role}`,
            data: { role: targetUser.role }
        });

    } catch (error) {
        console.error('[Admin] Change role error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to change user role' });
    }
};

/**
 * @desc    Get single user details
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Get user's conversion count
        const conversionCount = await ConversionLog.countDocuments({ userId: user._id });

        res.json({
            success: true,
            data: { ...user.toObject(), conversionCount }
        });

    } catch (error) {
        console.error('[Admin] Get user error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
};
