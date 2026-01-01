const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:5000';
const CV_FILE_PATH = 'C:\\\\Users\\\\Tag\\\\Desktop\\\\Careerforg ITI GRADUATION PROJECT\\\\Hytham Tag CV.pdf';

async function testUpload() {
  console.log('🔄 Testing CV Upload with fixed worker...');

  if (!fs.existsSync(CV_FILE_PATH)) {
    console.log('❌ CV file not found:', CV_FILE_PATH);
    return;
  }

  const formData = new FormData();
  formData.append('cv', fs.createReadStream(CV_FILE_PATH));

  try {
    const response = await axios.post(API_BASE_URL + '/api/cv/upload', formData, {
      headers: formData.getHeaders(),
    });

    if (response.data.success && response.data.data.cvId) {
      const cvId = response.data.data.cvId;
      console.log('✅ CV Upload PASSED:', { cvId, status: response.data.data.status });

      // Test status checking
      console.log('⏳ Monitoring CV processing...');
      await monitorStatus(cvId);
    }
  } catch (error) {
    console.log('❌ Upload FAILED:', error.response?.data || error.message);
  }
}

async function monitorStatus(cvId) {
  let attempts = 0;
  const maxAttempts = 20; // 3.3 minutes

  while (attempts < maxAttempts) {
    try {
      const response = await axios.get(API_BASE_URL + '/api/cv/' + cvId + '/status');

      if (response.data.success) {
        const status = response.data.data.status;
        const progress = response.data.data.progress;

        console.log('📊 Status:', { status, progress: progress + '%' });

        if (status === 'parsed') {
          console.log('🎉 CV PARSING COMPLETED!');
          await testOptimization(cvId);
          return;
        } else if (status === 'failed') {
          console.log('❌ CV PROCESSING FAILED');
          return;
        }
      }
    } catch (error) {
      console.log('❌ Status check failed:', error.message);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
  }

  console.log('⏰ Timeout: CV processing took too long');
}

async function testOptimization(cvId) {
  console.log('🚀 Testing CV Optimization...');

  try {
    const response = await axios.post(API_BASE_URL + '/api/cv/' + cvId + '/optimize', {
      targetRole: 'Senior Software Engineer',
      jobDescription: 'We are looking for a Senior Software Engineer with expertise in Node.js, React, and AI/ML technologies. The ideal candidate should have 5+ years of experience in full-stack development, strong proficiency in JavaScript/TypeScript, and experience with AI/ML frameworks.',
    });

    if (response.data.success) {
      console.log('✅ Optimization request accepted:', response.data.data);
      console.log('⏳ Monitoring optimization...');
      await monitorOptimization(cvId);
    }
  } catch (error) {
    console.log('❌ Optimization failed:', error.response?.data || error.message);
  }
}

async function monitorOptimization(cvId) {
  let attempts = 0;
  const maxAttempts = 15; // 2.5 minutes

  while (attempts < maxAttempts) {
    try {
      const response = await axios.get(API_BASE_URL + '/api/cv/' + cvId + '/status');

      if (response.data.success) {
        const status = response.data.data.status;
        const progress = response.data.data.progress;

        console.log('📊 Optimization Status:', { status, progress: progress + '%' });

        if (status === 'optimized') {
          console.log('🎉 CV OPTIMIZATION COMPLETED!');
          await testATSScore(cvId);
          return;
        } else if (status === 'failed') {
          console.log('❌ CV OPTIMIZATION FAILED');
          return;
        }
      }
    } catch (error) {
      console.log('❌ Optimization status check failed:', error.message);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
  }

  console.log('⏰ Timeout: CV optimization took too long');
}

async function testATSScore(cvId) {
  console.log('📈 Testing ATS Score Calculation...');

  try {
    const response = await axios.get(API_BASE_URL + '/api/cv/' + cvId + '/ats-score', {
      params: {
        jobDescription: 'Senior Software Engineer role requiring Node.js, React, AI/ML experience, 5+ years development experience, JavaScript/TypeScript proficiency.',
      },
    });

    if (response.data.success) {
      const scoreData = response.data.data;
      console.log('✅ ATS Score Calculated:');
      console.log('   - Score:', scoreData.score + '%');
      console.log('   - Recommendations:', scoreData.recommendations?.length || 0);

      if (scoreData.recommendations?.length > 0) {
        console.log('   - Top Recommendations:');
        scoreData.recommendations.slice(0, 2).forEach((rec, i) => {
          console.log(`     ${i + 1}. ${rec}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ ATS Score failed:', error.response?.data || error.message);
  }
}

testUpload();


