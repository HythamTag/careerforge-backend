/**
 * Full System Flow Test Script
 * 
 * Tests the complete system sequence:
 * 1. Registration/Login
 * 2. CV Upload
 * 3. Parsing (wait for completion)
 * 4. Optimization
 * 5. ATS Analysis
 * 
 * Usage: node scripts/test-full-system-flow.js
 */

require('module-alias/register');
require('dotenv').config({ path: '.env' });

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Try to load form-data
let FormDataModule;
try {
  FormDataModule = require('form-data');
} catch (e) {
  FormDataModule = null;
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.TEST_EMAIL || `test-full-${Date.now()}@cv-enhancer-test.com`;
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!';
const SAMPLES_DIR = path.join(__dirname, '../../samples');
const LOGS_DIR = path.join(__dirname, '../src/logs');
const CVS_LOGS_DIR = path.join(LOGS_DIR, 'cvs');

/**
 * Register a test user or login
 */
async function authenticate() {
  try {
    console.log('👤 Step 1: Registering test user...');
    const registerResponse = await axios.post(`${API_BASE_URL}/v1/auth/register`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      firstName: 'Test',
      lastName: 'User',
    });
    
    if (registerResponse.data?.success) {
      console.log('✅ Registration successful, logging in...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const loginResponse = await axios.post(`${API_BASE_URL}/v1/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      
      if (loginResponse.data?.data?.token) {
        console.log('✅ Login successful');
        return loginResponse.data.data.token;
      }
    }
  } catch (registerError) {
    if (!registerError.response) {
      console.error('❌ Cannot connect to server. Is the backend running?');
      throw new Error(`Cannot connect to server at ${API_BASE_URL}`);
    }
    
    if (registerError.response?.status === 409 || 
        (registerError.response?.status === 400 && 
         registerError.response?.data?.error?.code === 'ERR_1002')) {
      console.log('👤 User already exists, logging in...');
      const loginResponse = await axios.post(`${API_BASE_URL}/v1/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      
      if (loginResponse.data?.data?.token) {
        console.log('✅ Login successful');
        return loginResponse.data.data.token;
      }
    } else {
      console.error('❌ Registration failed:', registerError.response?.data || registerError.message);
      throw registerError;
    }
  }
  
  throw new Error('Failed to authenticate');
}

/**
 * Upload a CV file
 */
async function uploadCV(filePath, token) {
  const fileName = path.basename(filePath);
  console.log(`\n📤 Step 2: Uploading CV: ${fileName}...`);
  
  try {
    const fileBuffer = await fs.readFile(filePath);
    const title = fileName.replace(/\.[^/.]+$/, '');
    
    let formData;
    let headers;
    
    if (FormDataModule) {
      formData = new FormDataModule();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'application/pdf',
      });
      formData.append('title', title);
      headers = {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders(),
      };
    } else {
      const boundary = `----WebKitFormBoundary${Date.now()}`;
      const multipartBody = Buffer.concat([
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`),
        Buffer.from(`Content-Type: application/pdf\r\n\r\n`),
        fileBuffer,
        Buffer.from(`\r\n--${boundary}\r\n`),
        Buffer.from(`Content-Disposition: form-data; name="title"\r\n\r\n`),
        Buffer.from(`${title}\r\n`),
        Buffer.from(`--${boundary}--\r\n`),
      ]);
      
      formData = multipartBody;
      headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': multipartBody.length.toString(),
      };
    }
    
    const response = await axios.post(`${API_BASE_URL}/v1/cvs/upload`, formData, {
      headers,
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    console.log(`✅ Upload successful`);
    console.log(`   CV ID: ${response.data?.data?.cvId || response.data?.data?.resumeId}`);
    if (response.data?.data?.parsing) {
      console.log(`   Parsing Job ID: ${response.data.data.parsing.jobId}`);
      console.log(`   Parsing Status: ${response.data.data.parsing.status}`);
    }
    
    return response.data?.data;
  } catch (error) {
    console.error(`❌ Upload failed:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Wait for parsing to complete
 */
async function waitForParsing(jobId, token, maxWait = 120000) {
  if (!jobId) {
    return null;
  }
  
  console.log(`\n⏳ Step 3: Waiting for parsing to complete (max ${maxWait / 1000}s)...`);
  
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const status = response.data?.data?.status;
      const progress = response.data?.data?.progress || 0;
      console.log(`   Status: ${status} (${progress}%)`);
      
      if (status === 'completed') {
        console.log('✅ Parsing completed');
        return response.data.data;
      } else if (status === 'failed') {
        console.log('❌ Parsing failed');
        console.log('   Error:', response.data?.data?.error || 'Unknown error');
        return response.data.data;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      if (error.response?.status === 404) {
        // Try parsing job endpoint (mounted at /v1/parse)
        try {
          const parsingResponse = await axios.get(`${API_BASE_URL}/v1/parse/${jobId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const status = parsingResponse.data?.data?.status;
          const progress = parsingResponse.data?.data?.progress || 0;
          console.log(`   Parsing Job Status: ${status} (${progress}%)`);
          if (status === 'completed' || status === 'failed') {
            return parsingResponse.data.data;
          }
        } catch (parseError) {
          // Ignore
        }
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('⚠️  Parsing timeout - check logs for details');
  return null;
}

/**
 * Get CV details including parsed content
 */
async function getCVDetails(cvId, token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/v1/cvs/${cvId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data?.data;
  } catch (error) {
    console.error('❌ Failed to get CV details:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Optimize CV content
 */
async function optimizeCV(cvId, cvData, token) {
  console.log(`\n🔧 Step 4: Optimizing CV content...`);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/v1/optimize`, {
      cvData: cvData || {},
      options: {
        temperature: 0.7,
      },
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
    
    console.log('✅ Optimization completed');
    console.log(`   Optimized sections: ${Object.keys(response.data?.data?.optimized || {}).length}`);
    return response.data?.data;
  } catch (error) {
    console.error('❌ Optimization failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Start ATS analysis
 */
async function startATSAnalysis(cvId, token) {
  console.log(`\n📊 Step 5: Starting ATS analysis...`);
  
  const targetJob = {
    title: 'Senior Software Engineer',
    description: 'We are looking for an experienced software engineer with strong skills in JavaScript, Node.js, React, and cloud technologies. The ideal candidate should have 5+ years of experience in full-stack development, experience with microservices architecture, and strong problem-solving skills.',
    company: 'Tech Corp',
    location: 'Remote',
  };
  
  // Try multiple possible endpoints
  const endpoints = [
    `${API_BASE_URL}/v1/cvs/${cvId}/analyze`,
    `${API_BASE_URL}/v1/cv-ats/analyze`,
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.post(endpoint, {
        cvId,
        type: 'comprehensive',
        priority: 'medium',
        targetJob,
        parameters: {
          includeSuggestions: true,
          detailedBreakdown: true,
        },
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
      
      console.log('✅ ATS analysis job started');
      console.log(`   Analysis Job ID: ${response.data?.data?.jobId}`);
      console.log(`   Status: ${response.data?.data?.status}`);
      
      return response.data?.data;
    } catch (error) {
      if (error.response?.status !== 404) {
        // If it's not a 404, this might be the right endpoint but with wrong data
        console.error(`❌ ATS analysis failed at ${endpoint}:`, error.response?.data || error.message);
        if (error.response?.data) {
          console.error('   Details:', JSON.stringify(error.response.data, null, 2));
        }
      }
      // Try next endpoint
    }
  }
  
  console.log('⚠️  Could not find ATS analysis endpoint');
  return null;
}

/**
 * Wait for ATS analysis to complete
 */
async function waitForATSAnalysis(jobId, token, maxWait = 120000) {
  if (!jobId) {
    return null;
  }
  
  console.log(`\n⏳ Waiting for ATS analysis to complete (max ${maxWait / 1000}s)...`);
  
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const status = response.data?.data?.status;
      const progress = response.data?.data?.progress || 0;
      console.log(`   Status: ${status} (${progress}%)`);
      
      if (status === 'completed') {
        console.log('✅ ATS analysis completed');
        return response.data.data;
      } else if (status === 'failed') {
        console.log('❌ ATS analysis failed');
        console.log('   Error:', response.data?.data?.error || 'Unknown error');
        return response.data.data;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('   Error checking ATS job status:', error.response?.data || error.message);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('⚠️  ATS analysis timeout');
  return null;
}

/**
 * Check CV logs folder
 */
async function checkCVLogs() {
  console.log(`\n📁 Step 6: Checking CV logs folder...`);
  
  try {
    if (!await fs.access(CVS_LOGS_DIR).then(() => true).catch(() => false)) {
      console.log('⚠️  CV logs directory does not exist');
      return;
    }
    
    const folders = await fs.readdir(CVS_LOGS_DIR);
    
    if (folders.length === 0) {
      console.log('⚠️  No CV log folders found');
      console.log('   Expected: logs/cvs/{cvId}_{title}_{timestamp}/');
      return;
    }
    
    console.log(`✅ Found ${folders.length} CV log folder(s):`);
    
    for (const folder of folders.slice(-5)) { // Show last 5 folders
      const folderPath = path.join(CVS_LOGS_DIR, folder);
      const files = await fs.readdir(folderPath);
      
      console.log(`\n   📂 ${folder}:`);
      const expectedFiles = [
        'metadata.json',
        'extracted_text.txt',
        'parsed_cv.json',
        'process.log',
        'result_success.json',
        'result_failed.json',
        'ai_response_raw.txt',
      ];
      
      for (const expectedFile of expectedFiles) {
        if (files.includes(expectedFile)) {
          const filePath = path.join(folderPath, expectedFile);
          const stats = await fs.stat(filePath);
          console.log(`      ✅ ${expectedFile} (${(stats.size / 1024).toFixed(2)} KB)`);
        } else {
          console.log(`      ❌ ${expectedFile} (missing)`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking CV logs:', error.message);
  }
}

/**
 * Check server and worker logs for errors
 */
async function checkSystemLogs() {
  console.log(`\n📋 Step 7: Checking system logs for errors...`);
  
  try {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '-');
    const logFiles = [
      `server-error-${today}.log`,
      `worker-error-${today}.log`,
      `server-${today}.log`,
      `worker-${today}.log`,
    ];
    
    for (const logFile of logFiles) {
      const logPath = path.join(LOGS_DIR, logFile);
      try {
        const stats = await fs.stat(logPath);
        const content = await fs.readFile(logPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        const errorLines = lines.filter(l => 
          l.includes('"level":"error"') || 
          l.includes('error') || 
          l.includes('Error') ||
          l.includes('failed') ||
          l.includes('Failed')
        );
        
        if (errorLines.length > 0) {
          console.log(`\n   ⚠️  ${logFile} (${errorLines.length} error(s)):`);
          errorLines.slice(-10).forEach(line => {
            try {
              const json = JSON.parse(line);
              console.log(`      - ${json.message || json.error?.message || 'Unknown error'}`);
            } catch {
              console.log(`      - ${line.substring(0, 100)}...`);
            }
          });
        } else {
          console.log(`   ✅ ${logFile} (no errors)`);
        }
      } catch {
        // File doesn't exist or can't be read
      }
    }
  } catch (error) {
    console.error('❌ Error checking system logs:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Full System Flow Test');
  console.log('='.repeat(80));
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Samples Directory: ${SAMPLES_DIR}`);
  console.log(`Logs Directory: ${LOGS_DIR}`);
  console.log('='.repeat(80));
  
  try {
    // Check if samples directory exists
    try {
      await fs.access(SAMPLES_DIR);
    } catch {
      console.error(`❌ Samples directory not found: ${SAMPLES_DIR}`);
      process.exit(1);
    }
    
    // Step 1: Authenticate
    const token = await authenticate();
    
    // Find PDF files
    const files = await fs.readdir(SAMPLES_DIR);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.error('❌ No PDF files found in samples directory');
      process.exit(1);
    }
    
    console.log(`\n📁 Found ${pdfFiles.length} PDF file(s):`);
    pdfFiles.forEach(file => console.log(`   - ${file}`));
    
    // Process first CV only for full flow test
    const pdfFile = pdfFiles[0];
    const filePath = path.join(SAMPLES_DIR, pdfFile);
    
    // Step 2: Upload CV
    const uploadResult = await uploadCV(filePath, token);
    if (!uploadResult?.resumeId) {
      throw new Error('Upload failed - no CV ID returned');
    }
    
    const cvId = uploadResult.resumeId;
    
    // Step 3: Wait for parsing
    if (uploadResult?.parsing?.jobId) {
      await waitForParsing(uploadResult.parsing.jobId, token);
    }
    
    // Get CV details to check if parsed
    const cvDetails = await getCVDetails(cvId, token);
    if (!cvDetails) {
      console.log('⚠️  Could not retrieve CV details');
    } else {
      console.log(`\n📄 CV Details:`);
      console.log(`   Title: ${cvDetails.title}`);
      console.log(`   Parsed: ${cvDetails.isParsed ? 'Yes' : 'No'}`);
      console.log(`   Parsing Status: ${cvDetails.parsingStatus || 'unknown'}`);
      
      // Step 4: Optimize CV (if parsed)
      if (cvDetails.isParsed && cvDetails.parsedContent) {
        await optimizeCV(cvId, cvDetails.parsedContent, token);
      } else {
        console.log('\n⚠️  Skipping optimization - CV not parsed yet');
      }
      
      // Step 5: ATS Analysis (if parsed)
      if (cvDetails.isParsed && cvDetails.parsedContent) {
        const atsResult = await startATSAnalysis(cvId, token);
        if (atsResult?.jobId) {
          await waitForATSAnalysis(atsResult.jobId, token);
        }
      } else {
        console.log('\n⚠️  Skipping ATS analysis - CV not parsed yet');
      }
    }
    
    // Step 6: Check CV logs
    await checkCVLogs();
    
    // Step 7: Check system logs
    await checkSystemLogs();
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Full system flow test completed!');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

