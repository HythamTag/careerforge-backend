# Module Architecture Standards

## Overview

This document defines the **standard architecture patterns** for all modules in the CV Enhancer backend. Following these patterns ensures consistency, maintainability, and predictability across the codebase.

## Core Architecture Principles

### 1. Clean Architecture

**Strict separation of concerns:**
- **Controllers**: HTTP handling only (req/res, status codes, response formatting)
- **Services**: Business logic, orchestration, validation
- **Repositories**: Database queries only, no business logic
- **Models**: Data structure definitions only

**Rules:**
- ✅ Controllers never contain business logic
- ✅ Services never access `req`/`res` objects
- ✅ Repositories never implement business rules
- ✅ Models never contain business logic

### 2. Dependency Injection

**All dependencies injected via constructor:**
- ✅ Use dependency injection container for service resolution
- ✅ No direct instantiation of dependencies within classes
- ✅ Easy to test with mocks
- ✅ Loose coupling between layers

### 3. Error Handling

**Custom error classes with consistent structure:**
- ✅ Centralized error handling middleware
- ✅ Meaningful error messages with error codes
- ✅ Log errors with context (userId, operation, relevant IDs)
- ✅ Distinguish operational errors from programming errors

### 4. Validation

**Use Ajv JSON Schema for all request validation:**
- ✅ Validate at the edge (controller/middleware level)
- ✅ Separate validation logic from business logic
- ✅ Provide clear, actionable validation error messages
- ✅ Use constants for all limits and constraints

### 5. Database Operations

**Best practices for database operations:**
- ✅ Use transactions for multi-step operations
- ✅ Implement optimistic locking for concurrent updates
- ✅ Add appropriate indexes for queries
- ✅ Never expose internal database errors to clients
- ✅ Use `.lean()` for read-only queries
- ✅ Use `.select()` to limit returned fields

## Single Source of Truth Principles

All modules follow a **consistent pattern** to ensure maintainability, predictability, and avoid confusion.

**Key Principles:**
- ✅ **Consistency**: All modules follow the same structure and patterns
- ✅ **Predictability**: Developers know exactly where to find code
- ✅ **Maintainability**: Changes are easy to make and understand
- ✅ **Separation of Concerns**: Clear boundaries between layers
- ✅ **Dependency Injection**: Services resolved through container
- ✅ **Optional Components**: Repositories and models only when needed

## Standard Module Structure

Every module MUST follow this exact structure:

```
modules/[feature-name]/
├── controllers/          # HTTP request handlers
│   └── [feature].controller.js
├── services/             # Business logic & domain services
│   └── [feature].service.js
├── repositories/         # Data access layer (optional)
│   └── [feature].repository.js
├── models/               # Database schemas (optional)
│   └── [feature].model.js
├── validators/           # Input validation schemas
│   └── [feature].validator.js
├── routes/               # API route definitions
│   └── [feature].routes.js
└── index.js              # Module exports (REQUIRED)
```

## Module Index Pattern

**ALL** module `index.js` files MUST follow this exact pattern:

```javascript
/**
 * [MODULE NAME] MODULE
 *
 * [Brief description of module purpose]
 *
 * @module modules/[module-name]
 */

const routes = require('./routes/[feature].routes');

module.exports = {
    name: '[module-name]',
    routes: routes
};
```

### Rules:
- ✅ Blank line after JSDoc comment
- ✅ Blank line before `module.exports`
- ✅ Only export `name` and `routes`
- ✅ Use consistent naming (kebab-case for module name)

## Controller Pattern

**ALL** controllers MUST follow this pattern:

```javascript
const { HTTP_STATUS, PAGINATION, ERROR_CODES } = require('@constants');
const logger = require('@utils/logger');
const ResponseFormatter = require('@utils/responseFormatter');
const { NotFoundError } = require('@errors');
const pagination = require('@utils/pagination');

class FeatureController {
    constructor(service) {
        this.service = service; // ALWAYS use 'service', never 'featureService'
    }

    /**
     * Create a resource
     */
    async createResource(req, res, next) {
        try {
            const userId = req.userId;
            const data = req.body;

            const resource = await this.service.createResource(userId, data);

            const { response, statusCode } = ResponseFormatter.resource(resource, {
                links: {
                    self: `/v1/resources/${resource.id}`,
                    update: `/v1/resources/${resource.id}`,
                    delete: `/v1/resources/${resource.id}`,
                },
                statusCode: HTTP_STATUS.CREATED,
            });

            res.status(statusCode).json(response);
        } catch (error) {
            logger.logOperationError('Create resource', error, { userId: req.userId });
            next(error);
        }
    }

    /**
     * Get paginated list
     */
    async getResources(req, res, next) {
        try {
            const userId = req.userId;
            const { page: sanitizedPage, limit: sanitizedLimit } = pagination.sanitize(
                req.query.page,
                req.query.limit,
                { defaultLimit: PAGINATION.DEFAULT_LIMIT }
            );

            const result = await this.service.getResources(userId, {
                page: sanitizedPage,
                limit: sanitizedLimit,
            });

            const links = {
                self: `/v1/resources?page=${sanitizedPage}&limit=${sanitizedLimit}`,
            };
            if (result.pagination.hasNext) {
                links.next = `/v1/resources?page=${sanitizedPage + 1}&limit=${sanitizedLimit}`;
            }
            if (result.pagination.hasPrev) {
                links.prev = `/v1/resources?page=${sanitizedPage - 1}&limit=${sanitizedLimit}`;
            }

            const { response, statusCode } = ResponseFormatter.paginated(
                result.resources,
                result.pagination,
                { links }
            );

            res.status(statusCode).json(response);
        } catch (error) {
            logger.logOperationError('Get resources', error, { userId: req.userId });
            next(error);
        }
    }

    /**
     * Get single resource
     */
    async getResource(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.userId;

            const resource = await this.service.getResourceById(id, userId);
            if (!resource) {
                const error = new NotFoundError('Resource not found', ERROR_CODES.NOT_FOUND);
                return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
            }

            const { response, statusCode } = ResponseFormatter.resource(resource, {
                links: {
                    self: `/v1/resources/${resource.id}`,
                    update: `/v1/resources/${resource.id}`,
                    delete: `/v1/resources/${resource.id}`,
                },
            });

            res.status(statusCode).json(response);
        } catch (error) {
            logger.logOperationError('Get resource', error, { id: req.params.id, userId: req.userId });
            next(error);
        }
    }

    /**
     * Simple success response
     */
    async deleteResource(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.userId;

            await this.service.deleteResource(id, userId);

            const { response, statusCode } = ResponseFormatter.success(null, {
                message: 'Resource deleted successfully',
            });

            res.status(statusCode).json(response);
        } catch (error) {
            logger.logOperationError('Delete resource', error, { id: req.params.id, userId: req.userId });
            next(error);
        }
    }
}

module.exports = FeatureController;
```

### Rules:
- ✅ Service property MUST be `this.service` (not `this.featureService`)
- ✅ Always extract `userId` from `req.userId`
- ✅ Always use try/catch with `next(error)`
- ✅ Always use `ResponseFormatter` for consistent responses
- ✅ Use `ResponseFormatter.resource()` for single resources
- ✅ Use `ResponseFormatter.paginated()` for paginated lists
- ✅ Use `ResponseFormatter.success()` for simple success responses
- ✅ Use `ResponseFormatter.error()` for error responses
- ✅ Always use `logger.logOperationError()` for error logging
- ✅ Generate HATEOAS links for all resources
- ✅ Use `pagination.sanitize()` for query parameters

## Service Pattern

**ALL** services MUST follow this pattern:

```javascript
class FeatureService {
    constructor(repository, otherDependencies = null) {
        this.repository = repository;
        // Other dependencies with default null
    }

    async methodName(userId, ...args) {
        // Business logic here
        return result;
    }
}

module.exports = FeatureService;
```

### Rules:
- ✅ Constructor parameters with defaults use `= null`
- ✅ Repository property is `this.repository`
- ✅ First parameter is always `userId`
- ✅ Return values, don't throw unless critical

## Repository Pattern

**ALL** repositories MUST follow this pattern:

```javascript
class FeatureRepository {
    constructor() {
        // Initialize models if needed
    }

    async create(data) {
        // Data access logic
        return result;
    }

    async findById(id) {
        // Data access logic
        return result;
    }

    async updateById(id, data) {
        // Data access logic
        return result;
    }

    async deleteById(id) {
        // Data access logic
        return result;
    }
}

module.exports = FeatureRepository;
```

### Rules:
- ✅ Constructor can be empty if no initialization needed
- ✅ Standard CRUD methods: `create`, `findById`, `updateById`, `deleteById`
- ✅ Return data, handle errors internally

