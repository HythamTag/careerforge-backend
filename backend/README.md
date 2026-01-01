# CareerForge Backend

AI-powered CV parsing and ATS optimization backend built with Node.js, Express, and MongoDB.

## Features

- **PDF Upload & Processing**: Accept PDF CVs, extract text, and parse structured data
- **AI-Powered Parsing**: Multi-provider AI support (OpenAI, Anthropic, Google Gemini, HuggingFace, Ollama) for accurate CV extraction
- **ATS Optimization**: Enhance CVs for Applicant Tracking System compatibility
- **Background Jobs**: Async processing using BullMQ and Redis
- **CV Generation**: Generate ATS-safe PDF and DOCX formats
- **ATS Scoring**: Calculate compatibility scores with detailed recommendations
- **Clean Module Aliases**: Enterprise-grade import system for maintainable code

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment (see .env.example)
cp .env.example .env

# Start MongoDB and Redis
# Then run:
npm run dev        # API server
npm run worker     # Background worker (separate terminal)
```

## 📚 Documentation

See **[docs/README.md](./docs/README.md)** for complete documentation overview and hierarchy.

### Quick Links
- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System design and principles
- **[Development Handbook](./docs/DEVELOPMENT_HANDBOOK.md)** - Standards and best practices
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Developer cheat sheet
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - Complete API reference
- **[Project Roadmap](./docs/PROJECT_ROADMAP.md)** - Future vision and roadmap

## 🏗️ Architecture

Built with a **Hybrid Modular Monolith** architecture featuring clean module aliases, consistent layered structure, and enterprise-grade organization. See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for comprehensive technical details.

## 🔗 Clean Module Aliases

Enterprise-grade import system eliminating messy relative paths:

```javascript
// ❌ Messy relative imports (AVOID)
const logger = require("../../../../../core/utils/logger");

// ✅ Clean module aliases (USE)
const logger = require("@utils/logger");
```

See [docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) for complete alias reference and usage patterns.

## 📂 Project Structure

```
backend/
├── src/                        # Source code
│   ├── app.js                 # Express app (module aliases registered)
│   ├── server.js              # Server entry point
│   ├── core/                  # Shared foundational code
│   │   ├── config/            # Configuration (core/, modules/, types/)
│   │   ├── constants/         # Constants (core/, config/, domain/)
│   │   ├── errors/           # Error classes (base/, domain/, external/, http/, types/)
│   │   ├── middleware/       # Middleware (core/, security/, domain/)
│   │   ├── utils/            # Utilities (core/, validation/, formatting/, data/, messaging/, monitoring/, security/)
│   │   ├── infrastructure/   # Infrastructure connections
│   │   └── container/        # Dependency injection container
│   ├── modules/               # Feature modules (consistent structure)
│   └── shared/                # Shared external integrations
│       ├── external/         # External services (ai/, pdf/, storage/)
│       └── messaging/        # Messaging (queues/, workers/)
├── tests/                     # Test suite
├── docs/                      # Documentation (see below)
├── scripts/                   # Development scripts
└── uploads/                   # Temporary file storage
```

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed project structure and organization.

## API Endpoints

### Authentication (`/v1/auth`)
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - User login
- `POST /v1/auth/refresh` - Refresh access token
- `POST /v1/auth/logout` - Logout user
- `POST /v1/auth/forgot-password` - Request password reset
- `POST /v1/auth/reset-password` - Reset password with token
- `GET /v1/auth/verify-email/:token` - Verify email address
- `POST /v1/auth/resend-verification` - Resend email verification
- `GET /v1/auth/me` - Get current user

### User Management (`/v1/users`)
- `GET /v1/users/me` - Get user profile
- `PATCH /v1/users/me` - Update user profile
- `PATCH /v1/users/me/password` - Change password
- `POST /v1/users/me/avatar` - Upload avatar
- `DELETE /v1/users/me/avatar` - Delete avatar
- `GET /v1/users/me/stats` - Get user statistics
- `GET /v1/users/me/subscription` - Get subscription details
- `PATCH /v1/users/me/subscription` - Update subscription
- `DELETE /v1/users/me` - Delete account

### CV Management (`/v1/cvs`)
- `POST /v1/cvs` - Create CV
- `GET /v1/cvs` - List CVs
- `GET /v1/cvs/:id` - Get CV details
- `PATCH /v1/cvs/:id` - Update CV metadata
- `DELETE /v1/cvs/:id` - Delete CV
- `POST /v1/cvs/:id/duplicate` - Duplicate CV
- `POST /v1/cvs/upload` - Upload and create CV
- `POST /v1/cvs/:id/file` - Upload file to existing CV
- `GET /v1/cvs/:id/file` - Download original file
- `POST /v1/cvs/:id/parse` - Parse CV content
- `POST /v1/cvs/:id/generate` - Generate CV from CV
- `POST /v1/cvs/:id/enhance` - Enhance CV with AI
- `POST /v1/cvs/:id/analyze` - Analyze ATS compatibility
- `GET /v1/cvs/stats` - Get CV statistics

### CV Generation (`/v1/generate`)
- `POST /v1/generate` - Start CV generation job
- `GET /v1/generate/:jobId` - Get generation status
- `GET /v1/generate/:jobId/download` - Download generated CV
- `GET /v1/generate/history` - Get generation history
- `GET /v1/generate/stats` - Get generation statistics
- `POST /v1/generate/bulk` - Bulk CV generation
- `POST /v1/generate/preview` - Preview CV generation

### Templates (`/v1/templates`)
- `GET /v1/templates` - List templates
- `GET /v1/templates/categories` - Get template categories
- `GET /v1/templates/:slug` - Get template details
- `GET /v1/templates/category/:category` - Get templates by category

### Job Management (`/v1/jobs`)
- `GET /v1/jobs/:id` - Get job status
- `GET /v1/jobs/:id/logs` - Get job logs
- `DELETE /v1/jobs/:id` - Cancel job
- `POST /v1/jobs/:id/retry` - Retry failed job
- `GET /v1/jobs` - List user jobs
- `GET /v1/jobs/stats` - Get job statistics
- `POST /v1/jobs/cancel` - Bulk cancel jobs

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /v1/health` - Detailed health check
- `GET /v1/metrics` - Prometheus metrics

