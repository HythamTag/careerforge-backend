/**
 * Verification Script: End-to-End Download Test
 * 
 * 1. Creates a dummy PDF file
 * 2. Creates a fake 'COMPLETED' generation job in DB
 * 3. Authenticates as a real user
 * 4. Hits the download endpoint via HTTP
 * 5. Verifies the file content
 */

require('module-alias/register');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { GenerationModel } = require('@modules/cv-generation/models/generation.model');
const { UserModel } = require('@modules/users/models/user.model');
const { CV } = require('@modules/cvs/models/cv.model');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cv-enhancer';
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-super-secret-key';
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/v1`;

async function verifyDownload() {
    console.log('=== VERIFYING DOWNLOAD ENDPOINT ===\n');

    try {
        // 1. Setup DB Connection
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 2. Find User and CV
        // 2. Create Dummy User and CV
        const timestamp = Date.now();
        const dummyUser = await UserModel.create({
            email: `test_downloader_${timestamp}@example.com`,
            password: 'password123',
            firstName: 'Test',
            lastName: 'Downloader',
            role: 'user',
            isEmailVerified: true
        });
        const user = dummyUser;
        console.log(`✅ Created dummy user: ${user.email} (${user._id})`);

        const dummyCv = await CV.create({
            userId: user._id,
            title: `Test CV ${timestamp}`,
            template: 'modern',
            content: { personalInfo: { fullName: 'Test Downloader' } }
        });
        const cv = dummyCv;
        console.log(`✅ Created dummy CV: ${cv.title} (${cv._id})`);

        // 3. Create Dummy File
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'generated');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const dummyFileName = `test-cv-${Date.now()}.pdf`;
        const dummyFilePath = path.join(uploadsDir, dummyFileName);
        const dummyContent = 'This is a dummy PDF content for testing purposes.';
        fs.writeFileSync(dummyFilePath, dummyContent);
        console.log(`✅ Created dummy file: ${dummyFilePath}`);

        // 4. Create Generation Job
        const jobId = new mongoose.Types.ObjectId();
        const generationId = new mongoose.Types.ObjectId();

        await GenerationModel.create({
            _id: generationId,
            jobId: jobId,
            userId: user._id,
            cvId: cv._id,
            status: 'completed',
            outputFormat: 'pdf',
            type: 'from_cv',
            queuedAt: new Date(),
            startedAt: new Date(),
            completedAt: new Date(),
            progress: 100,
            currentStep: 'Completed manual test',
            inputData: {},
            outputFile: {
                fileName: dummyFileName,
                filePath: `generated/${dummyFileName}`, // Must be relative for LocalStorageProvider
                fileSize: dummyContent.length,
                mimeType: 'application/pdf'
            }
        });
        console.log(`✅ Created COMPLETED generation job: ${jobId.toString()}`);

        // Wait for server restart (nodemon)
        console.log('Waiting 3s for server to settle...');
        await new Promise(r => setTimeout(r, 3000));

        // 5. Generate Token
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        console.log('✅ Generated valid JWT');

        // 6. Test Download Endpoint
        console.log(`\n⬇️  Attempting download from: ${BASE_URL}/generation/${jobId}/download`);

        try {
            const response = await axios.get(`${BASE_URL}/generation/${jobId}/download`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                responseType: 'arraybuffer' // Important for binary data
            });

            console.log(`\n✅ HTTP Response: ${response.status} ${response.statusText}`);
            console.log(`✅ Content-Type: ${response.headers['content-type']}`);
            console.log(`✅ Content-Length: ${response.headers['content-length']}`);

            const downloadedContent = response.data.toString();
            if (downloadedContent === dummyContent) {
                console.log('\nSUCCESS: Downloaded content matches source file! 🎉');
            } else {
                console.error('\nFAILURE: Downloaded content mismatch!');
            }

        } catch (httpError) {
            console.error('\n❌ HTTP Request Failed:');
            if (httpError.response) {
                console.error(`Status: ${httpError.response.status}`);
                console.error('Data:', JSON.stringify(httpError.response.data, null, 2));
            } else {
                console.error(httpError.message);
            }
        }

        // Cleanup (optional, maybe keep for debugging)
        // await GenerationModel.deleteOne({ _id: generationId });
        // fs.unlinkSync(dummyFilePath);

    } catch (error) {
        console.error('\n❌ Script Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verifyDownload();