## Model Pattern

**ALL** models MUST follow this pattern (only create if you need database persistence):

```javascript
/**
 * CV MODEL
 *
 * Defines the data structures and schemas for CV operations.
 * Includes CV documents and metadata management.
 *
 * @module modules/cvs/models/cv.model
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { STRING_LIMITS, NUMERIC_LIMITS, CV_ENTITY_STATUS } = require('@constants');
const { TEMPLATES } = require('@constants');

const CVSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: STRING_LIMITS.TITLE_MAX_LENGTH,
  },
  template: {
    type: String,
    enum: Object.keys(TEMPLATES),
    default: 'modern',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(CV_ENTITY_STATUS),
    default: CV_ENTITY_STATUS.DRAFT,
    index: true,
  },
  content: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
  collection: 'cvs',
});

// Indexes for performance
CVSchema.index({ userId: 1, status: 1, createdAt: -1 });
CVSchema.index({ userId: 1, template: 1 });

const CV = mongoose.model('CV', CVSchema);

module.exports = {
  CV,
};
```

### Rules:
- ✅ Always export object with Model name (e.g., `{ CV }`)
- ✅ Use constants from `@constants` for enums and limits
- ✅ Always include `userId` for user-scoped entities
- ✅ Always include `timestamps: true`
- ✅ Always specify `collection` name
- ✅ Add appropriate indexes for query performance
- ⚠️ **Models are optional** - only create if you need database persistence

## Route Pattern

**ALL** routes MUST follow this pattern:

```javascript
/**
 * FEATURE ROUTES
 *
 * HTTP routes for feature operations.
 * Defines all endpoints for feature CRUD and management.
 *
 * @module modules/module-name/routes/feature.routes
 */

const express = require('express');
const { resolve } = require('@core/container');
const FeatureController = require('../controllers/feature.controller');
const subFeatureRoutes = require('./sub-feature.routes'); // For sub-routers
const authenticate = require('@middleware/auth.middleware');
const uploadMiddleware = require('@middleware/upload.middleware'); // For file uploads
const {
  validateCreateFeatureMiddleware,
  validateUpdateFeatureMiddleware,
  validateFeatureIdParamsMiddleware,
  validateGetFeaturesQueryMiddleware,
} = require('../validators/feature.validator');

const router = express.Router();
const featureService = resolve('featureService');
const featureController = new FeatureController(featureService);

// Apply authentication to all routes (if needed)
router.use(authenticate);

/**
 * Feature CRUD Operations
 * Note: Specific routes (like /upload, /search) must come before parameterized routes (/:id)
 */
router.post('/upload', uploadMiddleware.single('file'), featureController.uploadFeature.bind(featureController));
router.post('/', validateCreateFeatureMiddleware, featureController.createFeature.bind(featureController));
router.get('/', validateGetFeaturesQueryMiddleware, featureController.getFeatures.bind(featureController));
router.get('/search', validateGetFeaturesQueryMiddleware, featureController.searchFeatures.bind(featureController));

/**
 * Individual Feature Operations
 */
router.get('/:id', validateFeatureIdParamsMiddleware, featureController.getFeature.bind(featureController));
router.put('/:id', validateFeatureIdParamsMiddleware, validateUpdateFeatureMiddleware, featureController.updateFeature.bind(featureController));
router.delete('/:id', validateFeatureIdParamsMiddleware, featureController.deleteFeature.bind(featureController));

/**
 * Feature Management Operations
 */
router.post('/:id/duplicate', validateFeatureIdParamsMiddleware, featureController.duplicateFeature.bind(featureController));
router.post('/:id/archive', validateFeatureIdParamsMiddleware, featureController.archiveFeature.bind(featureController));

/**
 * Sub-Router Mounting
 * Mount sub-routes for nested resources (e.g., /:id/versions)
 */
router.use('/:id/sub-features', validateFeatureIdParamsMiddleware, subFeatureRoutes);

module.exports = router;
```

### Sub-Router Pattern

For nested resources, create a separate route file:

```javascript
/**
 * SUB-FEATURE ROUTES
 *
 * HTTP routes for sub-feature operations.
 * All routes are relative to /:id/sub-features
 *
 * @module modules/module-name/routes/sub-feature.routes
 */

const express = require('express');
const { resolve } = require('@core/container');
const SubFeatureController = require('../controllers/sub-feature.controller');
const {
  validateSubFeatureIdParamsMiddleware,
  validateCreateSubFeatureBodyMiddleware,
} = require('../validators/sub-feature.validator');

const router = express.Router({ mergeParams: true }); // Important: mergeParams to access parent :id
const featureService = resolve('featureService');
const subFeatureService = resolve('subFeatureService');
const subFeatureController = new SubFeatureController(subFeatureService, featureService);

/**
 * Sub-Feature Routes
 * Note: validateFeatureIdParamsMiddleware is already applied in parent router
 */
router.get('/', subFeatureController.getSubFeatures.bind(subFeatureController));
router.post('/', validateCreateSubFeatureBodyMiddleware, subFeatureController.createSubFeature.bind(subFeatureController));
router.get('/:subFeatureId', validateSubFeatureIdParamsMiddleware, subFeatureController.getSubFeature.bind(subFeatureController));

module.exports = router;
```

### Rules:
- ✅ Always use `express.Router()`
- ✅ Always use `resolve()` from container for services
- ✅ Always use `.bind(controller)` for controller methods
- ✅ Use `@middleware` aliases for middleware imports
- ✅ Group routes logically (CRUD, management, sub-routes)
- ✅ Place specific routes before parameterized routes (e.g., `/search` before `/:id`)
- ✅ Apply authentication middleware with `router.use()` if all routes need it
- ✅ Apply validation middleware before controller methods
- ✅ For sub-routers, use `express.Router({ mergeParams: true })` to access parent params
- ✅ For file uploads, use `uploadMiddleware.single('fieldName')` before controller method

## Validator Pattern

**ALL** validators MUST follow this pattern:

```javascript
/**
 * CV VALIDATORS
 *
 * Validation schemas for CV operations.
 * Uses Ajv JSON schemas for consistent validation.
 *
 * @module modules/cvs/validators/cv.validator
 */

const { validateRequest, validateParams, validateQuery } = require('@middleware/validation.middleware');
const { STRING_LIMITS, NUMERIC_LIMITS, CV_ENTITY_STATUS, TEMPLATES } = require('@constants');

// ==========================================
// SCHEMAS
// ==========================================

const createCVBodySchema = {
  type: 'object',
  required: ['title'],
  additionalProperties: false,
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: STRING_LIMITS.TITLE_MAX_LENGTH,
    },
    template: {
      type: 'string',
      enum: Object.keys(TEMPLATES),
    },
  },
};

const updateCVBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: STRING_LIMITS.TITLE_MAX_LENGTH,
    },
    status: {
      type: 'string',
      enum: [
        CV_ENTITY_STATUS.DRAFT,
        CV_ENTITY_STATUS.PUBLISHED,
        CV_ENTITY_STATUS.ARCHIVED,
      ],
    },
  },
  minProperties: 1, // At least one property must be present
};

const cvIdParamsSchema = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      format: 'objectId',
    },
  },
};

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

function validateCreateCV(data) {
  return require('@utils/validator').validateData(data, createCVBodySchema);
}

function validateUpdateCV(data) {
  return require('@utils/validator').validateData(data, updateCVBodySchema);
}

function validateCVIdParams(data) {
  return require('@utils/validator').validateData(data, cvIdParamsSchema);
}

// ==========================================
// MIDDLEWARE FUNCTIONS
// ==========================================

const validateCreateCVMiddleware = validateRequest(createCVBodySchema);
const validateUpdateCVMiddleware = validateRequest(updateCVBodySchema);
const validateCVIdParamsMiddleware = validateParams(cvIdParamsSchema);

module.exports = {
  // Schemas
  createCVBodySchema,
  updateCVBodySchema,
  cvIdParamsSchema,

  // Validation functions
  validateCreateCV,
  validateUpdateCV,
  validateCVIdParams,

  // Middleware
  validateCreateCVMiddleware,
  validateUpdateCVMiddleware,
  validateCVIdParamsMiddleware,
};
```

### Rules:
- ✅ Use Ajv JSON schemas with constants from `@constants`
- ✅ Export both validation functions and middleware wrappers
- ✅ Use `validateRequest()` for body validation
- ✅ Use `validateParams()` for URL parameter validation
- ✅ Use `validateQuery()` for query parameter validation
- ✅ Include both function and middleware patterns for flexibility
- ✅ Use `additionalProperties: false` to prevent unknown fields
- ✅ Use constants for all limits, enums, and constraints
- ✅ Use `format: 'objectId'` for MongoDB IDs
- ✅ Include `minProperties: 1` for update schemas

