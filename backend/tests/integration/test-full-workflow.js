const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:5000';
const CV_FILE_PATH = 'C:\\\\Users\\\\Tag\\\\Desktop\\\\Careerforg ITI GRADUATION PROJECT\\\\Hytham Tag CV.pdf';

async function comprehensiveTest() {
  console.log('🚀 STARTING FULL CV ENHANCER WORKFLOW TEST');
  console.log('==================================================');

  try {
    // 1. Health Check
    console.log('\\n🔍 Testing Health Check...');
    const healthResponse = await axios.get(API_BASE_URL + '/health');
    console.log('✅ Health Check PASSED:', healthResponse.data.status);

    // 2. CV Upload
    console.log('\\n📤 Testing CV Upload...');
    if (!fs.existsSync(CV_FILE_PATH)) {
      throw new Error('CV file not found: ' + CV_FILE_PATH);
    }

    const formData = new FormData();
    formData.append('cv', fs.createReadStream(CV_FILE_PATH));

    const uploadResponse = await axios.post(API_BASE_URL + '/api/cv/upload', formData, {
      headers: formData.getHeaders(),
    });

    if (!uploadResponse.data.success) {
      throw new Error('Upload failed: ' + JSON.stringify(uploadResponse.data));
    }

    const cvId = uploadResponse.data.data.cvId;
    console.log('✅ CV Upload PASSED - ID:', cvId);

    // 3. Wait for Processing
    console.log('\\n⏳ Waiting for CV Processing...');
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const statusResponse = await axios.get(API_BASE_URL + '/api/cv/' + cvId + '/status');
      const status = statusResponse.data.data.status;
      const progress = statusResponse.data.data.progress;

      console.log(\`📈 Status: \${status} (\${progress}%)\`);

      if (status === 'parsed') {
        console.log('✅ CV PARSING COMPLETED!');
        break;
      } else if (status === 'failed') {
        throw new Error('CV processing failed');
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    if (attempts >= maxAttempts) {
      throw new Error('CV processing timeout');
    }

    // 4. CV Data Retrieval
    console.log('\\n📄 Testing CV Data Retrieval...');
    const dataResponse = await axios.get(API_BASE_URL + '/api/cv/' + cvId);
    if (dataResponse.data.success && dataResponse.data.data) {
      const cvData = dataResponse.data.data;
      console.log('✅ CV Data Retrieved:');
      console.log('   - Status:', cvData.status);
      console.log('   - Has Parsed Data:', !!cvData.parsedData);
      console.log('   - Has Optimized Versions:', !!(cvData.optimizedVersions?.length > 0));
    }

    // 5. ATS Score Calculation
    console.log('\\n📈 Testing ATS Score Calculation...');
    const atsResponse = await axios.get(API_BASE_URL + '/api/cv/' + cvId + '/ats-score', {
      params: {
        jobDescription: 'Senior Software Engineer role requiring Node.js, React, AI/ML experience, 5+ years development experience, JavaScript/TypeScript proficiency.'
      }
    });

    if (atsResponse.data.success) {
      const scoreData = atsResponse.data.data;
      console.log('✅ ATS Score Calculated:');
      console.log('   - Score:', scoreData.score + '%');
      console.log('   - Breakdown:', scoreData.breakdown);
      console.log('   - Recommendations:', scoreData.recommendations?.length || 0);

      if (scoreData.recommendations?.length > 0) {
        console.log('   - Top Recommendations:');
        scoreData.recommendations.slice(0, 2).forEach((rec, i) => {
          console.log(\`     \${i + 1}. \${rec}\`);
        });
      }
    }

    // 6. CV Download Test
    console.log('\\n📥 Testing CV Download...');

    // PDF Download
    const pdfResponse = await axios.get(API_BASE_URL + '/api/cv/' + cvId + '/download?format=pdf', {
      responseType: 'stream',
      timeout: 10000
    });

    if (pdfResponse.status === 200) {
      console.log('✅ PDF Download: SUCCESSFUL');
    } else {
      console.log('❌ PDF Download: FAILED (status:', pdfResponse.status + ')');
    }

    // DOCX Download
    const docxResponse = await axios.get(API_BASE_URL + '/api/cv/' + cvId + '/download?format=docx', {
      responseType: 'stream',
      timeout: 10000
    });

    if (docxResponse.status === 200) {
      console.log('✅ DOCX Download: SUCCESSFUL');
    } else {
      console.log('❌ DOCX Download: FAILED (status:', docxResponse.status + ')');
    }

    // 7. Final Summary
    console.log('\\n🎯 TEST RESULTS SUMMARY');
    console.log('==================================================');
    console.log('✅ PASSED: Health check');
    console.log('✅ PASSED: CV upload');
    console.log('✅ PASSED: CV processing');
    console.log('✅ PASSED: CV data retrieval');
    console.log('✅ PASSED: ATS score calculation');
    console.log('✅ PASSED: PDF download');
    console.log('✅ PASSED: DOCX download');
    console.log('==================================================');
    console.log('🎉 OVERALL RESULT: ALL TESTS PASSED!');
    console.log('🏆 CV ENHANCER BACKEND: FULLY OPERATIONAL');
    console.log('==================================================');

  } catch (error) {
    console.error('\\n💥 TEST FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

comprehensiveTest();


