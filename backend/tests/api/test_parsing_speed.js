
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const BASE_URL = 'http://localhost:5000/v1';

async function generateTestToken() {
    return jwt.sign(
        { id: new mongoose.Types.ObjectId(), role: 'user', email: 'test@example.com' },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
    );
}

async function runTest() {
    console.log('🚀 Starting Parsing Speed Benchmark...');

    try {
        const token = await generateTestToken();
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Locate a real PDF file
        let testPdfPath = path.resolve(__dirname, '../../Hytham Tag CV.pdf');

        // Check if main file exists, else look in uploads
        if (!fs.existsSync(testPdfPath)) {
            console.log('⚠️ Primary test file not found, searching uploads...');
            const uploadDir = path.resolve(__dirname, '../../src/core/uploads');
            if (fs.existsSync(uploadDir)) {
                const files = fs.readdirSync(uploadDir);
                const pdf = files.find(f => f.endsWith('.pdf'));
                if (pdf) {
                    testPdfPath = path.join(uploadDir, pdf);
                    console.log(`✅ Found backup PDF: ${pdf}`);
                } else {
                    console.error('❌ No PDF files found for testing');
                    process.exit(1);
                }
            } else {
                console.error('❌ Upload directory not found');
                process.exit(1);
            }
        }

        // 2. Prepare safe temp file
        const tempFile = path.join(__dirname, 'test.pdf');
        fs.copyFileSync(testPdfPath, tempFile);

        const form = new FormData();
        form.append('cv', fs.createReadStream(tempFile));

        console.log('📤 Uploading CV...');
        const uploadStart = Date.now();

        const uploadRes = await axios.post(`${BASE_URL}/cvs/upload`, form, {
            headers: {
                ...headers,
                ...form.getHeaders()
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        const uploadTime = Date.now() - uploadStart;
        console.log(`✅ Upload Complete: ${uploadTime}ms`);
        console.log(`📄 CV ID: ${uploadRes.data.data.cvId}`);

        const cvId = uploadRes.data.data.cvId;

        let parsed = false;
        let attempts = 0;
        const maxAttempts = 60;
        const pollStart = Date.now();

        console.log('⏳ Waiting for parsing to complete...');

        // Minimal polling interval for accurate timing
        while (!parsed && attempts < maxAttempts) {
            const checkRes = await axios.get(`${BASE_URL}/cvs/${cvId}`, { headers });
            const status = checkRes.data.data.parsingStatus;
            const parsingError = checkRes.data.data.parsingError;

            if (status === 'COMPLETED') {
                parsed = true;
                console.log('\n🎉 Parsing COMPLETED!');
            } else if (status === 'FAILED') {
                console.error('\n❌ Parsing FAILED');
                console.error('Error:', parsingError);
                break;
            } else {
                process.stdout.write('.');
                await new Promise(r => setTimeout(r, 500)); // 500ms poll
                attempts++;
            }
        }

        const totalTime = Date.now() - pollStart;
        console.log(`\n⏱️ Total Parsing Time: ${totalTime}ms`);

        if (totalTime < 10000) {
            console.log('✅ GOAL MET: < 10 seconds');
        } else {
            console.log('⚠️ GOAL MISSED: > 10 seconds');
        }

        // Cleanup
        try { fs.unlinkSync(tempFile); } catch (e) { }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
}

runTest();
