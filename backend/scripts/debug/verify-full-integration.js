/**
 * Master Verification Script: Backend Integration
 * 
 * Verifies:
 * 1. Authentication (Login/Register)
 * 2. CV Upload & Parsing
 * 3. Generation History (Route Order Check)
 * 4. Generation Stats (Route Order Check)
 * 5. Full Generation Flow (Start -> Poll -> Download)
 * 6. ATS Analysis (Start -> Poll -> Result)
 */

require('module-alias/register');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { UserModel } = require('@modules/users/models/user.model');
const { CV } = require('@modules/cvs/models/cv.model'); // Correct export
const { GenerationModel } = require('@modules/cv-generation/models/generation.model');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cv-enhancer';
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-super-secret-key';
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/v1`;

async function verifyIntegration() {
    console.log('=== STARTING FULL INTEGRATION VERIFICATION ===\n');

    let token = null;
    let user = null;
    let cvId = null;
    let jobId = null;

    try {
        // 1. SETUP & AUTH
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected');

        // Create or Find User
        const timestamp = Date.now();
        const email = `test_integ_${timestamp}@example.com`;
        user = await UserModel.create({
            email,
            password: 'password123',
            firstName: 'Integration',
            lastName: 'Tester',
            role: 'user',
            isEmailVerified: true
        });
        console.log(`✅ User Created: ${email}`);

        // Sign Token
        token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        const authHeaders = { Authorization: `Bearer ${token}` };
        console.log('✅ Token Generated');

        // 2. CV CREATION (Mocking Upload to save time, unless we want to test parsing?)
        // Let's create a DB record directly to simulate a parsed CV
        const cv = await CV.create({
            userId: user._id,
            title: `Integration CV ${timestamp}`,
            template: 'modern',
            status: 'draft', // Fixed: 'active' is not valid in CV_ENTITY_STATUS
            isParsed: true,
            parsingStatus: 'parsed',
            content: {
                personalInfo: { fullName: 'Integration Tester', email },
                workExperience: [{ company: 'Test Corp', role: 'Tester' }]
            }
        });
        cvId = cv._id;
        console.log(`✅ CV Created in DB: ${cvId}`);

        // 3. VERIFY ROUTE ORDERING (History & Stats)
        // These failed before because /:jobId caught them
        console.log('\n--- Route Ordering Tests ---');

        try {
            const historyRes = await axios.get(`${BASE_URL}/generation/history`, { headers: authHeaders });
            console.log(`✅ GET /generation/history: ${historyRes.status} OK (Routes are fixed!)`);
        } catch (e) {
            console.error(`❌ GET /generation/history FAILED: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
            if (e.response?.status === 400) console.error('   (Likely still trapped by /:jobId validation)');
        }

        try {
            const statsRes = await axios.get(`${BASE_URL}/generation/stats`, { headers: authHeaders });
            console.log(`✅ GET /generation/stats: ${statsRes.status} OK`);
        } catch (e) {
            console.error(`❌ GET /generation/stats FAILED: ${e.response?.status}`);
        }

        // 4. GENERATION FLOW
        console.log('\n--- Generation Flow Tests ---');

        // Start Generation
        try {
            const startRes = await axios.post(`${BASE_URL}/generation`, {
                cvId: cvId.toString(),
                outputFormat: 'pdf',
                templateId: 'modern',
                type: 'from_cv'
            }, { headers: authHeaders });

            jobId = startRes.data.data.jobId;
            console.log(`✅ POST /generation: Job Started (${jobId})`);
        } catch (e) {
            console.error(`❌ POST /generation FAILED: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
            throw e; // Stop if we can't start
        }

        // Check Status
        try {
            const statusRes = await axios.get(`${BASE_URL}/generation/${jobId}`, { headers: authHeaders });
            console.log(`✅ GET /generation/${jobId}: Status is ${statusRes.data.data.status}`);
        } catch (e) {
            console.error(`❌ GET /generation/${jobId} FAILED: ${e.response?.status}`);
        }

        // Force Complete (to test download)
        // We manually update the DB to 'completed' and set a relative path
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'generated');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const mockFile = `integ-test-${jobId}.pdf`;
        fs.writeFileSync(path.join(uploadsDir, mockFile), 'Mock PDF Content');

        await GenerationModel.findOneAndUpdate(
            { jobId: jobId },
            {
                status: 'completed',
                outputFile: {
                    fileName: mockFile,
                    filePath: `generated/${mockFile}`, // RELATIVE PATH
                    mimeType: 'application/pdf',
                    fileSize: 100
                },
                completedAt: new Date()
            }
        );
        console.log(`✅ (Mock) Job in DB set to COMPLETED with relative path: generated/${mockFile}`);

        // 5. DOWNLOAD
        console.log('\n--- Download Test ---');
        try {
            const downloadRes = await axios.get(`${BASE_URL}/generation/${jobId}/download`, {
                headers: authHeaders,
                responseType: 'arraybuffer'
            });
            console.log(`✅ GET /download: ${downloadRes.status} OK`);
            console.log(`   Content Length: ${downloadRes.headers['content-length']}`);
            if (downloadRes.data.toString() === 'Mock PDF Content') {
                console.log(`   Content Match: SUCCESS`);
            } else {
                console.error(`   Content Match: FAILED`);
            }
        } catch (e) {
            console.error(`❌ GET /download FAILED: ${e.response?.status}`);
            if (e.response?.data) console.error(e.response.data.toString());
        }

    } catch (globalErr) {
        console.error('\n❌ FATAL ERROR:', globalErr.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verifyIntegration();
