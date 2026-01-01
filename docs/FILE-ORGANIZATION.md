# CV Enhancer - File Organization

This document describes the organization and location of all project files.

## 📁 Project Structure

```
CV Enhancer/
├── backend/                    # Backend Node.js application
│   ├── Dockerfile              # Main backend Docker image
│   ├── Dockerfile.worker       # Worker process Docker image
│   ├── .dockerignore           # Docker build exclusions
│   ├── src/                    # Source code
│   ├── config/                 # Configuration files
│   ├── scripts/                # Utility scripts
│   └── tests/                  # Test files
│
├── frontend/                   # Frontend React application
│   ├── src/                    # Source code
│   └── dist/                   # Build output
│
├── docker/                     # Docker-related files
│   ├── Dockerfile.ollama       # Ollama AI service Dockerfile
│   ├── Dockerfile.puppeteer    # Puppeteer PDF service Dockerfile
│   ├── docker-compose.core.yml # Core services (MongoDB, Redis)
│   ├── docker-compose.ollama-gpu.yml  # Ollama with GPU
│   ├── docker-compose.puppeteer.yml   # Puppeteer service
│   └── *.bat                   # Docker management scripts
│
├── docs/                       # Documentation
│   ├── deployment/             # Deployment documentation
│   │   ├── RAILWAY-DEPLOYMENT.md      # Recommended deployment guide
│   │   ├── QUICK-START-CHECKLIST.md   # Deployment checklist
│   │   ├── README.md                  # Deployment docs index
│   │   └── archive/                   # Legacy guides (Fly.io)
│   └── api/                    # API documentation
│       └── schemas/            # API schemas
│
├── .github/                    # GitHub configuration
│   └── workflows/              # GitHub Actions workflows
│       └── deploy.yml          # Auto-deployment workflow
│
├── scripts/                    # Project utility scripts
│   ├── start/                  # Start scripts
│   └── stop/                   # Stop scripts
│
└── [Root Level Files]
    ├── INSTALL-DOCKER.bat      # Docker installation script
    ├── REINSTALL-DOCKER-IMAGES.bat  # Docker image reinstall
    ├── CLEANUP.bat             # Cleanup script
    ├── CLEAN-DATABASE.bat      # Database cleanup
    ├── SETUP.bat               # Setup script
    ├── START.bat               # Start all services
    ├── STOP.bat                # Stop all services
    ├── TEST.bat                # Test script
    ├── EXPOSE_OLLAMA.bat       # tunnel local GPU via ngrok
    └── railway.json            # Railway deployment config
```

## 📍 File Locations

### Deployment Files

| File | Location | Purpose |
|------|----------|---------|
| Deployment Guide | `docs/deployment/RAILWAY-DEPLOYMENT.md` | Recommended hybrid cloud instructions |
| Deployment Checklist | `docs/deployment/QUICK-START-CHECKLIST.md` | Quick deployment checklist |
| Deployment README | `docs/deployment/README.md` | Deployment docs index |

### Docker Files

| File | Location | Purpose |
|------|----------|---------|
| Backend Dockerfile | `backend/Dockerfile` | Main backend Docker image |
| Worker Dockerfile | `backend/Dockerfile.worker` | Worker process Docker image |
| Ollama Dockerfile | `docker/Dockerfile.ollama` | Ollama AI service |
| Puppeteer Dockerfile | `docker/Dockerfile.puppeteer` | Puppeteer PDF service |
| Docker ignore | `backend/.dockerignore` | Docker build exclusions |

### CI/CD Files

| File | Location | Purpose |
|------|----------|---------|
| GitHub Actions | `.github/workflows/deploy.yml` | Auto-deployment workflow |

### Docker Compose Files

| File | Location | Purpose |
|------|----------|---------|
| Core Services | `docker/docker-compose.core.yml` | MongoDB + Redis |
| Ollama GPU | `docker/docker-compose.ollama-gpu.yml` | Ollama with GPU support |
| Puppeteer | `docker/docker-compose.puppeteer.yml` | Puppeteer service |

## ✅ Organization Rules

1. **Documentation** → `docs/` folder
   - Deployment docs → `docs/deployment/`
   - API docs → `docs/api/`

2. **Dockerfiles** → Next to their service
   - Backend Dockerfiles → `backend/`
   - Docker service Dockerfiles → `docker/`

3. **CI/CD** → `.github/workflows/`

4. **Scripts** → Organized by purpose
   - Docker scripts → `docker/`
   - Service scripts → `scripts/start/` and `scripts/stop/`
   - Utility scripts → Root level (for easy access)

5. **Configuration** → With their respective services
   - Backend config → `backend/config/`
   - Docker config → `docker/`

## 🎯 Quick Reference

**Need to deploy?**
→ Read `docs/deployment/RAILWAY-DEPLOYMENT.md`

**Need to check deployment status?**
→ Use `docs/deployment/QUICK-START-CHECKLIST.md`

**Need Docker files?**
→ Check `backend/` and `docker/` folders

**Need CI/CD config?**
→ Check `.github/workflows/`

---

**Last Updated:** 2024-12-31
