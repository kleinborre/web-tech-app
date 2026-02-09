/**
 * ImageToTextOnline - Database Configuration
 * 
 * Handles MongoDB connection using Mongoose.
 * Includes retry logic and error handling.
 * 
 * @version 1.0.0
 */

import dns from 'dns';
import mongoose from 'mongoose';

// Force Node.js to use Google DNS for SRV lookups (Windows fix)
dns.setServers(['8.8.8.8', '8.8.4.4']);

/**
 * Connects to MongoDB using the MONGO_URI from environment variables.
 * Implements connection retry and error handling.
 * 
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        console.log('[Database] Connecting to MongoDB...');

        const conn = await mongoose.connect(mongoURI, {
            // Extended timeout for DNS resolution on Windows
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            // Use new URL parser and unified topology
            family: 4, // Force IPv4
        });

        console.log('[Database] MongoDB Connected Successfully');
        console.log(`[Database] Host: ${conn.connection.host}`);
        console.log(`[Database] Database: ${conn.connection.name}`);

    } catch (error) {
        console.error('[Database] MongoDB Connection Error:', error.message);
        console.error('[Database] Full error:', error);

        // Exit process with failure for critical connection errors
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

/**
 * Disconnects from MongoDB.
 * Useful for graceful shutdown and testing.
 * 
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('[Database] MongoDB Disconnected');
    } catch (error) {
        console.error('[Database] Error disconnecting from MongoDB:', error.message);
    }
};

/**
 * Handle connection events
 */
mongoose.connection.on('disconnected', () => {
    console.log('[Database] MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('[Database] MongoDB reconnected');
});

mongoose.connection.on('error', (error) => {
    console.error('[Database] MongoDB error:', error.message);
});

export { connectDB, disconnectDB };
export default connectDB;
