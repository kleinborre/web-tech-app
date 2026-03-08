/**
 * ImageToTextOnline - Password Reset Token Model
 * 
 * Stores hashed reset tokens with 1-hour expiry.
 * Only one active token per user at a time.
 * 
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import crypto from 'crypto';

const passwordResetTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    }
});

// TTL index — MongoDB auto-deletes expired tokens
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Only one token per user
passwordResetTokenSchema.index({ userId: 1 }, { unique: true });

/**
 * Generate a secure random token.
 * Returns both the plain token (for the email link) and the hash (for DB storage).
 */
passwordResetTokenSchema.statics.createToken = async function (userId) {
    // Delete any existing token for this user
    await this.deleteMany({ userId });

    // Generate a secure random token
    const plainToken = crypto.randomBytes(32).toString('hex');

    // Hash the token for storage
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

    // Store the hashed token
    await this.create({
        userId,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });

    return plainToken;
};

/**
 * Verify a token against the stored hash.
 * Returns the token document if valid, null otherwise.
 */
passwordResetTokenSchema.statics.verifyToken = async function (plainToken, userId) {
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

    const tokenDoc = await this.findOne({
        userId,
        token: hashedToken,
        expiresAt: { $gt: new Date() }
    });

    return tokenDoc;
};

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

export default PasswordResetToken;
