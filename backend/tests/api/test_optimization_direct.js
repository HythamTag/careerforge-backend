const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Load .env
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const BASE_URL = 'http://localhost:5000/v1';
const CV_ID = process.env.TEST_CV_ID || '6955b10655f1664d18220e41'; // Default or from env
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/cv_enhancer?authSource=admin';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '24h';

async function getAuthToken() {
    if (!JWT_SECRET) throw new Error('Missing JWT_SECRET');

    // Connect if not connected
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGODB_URI);
    }

    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
        email: String, role: String, status: String
    }));

    const user = await User.findOne({ email: 'testuser@example.com' });
    if (!user) throw new Error('Test user not found');

    const payload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role || 'user',
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
        issuer: 'cv-enhancer',
        audience: 'api-users',
    });
}

async function getTestCV(userId) {
    const CV = mongoose.models.CV || mongoose.model('CV', new mongoose.Schema({
        userId: mongoose.Schema.Types.ObjectId,
        content: Object,
        status: String
    }));

    const cv = await CV.findOne({ userId: userId }).sort({ createdAt: -1 });
    if (!cv) throw new Error('No CV found for test user');

    return cv;
}

async function testTailor() {
    console.log(`Using Base URL: ${BASE_URL}`);

    try {
        const AUTH_TOKEN = await getAuthToken();
        console.log('Generated fresh AUTH_TOKEN');

        // Decode token to get userId (simple decode)
        const userId = JSON.parse(atob(AUTH_TOKEN.split('.')[1])).id;

        const cv = await getTestCV(userId);
        const CV_ID = cv._id.toString();
        console.log(`Found Test CV ID: ${CV_ID}`);

        // 1. Get CV Data
        const cvUrl = `${BASE_URL}/cvs/${CV_ID}`;
        console.log(`Fetching CV data from: ${cvUrl} `);
        const cvResponse = await axios.get(cvUrl, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });

        const cvData = cvResponse.data.data.content || cvResponse.data.data;
        console.log('CV data fetched successfully');

        // 2. Start Tailoring
        console.log('Sending tailoring request (this might take several minutes)...');
        const startTime = Date.now();

        const tailorResponse = await axios.post(`${BASE_URL}/optimize/tailor`, {
            cvId: CV_ID,
            cvData,
            jobData: {
                title: 'Senior AI Engineer',
                company: 'Careerforg ITI',
                description: 'Seeking an expert in AI, LLMs, and Python to build agentic coding assistants.'
            },
            options: {
                temperature: 0.4
            }
        }, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN} ` },
            timeout: 600000 // 10 minutes timeout for the test
        });

        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        console.log('\n--- SUCCESS ---');
        console.log(`Duration: ${duration.toFixed(2)} seconds`);
        console.log('Tailored CV Received:', JSON.stringify(tailorResponse.data.data.tailored, null, 2).substring(0, 500) + '...');

        if (tailorResponse.data.data.version) {
            console.log('Version Created:', tailorResponse.data.data.version);
        }

    } catch (error) {
        console.error('\n--- FAILED ---');
        if (error.response) {
            console.error(`Status: ${error.response.status} `);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
    }
}

testTailor();
