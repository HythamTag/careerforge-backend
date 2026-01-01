#!/usr/bin/env node

/**
 * Minimal test server for CV upload testing
 * Skips all external dependencies (MongoDB, Redis, AI)
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload configuration
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `cv-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10485760 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// Mock data storage
const mockCVs = new Map();

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mode: 'test-server-no-db',
  });
});

app.post('/api/cv/upload', upload.single('cv'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'File is required' },
      });
    }

    const cvId = `cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Mock CV data
    const mockCV = {
      _id: cvId,
      originalFileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      status: 'parsed', // Skip to parsed for testing
      createdAt: new Date(),
      updatedAt: new Date(),
      parsedData: {
        version: 1,
        extractedAt: new Date(),
        confidence: 0.9,
        data: {
          personal: {
            name: 'Hytham Tag',
            email: 'hytham@example.com',
            phone: '+1234567890',
            location: 'Test Location',
          },
          summary: 'Experienced Mechatronics Engineer with expertise in robotics and automation systems.',
          experience: [
            {
              role: 'Mechatronics Engineer',
              company: 'Tech Company',
              startDate: '2020-01',
              endDate: 'Present',
              bullets: [
                'Designed and implemented robotic systems',
                'Developed control algorithms',
                'Collaborated with cross-functional teams',
              ],
            },
          ],
          education: [
            {
              degree: 'Bachelor of Science',
              field: 'Mechatronics Engineering',
              institution: 'University',
              startDate: '2016',
              endDate: '2020',
            },
          ],
          skills: {
            technical: ['C++', 'Python', 'ROS', 'MATLAB', 'SolidWorks'],
            soft: ['Problem Solving', 'Team Collaboration', 'Project Management'],
          },
        },
      },
    };

    mockCVs.set(cvId, mockCV);

    console.log(`📁 CV uploaded: ${cvId} (${req.file.originalname})`);

    res.status(202).json({
      success: true,
      data: {
        cvId,
        status: 'processing',
      },
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: error.message },
    });
  }
});

app.get('/api/cv/:id/status', (req, res) => {
  const { id } = req.params;
  const cv = mockCVs.get(id);

  if (!cv) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'CV not found' },
    });
  }

  res.json({
    success: true,
    data: {
      cvId: id,
      status: cv.status,
      progress: 100,
    },
  });
});

app.get('/api/cv/:id', (req, res) => {
  const { id } = req.params;
  const cv = mockCVs.get(id);

  if (!cv) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'CV not found' },
    });
  }

  res.json({
    success: true,
    data: {
      cvId: id,
      data: cv.parsedData?.data || null,
      metadata: {
        uploadedAt: cv.createdAt,
        processedAt: cv.parsedData?.extractedAt,
        version: cv.parsedData?.version || 0,
        confidence: cv.parsedData?.confidence,
      },
    },
  });
});

app.post('/api/cv/:id/optimize', (req, res) => {
  const { id } = req.params;
  const cv = mockCVs.get(id);

  if (!cv) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'CV not found' },
    });
  }

  const jobId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Mock optimization - add optimized version
  const optimizedData = { ...cv.parsedData.data };
  optimizedData.optimizedVersions = [{
    version: 1,
    targetRole: req.body.targetRole || 'Software Engineer',
    optimizedAt: new Date(),
    data: optimizedData,
  }];

  console.log(`⚡ CV optimized: ${id} for role: ${req.body.targetRole || 'Software Engineer'}`);

  res.status(202).json({
    success: true,
    data: {
      jobId,
      status: 'completed',
    },
  });
});

app.get('/api/cv/:id/ats-score', (req, res) => {
  const { id } = req.params;
  const cv = mockCVs.get(id);
  const jobDescription = req.query.jobDescription || 'Software engineer with experience in robotics and programming';

  if (!cv) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'CV not found' },
    });
  }

  // Mock ATS score calculation
  const score = 78;
  const breakdown = {
    keywordMatch: 32,
    experienceRelevance: 23,
    skillsCoverage: 16,
    formatting: 7,
  };

  console.log(`📊 ATS score calculated: ${score}/100 for CV ${id}`);

  res.json({
    success: true,
    data: {
      score,
      breakdown,
      missingKeywords: ['JavaScript', 'React', 'Node.js'],
      recommendations: [
        'Add more technical keywords relevant to the job',
        'Include quantified achievements',
        'Highlight relevant experience prominently',
      ],
    },
  });
});

app.get('/api/cv/:id/download', (req, res) => {
  const { id } = req.params;
  const format = req.query.format || 'pdf';

  // Mock download - return the original file
  const filePath = path.join(uploadDir, 'Hytham Tag CV.pdf');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'File not found' },
    });
  }

  const contentType = format === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="cv-${id}.${format}"`);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'Server Error',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🧪 CV Enhancer Test Server (No Dependencies)');
  console.log('===========================================');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('🌐 Frontend: http://localhost:5173');
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log('');
  console.log('📤 Ready for CV upload testing!');
  console.log('Upload \'Hytham Tag CV.pdf\' to test all features');
  console.log('===========================================');
});

process.on('SIGINT', () => {
  console.log('\n👋 Test server shutting down...');
  process.exit(0);
});