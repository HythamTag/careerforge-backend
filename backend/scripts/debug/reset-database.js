/**
 * DATABASE RESET SCRIPT
 * 
 * Clears all collections in the MongoDB 'cv_enhancer' database.
 * Use with caution - this action is irreversible.
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env from root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cv_enhancer';

async function resetDatabase() {
    console.log('🔄 Starting database reset...');
    console.log(`📍 Connecting to: ${MONGODB_URI}`);

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const collections = await mongoose.connection.db.collections();

        for (const collection of collections) {
            console.log(`🧹 Clearing collection: ${collection.collectionName}`);
            await collection.deleteMany({});
        }

        console.log('✨ Database reset completed successfully');
    } catch (error) {
        console.error('❌ Database reset failed:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

resetDatabase();