## Naming Conventions

### Files
- Controllers: `[feature].controller.js`
- Services: `[feature].service.js`
- Repositories: `[feature].repository.js`
- Models: `[feature].model.js`
- Routes: `[feature].routes.js`

### Classes
- Controllers: `FeatureController` (PascalCase)
- Services: `FeatureService` (PascalCase)
- Repositories: `FeatureRepository` (PascalCase)
- Models: `FeatureModel` (PascalCase)

### Properties
- Service in controller: `this.service` (always)
- Repository in service: `this.repository` (always)

## Import Patterns

**ALWAYS** use module aliases:

```javascript
// ✅ CORRECT
const logger = require('@utils/logger');
const config = require('@config');
const { AppError } = require('@errors');

// ❌ WRONG
const logger = require('../../../../core/utils/logger');
const config = require('../../../../core/config');
```

## Module Registration

All modules are registered in `app.js` using individual `app.use()` calls:

```javascript
// ==========================================
// API MODULES (v1)
// ==========================================
const AuthModule = require('@modules/auth');
const UsersModule = require('@modules/users');
const CvsModule = require('@modules/cvs');
const CvGenerationModule = require('@modules/cv-generation');
// ... other modules

// Register v1 API modules
app.use('/v1/auth', AuthModule.routes);
app.use('/v1/users', UsersModule.routes);
app.use('/v1/cvs', CvsModule.routes);
app.use('/v1/generation', CvGenerationModule.routes);
// ... other module registrations
```

**Important Notes:**
- ✅ Route paths can differ from module names (e.g., `/v1/generation` for `cv-generation` module)
- ✅ Each module is registered individually for clarity and explicit control
- ✅ All routes are prefixed with `/v1/` for API versioning
- ✅ Module name in `index.js` is used for reference, but route path is explicitly set in `app.js`

## Single Source of Truth

1. **Configuration**: `@config` - All configuration values
2. **Constants**: `@constants` - All application constants
3. **Errors**: `@errors` - All error classes
4. **Models**: Module-specific models in `models/` directory
5. **Enums**: Defined in model files, exported with model

## Sub-Routers and Nested Routes

When you need nested resources (e.g., CV versions under a CV), use sub-routers:

### Parent Router (cv.routes.js)

```javascript
const cvVersionRoutes = require('./cv-version.routes');

// Mount sub-router
router.use('/:id/versions', validateCVIdParamsMiddleware, cvVersionRoutes);
```

### Sub-Router (cv-version.routes.js)

```javascript
const router = express.Router({ mergeParams: true }); // Critical: mergeParams: true

// Now :id from parent is available as req.params.id
router.get('/', cvVersionController.getCVVersions.bind(cvVersionController));
router.post('/', cvVersionController.createVersion.bind(cvVersionController));
router.get('/:versionId', cvVersionController.getCVVersion.bind(cvVersionController));
```

**Key Points:**
- ✅ Use `express.Router({ mergeParams: true })` in sub-router
- ✅ Parent route params (e.g., `:id`) are accessible in sub-router
- ✅ Apply parent validation middleware when mounting sub-router
- ✅ Sub-router routes are relative to the mount point

## Response Formatting Patterns

### ResponseFormatter Methods

The `ResponseFormatter` utility provides several methods for consistent API responses:

#### 1. `ResponseFormatter.resource()` - Single Resource

```javascript
const { response, statusCode } = ResponseFormatter.resource(cv, {
  links: {
    self: `/v1/cvs/${cv.id}`,
    update: `/v1/cvs/${cv.id}`,
    delete: `/v1/cvs/${cv.id}`,
    versions: `/v1/cvs/${cv.id}/versions`,
  },
  statusCode: HTTP_STATUS.CREATED, // Optional, defaults to 200
});

res.status(statusCode).json(response);
```

#### 2. `ResponseFormatter.paginated()` - Paginated List

```javascript
const { response, statusCode } = ResponseFormatter.paginated(
  result.cvs,
  result.pagination,
  {
    links: {
      self: `/v1/cvs?page=${page}&limit=${limit}`,
      next: result.pagination.hasNext ? `/v1/cvs?page=${page + 1}&limit=${limit}` : undefined,
      prev: result.pagination.hasPrev ? `/v1/cvs?page=${page - 1}&limit=${limit}` : undefined,
    },
    itemLinks: (cv) => ({
      self: `/v1/cvs/${cv.id}`,
      versions: `/v1/cvs/${cv.id}/versions`,
    }),
  }
);

res.status(statusCode).json(response);
```

#### 3. `ResponseFormatter.success()` - Simple Success

```javascript
const { response, statusCode } = ResponseFormatter.success(null, {
  message: 'Operation completed successfully',
  links: {
    self: `/v1/features`,
  },
});

res.status(statusCode).json(response);
```

#### 4. `ResponseFormatter.error()` - Error Response

```javascript
const error = new NotFoundError('Resource not found', ERROR_CODES.NOT_FOUND);
const { response, statusCode } = ResponseFormatter.error(error);

res.status(statusCode).json(response);
```

## Pagination Implementation

### Using pagination.sanitize()

Always sanitize pagination query parameters:

```javascript
const pagination = require('@utils/pagination');
const { PAGINATION } = require('@constants');

async getResources(req, res, next) {
  const { page: sanitizedPage, limit: sanitizedLimit } = pagination.sanitize(
    req.query.page,
    req.query.limit,
    { defaultLimit: PAGINATION.DEFAULT_LIMIT }
  );

  const result = await this.service.getResources(userId, {
    page: sanitizedPage,
    limit: sanitizedLimit,
  });
}
```

### Generating Pagination Links

```javascript
const links = {
  self: `/v1/resources?page=${page}&limit=${limit}`,
};

if (result.pagination.hasNext) {
  links.next = `/v1/resources?page=${page + 1}&limit=${limit}`;
}

if (result.pagination.hasPrev) {
  links.prev = `/v1/resources?page=${page - 1}&limit=${limit}`;
}
```

## File Upload Handling

### Route Setup

```javascript
const uploadMiddleware = require('@middleware/upload.middleware');

// File upload route (must be before parameterized routes)
router.post('/upload', uploadMiddleware.single('file'), controller.uploadFile.bind(controller));
```

### Controller Implementation

```javascript
async uploadFile(req, res, next) {
  try {
    const userId = req.userId;
    const file = req.file;

    if (!file) {
      const { ValidationError } = require('@errors');
      throw new ValidationError('No file uploaded', ERROR_CODES.VALIDATION_ERROR);
    }

    // Process file
    const result = await this.service.processFile(userId, file);

    const { response, statusCode } = ResponseFormatter.resource(result, {
      links: {
        self: `/v1/files/${result.id}`,
      },
      statusCode: HTTP_STATUS.CREATED,
    });

    res.status(statusCode).json(response);
  } catch (error) {
    logger.logOperationError('Upload file', error, { userId: req.userId });
    next(error);
  }
}
```

## Optional Components Guide

### When to Use Repositories and Models

**Repositories and Models are OPTIONAL** - use them when you need database persistence.

#### Module WITH Repository/Model (e.g., `cvs` module)

```javascript
// models/cv.model.js - Mongoose schema
// repositories/cv.repository.js - Data access layer
// services/cv.service.js - Uses repository
```

**Use when:**
- ✅ You need to persist data to MongoDB
- ✅ You have complex data relationships
- ✅ You need database queries and aggregations

#### Module WITHOUT Repository/Model (e.g., `auth` module)

```javascript
// No models/ directory
// No repositories/ directory
// services/auth.service.js - Uses userRepository from another module
```

**Use when:**
- ✅ You only need business logic
- ✅ You use repositories from other modules
- ✅ You don't need new database collections
- ✅ You're orchestrating operations across modules

### Example: Auth Module (No Repository)

```javascript
// services/auth.service.js
class AuthService {
  constructor(userRepository, config) {
    this.userRepository = userRepository; // From users module
    this.config = config;
  }

  async login(email, password) {
    const user = await this.userRepository.findByEmail(email);
    // Business logic here
    return token;
  }
}
```

### Example: CVs Module (With Repository)

```javascript
// repositories/cv.repository.js
class CVRepository {
  async createCV(data) {
    const cv = new CV(data);
    return await cv.save();
  }
}

// services/cv.service.js
class CVService {
  constructor(cvRepository) {
    this.repository = cvRepository;
  }

  async createCV(userId, data) {
    return await this.repository.createCV({ ...data, userId });
  }
}
```

