# CareerForge - API Documentation

Welcome to the API documentation for CV Enhancer. This documentation is automatically synchronized with the backend implementation.

## 📁 Documentation Structure

- **[API Reference](./API-REFERENCE.md)** - Complete list of all endpoints and their usage.
- **[Schemas](./schemas/)** - Detailed data structures for requests and responses.
- **[Archive](./archive/)** - Legacy and outdated documentation.

## 🚀 Key Modules

| Module | Base Path | Description |
|--------|-----------|-------------|
| **Auth** | `/v1/auth` | User registration, login, and security |
| **CVs** | `/v1/cvs` | Core CV management and versioning |
| **CV Parsing** | `/v1/parse` | AI-powered data extraction from files |
| **CV ATS** | `/v1/cv-ats` | ATS scoring and optimization analysis |
| **CV Optimizer**| `/v1/optimize` | Content optimization and tailoring |
| **CV Generation**| `/v1/generation`| Professional PDF generation |
| **Jobs** | `/v1/jobs` | Background job tracking and control |
| **Users** | `/v1/users` | User profile and account management |
| **Health** | `/v1/health` | System monitoring and health checks |
| **Webhooks** | `/v1/webhooks`| Event notifications and integration |

## 🛠 Usage Notes

- **Base URL**: `http://localhost:5000/v1` (Local) or your Railway URL for Production.
- **Authentication**: Most endpoints require a `Bearer <token>` in the `Authorization` header.
- **Content-Type**: All requests and responses use `application/json` unless noted otherwise.

---
**Last Updated**: 2026-01-01
