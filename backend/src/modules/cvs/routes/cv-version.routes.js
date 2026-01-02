/**
 * CV VERSION ROUTES
 *
 * HTTP routes for CV version operations.
 * Defines all endpoints for version management.
 *
 * @module modules/cvs/routes/cv-version.routes
 */

const express = require('express');
const { resolve } = require('@core/container');
const CVVersionController = require('../controllers/cv-version.controller');
const {
  validateCreateVersionBodyMiddleware,
  validateVersionIdParamsMiddleware,
  validateActivateVersionBodyMiddleware,
  validateGetCVVersionsQueryMiddleware,
} = require('../validators/cv-version.validator');

const router = express.Router({ mergeParams: true });
const cvService = resolve('cvService');
const cvVersionService = resolve('cvVersionService');
const cvVersionController = new CVVersionController(cvVersionService, cvService);

/**
 * CV Versioning Routes
 * All routes are relative to /:id/versions
 * Note: validateCVIdParamsMiddleware is already applied in parent route
 */
/**
 * @openapi
 * /v1/cvs/{id}/versions:
 *   get:
 *     tags:
 *       - CV Versions
 *     summary: Get all versions of a CV
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of CV versions
 */
router.get('/', validateGetCVVersionsQueryMiddleware, cvVersionController.getCVVersions.bind(cvVersionController));

/**
 * @openapi
 * /v1/cvs/{id}/versions:
 *   post:
 *     tags:
 *       - CV Versions
 *     summary: Create a new version
 *     description: Create a snapshot of the current CV state.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Version created successfully
 */
router.post('/', validateCreateVersionBodyMiddleware, cvVersionController.createVersion.bind(cvVersionController));

/**
 * @openapi
 * /v1/cvs/{id}/versions/{versionId}:
 *   get:
 *     tags:
 *       - CV Versions
 *     summary: Get specific version details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Version details returned
 */
router.get('/:versionId', validateVersionIdParamsMiddleware, cvVersionController.getCVVersion.bind(cvVersionController));

/**
 * @openapi
 * /v1/cvs/{id}/versions/{versionId}/activate:
 *   post:
 *     tags:
 *       - CV Versions
 *     summary: Activate a specific version
 *     description: Restore the main CV to the state of this version.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Version activated successfully
 */
router.post('/:versionId/activate', validateVersionIdParamsMiddleware, validateActivateVersionBodyMiddleware, cvVersionController.activateVersion.bind(cvVersionController));

module.exports = router;

