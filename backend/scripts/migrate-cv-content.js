/**
 * Migration Script: Backfill CV content field
 * 
 * This script copies parsedContent to content for all existing CVs
 * that have parsedContent but empty content field.
 * 
 * Run with: node scripts/migrate-cv-content.js
 */

require('module-alias/register');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from project root
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cv-enhancer';

async function migrateCV() {
    console.log('Starting CV content migration...');
    console.log(`Connecting to: ${MONGODB_URI}`);

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const cvsCollection = db.collection('cvs');

        // Find all CVs that have parsedContent (Force update all)
        const cvsToMigrate = await cvsCollection.find({
            parsedContent: { $exists: true, $ne: null }
        }).toArray();

        console.log(`Found ${cvsToMigrate.length} CVs to migrate`);

        if (cvsToMigrate.length === 0) {
            console.log('No CVs need migration. All good!');
            return;
        }

        let migrated = 0;
        let failed = 0;

        for (const cv of cvsToMigrate) {
            try {
                await cvsCollection.updateOne(
                    { _id: cv._id },
                    {
                        $set: {
                            content: cv.parsedContent,
                            parsingProgress: 100
                        }
                    }
                );
                console.log(`✓ Migrated CV: ${cv._id} (${cv.title || 'untitled'})`);
                migrated++;
            } catch (error) {
                console.error(`✗ Failed to migrate CV ${cv._id}:`, error.message);
                failed++;
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log(`Migrated: ${migrated}`);
        console.log(`Failed: ${failed}`);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

migrateCV();