## Route Organization Best Practices

### Route Ordering

**Critical:** Place specific routes before parameterized routes:

```javascript
// ✅ CORRECT ORDER
router.post('/upload', ...);           // Specific route
router.get('/search', ...);            // Specific route
router.get('/stats', ...);             // Specific route
router.get('/:id', ...);               // Parameterized route (comes last)
router.put('/:id', ...);               // Parameterized route
```

**❌ WRONG ORDER** (will cause issues):
```javascript
router.get('/:id', ...);               // This will match /search and /stats!
router.get('/search', ...);            // Never reached
```

### Route Grouping

Group related routes with comments:

```javascript
/**
 * Feature CRUD Operations
 */
router.post('/', ...);
router.get('/', ...);
router.get('/search', ...);

/**
 * Individual Feature Operations
 */
router.get('/:id', ...);
router.put('/:id', ...);
router.delete('/:id', ...);

/**
 * Feature Management Operations
 */
router.post('/:id/duplicate', ...);
router.post('/:id/archive', ...);

/**
 * Sub-Router Mounting
 */
router.use('/:id/sub-features', ...);
```

### Middleware Application

```javascript
// Apply to all routes
router.use(authenticate);

// Apply to specific route
router.post('/upload', uploadMiddleware.single('file'), controller.upload);

// Apply multiple middleware
router.put('/:id', 
  validateIdParamsMiddleware,
  validateUpdateMiddleware,
  controller.update
);
```

## Step-by-Step Module Creation Guide

Follow these steps to create a new module from scratch:

### 1. CREATE DIRECTORY STRUCTURE

```bash
mkdir -p modules/your-module/{controllers,services,repositories,models,routes,validators}
```

**Example:**
```bash
mkdir -p modules/notifications/{controllers,services,repositories,models,routes,validators}
```

**Note:** `repositories/` and `models/` directories are optional - only create them if you need database persistence.

### 2. DEFINE MODEL (models/cv.model.js) - Optional

Create Mongoose schema with proper structure (only if you need database persistence):

```javascript
/**
 * CV MODEL
 *
 * Defines the data structures and schemas for CV operations.
 * Includes CV documents and metadata management.
 *
 * @module modules/cvs/models/cv.model
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { STRING_LIMITS, NUMERIC_LIMITS, CV_ENTITY_STATUS } = require('@constants');
const { TEMPLATES } = require('@constants');

const CVSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: STRING_LIMITS.TITLE_MAX_LENGTH,
  },
  template: {
    type: String,
    enum: Object.keys(TEMPLATES),
    default: 'modern',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(CV_ENTITY_STATUS),
    default: CV_ENTITY_STATUS.DRAFT,
    index: true,
  },
  content: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
  collection: 'cvs',
});

// Indexes for performance
CVSchema.index({ userId: 1, status: 1, createdAt: -1 });
CVSchema.index({ userId: 1, template: 1 });

const CV = mongoose.model('CV', CVSchema);

module.exports = {
  CV,
};
```

**Rules:**
- ✅ Always include `userId` for user-scoped entities
- ✅ Always include `timestamps: true`
- ✅ Always specify `collection` name
- ✅ Add appropriate indexes for query performance
- ✅ Export as object with Model name
- ✅ Use constants from `@constants` for enums and limits
- ⚠️ **Models are optional** - only create if you need database persistence

### 3. CREATE REPOSITORY (repositories/cv.repository.js) - Optional

Implement data access layer (only if you have a model):

```javascript
/**
 * CV REPOSITORY
 *
 * Data access layer for CV operations.
 * Handles database interactions for CVs.
 *
 * @module modules/cvs/repositories/cv.repository
 */

const { CV } = require('../models/cv.model');
const logger = require('@utils/logger');
const { PAGINATION, NUMERIC_LIMITS, CV_ENTITY_STATUS, ERROR_CODES } = require('@constants');
const { NotFoundError } = require('@errors');

class CVRepository {
  /**
   * Create a new CV
   */
  async createCV(cvData) {
    try {
      const cv = new CV(cvData);
      await cv.save();
      logger.info('CV created', { cvId: cv.id, userId: cv.userId });
      return cv;
    } catch (error) {
      logger.error('Failed to create CV', { error: error.message, userId: cvData.userId });
      throw error;
    }
  }

  /**
   * Find CV by ID and user
   */
  async getCVById(cvId, userId) {
    try {
      return await CV.findOne({ _id: cvId, userId }).populate('userId', 'email name');
    } catch (error) {
      logger.error('Failed to find CV', { error: error.message, cvId, userId });
      throw error;
    }
  }

  /**
   * Get user's CVs with pagination
   */
  async getUserCVs(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = PAGINATION.PARSING_HISTORY_LIMIT,
        status,
        search,
      } = options;

      const query = { userId };
      if (status && status !== 'all') {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (page - 1) * limit;

      const [cvs, total] = await Promise.all([
        CV.find(query)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('-content')
          .populate('userId', 'email name'),
        CV.countDocuments(query),
      ]);

      return {
        cvs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Failed to get user CVs', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = CVRepository;
```

**Rules:**
- ✅ Always include error handling with logging
- ✅ Always check `userId` for user-scoped queries
- ✅ Return data, let service layer handle business logic
- ✅ Implement pagination in repository when needed
- ✅ Use `.populate()` for referenced documents
- ✅ **Accept `options` parameter for transaction support** (pass `{ session }`)
- ✅ **Use `.lean()` for read-only queries** (returns plain objects, faster)
- ✅ **Use `.select()` to limit returned fields** (improve performance)
- ✅ **Never start/commit transactions in repository** (service layer handles transactions)
- ⚠️ **Repositories are optional** - only create if you have a model

### Repository Transaction Support

Repositories should accept an `options` parameter for transaction support:

```javascript
async createCV(cvData, options = {}) {
  try {
    const cv = new CV(cvData);
    await cv.save({ session: options.session }); // Pass session if provided
    logger.info('CV created', { cvId: cv.id, userId: cv.userId });
    return cv;
  } catch (error) {
    logger.error('Failed to create CV', { error: error.message });
    throw error;
  }
}

async getCVById(cvId, userId, options = {}) {
  try {
    return await CV.findOne({ _id: cvId, userId })
      .populate('userId', 'email name')
      .session(options.session); // Pass session if provided
  } catch (error) {
    logger.error('Failed to find CV', { error: error.message, cvId, userId });
    throw error;
  }
}
```

### 4. CREATE SERVICE (services/cv.service.js)

Implement business logic with transaction support:

