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

/**
 * @openapi
 * /v1/cvs/upload:
 *   post:
 *     tags:
 *       - CVs
 *     summary: Upload a CV file
 *     description: Upload a PDF file to be parsed and managed by the system.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The CV file (PDF only)
 *     responses:
 *       201:
 *         description: CV uploaded and processing started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CV'
 *       400:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/upload', uploadMiddleware.single('file'), cvController.uploadCV.bind(cvController));

/**
 * @openapi
 * /v1/cvs:
 *   post:
 *     tags:
 *       - CVs
 *     summary: Create CV manually
 *     description: Create a CV entry by providing JSON data directly.
 *     responses:
 *       201:
 *         description: CV created successfully
 */
router.post('/', validateCreateCVMiddleware, cvController.createCV.bind(cvController));

/**
 * @openapi
 * /v1/cvs:
 *   get:
 *     tags:
 *       - CVs
 *     summary: Get user CVs
 *     description: Returns a list of all CVs belonging to the authenticated user.
 *     responses:
 *       200:
 *         description: List of CVs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CV'
 */
router.get('/', validateGetUserCVsQueryMiddleware, cvController.getUserCVs.bind(cvController));

router.get('/search', validateSearchCVsQueryMiddleware, cvController.searchCVs.bind(cvController));
router.get('/stats', cvController.getCVStats.bind(cvController));
router.post('/bulk', validateBulkOperationBodyMiddleware, cvController.bulkOperation.bind(cvController));

/**
 * Individual CV Operations
 */

/**
 * @openapi
 * /v1/cvs/{id}:
 *   get:
 *     tags:
 *       - CVs
 *     summary: Get CV details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CV details found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CV'
 */
router.get('/:id', validateCVIdParamsMiddleware, cvController.getCV.bind(cvController));

/**
 * @openapi
 * /v1/cvs/{id}/status:
 *   get:
 *     tags:
 *       - CVs
 *     summary: Get CV parsing status
 *     description: Returns the current status and progress of CV parsing.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status returned successfully
 */
router.get('/:id/status', validateCVIdParamsMiddleware, cvController.getCVStatus.bind(cvController));

router.put('/:id', validateCVIdParamsMiddleware, validateUpdateCVMiddleware, cvController.updateCV.bind(cvController));

/**
 * @openapi
 * /v1/cvs/{id}:
 *   delete:
 *     tags:
 *       - CVs
 *     summary: Delete a CV
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CV deleted successfully
 */
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

