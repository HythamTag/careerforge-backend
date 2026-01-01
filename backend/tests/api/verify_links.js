
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cv_enhancer';

(async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        const user = await mongoose.connection.collection('users').findOne({ email: 'testuser@example.com' });

        // Generate Token
        const token = jwt.sign(
            { id: user._id, role: 'user', email: 'testuser@example.com' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Fetch Latest CV
        const latestCv = await mongoose.connection.collection('cvs')
            .find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray();

        if (!latestCv || latestCv.length === 0) throw new Error('No CVs found');
        const cvId = latestCv[0]._id.toString();
        console.log(`Fetching CV ${cvId}...`);

        const response = await axios.get(`http://localhost:5000/v1/cvs/${cvId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const personalInfo = response.data.data.content.personalInfo;
        console.log('--- Personal Info Links ---');
        console.log(JSON.stringify(personalInfo.links, null, 2));
        console.log('--- Flat Fields (Should be preserved but normalized) ---');
        console.log('LinkedIn:', personalInfo.linkedin);
        console.log('Website:', personalInfo.website);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err.message);
        if (err.response) console.error(JSON.stringify(err.response.data, null, 2));
        process.exit(1);
    }
})();
