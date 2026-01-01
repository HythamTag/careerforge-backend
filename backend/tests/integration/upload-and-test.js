const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/v1';

async function uploadCV() {
  try {
    const cvPath = path.join(__dirname, '../../../samples/Hytham Tag CV.pdf');

    if (!fs.existsSync(cvPath)) {
      console.error('❌ CV file not found at:', cvPath);
      console.error('   Expected: "Hytham Tag CV.pdf" in project root directory');
      process.exit(1);
    }

    console.log('📄 Found CV file:', cvPath);
    console.log('🔐 Authenticating...');

    // Step 1: Register or login to get auth token
    let authToken;
    try {
      const testEmail = 'test@cv-enhancer.local';
      const testPassword = 'test123456';

      // Try to register a test user (will fail if exists, that's OK)
      try {
        await axios.post(`${API_BASE_URL}/auth/register`, {
          email: testEmail,
          password: testPassword,
          firstName: 'Test',
          lastName: 'User',
        });
        console.log('✅ Registered new test user');
      } catch (registerError) {
        // User might already exist (409 Conflict) or validation error, that's OK
        if (registerError.response?.status === 409 ||
          registerError.response?.data?.error?.message?.includes('already exists')) {
          console.log('ℹ️  Test user already exists, will login');
        } else {
          // Log but continue - registration might have succeeded without token
          console.log('ℹ️  Registration attempt result:', registerError.response?.status || registerError.message);
        }
      }

      // Always login to get token
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testEmail,
        password: testPassword,
      });
      authToken = loginResponse.data.token;
      console.log('✅ Logged in successfully');
    } catch (authError) {
      console.error('❌ Authentication failed:', authError.message);
      if (authError.response) {
        console.error('Response:', JSON.stringify(authError.response.data, null, 2));
      }
      process.exit(1);
    }

    // Step 2: Upload CV file and create CV in one step
    console.log('📤 Uploading CV file and creating CV...');
    const formData = new FormData();
    formData.append('title', 'Hytham Tag CV');
    formData.append('file', fs.createReadStream(cvPath), {
      filename: 'Hytham Tag CV.pdf',
      contentType: 'application/pdf',
    });

    let uploadResponse;
    try {
      uploadResponse = await axios.post(
        `${API_BASE_URL}/resumes/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 30000,
        },
      );
    } catch (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      if (uploadError.response) {
        console.error('Response status:', uploadError.response.status);
        console.error('Response data:', JSON.stringify(uploadError.response.data, null, 2));
      }
      process.exit(1);
    }

    console.log('✅ Upload successful!');
    console.log('   Full response:', JSON.stringify(uploadResponse.data, null, 2));

    const cvId = uploadResponse.data.data.cv?.id;
    const jobId = uploadResponse.data.data.parsingJob.jobId;
    console.log('   CV ID:', cvId);
    console.log('   Job ID:', jobId);
    console.log('   Status:', uploadResponse.data.data.cv?.status);

    // Parsing job already started automatically
    console.log('🚀 Parsing job already started automatically:', jobId);

    // Step 5: Monitor processing status in real-time
    console.log('\n📊 Monitoring processing status (streaming)...');
    console.log('   Press Ctrl+C to stop monitoring\n');

    let lastStatus = 'pending';
    let lastProgress = 0;
    const maxAttempts = 300; // 10 minutes max (2 second intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const statusResponse = await axios.get(
          `${API_BASE_URL}/v1/cvs/${cvId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
            timeout: 5000,
          },
        );

        const statusData = statusResponse.data.data;
        const currentStatus = statusData.status || statusData.jobStatus;
        const currentProgress = statusData.progress || 0;

        // Only show updates when status or progress changes
        if (currentStatus !== lastStatus || currentProgress !== lastProgress) {
          const timestamp = new Date().toLocaleTimeString();
          console.log(`[${timestamp}] Status: ${currentStatus} (${currentProgress}% complete)`);

          if (currentProgress > lastProgress) {
            console.log(`   Progress: ${lastProgress}% → ${currentProgress}%`);
          }

          lastStatus = currentStatus;
          lastProgress = currentProgress;
        }

        // Check if processing is complete
        if (currentStatus === 'completed' || currentStatus === 'success') {
          console.log('\n🎉 CV Processing Complete!');
          console.log('✅ Successfully parsed CV data');

          // Try to get the parsed result from the CV itself
          try {
            const resultResponse = await axios.get(
              `${API_BASE_URL}/v1/cvs/${cvId}`,
              {
                headers: { Authorization: `Bearer ${authToken}` },
              },
            );
            const resultData = resultResponse.data.data;

            console.log('\n📋 Extracted Information:');
            if (resultData.parsedData?.personal?.name) {
              console.log(`   👤 Name: ${resultData.parsedData.personal.name}`);
            }
            if (resultData.parsedData?.personal?.email) {
              console.log(`   📧 Email: ${resultData.parsedData.personal.email}`);
            }
            if (resultData.parsedData?.experience?.length > 0) {
              console.log(`   💼 Experience: ${resultData.parsedData.experience.length} positions`);
            }
            if (resultData.parsedData?.education?.length > 0) {
              console.log(`   🎓 Education: ${resultData.parsedData.education.length} entries`);
            }
            if (resultData.parsedData?.skills?.technical?.length > 0) {
              console.log(`   🛠️  Skills: ${resultData.parsedData.skills.technical.length} technical skills`);
            }
          } catch (resultError) {
            console.log('   (Could not retrieve detailed parsing result)');
          }

          break;
        } else if (currentStatus === 'failed' || currentStatus === 'error') {
          console.log('\n❌ CV Processing Failed!');
          if (statusData.error) {
            console.log('Error details:', JSON.stringify(statusData.error, null, 2));
          }
          break;
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2 seconds
        attempts++;

      } catch (err) {
        console.log(`[${new Date().toLocaleTimeString()}] Error checking status: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait longer on errors
        attempts++;
      }
    }

    if (attempts >= maxAttempts) {
      console.log('\n⏰ Monitoring timeout reached (10 minutes)');
      console.log('CV processing may still be running in the background');
      console.log(`Check status manually: curl -H "Authorization: Bearer ${authToken}" ${API_BASE_URL}/parse/${jobId}`);
    }

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Server may not be running on port 5000.');
      console.error('Error code:', error.code);
    } else {
      console.error('Error details:', error);
    }
    process.exit(1);
  }
}

uploadCV();