## Environment Variables

### Required
- `NODE_ENV` - Environment (development/production/test)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `JWT_SECRET` - JWT signing secret (required for production)
- `AI_PROVIDER` - AI provider (openai/anthropic/gemini/huggingface/ollama)

### AI Provider Keys (choose based on AI_PROVIDER)
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GEMINI_API_KEY` - Google Gemini API key
- `HF_TOKEN` - HuggingFace token

### Optional
- `STORAGE_TYPE` - File storage type (local/s3, default: local)
- `AWS_ACCESS_KEY_ID` - AWS access key (for S3 storage)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key (for S3 storage)
- `AWS_S3_BUCKET` - S3 bucket name
- `MAX_FILE_SIZE` - Maximum file upload size in bytes (default: 10MB)
- `RATE_LIMIT_UPLOADS` - Upload rate limit per window (default: 100)
- `RATE_LIMIT_WINDOW` - Rate limit window in ms (default: 1 hour)
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)

See `.env.example` for complete configuration reference.

## Testing

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests only
```

### Development Scripts

Organized testing and utility scripts available in `scripts/`:

- **AI Testing**: `scripts/ai-tests/` - Test AI providers and models
- **Integration Testing**: `scripts/integration-tests/` - End-to-end workflow tests
- **Utilities**: `scripts/utilities/` - Development tools and setup

See [scripts/README.md](./scripts/README.md) for detailed usage instructions.

## 📚 Documentation

See **[docs/README.md](./docs/README.md)** for complete documentation overview.

### Key Guides
- **[Architecture Guide](./docs/ARCHITECTURE.md)** - Complete system overview
- **[Development Handbook](./docs/DEVELOPMENT_HANDBOOK.md)** - Standards and best practices
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Developer cheat sheet
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - Complete API reference

## Quick Start (Windows)

**Easiest way:** Double-click `START-HERE.bat` to start everything!

## Code Quality

- ✅ **Hybrid Modular Monolith**: Clean separation of concerns
- ✅ **Module Aliases**: Enterprise-grade import system (`@utils/logger`)
- ✅ **SOLID Principles**: Applied throughout the codebase
- ✅ **Dependency Injection**: Centralized container management
- ✅ **Clean Architecture**: Proper layering and separation
- ✅ **Consistent Structure**: All modules follow identical patterns
- ✅ **Type Safety**: Comprehensive error handling and validation
- ✅ **No Messy Imports**: Eliminated all `../../../../../` paths

## License

ISC
