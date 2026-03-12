/**
 * ImageToTextOnline - Admin Controller
 * 
 * Handles admin operations: user management and statistics.
 * 
 * @version 1.0.0
 */

import User from '../models/User.model.js';
import ConversionLog from '../models/ConversionLog.model.js';
import Translation from '../models/Translation.model.js';

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getUsers = async (req, res, next) => {
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
        next(error);
    }
};

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getStats = async (req, res, next) => {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Independent filter params per chart
        // ?globalDays= applies to ALL charts, ?trendDays= overrides for trend chart
        const globalDays = parseInt(req.query.globalDays) || 0;
        const trendDays = parseInt(req.query.trendDays) || globalDays || 7;
        const fileTypeDays = parseInt(req.query.fileTypeDays) || globalDays || 0;
        const langDays = parseInt(req.query.langDays) || globalDays || 0;

        // Build date cutoffs
        const trendCutoff = new Date(now);
        trendCutoff.setDate(trendCutoff.getDate() - trendDays);

        // ── User KPIs ──
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const inactiveUsers = totalUsers - activeUsers;
        const newUsersWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        const newUsersMonth = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        const googleUsers = await User.countDocuments({ googleId: { $exists: true, $ne: null } });
        const regularUsers = totalUsers - googleUsers;
        const roleUser = await User.countDocuments({ role: 'user' });
        const roleAdmin = await User.countDocuments({ role: 'admin' });
        const roleSuperAdmin = await User.countDocuments({ role: 'superadmin' });

        const userRegistrationTrend = await User.aggregate([
            { $match: { createdAt: { $gte: trendCutoff } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // ── Conversion KPIs (ALL conversions: auth + guest) ──
        const totalConversions = await ConversionLog.countDocuments();
        const guestConversions = await ConversionLog.countDocuments({ userId: null });
        const authConversions = totalConversions - guestConversions;
        const recentConversions = await ConversionLog.countDocuments({ conversionDate: { $gte: sevenDaysAgo } });
        const monthConversions = await ConversionLog.countDocuments({ conversionDate: { $gte: thirtyDaysAgo } });
        const successfulConversions = await ConversionLog.countDocuments({ success: true });
        const failedConversions = await ConversionLog.countDocuments({ success: false });
        const withImages = await ConversionLog.countDocuments({ imageUrl: { $exists: true, $ne: '' } });
        const translatedCount = await Translation.countDocuments();

        const convAggs = await ConversionLog.aggregate([{
            $group: {
                _id: null,
                avgConfidence: { $avg: '$confidence' },
                avgProcessingTime: { $avg: '$processingTime' },
                totalFileSize: { $sum: '$fileSize' }
            }
        }]);
        const agg = convAggs[0] || { avgConfidence: 0, avgProcessingTime: 0, totalFileSize: 0 };

        // ── Trend chart (independent: uses trendDays) ──
        const dailyConversions = await ConversionLog.aggregate([
            { $match: { conversionDate: { $gte: trendCutoff } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$conversionDate' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // ── File Types chart (independent: uses fileTypeDays) ──
        const ftMatch = { mimeType: { $exists: true, $ne: null } };
        if (fileTypeDays > 0) {
            const ftCutoff = new Date(now);
            ftCutoff.setDate(ftCutoff.getDate() - fileTypeDays);
            ftMatch.conversionDate = { $gte: ftCutoff };
        }
        const fileTypeDistribution = await ConversionLog.aggregate([
            { $match: ftMatch },
            { $group: { _id: '$mimeType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }, { $limit: 10 }
        ]);

        // ── Languages chart (independent: uses langDays, from Translation model) ──
        const lgMatch = { targetLang: { $exists: true, $ne: '' } };
        if (langDays > 0) {
            const lgCutoff = new Date(now);
            lgCutoff.setDate(lgCutoff.getDate() - langDays);
            lgMatch.createdAt = { $gte: lgCutoff };
        }
        const popularLanguages = await Translation.aggregate([
            { $match: lgMatch },
            { $group: { _id: '$targetLang', count: { $sum: 1 } } },
            { $sort: { count: -1 } }, { $limit: 10 }
        ]);

        // ── Available dropdown options (real DB data) ──
        const availableFileTypes = await ConversionLog.distinct('mimeType', { mimeType: { $exists: true, $ne: null, $ne: '' } });
        const availableLanguages = await Translation.distinct('targetLang', { targetLang: { $exists: true, $ne: '' } });

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers, active: activeUsers, inactive: inactiveUsers,
                    newWeek: newUsersWeek, newMonth: newUsersMonth,
                    google: googleUsers, regular: regularUsers,
                    roles: { user: roleUser, admin: roleAdmin, superadmin: roleSuperAdmin },
                    registrationTrend: userRegistrationTrend
                },
                conversions: {
                    total: totalConversions, guest: guestConversions, auth: authConversions,
                    recent: recentConversions, month: monthConversions,
                    successful: successfulConversions, failed: failedConversions,
                    withImages, translated: translatedCount,
                    avgConfidence: Math.round((agg.avgConfidence || 0) * 10) / 10,
                    avgProcessingTime: Math.round(agg.avgProcessingTime || 0),
                    totalFileSize: agg.totalFileSize || 0,
                    daily: dailyConversions
                },
                fileTypes: fileTypeDistribution,
                languages: popularLanguages,
                availableFileTypes: availableFileTypes.filter(Boolean),
                availableLanguages: availableLanguages.filter(Boolean)
            }
        });
    } catch (error) {
        console.error('[Admin] Get stats error:', error.message);
        next(error);
    }
};

/**
 * @desc    Toggle user active status
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private/Admin
 */
export const toggleUserStatus = async (req, res, next) => {
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
        next(error);
    }
};

/**
 * @desc    Change user role
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private/SuperAdmin
 */
export const changeUserRole = async (req, res, next) => {
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
        next(error);
    }
};

/**
 * @desc    Get single user details
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getUser = async (req, res, next) => {
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
        next(error);
    }
};
