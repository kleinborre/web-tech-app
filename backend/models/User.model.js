/**
 * ImageToTextOnline - User Model
 * 
 * Defines the User schema for authentication and authorization.
 * Follows 3NF normalization with proper indexing.
 * 
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

/* ==========================================================================
   USER SCHEMA DEFINITION
   ========================================================================== */

const userSchema = new mongoose.Schema({
    /**
     * Unique username for login and display.
     */
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens']
    },

    /**
     * Email address for regular users.
     * Optional for superadmin accounts.
     */
    email: {
        type: String,
        unique: true,
        sparse: true, // Allows null/undefined values while maintaining uniqueness
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },

    /**
     * Hashed password using bcrypt.
     */
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't include password in queries by default
    },

    /**
     * User role for authorization.
     */
    role: {
        type: String,
        enum: {
            values: ['superadmin', 'admin', 'user'],
            message: 'Role must be superadmin, admin, or user'
        },
        default: 'user'
    },

    /**
     * Account status flag.
     */
    isActive: {
        type: Boolean,
        default: true
    },

    /**
     * Account creation timestamp.
     */
    createdAt: {
        type: Date,
        default: Date.now
    },

    /**
     * Profile picture URL from Firebase Storage.
     */
    profilePicture: {
        type: String,
        default: ''
    },

    /**
     * Last update timestamp.
     */
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true, // Automatically manage createdAt and updatedAt
    collection: 'users'
});

/* ==========================================================================
   INDEXES
   ========================================================================== */

// Note: username and email already have unique indexes defined in schema
// Compound index for role-based queries
userSchema.index({ role: 1, isActive: 1 });

/* ==========================================================================
   PRE-SAVE MIDDLEWARE
   ========================================================================== */

/**
 * Hash password before saving if it has been modified.
 * Note: Mongoose 8+ async hooks don't use next() callback.
 */
userSchema.pre('save', async function () {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return;
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

/* ==========================================================================
   INSTANCE METHODS
   ========================================================================== */

/**
 * Compare provided password with stored hashed password.
 * 
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if user has a specific role or higher privilege.
 * 
 * @param {string} role - Role to check
 * @returns {boolean} True if user has role or higher
 */
userSchema.methods.hasRole = function (role) {
    const roleHierarchy = { superadmin: 3, admin: 2, user: 1 };
    return roleHierarchy[this.role] >= roleHierarchy[role];
};

/* ==========================================================================
   STATIC METHODS
   ========================================================================== */

/**
 * Find user by email and include password for authentication.
 * 
 * @param {string} email - Email to search
 * @returns {Promise<User|null>} User document or null
 */
userSchema.statics.findByEmailWithPassword = function (email) {
    return this.findOne({ email }).select('+password');
};

/**
 * Find user by username and include password for authentication.
 * 
 * @param {string} username - Username to search
 * @returns {Promise<User|null>} User document or null
 */
userSchema.statics.findByUsernameWithPassword = function (username) {
    return this.findOne({ username }).select('+password');
};

/* ==========================================================================
   EXPORT MODEL
   ========================================================================== */

const User = mongoose.model('User', userSchema);

export default User;