```javascript
/**
 * CV SERVICE
 *
 * Business logic layer for CV operations.
 * Handles CV lifecycle, validation, and complex operations.
 *
 * @module modules/cvs/services/cv.service
 */

const mongoose = require('mongoose');
const CVRepository = require('../repositories/cv.repository');
const logger = require('@utils/logger');
const { ValidationError, NotFoundError } = require('@errors');
const { ERROR_CODES, CV_ENTITY_STATUS } = require('@constants');

class CVService {
  /**
   * Create CV service with dependency injection.
   */
  constructor(cvRepository, cvVersionRepository) {
    this.repository = cvRepository;
    this.cvVersionRepository = cvVersionRepository;
  }

  /**
   * Create a new CV with initial version (using transaction)
   */
  async createCV(cvData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate CV data
      this._validateCVData(cvData);

      // Create CV within transaction
      const cv = await this.repository.createCV(cvData, { session });

      // Create initial version within same transaction
      await this._createVersion(
        cv.id,
        cv.userId,
        cv.content,
        'Initial version',
        'First version of the CV',
        'manual',
        { session }
      );

      // Commit transaction
      await session.commitTransaction();

      logger.info('CV created successfully', { cvId: cv.id, userId: cv.userId });
      return cv;
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      logger.logOperationError('CV creation', error, { userId: cvData.userId });
      throw error;
    } finally {
      // Always end session
      session.endSession();
    }
  }

  /**
   * Update CV with authorization check
   */
  async updateCV(cvId, userId, updates) {
    try {
      // Get current CV
      const currentCV = await this.repository.getCVById(cvId, userId);
      if (!currentCV) {
        throw new NotFoundError('CV not found', ERROR_CODES.CV_NOT_FOUND);
      }

      // Authorization check: ensure user owns the CV
      if (currentCV.userId.toString() !== userId) {
        const { ForbiddenError } = require('@errors');
        throw new ForbiddenError('Not authorized to update this CV', ERROR_CODES.FORBIDDEN);
      }

      // Validate updates
      this._validateCVUpdates(updates);

      // Create version before updating (if content changed)
      if (updates.content) {
        await this._createVersion(
          cvId,
          userId,
          currentCV.content,
          'Content updated',
          'Content updated',
          'manual'
        );
      }

      // Update CV
      const updatedCV = await this.repository.updateCV(cvId, userId, updates);

      return updatedCV;
    } catch (error) {
      logger.logOperationError('CV update', error, { cvId, userId });
      throw error;
    }
  }

  /**
   * Get user's CVs with pagination and filtering
   */
  async getUserCVs(userId, options = {}) {
    try {
      return await this.repository.getUserCVs(userId, options);
    } catch (error) {
      logger.logOperationError('Get user CVs', error, { userId });
      throw error;
    }
  }

  /**
   * Get CV by ID and user
   */
  async getCVById(cvId, userId) {
    try {
      const cv = await this.repository.getCVById(cvId, userId);
      if (!cv) {
        throw new NotFoundError('CV not found', ERROR_CODES.CV_NOT_FOUND);
      }

      // Authorization check
      if (cv.userId.toString() !== userId) {
        const { ForbiddenError } = require('@errors');
        throw new ForbiddenError('Not authorized to access this CV', ERROR_CODES.FORBIDDEN);
      }

      return cv;
    } catch (error) {
      logger.logOperationError('Get CV by ID', error, { cvId, userId });
      throw error;
    }
  }

  /**
   * Validate CV data
   */
  _validateCVData(data) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      throw new ValidationError('CV title is required and must be a non-empty string', ERROR_CODES.VALIDATION_ERROR);
    }

    if (!data.userId) {
      throw new ValidationError('User ID is required', ERROR_CODES.MISSING_USER_ID);
    }
  }

  /**
   * Validate CV updates
   */
  _validateCVUpdates(updates) {
    const allowedFields = ['title', 'description', 'tags', 'content', 'status', 'metadata', 'settings', 'template'];
    const updateFields = Object.keys(updates);
    const invalidFields = updateFields.filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      throw new ValidationError(`Invalid update fields: ${invalidFields.join(', ')}`, ERROR_CODES.VALIDATION_ERROR);
    }
  }

  /**
   * Create a new version of CV
   */
  async _createVersion(cvId, userId, content, name, description, changeType, options = {}) {
    try {
      const latestVersionNumber = await this.cvVersionRepository.getLatestVersionNumber(cvId);
      const versionNumber = latestVersionNumber + 1;

      return await this.cvVersionRepository.createVersion({
        cvId,
        versionNumber,
        userId,
        name: name || 'Initial version',
        description: description || name,
        content,
        changeType,
      }, options);
    } catch (error) {
      logger.error('Version creation failed', { error: error.message, cvId });
      throw error;
    }
  }
}

module.exports = CVService;
```

**Rules:**
- ✅ First parameter is always `userId` for user-scoped operations
- ✅ Use `this.repository` for data access (if repository exists)
- ✅ Validate in service layer
- ✅ Use `logger.logOperationError` for errors
- ✅ Handle dependencies with default `null` if optional
- ✅ Services can use repositories from other modules if needed
- ✅ **Use transactions for multi-step operations** (create CV + version)
- ✅ **Always check authorization** (userId matches resource owner)
- ✅ **Always wrap transactions in try-catch-finally**
- ✅ **Commit on success, abort on error, end session in finally**

### 5. CREATE VALIDATOR (validators/cv.validator.js)

Define validation schemas:

```javascript
/**
 * CV VALIDATORS
 *
 * Validation schemas for CV operations.
 * Uses Ajv JSON schemas for consistent validation.
 *
 * @module modules/cvs/validators/cv.validator
 */

const { validateRequest, validateParams, validateQuery } = require('@middleware/validation.middleware');
const { STRING_LIMITS, NUMERIC_LIMITS, CV_ENTITY_STATUS, VALIDATION_PATTERNS, TEMPLATES } = require('@constants');

// ==========================================
// SCHEMAS
// ==========================================

const createCVBodySchema = {
  type: 'object',
  required: ['title'],
  additionalProperties: false,
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: STRING_LIMITS.TITLE_MAX_LENGTH,
    },
    description: {
      type: 'string',
      maxLength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
    },
    template: {
      type: 'string',
      enum: Object.keys(TEMPLATES),
    },
    content: {
      type: 'object',
      additionalProperties: true,
    },
  },
};

const updateCVBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: STRING_LIMITS.TITLE_MAX_LENGTH,
    },
    description: {
      type: 'string',
      maxLength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
    },
    template: {
      type: 'string',
      enum: Object.keys(TEMPLATES),
    },
    status: {
      type: 'string',
      enum: [
        CV_ENTITY_STATUS.DRAFT,
        CV_ENTITY_STATUS.PUBLISHED,
        CV_ENTITY_STATUS.ARCHIVED
      ],
    },
    content: {
      type: 'object',
      additionalProperties: true,
    },
  },
  minProperties: 1,
};

const cvIdParamsSchema = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      format: 'objectId',
    },
  },
};

const getUserCVsQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: {
      type: 'integer',
      minimum: 1,
      maximum: NUMERIC_LIMITS.PAGE_MAX,
      default: 1,
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: NUMERIC_LIMITS.LIMIT_MAX,
      default: 10,
    },
    status: {
      type: 'string',
      enum: [
        CV_ENTITY_STATUS.DRAFT,
        CV_ENTITY_STATUS.PUBLISHED,
        CV_ENTITY_STATUS.ARCHIVED,
        'all'
      ],
    },
    search: {
      type: 'string',
      maxLength: STRING_LIMITS.SEARCH_MAX_LENGTH,
    },
  },
};

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

function validateCreateCV(data) {
  return require('@utils/validator').validateData(data, createCVBodySchema);
}

function validateUpdateCV(data) {
  return require('@utils/validator').validateData(data, updateCVBodySchema);
}

function validateCVIdParams(data) {
  return require('@utils/validator').validateData(data, cvIdParamsSchema);
}

function validateGetUserCVsQuery(data) {
  return require('@utils/validator').validateData(data, getUserCVsQuerySchema);
}

// ==========================================
// MIDDLEWARE FUNCTIONS
// ==========================================

const validateCreateCVMiddleware = validateRequest(createCVBodySchema);
const validateUpdateCVMiddleware = validateRequest(updateCVBodySchema);
const validateCVIdParamsMiddleware = validateParams(cvIdParamsSchema);
const validateGetUserCVsQueryMiddleware = validateQuery(getUserCVsQuerySchema);

module.exports = {
  // Schemas
  createCVBodySchema,
  updateCVBodySchema,
  cvIdParamsSchema,
  getUserCVsQuerySchema,

  // Validation functions
  validateCreateCV,
  validateUpdateCV,
  validateCVIdParams,
  validateGetUserCVsQuery,

  // Middleware
  validateCreateCVMiddleware,
  validateUpdateCVMiddleware,
  validateCVIdParamsMiddleware,
  validateGetUserCVsQueryMiddleware,
};
```

**Rules:**
- ✅ Use constants from `@constants` for limits, enums, and patterns
- ✅ Export both functions and middleware
- ✅ Use `additionalProperties: false` to prevent unknown fields
- ✅ Use `format: 'objectId'` for MongoDB IDs
- ✅ Use `validateRequest()` for body validation
- ✅ Use `validateParams()` for URL parameter validation
- ✅ Use `validateQuery()` for query parameter validation
- ✅ Include `minProperties: 1` for update schemas

### 6. CREATE CONTROLLER (controllers/cv.controller.js)

Handle HTTP requests with proper error handling and response formatting:

