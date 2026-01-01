const mongoose = require('mongoose');

async function testConnection() {
    // Try WITHOUT credentials
    const uri = "mongodb://127.0.0.1:27017/cv_enhancer";
    console.log('Testing connection to:', uri);

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Successfully connected to MongoDB WITHOUT credentials');
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Connection failed WITHOUT credentials:', error.message);
    }
}

testConnection();
