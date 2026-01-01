/**
 * Check specific CV: 6953cc8de653d0f5a57afdf9
 */
require('module-alias/register');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function checkCV() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const cv = await db.collection('cvs').findOne({ _id: new mongoose.Types.ObjectId('6953cc8de653d0f5a57afdf9') });

    console.log('=== CV 6953cc8de653d0f5a57afdf9 ===\n');

    if (cv?.content) {
        console.log('Skills is Array?', Array.isArray(cv.content.skills));
        console.log('Skills Type:', typeof cv.content.skills);
        if (cv.content.skills) {
            console.log('Skills Keys:', Object.keys(cv.content.skills));
            console.log('Skills Content (First 200 chars):', JSON.stringify(cv.content.skills).substring(0, 200));
        }
    } else {
        console.log('NO CONTENT FOUND');
    }

    await mongoose.disconnect();
}

checkCV().catch(console.error);
