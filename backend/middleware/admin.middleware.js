/**
 * ImageToTextOnline - Admin Middleware
 * 
 * Role-based access control for admin routes.
 * Must be used after auth.middleware.js protect.
 * 
 * @version 1.0.0
 */

/**
 * Restrict access to admin and superadmin roles.
 * Must be used after protect middleware.
 */
export const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized'
        });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({
            success: false,
            error: 'Access denied. Admin privileges required.'
        });
    }

    next();
};

/**
 * Restrict access to superadmin role only.
 * Must be used after protect middleware.
 */
export const superadminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized'
        });
    }

    if (req.user.role !== 'superadmin') {
        return res.status(403).json({
            success: false,
            error: 'Access denied. Superadmin privileges required.'
        });
    }

    next();
};

/**
 * Authorize specific roles.
 * Usage: authorize('admin', 'superadmin')
 * 
 * @param  {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. Required roles: ${roles.join(', ')}`
            });
        }

        next();
    };
};
