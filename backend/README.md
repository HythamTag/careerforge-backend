# 🚀 CareerForge Backend

<p align="center">
  <strong>Enterprise-Grade AI-Powered CV Parsing & ATS Optimization Platform</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#api-reference">API</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## 🎯 Overview

**CareerForge** is a production-ready backend system that leverages AI to parse, analyze, and optimize CVs for Applicant Tracking Systems (ATS). Built with **clean architecture principles**, **SOLID design patterns**, and a focus on **scalability** and **maintainability**.

This project demonstrates:
- 🏗️ **Hybrid Modular Monolith Architecture** — Feature-based modules with clean separation of concerns
- 🤖 **Multi-Provider AI Integration** — Supports OpenAI, Anthropic, Google Gemini, HuggingFace, and local Ollama
- ⚡ **Async Job Processing** — BullMQ-powered background workers for heavy AI operations
- 🔒 **Production Security** — JWT auth, rate limiting, input validation, and role-based access
- 📊 **Enterprise Patterns** — Dependency injection, repository pattern, and centralized error handling

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Smart CV Parsing** | Extract structured data from PDF/DOCX using AI with 95%+ accuracy |
| **ATS Score Analysis** | Calculate ATS compatibility scores with actionable recommendations |
| **Content Optimization** | AI-powered suggestions to improve CV content and keywords |
| **Job Tailoring** | Automatically tailor CVs for specific job descriptions |
| **PDF Generation** | Generate professionally formatted, ATS-safe PDF documents |
| **Version Control** | Track and manage multiple CV versions per user |
| **Webhook Integration** | Real-time event notifications for external integrations |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│                    (Express + Middleware)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │   Auth   │  │   CVs    │  │   ATS    │  │    Optimizer     │ │
│  │  Module  │  │  Module  │  │  Module  │  │      Module      │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│       │             │             │                  │           │
│  ┌────┴─────────────┴─────────────┴──────────────────┴────────┐ │
│  │                    Core Services Layer                      │ │
│  │   (DI Container • Error Handling • Logging • Validation)   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  External Integrations                       │ │
│  │     AI Providers  •  Storage (S3/Local)  •  PDF Engine      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB        Redis/BullMQ        Background Workers          │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Pattern | Implementation |
|---------|----------------|
| **Dependency Injection** | Centralized container (`@core/container`) for all service instantiation |
| **Module Aliases** | Clean imports via `@core`, `@modules`, `@shared` — no `../../../` paths |
| **Repository Pattern** | Data access abstraction for testability and flexibility |
| **Strategy Pattern** | Swappable AI providers without code changes |
| **Chain of Responsibility** | Middleware pipeline for auth, validation, and error handling |

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Caching/Queue** | Redis + BullMQ |
| **AI Providers** | OpenAI, Anthropic Claude, Google Gemini, HuggingFace, Ollama |
| **PDF Processing** | pdf-parse, Puppeteer, PDFKit |
| **Authentication** | JWT (Access + Refresh tokens) |
| **Validation** | AJV (JSON Schema) + Joi |
| **Logging** | Winston with daily rotation |
| **Testing** | Jest + Supertest |
| **Documentation** | Swagger/OpenAPI |

---

## 📡 API Reference

### Core Endpoints

| Module | Base Path | Key Endpoints |
|--------|-----------|---------------|
| **Auth** | `/v1/auth` | `POST /register`, `POST /login`, `POST /refresh` |
| **CVs** | `/v1/cvs` | `POST /upload`, `GET /`, `GET /:id`, `PUT /:id` |
| **Parsing** | `/v1/parse` | `POST /`, `GET /:jobId/result` |
| **ATS** | `/v1/cv-ats` | `POST /`, `GET /:id/result` |
| **Optimizer** | `/v1/optimize` | `POST /sections`, `POST /tailor` |
| **Generation** | `/v1/generation` | `POST /`, `GET /:jobId/download` |
| **Jobs** | `/v1/jobs` | `GET /:id`, `POST /:id/retry` |

Full API documentation available at `/api-docs` (Swagger UI).

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+
- Docker (optional, for containerized setup)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/HythamTag/careerforge-backend.git
cd careerforge-backend/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start services (MongoDB, Redis)
docker-compose -f docker/docker-compose.core.yml up -d

# Run the application
npm run dev          # API server (port 5000)
npm run worker       # Background worker (separate terminal)
```

### Environment Variables

```env
# Core
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/careerforge
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secure-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI Provider (choose one)
AI_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
# Or for cloud providers:
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-...
```

---

## 🐳 Deployment

### Railway (Recommended)

This project is optimized for Railway deployment with a hybrid architecture:
- **Backend + MongoDB + Redis** → Railway Cloud
- **Ollama AI** → Local GPU via ngrok tunnel

See [docs/deployment/RAILWAY-DEPLOYMENT.md](./docs/deployment/RAILWAY-DEPLOYMENT.md) for detailed instructions.

### Docker

```bash
# Build and run all services
docker-compose up -d

# Or build individually
docker build -t careerforge-backend -f Dockerfile .
docker build -t careerforge-worker -f Dockerfile.worker .
```

---

## 📂 Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Entry point
│   ├── core/                  # Shared infrastructure
│   │   ├── config/            # Environment & module configs
│   │   ├── container/         # Dependency injection
│   │   ├── errors/            # Custom error classes
│   │   ├── middleware/        # Express middleware
│   │   └── utils/             # Utilities & helpers
│   ├── modules/               # Feature modules
│   │   ├── auth/              # Authentication & authorization
│   │   ├── cvs/               # CV management & versioning
│   │   ├── cv-parsing/        # AI-powered parsing
│   │   ├── cv-ats/            # ATS scoring & analysis
│   │   ├── cv-optimizer/      # Content optimization
│   │   └── cv-generation/     # PDF/DOCX generation
│   └── shared/                # Shared services
│       ├── external/          # Third-party integrations
│       │   ├── ai/            # Multi-provider AI service
│       │   ├── pdf/           # PDF processing
│       │   └── storage/       # File storage (S3/Local)
│       └── messaging/         # BullMQ queues & workers
├── tests/                     # Test suites
├── docs/                      # Documentation
└── scripts/                   # Utility scripts
```

---

## 🧪 Testing

```bash
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:cv          # CV processing tests
```

---

## 📈 Performance

- **CV Parsing**: ~30-40 seconds for complex multi-page CVs
- **ATS Analysis**: ~15-20 seconds per CV
- **PDF Generation**: ~5-10 seconds per document
- **Concurrent Processing**: Supports 4+ parallel AI operations

---

## 🤝 Contributing

Contributions are welcome! Please read the [Development Handbook](./docs/DEVELOPMENT_HANDBOOK.md) for coding standards and best practices.

---

## 📄 License

ISC License

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/HythamTag">Hytham Tag</a>
</p>
