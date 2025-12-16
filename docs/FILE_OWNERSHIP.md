# File Ownership Guide

## Team Members

- **Backend Leader**: Core infrastructure, AI, LaTeX, notifications, health/admin endpoints
- **Auth Developer**: All authentication-related files
- **Resume Developer**: All resume-related files
- **ATS Developer**: All ATS analysis and scoring files

## Backend Files

### Backend Leader
- `backend/src/server.js`
- `backend/src/config/database.js`
- `backend/src/middleware/error/errorHandler.js`
- `backend/src/middleware/logging/logger.js`
- `backend/src/middleware/security/*`
- `backend/src/utils/responseFormatter.js`
- `backend/src/errors/*`
- `backend/src/routes/health.js`
- `backend/src/routes/ai.js`
- `backend/src/routes/latex.js`
- `backend/src/routes/notifications.js`
- `backend/src/controllers/healthController.js`
- `backend/src/controllers/aiController.js`
- `backend/src/controllers/latexController.js`
- `backend/src/controllers/notifyController.js`
- `backend/src/services/aiService.js`
- `backend/src/services/latexService.js`
- `backend/src/services/notificationService.js`
- `backend/tests/ai.test.js`
- `backend/tests/latex.test.js`
- `backend/tests/notifications.test.js`

### Auth Developer
- `backend/src/routes/auth.js`
- `backend/src/controllers/authController.js`
- `backend/src/services/authService.js`
- `backend/src/services/emailService.js`
- `backend/src/models/User.js`
- `backend/src/middleware/auth/authMiddleware.js`
- `backend/src/middleware/validation/validateRequest.js`
- `backend/src/validators/authValidator.js`
- `backend/tests/auth.test.js`

### Resume Developer
- `backend/src/routes/resume.js`
- `backend/src/controllers/resumeController.js`
- `backend/src/services/resumeService.js`
- `backend/src/services/pdfParserService.js`
- `backend/src/services/atsService.js` (mock)
- `backend/src/services/aiService.js` (mock)
- `backend/src/models/Resume.js`
- `backend/src/utils/fileUpload.js`
- `backend/tests/resume.test.js`

### ATS Developer
- `backend/src/routes/ats.js`                    (*@// /ats/analyze*@)
- `backend/src/controllers/atsController.js`
- `backend/src/services/atsService.js`
- `backend/tests/ats.test.js`
