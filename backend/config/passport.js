/**
 * ImageToTextOnline - Passport Configuration
 * 
 * Configures Google OAuth 2.0 strategy for social login.
 * Creates or links users on successful Google authentication.
 * 
 * @version 1.0.0
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.model.js';

/* ==========================================================================
   GOOGLE OAUTH 2.0 STRATEGY (lazy init - called after dotenv loads)
   ========================================================================== */

function initializePassport() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.warn('[Passport] Google OAuth credentials not found in .env — Google Sign In disabled');
        return;
    }

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        proxy: true // Trust proxy for production (Vercel)
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const googleId = profile.id;
            const email = profile.emails?.[0]?.value;
            const displayName = profile.displayName || '';
            const profilePicture = profile.photos?.[0]?.value || '';

            // 1. Check if user exists with this Google ID
            let user = await User.findOne({ googleId });

            if (user) {
                // Update profile picture from Google if user doesn't have a custom one
                if (!user.profilePicture && profilePicture) {
                    user.profilePicture = profilePicture;
                    await user.save();
                }
                return done(null, user);
            }

            // 2. Check if user exists with same email (link accounts)
            if (email) {
                user = await User.findOne({ email });
                if (user) {
                    // Link Google account to existing user
                    user.googleId = googleId;
                    if (!user.profilePicture && profilePicture) {
                        user.profilePicture = profilePicture;
                    }
                    await user.save();
                    return done(null, user);
                }
            }

            // 3. Create new user from Google profile
            let baseUsername = displayName
                .toLowerCase()
                .replace(/[^a-z0-9_-]/g, '')
                .substring(0, 20) || 'user';

            let username = baseUsername;
            let counter = 1;

            // Ensure username is unique
            while (await User.findOne({ username })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }

            user = await User.create({
                username,
                email,
                googleId,
                profilePicture,
                role: 'user',
                isActive: true
            });

            console.log(`[Auth] New Google user created: ${username} (${email})`);
            return done(null, user);

        } catch (error) {
            console.error('[Passport] Google strategy error:', error.message);
            return done(error, null);
        }
    }));

    console.log('[Passport] Google OAuth strategy initialized');
}

/* ==========================================================================
   SERIALIZATION (minimal - we use JWT, not sessions)
   ========================================================================== */

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export { initializePassport };
export default passport;
