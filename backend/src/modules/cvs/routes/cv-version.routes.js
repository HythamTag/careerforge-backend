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
router.get('/', validateGetCVVersionsQueryMiddleware, cvVersionController.getCVVersions.bind(cvVersionController));
router.post('/', validateCreateVersionBodyMiddleware, cvVersionController.createVersion.bind(cvVersionController));
router.get('/:versionId', validateVersionIdParamsMiddleware, cvVersionController.getCVVersion.bind(cvVersionController));
router.post('/:versionId/activate', validateVersionIdParamsMiddleware, validateActivateVersionBodyMiddleware, cvVersionController.activateVersion.bind(cvVersionController));

module.exports = router;