```javascript
/**
 * CV CONTROLLER
 *
 * Handles HTTP requests for CV operations including CRUD and management.
 *
 * @module modules/cvs/controllers/cv.controller
 */

const { HTTP_STATUS, PAGINATION, ERROR_CODES } = require('@constants');
const logger = require('@utils/logger');
const ResponseFormatter = require('@utils/responseFormatter');
const { NotFoundError } = require('@errors');
const pagination = require('@utils/pagination');

class CVController {
  constructor(cvService) {
    this.service = cvService; // ALWAYS use 'service', never 'cvService'
  }

  /**
   * Create a new CV
   */
  async createCV(req, res, next) {
    try {
      const userId = req.userId;
      const cvData = {
        ...req.body,
        userId,
      };

      const cv = await this.service.createCV(cvData);

      const { response, statusCode } = ResponseFormatter.resource(cv, {
        links: {
          self: `/v1/cvs/${cv.id}`,
          update: `/v1/cvs/${cv.id}`,
          delete: `/v1/cvs/${cv.id}`,
          versions: `/v1/cvs/${cv.id}/versions`,
        },
        statusCode: HTTP_STATUS.CREATED,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Create CV', error, { userId: req.userId });
      next(error);
    }
  }

  /**
   * Get user's CVs with pagination
   */
  async getUserCVs(req, res, next) {
    try {
      const userId = req.userId;
      const { page: sanitizedPage, limit: sanitizedLimit } = pagination.sanitize(
        req.query.page,
        req.query.limit,
        { defaultLimit: PAGINATION.PARSING_HISTORY_LIMIT }
      );

      const options = {
        page: sanitizedPage,
        limit: sanitizedLimit,
        status: req.query.status,
        search: req.query.search,
      };

      const result = await this.service.getUserCVs(userId, options);

      const links = {
        self: `/v1/cvs?page=${options.page}&limit=${options.limit}`,
      };
      if (result.pagination.hasNext) {
        links.next = `/v1/cvs?page=${options.page + 1}&limit=${options.limit}`;
      }
      if (result.pagination.hasPrev) {
        links.prev = `/v1/cvs?page=${options.page - 1}&limit=${options.limit}`;
      }

      const { response, statusCode } = ResponseFormatter.paginated(result.cvs, result.pagination, {
        links,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Get user CVs', error, { userId: req.userId });
      next(error);
    }
  }

  /**
   * Get CV by ID
   */
  async getCV(req, res, next) {
    try {
      const cvId = req.params.id;
      const userId = req.userId;

      const cv = await this.service.getCVById(cvId, userId);
      if (!cv) {
        const error = new NotFoundError('CV not found', ERROR_CODES.CV_NOT_FOUND);
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }

      const { response, statusCode } = ResponseFormatter.resource(cv, {
        links: {
          self: `/v1/cvs/${cv.id}`,
          update: `/v1/cvs/${cv.id}`,
          delete: `/v1/cvs/${cv.id}`,
          versions: `/v1/cvs/${cv.id}/versions`,
        },
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Get CV', error, { cvId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
   * Delete CV
   */
  async deleteCV(req, res, next) {
    try {
      const cvId = req.params.id;
      const userId = req.userId;

      await this.service.deleteCV(cvId, userId);

      const { response, statusCode } = ResponseFormatter.success(null, {
        message: 'CV deleted successfully',
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Delete CV', error, { cvId: req.params.id, userId: req.userId });
      next(error);
    }
  }
}

module.exports = CVController;
```

**Rules:**
- ✅ Always use `this.service` (not `this.cvService`)
- ✅ Always extract `userId` from `req.userId`
- ✅ Always use `ResponseFormatter` for responses
- ✅ Use `ResponseFormatter.resource()` for single resources
- ✅ Use `ResponseFormatter.paginated()` for paginated lists
- ✅ Use `ResponseFormatter.success()` for simple success responses
- ✅ Use `ResponseFormatter.error()` for error responses
- ✅ Always use try/catch with `next(error)`
- ✅ Always use `logger.logOperationError` for errors
- ✅ Use `pagination.sanitize()` for query parameters
- ✅ Generate HATEOAS links for all resources
- ✅ Handle `NotFoundError` explicitly with proper status codes

### 7. DEFINE ROUTES (routes/cv.routes.js)

Mount endpoints with proper organization:

```javascript
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
const cvVersionRoutes = require('./cv-version.routes'); // Sub-router
const authenticate = require('@middleware/auth.middleware');
const uploadMiddleware = require('@middleware/upload.middleware');
const {
  validateCreateCVMiddleware,
  validateUpdateCVMiddleware,
  validateCVIdParamsMiddleware,
  validateGetUserCVsQueryMiddleware,
} = require('../validators/cv.validator');

const router = express.Router();
const cvService = resolve('cvService');
const cvController = new CVController(cvService);

// Apply authentication to all routes
router.use(authenticate);

/**
 * CV CRUD Operations
 * Note: Specific routes must come before parameterized routes
 */
router.post('/upload', uploadMiddleware.single('file'), cvController.uploadCV.bind(cvController));
router.post('/', validateCreateCVMiddleware, cvController.createCV.bind(cvController));
router.get('/', validateGetUserCVsQueryMiddleware, cvController.getUserCVs.bind(cvController));
router.get('/search', validateGetUserCVsQueryMiddleware, cvController.searchCVs.bind(cvController));
router.get('/stats', cvController.getCVStats.bind(cvController));

/**
 * Individual CV Operations
 */
router.get('/:id', validateCVIdParamsMiddleware, cvController.getCV.bind(cvController));
router.put('/:id', validateCVIdParamsMiddleware, validateUpdateCVMiddleware, cvController.updateCV.bind(cvController));
router.delete('/:id', validateCVIdParamsMiddleware, cvController.deleteCV.bind(cvController));

/**
 * CV Management Operations
 */
router.post('/:id/duplicate', validateCVIdParamsMiddleware, cvController.duplicateCV.bind(cvController));
router.post('/:id/archive', validateCVIdParamsMiddleware, cvController.archiveCV.bind(cvController));

/**
 * CV Versioning Routes
 * Mount version routes as a sub-router
 */
router.use('/:id/versions', validateCVIdParamsMiddleware, cvVersionRoutes);

module.exports = router;
```

**Rules:**
- ✅ Always use `express.Router()`
- ✅ Always use `resolve()` from container for services
- ✅ Always use `.bind(controller)` for controller methods
- ✅ Apply authentication middleware with `router.use()` if all routes need it
- ✅ Apply validation middleware before controller methods
- ✅ Place specific routes (e.g., `/upload`, `/search`) before parameterized routes (e.g., `/:id`)
- ✅ Group routes logically with comments
- ✅ Mount sub-routers with `router.use()` after parent validation

### 7a. CREATE SUB-ROUTER (routes/cv-version.routes.js) - Optional

For nested resources:

```javascript
/**
 * CV VERSION ROUTES
 *
 * HTTP routes for CV version operations.
 * All routes are relative to /:id/versions
 *
 * @module modules/cvs/routes/cv-version.routes
 */

const express = require('express');
const { resolve } = require('@core/container');
const CVVersionController = require('../controllers/cv-version.controller');
const {
  validateCreateVersionBodyMiddleware,
  validateVersionIdParamsMiddleware,
} = require('../validators/cv-version.validator');

const router = express.Router({ mergeParams: true }); // Critical: mergeParams: true
const cvService = resolve('cvService');
const cvVersionService = resolve('cvVersionService');
const cvVersionController = new CVVersionController(cvVersionService, cvService);

/**
 * CV Versioning Routes
 * Note: validateCVIdParamsMiddleware is already applied in parent router
 */
router.get('/', cvVersionController.getCVVersions.bind(cvVersionController));
router.post('/', validateCreateVersionBodyMiddleware, cvVersionController.createVersion.bind(cvVersionController));
router.get('/:versionId', validateVersionIdParamsMiddleware, cvVersionController.getCVVersion.bind(cvVersionController));

module.exports = router;
```

**Rules:**
- ✅ Use `express.Router({ mergeParams: true })` to access parent route params
- ✅ Parent validation middleware is already applied, don't duplicate
- ✅ Routes are relative to the mount point (e.g., `/` becomes `/:id/versions`)

### 8. CREATE MODULE INDEX (index.js)

Export module:

```javascript
/**
 * CVS MODULE
 *
 * CV (Curriculum Vitae) management and lifecycle operations.
 * Core module for handling CV CRUD, metadata, versioning, and status management.
 *
 * @module modules/cvs
 */

const routes = require('./routes/cv.routes');

module.exports = {
  name: 'cvs',
  routes: routes,
};
```

**Rules:**
- ✅ Blank line after JSDoc comment
- ✅ Blank line before `module.exports`
- ✅ Only export `name` and `routes`
- ✅ Use kebab-case for module name
- ✅ Import main routes file (usually the primary entity routes)

### 9. REGISTER IN CONTAINER (core/container/index.js)

Add to `_registerCoreServices()` method:

```javascript
// ========================================
// CVS MODULE SERVICES
// ========================================
this.register('cvRepository', () => {
  const CVRepository = require('@modules/cvs/repositories/cv.repository');
  return new CVRepository();
});

this.register('cvService', (container) => {
  const CVService = require('@modules/cvs/services/cv.service');
  return new CVService(
    container.resolve('cvRepository'),
    container.resolve('cvVersionRepository')
  );
});

// ========================================
// CV VERSION MODULE SERVICES
// ========================================
this.register('cvVersionRepository', () => {
  const CVVersionRepository = require('@modules/cvs/repositories/cv-version.repository');
  return new CVVersionRepository();
});

this.register('cvVersionService', (container) => {
  const CVVersionService = require('@modules/cvs/services/cv-version.service');
  return new CVVersionService(
    container.resolve('cvVersionRepository'),
    container.resolve('cvRepository')
  );
});
```

