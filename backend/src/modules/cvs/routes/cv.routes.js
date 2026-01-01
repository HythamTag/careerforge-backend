/**
 * CV ROUTES
 *
 * HTTP routes for CV operations.
 * Defines all endpoints for CV CRUD and management.
 *
 * @module modules/cvs/routes/cv.routes
 */

const express = require('express');
const { resolve } = require('@core/container');
const CVController = require('../controllers/cv.controller');
const cvVersionRoutes = require('./cv-version.routes');
const { authMiddleware, uploadMiddleware } = require('@middleware');
const {
  validateCreateCVMiddleware,
  validateUpdateCVMiddleware,
  validateCVIdParamsMiddleware,
  validateGetUserCVsQueryMiddleware,
  validateSearchCVsQueryMiddleware,
  validateDuplicateCVBodyMiddleware,
  validateBulkOperationBodyMiddleware,
} = require('../validators/cv.validator');

const router = express.Router();
const cvService = resolve('cvService');
const fileService = resolve('fileService');
const cvParsingService = resolve('cvParsingService');
const cvController = new CVController(cvService, fileService, cvParsingService);

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * CV CRUD Operations
 */
router.post('/upload', uploadMiddleware.single('file'), cvController.uploadCV.bind(cvController));
router.post('/', validateCreateCVMiddleware, cvController.createCV.bind(cvController));
router.get('/', validateGetUserCVsQueryMiddleware, cvController.getUserCVs.bind(cvController));
router.get('/search', validateSearchCVsQueryMiddleware, cvController.searchCVs.bind(cvController));
router.get('/stats', cvController.getCVStats.bind(cvController));
router.post('/bulk', validateBulkOperationBodyMiddleware, cvController.bulkOperation.bind(cvController));

/**
 * Individual CV Operations
 */
router.get('/:id', validateCVIdParamsMiddleware, cvController.getCV.bind(cvController));
router.get('/:id/status', validateCVIdParamsMiddleware, cvController.getCVStatus.bind(cvController));
router.put('/:id', validateCVIdParamsMiddleware, validateUpdateCVMiddleware, cvController.updateCV.bind(cvController));
router.delete('/:id', validateCVIdParamsMiddleware, cvController.deleteCV.bind(cvController));

/**
 * CV Management Operations
 */
router.post('/:id/duplicate', validateCVIdParamsMiddleware, validateDuplicateCVBodyMiddleware, cvController.duplicateCV.bind(cvController));
router.post('/:id/archive', validateCVIdParamsMiddleware, cvController.archiveCV.bind(cvController));
router.post('/:id/publish', validateCVIdParamsMiddleware, cvController.publishCV.bind(cvController));

/**
 * CV Versioning Routes
 * Mount version routes as a sub-router
 */
router.use('/:id/versions', validateCVIdParamsMiddleware, cvVersionRoutes);

module.exports = router;

