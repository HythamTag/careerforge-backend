const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/cv_enhancer?authSource=admin';
const JWT_SECRET = process.env.JWT_SECRET;

async function getToken() {
    if (!JWT_SECRET) {
        console.error('Missing JWT_SECRET in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the test user
        const User = mongoose.model('User', new mongoose.Schema({
            email: String,
            role: String,
            status: String
        }));

        const user = await User.findOne({ email: 'testuser@example.com' });
        if (!user) {
            console.error('Test user not found');
            process.exit(1);
        }

        console.log(`Found user: ${user.email} (${user._id})`);

        const payload = {
            id: user._id.toString(),
            email: user.email,
            role: user.role || 'user',
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: '24h',
            issuer: 'cv-enhancer',
            audience: 'api-users',
        });

        console.log('\n--- ACCESS TOKEN ---');
        console.log(token);
        console.log('--------------------\n');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

getToken();