**Rules:**
- ✅ Register repository first (no dependencies)
- ✅ Register service second (with repository dependency)
- ✅ Use `container.resolve()` for dependencies
- ✅ Use consistent naming: `cvRepository`, `cvService` (kebab-case for registration key)
- ✅ Group related services with comments
- ✅ Services can depend on multiple repositories
- ⚠️ **Only register if you have repositories/models** - services without repositories may use other module's repositories
- ✅ For services without repositories (like `auth`), register service with dependencies from other modules

### 10. REGISTER MODULE IN APP (app.js)

Add module registration in `app.js`:

```javascript
// ==========================================
// API MODULES (v1)
// ==========================================
const AuthModule = require('@modules/auth');
const UsersModule = require('@modules/users');
const YourModule = require('@modules/your-module'); // Add your module here

// Register v1 API modules
app.use('/v1/auth', AuthModule.routes);
app.use('/v1/users', UsersModule.routes);
app.use('/v1/your-module', YourModule.routes); // Register your module
```

**Rules:**
- ✅ Import module at top of API modules section
- ✅ Register with `app.use()` using explicit route path
- ✅ Route path can differ from module name (e.g., `/v1/generation` for `cv-generation` module)
- ✅ All routes are prefixed with `/v1/` for API versioning

### 11. WRITE TESTS (Optional but Recommended)

Create test files in `__tests__` directory:

```javascript
// __tests__/cv.service.test.js
const CVService = require('../services/cv.service');
const CVRepository = require('../repositories/cv.repository');

describe('CVService', () => {
  let cvService;
  let mockRepository;

  beforeEach(() => {
    mockRepository = {
      createCV: jest.fn(),
      getCVById: jest.fn(),
    };
    cvService = new CVService(mockRepository);
  });

  describe('createCV', () => {
    it('should create a CV successfully', async () => {
      // Add test implementation
    });
  });
});
```

### 12. UPDATE DOCUMENTATION

- Add module description to main README
- Update API documentation
- Add usage examples

## Error Handling Patterns

### Standard Error Handling

```javascript
// In controller
async getResource(req, res, next) {
  try {
    const resource = await this.service.getResourceById(id, userId);
    if (!resource) {
      const error = new NotFoundError('Resource not found', ERROR_CODES.NOT_FOUND);
      return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
    }
    // ... success response
  } catch (error) {
    logger.logOperationError('Get resource', error, { id, userId });
    next(error); // Let error middleware handle it
  }
}

// In service
async getResourceById(id, userId) {
  const resource = await this.repository.findById(id);
  
  if (!resource) {
    throw new NotFoundError('Resource not found', ERROR_CODES.NOT_FOUND);
  }
  
  // Authorization check
  if (resource.userId.toString() !== userId) {
    throw new ForbiddenError('Not authorized', ERROR_CODES.FORBIDDEN);
  }
  
  return resource;
}
```

### Error Types

- **`NotFoundError`**: Resource not found (404)
- **`ValidationError`**: Invalid input data (400)
- **`UnauthorizedError`**: Authentication required (401)
- **`ForbiddenError`**: Access denied (403)
- **`ConflictError`**: Resource conflict (409)

### Custom Error Classes

```javascript
// All custom errors extend AppError
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true; // Distinguish from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource, errorCode = 'NOT_FOUND') {
    super(`${resource} not found`, 404, errorCode);
  }
}

class ValidationError extends AppError {
  constructor(message, errorCode = 'VALIDATION_ERROR') {
    super(message, 400, errorCode);
  }
}
```

### Error Response Format

```javascript
// Using ResponseFormatter.error()
const error = new NotFoundError('CV not found', ERROR_CODES.CV_NOT_FOUND);
const { response, statusCode } = ResponseFormatter.error(error);

// Response structure:
{
  success: false,
  error: {
    code: 'CV_NOT_FOUND',
    message: 'CV not found'
  }
}
```

### Error Logging

Always use `logger.logOperationError()` for operation errors:

```javascript
logger.logOperationError('Operation name', error, { 
  userId: req.userId,
  resourceId: req.params.id,
  operation: 'update',
  field: 'content',
  // ... other context
});
```

### Error Middleware

Errors are handled by centralized error middleware:

```javascript
// middleware/error.middleware.js
function errorHandler(err, req, res, next) {
  // Log error
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.userId,
    errorCode: err.errorCode
  });

  // Operational errors (expected)
  if (err.isOperational) {
    return res.status(err.statusCode).json(ResponseFormatter.error(err).response);
  }

  // Programming errors (unexpected) - don't expose details
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong'
    }
  });
}
```

## Validation Checklist

Before committing a module, ensure:

### Module Structure
- [ ] Module index follows exact pattern (blank lines, only `name` and `routes`)
- [ ] Directory structure matches standard pattern
- [ ] All required directories exist (controllers, services, validators, routes)
- [ ] Optional directories (repositories, models) only exist if needed

### Controller
- [ ] Controller uses `this.service` (not `this.cvService` or `this.featureService`)
- [ ] Controller uses `ResponseFormatter` for all responses
- [ ] Controller uses `pagination.sanitize()` for query parameters
- [ ] Controller handles errors with `NotFoundError` and `ResponseFormatter.error()`
- [ ] All controller methods extract `userId` from `req.userId`
- [ ] All controller methods use try/catch with `next(error)`
- [ ] All controller methods use `logger.logOperationError()` for errors
- [ ] HATEOAS links are generated for all resources

### Service
- [ ] Service constructor follows pattern
- [ ] Service first parameter is `userId` for user-scoped operations
- [ ] Service uses `this.repository` for data access (if repository exists)
- [ ] Service uses `logger.logOperationError()` for errors
- [ ] Service validates data in business logic layer

### Repository (if exists)
- [ ] Repository follows pattern
- [ ] Repository always checks `userId` for user-scoped queries
- [ ] Repository includes error handling with logging
- [ ] Repository implements pagination when needed
- [ ] Repository uses `.populate()` for referenced documents

### Model (if exists)
- [ ] Model exports object with Model and enums
- [ ] Model includes `userId` for user-scoped entities
- [ ] Model includes `timestamps: true`
- [ ] Model specifies `collection` name
- [ ] Model has appropriate indexes
- [ ] Model uses constants from `@constants` for enums and limits

### Validator
- [ ] **Validator uses constants from `@constants`**
- [ ] **Validator exports both functions and middleware**
- [ ] Validator uses `validateRequest()`, `validateParams()`, `validateQuery()` appropriately
- [ ] Validator uses `additionalProperties: false` to prevent unknown fields
- [ ] Validator uses `format: 'objectId'` for MongoDB IDs
- [ ] Update schemas include `minProperties: 1`

### Routes
- [ ] Routes use `.bind(controller)` for controller methods
- [ ] Routes use validation middleware before controller methods
- [ ] Routes are ordered correctly (specific before parameterized)
- [ ] Routes use `resolve()` from container for services
- [ ] Sub-routers use `express.Router({ mergeParams: true })`
- [ ] Authentication middleware applied appropriately

### Container Registration (if repository exists)
- [ ] Repository registered first (no dependencies)
- [ ] Service registered second (with repository dependency)
- [ ] Uses `container.resolve()` for dependencies
- [ ] Uses consistent naming (kebab-case for registration key)

### App Registration
- [ ] Module registered in `app.js` with explicit route path
- [ ] Route path can differ from module name if needed
- [ ] All routes prefixed with `/v1/` for API versioning

### Response Formatting
- [ ] HATEOAS links are generated for all resources
- [ ] Pagination links are generated for paginated responses

## Quick Reference

### Module Structure Template

```
modules/your-module/
├── controllers/
│   └── your-module.controller.js
├── services/
│   └── your-module.service.js
├── repositories/          # Optional
│   └── your-module.repository.js
├── models/                # Optional
│   └── your-module.model.js
├── validators/
│   └── your-module.validator.js
├── routes/
│   └── your-module.routes.js
└── index.js
```

### Common Patterns

#### Controller Service Property
```javascript
// ✅ CORRECT
this.service = service;

// ❌ WRONG
this.cvService = service;
this.featureService = service;
```

#### Service Repository Property
```javascript
// ✅ CORRECT
this.repository = repository;

// ❌ WRONG
this.cvRepository = repository;
```

