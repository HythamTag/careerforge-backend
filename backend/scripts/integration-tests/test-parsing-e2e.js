/**
 * E2E Parsing Test
 * Tests the full upload -> parse -> update flow
 */
require('module-alias/register');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { resolve } = require('@core/container');
const { CV_ENTITY_STATUS, CV_STATUS, JOB_TYPE } = require('@constants');
const config = require('@config');

async function runTest() {
    console.log('🚀 Starting E2E Parsing Test...');

    try {
        // 1. Connect to Database
        console.log('🔌 Connecting to MongoDB:', config.mongodb.uri);
        await mongoose.connect(config.mongodb.uri, config.mongodb.options);
        console.log('✅ Connected to MongoDB');

        // 2. Resolve Services
        const cvService = resolve('cvService');
        const cvParsingService = resolve('cvParsingService');
        const jobService = resolve('jobService');
        const cvRepository = resolve('cvRepository');
        const userRepository = resolve('userRepository');
        const cvParsingRepository = resolve('cvParsingRepository');

        // 3. Mock User
        let user = await userRepository.findByEmail('test@example.com');
        if (!user) {
            user = await userRepository.create({
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User'
            });
        }
        const userId = user._id;

        // 4. Prepare File
        const filePath = path.resolve('c:/Users/Tag/Desktop/Careerforg ITI GRADUATION PROJECT/CV Enhancer/samples/Hytham Tag CV.pdf');
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const fileBuffer = fs.readFileSync(filePath);

        console.log('📄 Uploading CV...');
        // Simulate Upload
        const cv = await cvService.createCV({
            userId,
            title: 'E2E Test CV ' + new Date().toISOString(),
            source: 'upload',
            fileInfo: {
                originalName: 'Hytham Tag CV.pdf',
                mimeType: 'application/pdf',
                size: fileBuffer.length,
                key: `cv/test-${Date.now()}.pdf`
            }
        });

        console.log('✅ CV created with ID:', cv._id);

        // 5. Start Parsing
        console.log('⚙️ Starting parsing job...');
        const parsingResponse = await cvParsingService.startParsing(userId, {
            cvId: cv._id,
            priority: 'high'
        });

        const jobId = parsingResponse.jobId;
        console.log('⏳ Parsing job enqueued. Job ID:', jobId);

        // 6. Poll for completion (Wait max 60s)
        console.log('⌛ Waiting for worker to process... (Polling DB)');
        let retries = 0;
        let completed = false;

        while (retries < 60 && !completed) {
            const updatedCV = await cvRepository.getCVById(cv._id, userId);
            const parsingJob = await cvParsingRepository.findByJobId(jobId);

            const pStatus = updatedCV.parsingStatus || 'N/A';
            const jStatus = parsingJob ? parsingJob.status : 'N/A';
            const progress = updatedCV.parsingProgress || 0;

            console.log(`[${retries}s] Entity Status: ${updatedCV.status} | Workflow Status: ${pStatus} | Job Status: ${jStatus} | Progress: ${progress}%`);

            if (pStatus === CV_STATUS.PARSED || updatedCV.isParsed) {
                console.log('🎉 SUCCESS! CV updated to PARSED state.');
                console.log('Parsed Content Found:', !!updatedCV.content);
                completed = true;
            } else if (jStatus === 'failed') {
                throw new Error(`Parsing job failed: ${parsingJob.error?.message || 'Unknown error'}`);
            }

            if (!completed) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                retries += 2;
            }
        }

        if (!completed) {
            console.log('❌ TIMEOUT! CV never reached PARSED state.');
            console.log('Check if the Worker process is running (npm run worker:dev)');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

runTest();
