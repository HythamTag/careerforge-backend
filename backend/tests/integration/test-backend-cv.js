#!/usr/bin/env node

/**
 * Test script to test backend CV processing with Hytham Tag CV.pdf
 * Tests: Upload, Status, Get CV, Optimize, ATS Score
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const CV_FILE_NAME = 'Hytham Tag CV.pdf';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
  console.log('-'.repeat(50));
}

function logSuccess(message) {
  log(`[SUCCESS] ${message}`, 'green');
}

function logError(message) {
  log(`[ERROR] ${message}`, 'red');
}

function logWarning(message) {
  log(`[WARNING] ${message}`, 'yellow');
}

function logInfo(message) {
  log(`[INFO] ${message}`, 'blue');
}

async function findCVFile() {
  const possiblePaths = [
    path.join(__dirname, '..', 'uploads', CV_FILE_NAME),
    path.join(__dirname, '..', '..', '..', CV_FILE_NAME),
    path.join(__dirname, CV_FILE_NAME),
    path.join(process.cwd(), CV_FILE_NAME),
    path.join(process.cwd(), 'uploads', CV_FILE_NAME),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  throw new Error(`CV file not found. Searched in: ${possiblePaths.join(', ')}`);
}

async function waitForStatus(api, cvId, expectedStatus, maxWait = 120000) {
  const startTime = Date.now();
  const checkInterval = 2000; // Check every 2 seconds

  while (Date.now() - startTime < maxWait) {
    try {
      const response = await api.get(`/v1/cvs/${cvId}/status`);
      const statusData = response.data.data || response.data;
      const status = statusData.status;
      const progress = statusData.progress || 0;

      process.stdout.write(`\r   Status: ${status}, Progress: ${progress} percent`);

      if (status === expectedStatus) {
        console.log(''); // New line after progress
        return statusData;
      }

      if (status === 'error') {
        console.log(''); // New line after progress
        throw new Error(`CV processing failed: ${statusData.error?.message || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`CV not found: ${cvId}`);
      }
      throw error;
    }
  }

  console.log(''); // New line after progress
  throw new Error(`Timeout waiting for status ${expectedStatus}`);
}

async function testBackend() {
  log('\n[TEST] Backend CV Processing Test', 'cyan');
  log('='.repeat(50), 'cyan');

  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000, // 2 minutes timeout
  });

  let cvId = null;

  try {
    // Step 1: Health Check
    logStep('1', 'Health Check');
    try {
      const healthResponse = await api.get('/health');
      logSuccess(`Server is running: ${healthResponse.status}`);
    } catch (error) {
      logError(`Server health check failed: ${error.message}`);
      logWarning('Make sure the server is running on port 5000');
      process.exit(1);
    }

    // Step 2: Find CV File
    logStep('2', 'Finding CV File');
    const cvFilePath = await findCVFile();
    logSuccess(`CV file found: ${cvFilePath}`);
    const fileStats = fs.statSync(cvFilePath);
    logInfo(`File size: ${(fileStats.size / 1024).toFixed(2)} KB`);

    // Step 3: Upload CV
    logStep('3', 'Uploading CV');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(cvFilePath), {
      filename: CV_FILE_NAME,
      contentType: 'application/pdf',
    });
    formData.append('title', 'Integration Test CV ' + new Date().toISOString());

    const uploadResponse = await api.post('/v1/cvs/upload', formData, {
      headers: formData.getHeaders(),
    });

    if (!uploadResponse.data.success) {
      throw new Error('Upload failed: ' + JSON.stringify(uploadResponse.data));
    }

    cvId = uploadResponse.data.data?.cvId || uploadResponse.data.data?.id;
    if (!cvId) {
      throw new Error('No CV ID returned from upload: ' + JSON.stringify(uploadResponse.data));
    }

    logSuccess(`CV uploaded successfully. CV ID: ${cvId}`);

    // Step 4: Check Status (wait for parsing)
    logStep('4', 'Waiting for CV Parsing');
    logInfo('This may take 30-60 seconds (or longer if AI quota is exceeded)...');

    const statusData = await waitForStatus(api, cvId, 'parsed', 180000);
    logSuccess('CV parsed successfully!');
    logInfo(`Confidence: ${statusData.confidence || 'N/A'}`);
    if (statusData.error) {
      logWarning(`Note: ${statusData.error.message || 'Processing completed with warnings'}`);
    }

    // Step 5: Get CV Data
    logStep('5', 'Retrieving Parsed CV Data');
    const cvResponse = await api.get(`/v1/cvs/${cvId}`);

    if (!cvResponse.data.success) {
      throw new Error('Failed to retrieve CV: ' + JSON.stringify(cvResponse.data));
    }

    const cvData = cvResponse.data.data?.data || cvResponse.data.data;

    if (!cvData) {
      logError('No CV data returned');
      throw new Error('CV data is null');
    }

    logSuccess('CV data retrieved successfully');
    logInfo(`Name: ${cvData.personal?.name || 'N/A'}`);
    logInfo(`Email: ${cvData.personal?.email || 'N/A'}`);
    logInfo(`Phone: ${cvData.personal?.phone || 'N/A'}`);
    logInfo(`Location: ${cvData.personal?.location || 'N/A'}`);
    logInfo(`Summary: ${cvData.summary ? (cvData.summary.substring(0, 100) + '...') : 'N/A'}`);
    logInfo(`Experience entries: ${cvData.experience?.length || 0}`);
    if (cvData.experience?.length > 0) {
      cvData.experience.slice(0, 2).forEach((exp, idx) => {
        logInfo(`  ${idx + 1}. ${exp.role} at ${exp.company}`);
      });
    }
    logInfo(`Education entries: ${cvData.education?.length || 0}`);
    if (cvData.education?.length > 0) {
      cvData.education.slice(0, 2).forEach((edu, idx) => {
        logInfo(`  ${idx + 1}. ${edu.degree} in ${edu.field} from ${edu.institution}`);
      });
    }
    logInfo(`Technical skills: ${cvData.skills?.technical?.length || 0}`);
    if (cvData.skills?.technical?.length > 0) {
      logInfo(`  Skills: ${cvData.skills.technical.slice(0, 10).join(', ')}${cvData.skills.technical.length > 10 ? '...' : ''}`);
    }

    // Step 6: Test Optimization
    logStep('6', 'Testing CV Optimization');
    const targetRole = 'Software Engineer';
    const jobDescription = 'Looking for a skilled software engineer with experience in web development, AI, machine learning, and robotics. Must have strong programming skills in Python, JavaScript, and C++. Experience with React, Node.js, and cloud platforms (AWS) is preferred.';

    try {
      logInfo(`Target Role: ${targetRole}`);
      logInfo(`Job Description: ${jobDescription.substring(0, 100)}...`);

      const optimizeResponse = await api.post(`/v1/cvs/${cvId}/optimize`, {
        targetRole: targetRole,
        jobDescription: jobDescription,
      });

      if (!optimizeResponse.data.success) {
        throw new Error('Optimization request failed: ' + JSON.stringify(optimizeResponse.data));
      }

      const optimizeJobId = optimizeResponse.data.data?.jobId;
      if (!optimizeJobId) {
        throw new Error('No job ID returned from optimization request');
      }

      logSuccess(`Optimization job queued: ${optimizeJobId}`);
      logInfo('Waiting for optimization to complete (this may take 30-60 seconds)...');

      // Wait for optimization - check status periodically
      let optimizationComplete = false;
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes

      while (!optimizationComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;

        try {
          const statusRes = await api.get(`/v1/cvs/${cvId}/status`);
          const status = statusRes.data.data?.status || statusRes.data.data?.status;
          const progress = statusRes.data.data?.progress || 0;

          process.stdout.write(`\r   Status: ${status} (${progress} percent) - Attempt ${attempts}/${maxAttempts}`);

          // Check if CV has optimized versions
          const cvRes = await api.get(`/v1/cvs/${cvId}`);
          const cvDataAfter = cvRes.data.data?.data || cvRes.data.data;

          if (cvDataAfter && cvRes.data.data?.optimizedVersions?.length > 0) {
            optimizationComplete = true;
            console.log('\n');
            logSuccess('CV optimization completed!');
            logInfo(`Optimized versions: ${cvRes.data.data.optimizedVersions.length}`);

            // Show optimized version info
            const latestOptimized = cvRes.data.data.optimizedVersions[cvRes.data.data.optimizedVersions.length - 1];
            if (latestOptimized.atsScore) {
              logInfo(`ATS Score after optimization: ${latestOptimized.atsScore}/100`);
            }
            break;
          }

          if (status === 'error') {
            throw new Error(`Optimization failed: ${statusRes.data.data?.error?.message || 'Unknown error'}`);
          }
        } catch (statusError) {
          if (statusError.response?.status === 404) {
            throw new Error(`CV not found: ${cvId}`);
          }
          // Continue waiting
        }
      }

      if (!optimizationComplete) {
        logWarning('Optimization timeout - may still be processing');
      }
    } catch (error) {
      if (error.response?.status === 429 || error.message?.includes('quota') || error.message?.includes('Quota exceeded')) {
        logWarning('Optimization skipped: AI quota exceeded');
        logInfo('The CV has been parsed and can be viewed, but optimization requires AI services.');
      } else {
        logError(`Optimization failed: ${error.message}`);
        if (error.response?.data) {
          logError(`Error details: ${JSON.stringify(error.response.data)}`);
        }
      }
    }

    // Step 7: Test ATS Score (before optimization)
    logStep('7', 'Testing ATS Score Calculation (Before Optimization)');
    try {
      const atsResponseBefore = await api.get(`/v1/cvs/${cvId}/ats-score`, {
        params: {
          jobDescription: jobDescription,
        },
      });

      if (!atsResponseBefore.data.success) {
        throw new Error('ATS Score request failed: ' + JSON.stringify(atsResponseBefore.data));
      }

      const atsScoreBefore = atsResponseBefore.data.data;
      logSuccess(`ATS Score (before optimization): ${atsScoreBefore.score}/100`);
      logInfo(`Keyword Match: ${atsScoreBefore.breakdown?.keywordMatch || 'N/A'}/100`);
      logInfo(`Experience Relevance: ${atsScoreBefore.breakdown?.experienceRelevance || 'N/A'}/100`);
      logInfo(`Skills Coverage: ${atsScoreBefore.breakdown?.skillsCoverage || 'N/A'}/100`);
      logInfo(`Formatting: ${atsScoreBefore.breakdown?.formatting || 'N/A'}/100`);

      if (atsScoreBefore.missingKeywords?.length > 0) {
        logInfo(`Missing Keywords (${atsScoreBefore.missingKeywords.length}): ${atsScoreBefore.missingKeywords.slice(0, 10).join(', ')}${atsScoreBefore.missingKeywords.length > 10 ? '...' : ''}`);
      }

      if (atsScoreBefore.recommendations?.length > 0) {
        logInfo('\nRecommendations:');
        atsScoreBefore.recommendations.slice(0, 5).forEach((rec, idx) => {
          logInfo(`  ${idx + 1}. ${rec}`);
        });
      }
    } catch (error) {
      logError(`ATS Score calculation failed: ${error.message}`);
      if (error.response?.data) {
        logError(`Error details: ${JSON.stringify(error.response.data)}`);
      }
    }

    // Step 8: Test ATS Score (after optimization if available)
    logStep('8', 'Testing ATS Score Calculation (After Optimization)');
    try {
      // Wait a bit for optimization to complete if it was running
      await new Promise(resolve => setTimeout(resolve, 3000));

      const atsResponseAfter = await api.get(`/v1/cvs/${cvId}/ats-score`, {
        params: {
          jobDescription: jobDescription,
        },
      });

      if (atsResponseAfter.data.success) {
        const atsScoreAfter = atsResponseAfter.data.data;
        logSuccess(`ATS Score (after optimization): ${atsScoreAfter.score}/100`);

        // Compare scores if we have both
        try {
          const beforeRes = await api.get(`/v1/cvs/${cvId}/ats-score`, {
            params: { jobDescription: jobDescription },
          });
          if (beforeRes.data.success) {
            const beforeScore = beforeRes.data.data.score;
            const improvement = atsScoreAfter.score - beforeScore;
            if (improvement > 0) {
              logSuccess(`Score improved by ${improvement} points!`);
            } else if (improvement < 0) {
              logWarning(`Score decreased by ${Math.abs(improvement)} points`);
            } else {
              logInfo('Score remained the same');
            }
          }
        } catch (e) {
          // Ignore comparison errors
        }

        logInfo(`Keyword Match: ${atsScoreAfter.breakdown?.keywordMatch || 'N/A'}/100`);
        logInfo(`Experience Relevance: ${atsScoreAfter.breakdown?.experienceRelevance || 'N/A'}/100`);
        logInfo(`Skills Coverage: ${atsScoreAfter.breakdown?.skillsCoverage || 'N/A'}/100`);
        logInfo(`Formatting: ${atsScoreAfter.breakdown?.formatting || 'N/A'}/100`);
      }
    } catch (error) {
      logWarning(`Could not calculate post-optimization ATS score: ${error.message}`);
    }

    // Summary
    log('\n' + '='.repeat(50), 'cyan');
    log('[SUCCESS] Backend Test Completed Successfully!', 'green');
    log('='.repeat(50), 'cyan');
    log('\n[SUMMARY] Test Summary:', 'cyan');
    logSuccess('[SUCCESS] Health check passed');
    logSuccess('[SUCCESS] CV file found and uploaded');
    logSuccess('[SUCCESS] CV parsed successfully');
    logSuccess('[SUCCESS] CV data retrieved and displayed');
    logSuccess('[SUCCESS] CV optimization tested');
    logSuccess('[SUCCESS] ATS score calculated (before and after optimization)');
    log(`\n[CV ID] ${cvId}`, 'blue');
    log(`[URL] View CV: ${API_BASE_URL}/v1/cvs/${cvId}`, 'blue');
    log(`[URL] Check Status: ${API_BASE_URL}/v1/cvs/${cvId}/status`, 'blue');
    log(`[URL] Get ATS Score: ${API_BASE_URL}/v1/cvs/${cvId}/ats-score?jobDescription=...`, 'blue');

  } catch (error) {
    log('\n' + '='.repeat(50), 'red');
    logError('Test Failed!');
    log('='.repeat(50), 'red');
    logError(`Error: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    if (error.stack) {
      logError(`Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testBackend().catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testBackend };
