# Deployment Documentation

This folder contains all deployment-related documentation for the CareerForge project.

## 📚 Documentation Files

- **[RAILWAY-DEPLOYMENT.md](./RAILWAY-DEPLOYMENT.md)** - *Recommended:* Hybrid cloud + local GPU setup (Railway + ngrok)
- **[QUICK-START-CHECKLIST.md](./QUICK-START-CHECKLIST.md)** - Deployment checklist for Railway
- **[Archive](./archive/)** - Legacy deployment guides (Fly.io)

## 📁 File Organization

### Dockerfiles
- `backend/Dockerfile` - Main backend application Dockerfile
- `backend/Dockerfile.worker` - Worker process Dockerfile
- `docker/Dockerfile.ollama` - Ollama AI service Dockerfile
- `docker/Dockerfile.puppeteer` - Puppeteer PDF service Dockerfile

### Docker Configuration
- `backend/.dockerignore` - Files to exclude from backend Docker build

### CI/CD
- `.github/workflows/deploy.yml` - GitHub Actions workflow for automatic deployment

## 🚀 Quick Start

1. Read [RAILWAY-DEPLOYMENT.md](./RAILWAY-DEPLOYMENT.md) for complete instructions
2. Use [QUICK-START-CHECKLIST.md](./QUICK-START-CHECKLIST.md) to track your progress

## 📖 Related Documentation

- API Documentation: `../api/`
- Backend README: `../../backend/README.md`
- Docker README: `../../docker/README.md`
