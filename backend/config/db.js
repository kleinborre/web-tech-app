/**
 * ImageToTextOnline - Database Configuration
 * 
 * Handles MongoDB connection using Mongoose.
 * Uses cached connection for Vercel serverless compatibility.
 * 
 * @version 1.1.0
 */

import dns from 'dns';
import mongoose from 'mongoose';

// Force Node.js to use Google DNS for SRV lookups (Windows fix)
dns.setServers(['8.8.8.8', '8.8.4.4']);

/**
 * Cache the connection promise globally to reuse across
 * Vercel serverless function invocations (cold starts).
 */
let cached = global._mongooseConnection;
if (!cached) {
    cached = global._mongooseConnection = { conn: null, promise: null };
}

/**
 * Connects to MongoDB using the MONGO_URI from environment variables.
 * Caches the connection to avoid reconnecting on every serverless invocation.
 * 
 * @returns {Promise<mongoose.Connection>}
 */
const connectDB = async () => {
    // If already connected, return cached connection
    if (cached.conn) {
        return cached.conn;
    }

    // If a connection attempt is in progress, await it
    if (!cached.promise) {
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        console.log('[Database] Connecting to MongoDB...');

        cached.promise = mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            family: 4, // Force IPv4
            bufferCommands: false, // Disable buffering — fail fast if not connected
        }).then((m) => {
            console.log('[Database] MongoDB Connected Successfully');
            console.log(`[Database] Host: ${m.connection.host}`);
            console.log(`[Database] Database: ${m.connection.name}`);
            return m;
        }).catch((error) => {
            console.error('[Database] MongoDB Connection Error:', error.message);
            cached.promise = null; // Reset so next request retries
            throw error;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        throw error;
    }

    return cached.conn;
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
        cached.conn = null;
        cached.promise = null;
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
    cached.conn = null;
});

mongoose.connection.on('reconnected', () => {
    console.log('[Database] MongoDB reconnected');
});

mongoose.connection.on('error', (error) => {
    console.error('[Database] MongoDB error:', error.message);
});

export { connectDB, disconnectDB };
export default connectDB;
