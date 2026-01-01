#!/usr/bin/env node

/**
 * Quick test script for CV processing
 * Tests upload, status, and retrieval
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function test() {
  console.log('\n🧪 Testing Backend with Hytham Tag CV.pdf\n');

  // Check if server is running
  try {
    await axios.get(`${API_BASE_URL}/health`, { timeout: 2000 });
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Server is not running!');
    console.error('Please start the server first:');
    console.error('  npm run dev');
    console.error('And in another terminal, start the worker:');
    console.error('  npm run worker\n');
    process.exit(1);
  }

  // Find CV file
  const possiblePaths = [
    path.join(__dirname, '..', 'uploads', 'Hytham Tag CV.pdf'),
    path.join(__dirname, '..', '..', '..', 'Hytham Tag CV.pdf'),
    path.join(process.cwd(), 'Hytham Tag CV.pdf'),
  ];

  let cvPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      cvPath = p;
      break;
    }
  }

  if (!cvPath) {
    console.error('❌ CV file not found. Please place "Hytham Tag CV.pdf" in one of:');
    possiblePaths.forEach(p => console.error(`   - ${p}`));
    process.exit(1);
  }

  console.log(`📁 Found CV: ${cvPath}\n`);

  try {
    // Upload
    console.log('📤 Uploading CV...');
    const formData = new FormData();
    formData.append('cv', fs.createReadStream(cvPath));

    const uploadRes = await axios.post(`${API_BASE_URL}/api/cv/upload`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000,
    });

    const cvId = uploadRes.data.data?.cvId || uploadRes.data.cvId || uploadRes.data.id;
    console.log(`✅ Uploaded! CV ID: ${cvId}\n`);

    // Wait for parsing with timeout
    console.log('⏳ Waiting for parsing (timeout: 120 seconds)...');
    let status;
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts * 2 seconds = 120 seconds timeout

    while (attempts < maxAttempts) {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusRes = await axios.get(`${API_BASE_URL}/api/cv/${cvId}/status`, { timeout: 5000 });
        // Response format: { success: true, data: { status, progress, ... } }
        status = statusRes.data?.data || statusRes.data;
        
        const statusText = status?.status || 'unknown';
        const progress = status?.progress || 0;
        process.stdout.write(`\r   Status: ${statusText} (${progress}%) - Attempt ${attempts + 1}/${maxAttempts}`);
        
        if (statusText === 'parsed') {
          console.log('\n✅ CV parsed successfully!\n');
          break;
        }
        if (statusText === 'failed' || statusText === 'error') {
          console.error(`\n❌ CV parsing failed: ${status?.error?.message || status?.error || 'Unknown error'}\n`);
          process.exit(1);
        }
        attempts++;
      } catch (error) {
        console.error(`\n❌ Error checking status: ${error.message}`);
        if (attempts >= maxAttempts - 1) {
          console.error('Timeout reached. Check worker logs for details.');
          process.exit(1);
        }
        attempts++;
      }
    }

    if (!status || status?.status !== 'parsed') {
      console.log('\n⚠️  Timeout waiting for parsing');
      console.log('Final status:', JSON.stringify(status, null, 2));
      process.exit(1);
    }

    // Get CV data
    console.log('📥 Retrieving CV data...');
    const cvRes = await axios.get(`${API_BASE_URL}/api/cv/${cvId}`);
    const cvData = cvRes.data.data;

    if (!cvData) {
      console.error('❌ No CV data returned');
      process.exit(1);
    }

    console.log('✅ CV data retrieved!\n');
    console.log('📋 CV Summary:');
    console.log(`   Name: ${cvData.personal?.name || 'N/A'}`);
    console.log(`   Email: ${cvData.personal?.email || 'N/A'}`);
    console.log(`   Phone: ${cvData.personal?.phone || 'N/A'}`);
    console.log(`   Experience: ${cvData.experience?.length || 0} entries`);
    console.log(`   Education: ${cvData.education?.length || 0} entries`);
    console.log(`   Skills: ${cvData.skills?.technical?.length || 0} technical`);
    console.log('\n🎉 Test completed successfully!');
    console.log(`\n🔗 View CV: ${API_BASE_URL}/api/cv/${cvId}`);

  } catch (error) {
    console.error('\n❌ Test failed!');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', error.response.data);
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

test();
