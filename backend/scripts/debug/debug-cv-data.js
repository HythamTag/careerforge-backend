/**
 * Debug Script: Check CV fields in MongoDB
 */

require('module-alias/register');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from project root
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cv-enhancer';

async function debugCVs() {
    console.log('Checking CV data in MongoDB...\n');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const cvsCollection = db.collection('cvs');

        // Get all CVs
        const cvs = await cvsCollection.find({}).toArray();
        console.log(`Total CVs in database: ${cvs.length}\n`);

        for (const cv of cvs) {
            console.log(`=== CV: ${cv._id} ===`);
            console.log(`  Title: ${cv.title || 'untitled'}`);
            console.log(`  parsingStatus: ${cv.parsingStatus}`);
            console.log(`  isParsed: ${cv.isParsed}`);
            console.log(`  Has content: ${cv.content ? 'YES (' + Object.keys(cv.content).length + ' keys)' : 'NO'}`);
            console.log(`  Has parsedContent: ${cv.parsedContent ? 'YES (' + Object.keys(cv.parsedContent).length + ' keys)' : 'NO'}`);

            if (cv.content) {
                console.log(`  Content keys: ${Object.keys(cv.content).join(', ')}`);
            }
            console.log('');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugCVs();
