# File Ownership Guide

## Team Members

- **Senior Engineer**: Core/infrastructure + all non-auth/non-resume APIs (ATS, AI, LaTeX, notifications, payments, subscriptions, health/admin)
- **Auth Developer**: All authentication-related files
- **Resume Developer**: All resume-related files

## Backend Files

### Senior Engineer
- `backend/src/server.js`
- `backend/src/config/database.js`
- `backend/src/middleware/error/errorHandler.js`
- `backend/src/middleware/logging/logger.js`
- `backend/src/middleware/security/*`
- `backend/src/utils/responseFormatter.js`
- `backend/src/errors/*`
- `backend/src/routes/health.js`
- `backend/src/routes/ats.js`
- `backend/src/routes/ai.js`
- `backend/src/routes/latex.js`
- `backend/src/routes/notifications.js`
- `backend/src/routes/payment.js`
- `backend/src/controllers/healthController.js`
- `backend/src/controllers/atsController.js`
- `backend/src/controllers/aiController.js`
- `backend/src/controllers/latexController.js`
- `backend/src/controllers/notifyController.js`
- `backend/src/controllers/paymentController.js`
- `backend/src/services/atsService.js`
- `backend/src/services/aiService.js`
- `backend/src/services/latexService.js`
- `backend/src/services/notificationService.js`
- `backend/src/services/paymentService.js`
- `backend/src/services/subscriptionService.js`
- `backend/src/models/Subscription.js`
- `backend/src/models/Plan.js`
- `backend/tests/ats.test.js`
- `backend/tests/ai.test.js`
- `backend/tests/latex.test.js`
- `backend/tests/notifications.test.js`
- `backend/tests/payments.test.js`

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
