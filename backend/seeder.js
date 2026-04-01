/**
 * ImageToTextOnline - Database Seeder
 * 
 * Seeds the database with initial users.
 * Run once to create SuperAdmin and TestUser accounts.
 * 
 * Usage: node seeder.js
 * 
 * @version 1.0.0
 */

import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.model.js';

// Force Node.js to use Google DNS for SRV lookups
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load environment variables
dotenv.config();

/* ==========================================================================
   SEED DATA
   ========================================================================== */

const seedUsers = [
    {
        username: 'admin-user',
        password: 'eX6LooLPiVfCuZF6',
        role: 'superadmin',
        isActive: true
        // Note: No email required for superadmin
    },
    {
        username: 'test-user',
        password: 'VitBxRJVNwqdHLsQ',
        role: 'user',
        isActive: true
        // Note: No email required for test user
    },
    {
        username: 'mpisonjr',
        email: 'mpisonjr@mmdc.mcl.edu.ph',
        password: 'Mmdc2026_',
        role: 'admin',
        isActive: true
    }
];

/* ==========================================================================
   SEEDER FUNCTION
   ========================================================================== */

const seedDatabase = async () => {
    try {
        console.log('='.repeat(60));
        console.log('  ImageToTextOnline Database Seeder');
        console.log('='.repeat(60));

        // Connect to MongoDB
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        console.log('[Seeder] Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('[Seeder] Connected to MongoDB');

        // Check existing users
        const existingCount = await User.countDocuments();
        console.log(`[Seeder] Existing users in database: ${existingCount}`);

        // Seed users
        let createdCount = 0;
        let skippedCount = 0;

        for (const userData of seedUsers) {
            // Check if user already exists
            const existingUser = await User.findOne({ username: userData.username });

            if (existingUser) {
                console.log(`[Seeder] User '${userData.username}' already exists - skipping`);
                skippedCount++;
            } else {
                // Create new user (password will be hashed by pre-save middleware)
                const newUser = new User(userData);
                await newUser.save();
                console.log(`[Seeder] ✓ Created user '${userData.username}' with role '${userData.role}'`);
                createdCount++;
            }
        }

        // Summary
        console.log('='.repeat(60));
        console.log('  Seeding Complete!');
        console.log('='.repeat(60));
        console.log(`  Users created: ${createdCount}`);
        console.log(`  Users skipped: ${skippedCount}`);
        console.log(`  Total users:   ${await User.countDocuments()}`);
        console.log('='.repeat(60));

        // Close connection
        await mongoose.connection.close();
        console.log('[Seeder] Database connection closed');

        process.exit(0);

    } catch (error) {
        console.error('[Seeder] Error:', error.message);
        console.error('[Seeder] Full error:', error);

        // Close connection if open
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }

        process.exit(1);
    }
};

/* ==========================================================================
   RUN SEEDER
   ========================================================================== */

seedDatabase();
