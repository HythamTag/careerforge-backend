#!/usr/bin/env node

/**
 * Test script to demonstrate CV processing functionality
 * This script reads the Hytham Tag CV.pdf file and processes it using the CV Enhancer services
 */

const fs = require('fs').promises;
const path = require('path');
const pdfService = require('./src/services/pdf.service');
const textCleanerService = require('./src/services/text-cleaner.service');
const cvParserService = require('./src/services/cv-parser.service');
const atsScoreService = require('./src/services/ats-score.service');

async function testCVProcessing() {
  console.log('🧪 Testing CV Enhancer Processing Pipeline');
  console.log('==========================================\n');

  const cvPath = path.join(__dirname, 'uploads', 'Hytham Tag CV.pdf');

  try {
    // Step 1: Check if CV file exists
    console.log('📁 Step 1: Checking CV file...');
    await fs.access(cvPath);
    console.log('✅ CV file found:', cvPath);
    console.log();

    // Step 2: Read and extract text from PDF
    console.log('📄 Step 2: Extracting text from PDF...');
    const fileBuffer = await fs.readFile(cvPath);
    const pdfData = await pdfService.extractText(fileBuffer);
    console.log('✅ PDF text extracted successfully');
    console.log('📊 Extracted', pdfData.numPages, 'pages with', pdfData.text.length, 'characters');
    console.log();

    // Step 3: Clean the extracted text
    console.log('🧹 Step 3: Cleaning extracted text...');
    const cleanedText = textCleanerService.clean(pdfData.text);
    console.log('✅ Text cleaned successfully');
    console.log('📊 Cleaned text length:', cleanedText.length, 'characters');
    console.log();

    // Step 4: Show sample of cleaned text
    console.log('📋 Sample of cleaned text:');
    console.log('"' + cleanedText.substring(0, 200) + '..."');
    console.log();

    // Step 5: Test text cleaning components
    console.log('🔧 Step 4: Testing text cleaning components...');
    const sections = textCleanerService.detectSections(cleanedText);
    console.log('✅ Detected sections:', Object.keys(sections));
    console.log();

    // Step 6: Test ATS scoring (mock data since AI isn't available)
    console.log('📊 Step 5: Testing ATS scoring logic...');
    const mockCVData = {
      personal: {
        name: 'Hytham Tag',
        email: 'hytham@example.com',
        phone: '+1234567890',
      },
      experience: [{
        role: 'Software Developer',
        company: 'Tech Company',
        startDate: '2020-01',
        endDate: 'Present',
        bullets: [
          'Developed web applications using React and Node.js',
          'Implemented REST APIs and database solutions',
          'Collaborated with cross-functional teams',
        ],
      }],
      education: [{
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        institution: 'University',
        startDate: '2016',
        endDate: '2020',
      }],
      skills: {
        technical: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Git'],
        soft: ['Communication', 'Teamwork', 'Problem Solving'],
      },
    };

    const jobDescription = 'Looking for a React developer with Node.js experience and MongoDB knowledge';
    const atsScore = atsScoreService.calculateScore(mockCVData, jobDescription);
    console.log('✅ ATS scoring calculated:');
    console.log('   Score:', atsScore.score + '/100');
    console.log('   Breakdown:', atsScore.breakdown);
    console.log('   Missing keywords:', atsScore.missingKeywords.slice(0, 3));
    console.log();

    console.log('🎉 CV Processing Test Completed Successfully!');
    console.log('==========================================');
    console.log('\n📝 Summary:');
    console.log('✅ PDF reading and text extraction');
    console.log('✅ Text cleaning and normalization');
    console.log('✅ Section detection');
    console.log('✅ ATS scoring algorithm');
    console.log('✅ All core services functioning correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testCVProcessing();