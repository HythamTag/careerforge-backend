/**
 * Test CV Upload Script
 * 
 * Uploads CVs from the samples folder and checks logs for debug information.
 * 
 * Usage: node scripts/test-cv-upload-samples.js
 */

require('module-alias/register');
require('dotenv').config({ path: '.env' });

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Try to load form-data, fallback to manual construction if not available
let FormDataModule;
try {
  FormDataModule = require('form-data');
} catch (e) {
  FormDataModule = null;
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.TEST_EMAIL || `test-${Date.now()}@cv-enhancer-test.com`;
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!';
const SAMPLES_DIR = path.join(__dirname, '../../samples');
const LOGS_DIR = path.join(__dirname, '../src/logs');

/**
 * Register a test user or login
 */
async function authenticate() {
  // Try to register first (will fail if user exists, then we'll login)
  try {
    console.log('👤 Attempting to register test user...');
    const registerResponse = await axios.post(`${API_BASE_URL}/v1/auth/register`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      firstName: 'Test',
      lastName: 'User',
    });
    
    // Registration successful, but doesn't return token - need to login
    if (registerResponse.data?.success) {
      console.log('✅ Registration successful, logging in...');
      // Wait a moment for user to be fully created
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
      console.error('   Error:', registerError.message);
      console.error(`   URL: ${API_BASE_URL}`);
      throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please ensure the backend is running.`);
    }
    
    // If user already exists (409 or 400), try to login
    if (registerError.response?.status === 409 || 
        (registerError.response?.status === 400 && 
         registerError.response?.data?.error?.code === 'ERR_1002')) {
      console.log('👤 User already exists, attempting to login...');
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/v1/auth/login`, {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });
        
        if (loginResponse.data?.data?.token) {
          console.log('✅ Login successful');
          return loginResponse.data.data.token;
        }
      } catch (loginError) {
        console.error('❌ Login failed:', loginError.response?.data || loginError.message);
        throw loginError;
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
  console.log(`\n📤 Uploading: ${fileName}...`);
  
  try {
    const fileBuffer = await fs.readFile(filePath);
    const title = fileName.replace(/\.[^/.]+$/, '');
    
    let formData;
    let headers;
    
    if (FormDataModule) {
      // Use form-data package
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
      // Manual multipart/form-data construction
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
      timeout: 120000, // 2 minutes timeout
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    console.log(`✅ Upload successful for ${fileName}`);
    console.log(`   CV ID: ${response.data?.data?.cvId || response.data?.data?.resumeId}`);
    if (response.data?.data?.parsing) {
      console.log(`   Parsing Job ID: ${response.data.data.parsing.jobId}`);
      console.log(`   Parsing Status: ${response.data.data.parsing.status}`);
    }
    
    return response.data?.data;
  } catch (error) {
    console.error(`❌ Upload failed for ${fileName}:`, error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Read and display log files
 */
async function checkLogs() {
  console.log('\n📋 Checking logs...\n');
  
  try {
    const logFiles = await fs.readdir(LOGS_DIR);
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '-');
    
    // Find today's log files
    const todayLogs = logFiles.filter(file => file.includes(today));
    
    if (todayLogs.length === 0) {
      console.log('⚠️  No log files found for today');
      return;
    }
    
    for (const logFile of todayLogs) {
      const logPath = path.join(LOGS_DIR, logFile);
      const stats = await fs.stat(logPath);
      
      // Only read if file was modified recently (last 5 minutes) or is error log
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (stats.mtimeMs > fiveMinutesAgo || logFile.includes('error')) {
        console.log(`\n📄 ${logFile} (${(stats.size / 1024).toFixed(2)} KB):`);
        console.log('─'.repeat(80));
        
        try {
          const content = await fs.readFile(logPath, 'utf-8');
          const lines = content.split('\n');
          
          // Show last 50 lines for regular logs, all lines for error logs
          const linesToShow = logFile.includes('error') ? lines : lines.slice(-50);
          
          for (const line of linesToShow) {
            if (line.trim()) {
              console.log(line);
            }
          }
          
          if (!logFile.includes('error') && lines.length > 50) {
            console.log(`\n... (showing last 50 of ${lines.length} lines)`);
          }
        } catch (readError) {
          console.error(`   Error reading log file: ${readError.message}`);
        }
        
        console.log('─'.repeat(80));
      }
    }
  } catch (error) {
    console.error('❌ Error checking logs:', error.message);
  }
}

/**
 * Wait for parsing to complete
 */
async function waitForParsing(jobId, token, maxWait = 60000) {
  if (!jobId) {
    return null;
  }
  
  console.log(`\n⏳ Waiting for parsing to complete (max ${maxWait / 1000}s)...`);
  
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const status = response.data?.data?.status;
      console.log(`   Status: ${status}`);
      
      if (status === 'completed') {
        console.log('✅ Parsing completed');
        return response.data.data;
      } else if (status === 'failed') {
        console.log('❌ Parsing failed');
        console.log('   Error:', response.data?.data?.error || 'Unknown error');
        return response.data.data;
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('   Error checking job status:', error.response?.data || error.message);
      break;
    }
  }
  
  console.log('⚠️  Parsing timeout - check logs for details');
  return null;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 CV Upload Test Script');
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
    
    // Authenticate
    const token = await authenticate();
    
    // Find PDF files in samples directory
    const files = await fs.readdir(SAMPLES_DIR);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.error('❌ No PDF files found in samples directory');
      process.exit(1);
    }
    
    console.log(`\n📁 Found ${pdfFiles.length} PDF file(s):`);
    pdfFiles.forEach(file => console.log(`   - ${file}`));
    
    // Upload each CV
    const uploadResults = [];
    for (const pdfFile of pdfFiles) {
      const filePath = path.join(SAMPLES_DIR, pdfFile);
      try {
        const result = await uploadCV(filePath, token);
        uploadResults.push({ file: pdfFile, success: true, result });
        
        // Wait for parsing if job was started
        if (result?.parsing?.jobId) {
          await waitForParsing(result.parsing.jobId, token);
        }
        
        // Small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        uploadResults.push({ file: pdfFile, success: false, error: error.message });
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 Upload Summary:');
    console.log('='.repeat(80));
    uploadResults.forEach(({ file, success, result, error }) => {
      if (success) {
        console.log(`✅ ${file}: Success (CV ID: ${result?.cvId || result?.resumeId})`);
      } else {
        console.log(`❌ ${file}: Failed - ${error}`);
      }
    });
    
    // Check logs
    await checkLogs();
    
    console.log('\n✅ Test completed!');
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

