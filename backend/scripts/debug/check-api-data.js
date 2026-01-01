/**
 * Test Script: Check existing users and CVs, then test API
 */

require('module-alias/register');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from project root
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cv-enhancer';

async function testAPI() {
    console.log('=== API DATA CHECK ===\n');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Get a user
        const usersCollection = db.collection('users');
        const users = await usersCollection.find({}).limit(1).toArray();
        console.log('Users found:', users.length);
        if (users.length > 0) {
            console.log('First user email:', users[0].email);
            console.log('First user ID:', users[0]._id);
        }

        // Get CVs with content
        const cvsCollection = db.collection('cvs');
        const cvs = await cvsCollection.find({}).toArray();
        console.log('\nTotal CVs:', cvs.length);

        for (const cv of cvs) {
            console.log(`\n--- CV: ${cv._id} ---`);
            console.log('  userId:', cv.userId);
            console.log('  parsingStatus:', cv.parsingStatus);
            console.log('  isParsed:', cv.isParsed);
            console.log('  content exists:', !!cv.content);
            console.log('  parsedContent exists:', !!cv.parsedContent);

            if (cv.content) {
                console.log('  content keys:', Object.keys(cv.content));
                if (cv.content.personal) {
                    console.log('  content.personal.name:', cv.content.personal.name);
                }
            }
            if (cv.parsedContent) {
                console.log('  parsedContent keys:', Object.keys(cv.parsedContent));
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testAPI();
