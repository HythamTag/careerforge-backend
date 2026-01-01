
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cv_enhancer';

(async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        const user = await mongoose.connection.collection('users').findOne({ email: 'testuser@example.com' });

        let userId;
        if (user) {
            userId = user._id;
        } else {
            // Create if not exists to be safe
            const newUser = await mongoose.connection.collection('users').insertOne({
                email: 'testuser@example.com',
                password: 'hashedpassword',
                role: 'user',
                isVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            userId = newUser.insertedId;
        }

        const token = jwt.sign(
            { id: userId, role: 'user', email: 'testuser@example.com' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log(token);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
