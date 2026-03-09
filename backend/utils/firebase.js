/**
 * ImageToTextOnline - Firebase Storage Utility
 * 
 * Initializes Firebase Admin SDK and provides helpers
 * for uploading/deleting files in Firebase Storage.
 * 
 * @version 1.0.0
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

/* ==========================================================================
   FIREBASE INITIALIZATION
   ========================================================================== */

let bucket = null;

/**
 * Initialize Firebase Admin SDK (lazy initialization).
 * Called once on first use.
 */
const initFirebase = () => {
    if (bucket) return bucket;

    const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!keyPath || !storageBucket) {
        console.error('[Firebase] Missing FIREBASE_SERVICE_ACCOUNT_KEY_PATH or FIREBASE_STORAGE_BUCKET in .env');
        throw new Error('Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY_PATH and FIREBASE_STORAGE_BUCKET.');
    }

    try {
        const serviceAccount = JSON.parse(readFileSync(path.resolve(keyPath), 'utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: storageBucket
        });

        bucket = admin.storage().bucket();
        console.log('[Firebase] Storage initialized successfully');
        return bucket;
    } catch (error) {
        console.error('[Firebase] Initialization error:', error.message);
        throw new Error('Failed to initialize Firebase. Check service account key path.');
    }
};

/* ==========================================================================
   STORAGE HELPERS
   ========================================================================== */

/**
 * Upload a file buffer to Firebase Storage.
 * 
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} filePath - Destination path in storage (e.g., 'profile-pictures/userId/file.jpg')
 * @param {string} mimetype - File MIME type (e.g., 'image/jpeg')
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export const uploadToFirebase = async (buffer, filePath, mimetype) => {
    const storageBucket = initFirebase();
    const file = storageBucket.file(filePath);

    await file.save(buffer, {
        metadata: {
            contentType: mimetype,
            cacheControl: 'public, max-age=31536000' // 1 year cache
        },
        public: true
    });

    // Return the public URL
    const publicUrl = `https://storage.googleapis.com/${storageBucket.name}/${filePath}`;
    return publicUrl;
};

/**
 * Delete a file from Firebase Storage.
 * 
 * @param {string} filePath - Path of the file to delete in storage
 * @returns {Promise<void>}
 */
export const deleteFromFirebase = async (filePath) => {
    const storageBucket = initFirebase();
    const file = storageBucket.file(filePath);

    try {
        const [exists] = await file.exists();
        if (exists) {
            await file.delete();
            console.log(`[Firebase] Deleted: ${filePath}`);
        }
    } catch (error) {
        console.error(`[Firebase] Delete error for ${filePath}:`, error.message);
        // Don't throw — deletion failure shouldn't break the flow
    }
};

/**
 * Extract the Firebase Storage file path from a public URL.
 * 
 * @param {string} publicUrl - The public URL of the file
 * @returns {string|null} The file path in storage, or null if not a valid URL
 */
export const getFilePathFromUrl = (publicUrl) => {
    if (!publicUrl) return null;

    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    const prefix = `https://storage.googleapis.com/${bucketName}/`;

    if (publicUrl.startsWith(prefix)) {
        return publicUrl.substring(prefix.length);
    }

    return null;
};
