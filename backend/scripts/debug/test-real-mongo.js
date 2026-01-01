const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
    const uri = process.env.MONGODB_URI;
    console.log('Testing connection to:', uri);

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Successfully connected to MongoDB');
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        if (error.reason) {
            console.error('Reason:', JSON.stringify(error.reason, null, 2));
        }
    }
}

testConnection();