#### Response Formatting
```javascript
// Single resource
ResponseFormatter.resource(data, { links, statusCode });

// Paginated list
ResponseFormatter.paginated(items, pagination, { links });

// Simple success
ResponseFormatter.success(data, { message });

// Error
ResponseFormatter.error(error);
```

#### Pagination Sanitization
```javascript
const { page, limit } = pagination.sanitize(
  req.query.page,
  req.query.limit,
  { defaultLimit: PAGINATION.DEFAULT_LIMIT }
);
```

#### Route Ordering
```javascript
// ✅ CORRECT: Specific routes first
router.post('/upload', ...);
router.get('/search', ...);
router.get('/:id', ...);  // Parameterized last

// ❌ WRONG: Parameterized first
router.get('/:id', ...);  // Will match /search!
router.get('/search', ...);  // Never reached
```

#### Sub-Router Setup
```javascript
// Parent router
router.use('/:id/versions', validateIdMiddleware, subRouter);

// Sub-router
const router = express.Router({ mergeParams: true });
```

### Module Aliases

Always use these aliases for imports:

```javascript
const logger = require('@utils/logger');
const config = require('@config');
const { NotFoundError } = require('@errors');
const { ERROR_CODES, PAGINATION } = require('@constants');
const ResponseFormatter = require('@utils/responseFormatter');
const pagination = require('@utils/pagination');
```

### File Naming Conventions

- **Files**: kebab-case (e.g., `cv.controller.js`, `cv-version.routes.js`)
- **Classes**: PascalCase (e.g., `CVController`, `CVService`)
- **Container Keys**: kebab-case (e.g., `cvService`, `cvRepository`)
- **Module Names**: kebab-case (e.g., `cvs`, `cv-generation`)

## Examples from Codebase

### Module WITH Repository/Model
- **`modules/cvs/`** - Full CRUD module with database persistence
  - Has `models/cv.model.js`
  - Has `repositories/cv.repository.js`
  - Has `services/cv.service.js`
  - Has sub-router for versions

### Module WITHOUT Repository/Model
- **`modules/auth/`** - Business logic only
  - No `models/` directory
  - No `repositories/` directory
  - Uses `userRepository` from `users` module
  - Has `services/auth.service.js`

## Transaction Handling

### When to Use Transactions

Use transactions for operations that modify multiple documents:

```javascript
async createCVWithVersion(cvData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Create CV
    const cv = await this.repository.createCV(cvData, { session });

    // 2. Create initial version
    await this.cvVersionRepository.createVersion({
      cvId: cv.id,
      versionNumber: 1,
      userId: cv.userId,
      content: cv.content,
    }, { session });

    // 3. Commit transaction
    await session.commitTransaction();
    return cv;
  } catch (error) {
    // 4. Abort on error
    await session.abortTransaction();
    logger.error('Transaction failed', { error: error.message });
    throw error;
  } finally {
    // 5. Always end session
    session.endSession();
  }
}
```

### Transaction Rules

- ✅ **Always wrap in try-catch-finally**
- ✅ **Commit on success, abort on error**
- ✅ **End session in finally block**
- ✅ **Pass session to all repository methods**
- ✅ **Never start transactions in repositories** (service layer only)

## Security Best Practices

### Authorization Checks

Always verify resource ownership in services:

```javascript
async updateCV(cvId, userId, updates) {
  const cv = await this.repository.getCVById(cvId, userId);
  
  if (!cv) {
    throw new NotFoundError('CV not found', ERROR_CODES.CV_NOT_FOUND);
  }
  
  // Authorization check
  if (cv.userId.toString() !== userId) {
    throw new ForbiddenError('Not authorized to update this CV', ERROR_CODES.FORBIDDEN);
  }
  
  return await this.repository.updateCV(cvId, userId, updates);
}
```

### Input Validation

- ✅ Validate ALL inputs (params, query, body)
- ✅ Use Ajv schemas with strict rules
- ✅ Set `additionalProperties: false` to prevent unknown fields
- ✅ Set `maxLength` on all string fields
- ✅ Use `format: 'objectId'` for MongoDB IDs

### Sensitive Data

- ✅ Never log passwords, tokens, or PII
- ✅ Redact sensitive fields in logs
- ✅ Use environment variables for secrets
- ✅ Never expose internal database errors to clients

## Performance Optimization

### Database Queries

```javascript
// ✅ Good: Use .lean() for read-only queries
const cvs = await CV.find({ userId })
  .select('title status createdAt') // Only select needed fields
  .lean(); // Returns plain objects (faster)

// ✅ Good: Use populate efficiently
const cv = await CV.findById(id)
  .populate('userId', 'email name') // Only populate needed fields
  .lean();

// ✅ Good: Parallel queries
const [cvs, total] = await Promise.all([
  CV.find(query).skip(skip).limit(limit),
  CV.countDocuments(query)
]);

// ❌ Bad: N+1 query problem
const cvs = await CV.find();
for (const cv of cvs) {
  cv.user = await User.findById(cv.userId); // Don't do this!
}
```

### Pagination

Always paginate list queries:

```javascript
async getUserCVs(userId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [cvs, total] = await Promise.all([
    CV.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CV.countDocuments({ userId })
  ]);

  return {
    cvs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}
```

### Indexes

Add indexes for frequently queried fields:

```javascript
// Compound indexes
CVSchema.index({ userId: 1, status: 1, createdAt: -1 });

// Text indexes for search
CVSchema.index({ title: 'text', description: 'text' });
```

## Common Patterns

### Soft Delete

```javascript
async softDelete(id, userId) {
  return await this.repository.update(id, {
    status: CV_ENTITY_STATUS.DELETED,
    deletedAt: new Date(),
    deletedBy: userId,
  });
}
```

### Bulk Operations

```javascript
// ✅ Good: Bulk operation
await CV.updateMany(
  { _id: { $in: ids } },
  { status: CV_ENTITY_STATUS.ARCHIVED }
);

// ❌ Bad: Multiple individual operations
for (const id of ids) {
  await CV.updateOne({ _id: id }, { status: CV_ENTITY_STATUS.ARCHIVED });
}
```

### Cascading Operations

```javascript
async deleteCVWithVersions(cvId, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete CV
    await this.repository.deleteCV(cvId, userId, { session });

    // Delete all versions
    await this.cvVersionRepository.deleteByCVId(cvId, { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

## Testing Patterns

### Unit Tests - Services

```javascript
describe('CVService', () => {
  let service;
  let mockRepository;
  let mockVersionRepository;

  beforeEach(() => {
    mockRepository = {
      createCV: jest.fn(),
      getCVById: jest.fn(),
      updateCV: jest.fn(),
    };
    mockVersionRepository = {
      createVersion: jest.fn(),
      getLatestVersionNumber: jest.fn(),
    };
    service = new CVService(mockRepository, mockVersionRepository);
  });

  describe('createCV', () => {
    it('should create CV successfully', async () => {
      const cvData = { title: 'My CV', userId: '123' };
      const expectedCV = { id: 'cv1', ...cvData };
      
      mockRepository.createCV.mockResolvedValue(expectedCV);
      mockVersionRepository.getLatestVersionNumber.mockResolvedValue(0);
      mockVersionRepository.createVersion.mockResolvedValue({});

      const result = await service.createCV(cvData);

      expect(result).toEqual(expectedCV);
      expect(mockRepository.createCV).toHaveBeenCalledWith(cvData, expect.any(Object));
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = { title: '' };

      await expect(service.createCV(invalidData))
        .rejects
        .toThrow(ValidationError);
    });
  });
});
```

### Integration Tests

```javascript
describe('CV API', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();
  });

  describe('POST /v1/cvs', () => {
    it('should create CV', async () => {
      const response = await request(app)
        .post('/v1/cvs')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'My CV' })
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('My CV');
    });

    it('should return 400 for invalid data', async () => {
      await request(app)
        .post('/v1/cvs')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '' })
        .expect(400);
    });
  });
});
```

## Need Help?

If you're creating a new module and unsure about patterns:

1. **Check existing modules** - Look at `modules/cvs/` for a complete example
2. **Check this README** - All patterns are documented here
3. **Follow the step-by-step guide** - Start from Step 1 and work through
4. **Use the validation checklist** - Before committing, verify all items
5. **Review best practices** - Follow clean architecture principles
- [ ] Error responses use `ResponseFormatter.error()`
- [ ] Success responses use appropriate `ResponseFormatter` method

### Code Quality
- [ ] All imports use module aliases (`@utils`, `@config`, `@errors`, `@constants`)
- [ ] JSDoc comments are consistent and complete
- [ ] File naming follows conventions (kebab-case)
- [ ] No placeholder text or examples remain

