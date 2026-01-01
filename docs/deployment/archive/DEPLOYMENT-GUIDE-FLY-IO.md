# CV Enhancer - Complete Deployment Guide

**Complete step-by-step guide to deploy CV Enhancer backend to Fly.io with automatic GitHub deployments.**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Set Up Cloud Services](#step-1-set-up-cloud-services)
3. [Step 2: Create Dockerfile](#step-2-create-dockerfile)
4. [Step 3: Deploy Backend to Fly.io](#step-3-deploy-backend-to-flyio)
5. [Step 4: Deploy Ollama (Free AI)](#step-4-deploy-ollama-free-ai)
6. [Step 5: Deploy Puppeteer (PDF Generation)](#step-5-deploy-puppeteer-pdf-generation)
7. [Step 6: Set Up GitHub Actions (Auto-Deploy)](#step-6-set-up-github-actions-auto-deploy)
8. [Step 7: Configure Environment Variables](#step-7-configure-environment-variables)
9. [Step 8: Test Your Deployment](#step-8-test-your-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ GitHub account
- ✅ Fly.io account (free tier available)
- ✅ Node.js 18+ installed locally
- ✅ Git installed
- ✅ Code pushed to GitHub repository

---

## Step 1: Set Up Cloud Services

### 1.1 MongoDB Atlas (Free Database)

**Why:** Production databases should use managed services, not Docker containers.

1. **Sign up for MongoDB Atlas:**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Create a free account

2. **Create a Free Cluster:**
   - Click "Build a Database"
   - Choose **M0 Free Tier** (512MB storage)
   - Select region closest to you
   - Click "Create"

3. **Create Database User:**
   - Go to "Database Access" → "Add New Database User"
   - Username: `cv-enhancer-user`
   - Password: Create a strong password (save it!)
   - Database User Privileges: "Atlas admin"
   - Click "Add User"

4. **Configure Network Access:**
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String:**
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `cv_enhancer`
   - **Example:** `mongodb+srv://cv-enhancer-user:YourPassword@cluster0.xxxxx.mongodb.net/cv_enhancer?retryWrites=true&w=majority`
   - **Save this connection string!** You'll need it later.

### 1.2 Redis Cloud (Free Cache/Queue)

**Why:** Redis Cloud provides reliable, managed Redis with free tier.

1. **Sign up for Redis Cloud:**
   - Go to: https://redis.com/try-free/
   - Create a free account

2. **Create Free Database:**
   - Click "New Subscription"
   - Choose "Fixed" plan (free tier)
   - Select region closest to you
   - Click "Activate"

3. **Create Database:**
   - Click "New Database"
   - Name: `cv-enhancer-redis`
   - Memory: 30MB (free tier)
   - Click "Activate"

4. **Get Connection Details:**
   - Click on your database
   - Copy these values:
     - **Endpoint:** `redis-xxxxx.redis.cloud` (this is REDIS_HOST)
     - **Port:** `12345` (this is REDIS_PORT)
     - **Default user password:** (this is REDIS_PASSWORD)
   - **Save these values!** You'll need them later.

---

## Step 2: Create Dockerfile

Create `backend/Dockerfile` with this content:

```dockerfile
# ==========================================
# BUILD STAGE
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for module-alias)
RUN npm ci

# Copy source code
COPY . .

# ==========================================
# PRODUCTION STAGE
# ==========================================
FROM node:18-alpine AS production

# Create non-root user (SECURITY BEST PRACTICE)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code from builder
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/config ./config

# Switch to non-root user (SECURITY)
USER nodejs

# Expose port (Fly.io uses PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "-r", "module-alias/register", "src/server.js"]
```

Create `backend/.dockerignore`:

```
node_modules
npm-debug.log
.env
.env.local
.env.*.local
.git
.gitignore
README.md
tests
coverage
logs
*.log
uploads
temp
.vscode
.idea
*.swp
*.swo
.DS_Store
```

---

## Step 3: Deploy Backend to Fly.io

### 3.1 Install Fly.io CLI

**Windows (PowerShell as Administrator):**

```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Verify installation:**
```bash
flyctl version
```

### 3.2 Login to Fly.io

```bash
flyctl auth login
```

This opens a browser - sign in with your Fly.io account.

### 3.3 Initialize Backend App

```bash
# Navigate to backend folder
cd backend

# Initialize Fly.io app
flyctl launch
```

**Answer the prompts:**
- **App name:** `cv-enhancer-backend` (or choose your own)
- **Region:** Choose closest to you (e.g., `iad` for US East)
- **PostgreSQL:** `No` (we use MongoDB Atlas)
- **Redis:** `No` (we use Redis Cloud)
- **Deploy now:** `No` (we need to configure first)

This creates `fly.toml` in your backend folder.

### 3.4 Update fly.toml

Edit `backend/fly.toml`:

```toml
app = "cv-enhancer-backend"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

  [[http_service.checks]]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    timeout = "5s"
    path = "/health"

[[vm]]
  memory_mb = 512
  cpu_kind = "shared"
  cpus = 1
```

### 3.5 Set Environment Variables (Secrets)

Set all required secrets:

```bash
# Server Configuration
flyctl secrets set NODE_ENV="production" --app cv-enhancer-backend
flyctl secrets set PORT="8080" --app cv-enhancer-backend

# MongoDB (from Step 1.1)
flyctl secrets set MONGODB_URI="mongodb+srv://cv-enhancer-user:YourPassword@cluster0.xxxxx.mongodb.net/cv_enhancer?retryWrites=true&w=majority" --app cv-enhancer-backend

# Redis (from Step 1.2)
flyctl secrets set REDIS_HOST="redis-xxxxx.redis.cloud" --app cv-enhancer-backend
flyctl secrets set REDIS_PORT="12345" --app cv-enhancer-backend
flyctl secrets set REDIS_PASSWORD="your-redis-password" --app cv-enhancer-backend

# JWT Secret (generate a random string)
flyctl secrets set JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long" --app cv-enhancer-backend

# CORS - Add your frontend domain
flyctl secrets set CORS_ALLOWED_ORIGINS="https://your-frontend-domain.com,http://localhost:5173" --app cv-enhancer-backend

# AI Provider - We'll set Ollama later
flyctl secrets set AI_PROVIDER="ollama" --app cv-enhancer-backend

# Storage (local for now)
flyctl secrets set STORAGE_TYPE="local" --app cv-enhancer-backend

# Puppeteer (we'll set this after deploying Puppeteer)
# For now, leave default or set to Browserless.io
```

### 3.6 Deploy Backend

```bash
flyctl deploy --app cv-enhancer-backend
```

**Wait for deployment to complete.** You'll get a URL like: `https://cv-enhancer-backend.fly.dev`

### 3.7 Verify Backend Deployment

```bash
# Check status
flyctl status --app cv-enhancer-backend

# View logs
flyctl logs --app cv-enhancer-backend

# Test health endpoint
curl https://cv-enhancer-backend.fly.dev/health
```

---

## Step 4: Deploy Ollama (Free AI)

### 4.1 Create Ollama Dockerfile

Create `docker/Dockerfile.ollama`:

```dockerfile
FROM ollama/ollama:latest

# Expose Ollama port
EXPOSE 11434

# Ollama runs on CPU mode for free tier
ENV OLLAMA_HOST=0.0.0.0
ENV OLLAMA_NUM_GPU=0
ENV OLLAMA_LOW_VRAM=true

CMD ["ollama", "serve"]
```

### 4.2 Deploy Ollama to Fly.io

```bash
# Navigate to docker folder
cd docker

# Initialize Ollama app
flyctl launch --name cv-enhancer-ollama --dockerfile Dockerfile.ollama
```

**Answer prompts:**
- **Region:** Same as backend (e.g., `iad`)
- **PostgreSQL:** `No`
- **Redis:** `No`
- **Deploy now:** `No`

### 4.3 Update Ollama fly.toml

Edit `docker/fly.ollama.toml` (or the generated `fly.toml`):

```toml
app = "cv-enhancer-ollama"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile.ollama"

[env]
  OLLAMA_HOST = "0.0.0.0"
  OLLAMA_NUM_GPU = "0"
  OLLAMA_LOW_VRAM = "true"

[http_service]
  internal_port = 11434
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory_mb = 2048  # Need more memory for models
  cpu_kind = "shared"
  cpus = 2

# Volume for storing AI models
[[mounts]]
  source = "ollama_data"
  destination = "/root/.ollama"
```

### 4.4 Create Volume and Deploy

```bash
# Create volume for models
flyctl volumes create ollama_data --size 10 --app cv-enhancer-ollama

# Deploy Ollama
flyctl deploy --app cv-enhancer-ollama --config fly.ollama.toml
```

### 4.5 Pull AI Model

After deployment, pull a small model (for free tier):

```bash
# SSH into Ollama container
flyctl ssh console --app cv-enhancer-ollama

# Inside container, pull a small model
ollama pull llama3.2:1b

# Or even smaller
ollama pull qwen2:0.5b

# Exit
exit
```

### 4.6 Connect Backend to Ollama

```bash
# Set Ollama URL (internal Fly.io network)
flyctl secrets set OLLAMA_HOST="http://cv-enhancer-ollama.internal:11434" --app cv-enhancer-backend
flyctl secrets set AI_PROVIDER="ollama" --app cv-enhancer-backend
```

---

## Step 5: Deploy Puppeteer (PDF Generation)

### 5.1 Create Puppeteer Dockerfile

Create `docker/Dockerfile.puppeteer`:

```dockerfile
FROM browserless/chrome:latest

EXPOSE 3000

# Environment variables
ENV CONNECTION_TIMEOUT=300000
ENV MAX_CONCURRENT_SESSIONS=5
ENV PREBOOT_CHROME=true
ENV KEEP_ALIVE=true
```

### 5.2 Deploy Puppeteer

```bash
# In docker folder
cd docker

# Initialize Puppeteer app
flyctl launch --name cv-enhancer-puppeteer --dockerfile Dockerfile.puppeteer
```

**Answer prompts:**
- **Region:** Same as backend
- **PostgreSQL:** `No`
- **Redis:** `No`
- **Deploy now:** `No`

### 5.3 Update Puppeteer fly.toml

```toml
app = "cv-enhancer-puppeteer"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile.puppeteer"

[env]
  CONNECTION_TIMEOUT = "300000"
  MAX_CONCURRENT_SESSIONS = "5"
  PREBOOT_CHROME = "true"
  KEEP_ALIVE = "true"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory_mb = 2048
  cpu_kind = "shared"
  cpus = 1
```

### 5.4 Deploy Puppeteer

```bash
flyctl deploy --app cv-enhancer-puppeteer --config fly.puppeteer.toml
```

### 5.5 Connect Backend to Puppeteer

```bash
# Set Puppeteer WebSocket endpoint
flyctl secrets set PUPPETEER_WS_ENDPOINT="ws://cv-enhancer-puppeteer.internal:3000/chrome" --app cv-enhancer-backend
```

---

## Step 6: Set Up GitHub Actions (Auto-Deploy)

### 6.1 Get Fly.io API Token

1. Go to: https://fly.io/app/personal/tokens
2. Click "Create Token"
3. Name: `github-actions-deploy`
4. Copy the token (you'll only see it once!)

### 6.2 Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FLY_API_TOKEN`
5. Value: Paste your Fly.io token
6. Click **Add secret**

### 6.3 Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'
  workflow_dispatch:  # Allow manual trigger

jobs:
  deploy-backend:
    name: Deploy Backend
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Fly.io CLI
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy Backend
        working-directory: ./backend
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
        run: |
          flyctl deploy --remote-only --app cv-enhancer-backend
```

### 6.4 Test Auto-Deployment

```bash
# Make a small change
echo "# Test" >> backend/README.md

# Commit and push
git add backend/README.md
git commit -m "Test auto-deploy"
git push origin main

# Check GitHub Actions tab - deployment should start automatically!
```

---

## Step 7: Configure Environment Variables

### 7.1 Complete Secret List

Here's the complete list of secrets you need to set:

```bash
# ==========================================
# SERVER CONFIGURATION
# ==========================================
flyctl secrets set NODE_ENV="production" --app cv-enhancer-backend
flyctl secrets set PORT="8080" --app cv-enhancer-backend

# ==========================================
# DATABASE (MongoDB Atlas)
# ==========================================
flyctl secrets set MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/cv_enhancer?retryWrites=true&w=majority" --app cv-enhancer-backend

# ==========================================
# REDIS (Redis Cloud)
# ==========================================
flyctl secrets set REDIS_HOST="redis-xxxxx.redis.cloud" --app cv-enhancer-backend
flyctl secrets set REDIS_PORT="12345" --app cv-enhancer-backend
flyctl secrets set REDIS_PASSWORD="your-password" --app cv-enhancer-backend

# ==========================================
# JWT SECURITY
# ==========================================
flyctl secrets set JWT_SECRET="generate-random-256-bit-key-here" --app cv-enhancer-backend
flyctl secrets set JWT_ACCESS_TOKEN_EXPIRY="15m" --app cv-enhancer-backend
flyctl secrets set JWT_REFRESH_TOKEN_EXPIRY="7d" --app cv-enhancer-backend

# ==========================================
# CORS (Frontend Domain)
# ==========================================
flyctl secrets set CORS_ALLOWED_ORIGINS="https://your-frontend.com,http://localhost:5173" --app cv-enhancer-backend

# ==========================================
# AI CONFIGURATION (Ollama)
# ==========================================
flyctl secrets set AI_PROVIDER="ollama" --app cv-enhancer-backend
flyctl secrets set OLLAMA_HOST="http://cv-enhancer-ollama.internal:11434" --app cv-enhancer-backend
flyctl secrets set OLLAMA_TIMEOUT="120000" --app cv-enhancer-backend
flyctl secrets set AI_MODEL_PARSER_OLLAMA="llama3.2:1b" --app cv-enhancer-backend
flyctl secrets set AI_MODEL_OPTIMIZER_OLLAMA="llama3.2:1b" --app cv-enhancer-backend

# ==========================================
# PUPPETEER (PDF Generation)
# ==========================================
flyctl secrets set PUPPETEER_WS_ENDPOINT="ws://cv-enhancer-puppeteer.internal:3000/chrome" --app cv-enhancer-backend
flyctl secrets set PUPPETEER_TIMEOUT="30000" --app cv-enhancer-backend

# ==========================================
# STORAGE
# ==========================================
flyctl secrets set STORAGE_TYPE="local" --app cv-enhancer-backend

# ==========================================
# OPTIONAL: Rate Limiting
# ==========================================
flyctl secrets set RATE_LIMIT_UPLOADS="10" --app cv-enhancer-backend
flyctl secrets set RATE_LIMIT_WINDOW_MS="3600000" --app cv-enhancer-backend
```

### 7.2 View All Secrets

```bash
flyctl secrets list --app cv-enhancer-backend
```

---

## Step 8: Test Your Deployment

### 8.1 Test Health Endpoint

```bash
curl https://cv-enhancer-backend.fly.dev/health
```

**Expected response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### 8.2 Test API Endpoints

**Register a user:**
```bash
curl -X POST https://cv-enhancer-backend.fly.dev/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Login:**
```bash
curl -X POST https://cv-enhancer-backend.fly.dev/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 8.3 Check Logs

```bash
# Backend logs
flyctl logs --app cv-enhancer-backend

# Ollama logs
flyctl logs --app cv-enhancer-ollama

# Puppeteer logs
flyctl logs --app cv-enhancer-puppeteer
```

### 8.4 Check Status

```bash
# Backend status
flyctl status --app cv-enhancer-backend

# All apps
flyctl apps list
```

---

## Step 9: Deploy Worker (Background Jobs)

Your backend uses a worker process for background jobs. You have two options:

### Option A: Deploy Worker as Separate App (Recommended)

Create `backend/Dockerfile.worker`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

USER nodejs

CMD ["node", "-r", "module-alias/register", "--max-old-space-size=8192", "src/shared/messaging/workers/unified.worker.js"]
```

Deploy:

```bash
cd backend
flyctl launch --name cv-enhancer-worker --dockerfile Dockerfile.worker

# Set same secrets as backend
flyctl secrets set MONGODB_URI="..." --app cv-enhancer-worker
flyctl secrets set REDIS_HOST="..." --app cv-enhancer-worker
# ... (copy all secrets from backend)

flyctl deploy --app cv-enhancer-worker
```

### Option B: Use Fly.io Process Groups (Advanced)

Update `backend/fly.toml`:

```toml
[processes]
  app = "node -r module-alias/register src/server.js"
  worker = "node -r module-alias/register --max-old-space-size=8192 src/shared/messaging/workers/unified.worker.js"

[[services]]
  processes = ["app"]
  # ... existing config

[[services]]
  processes = ["worker"]
  # Worker doesn't need HTTP service
```

---

## Troubleshooting

### Backend Won't Start

**Check logs:**
```bash
flyctl logs --app cv-enhancer-backend
```

**Common issues:**
- Missing `MONGODB_URI` → Set it with `flyctl secrets set`
- Missing `JWT_SECRET` → Set it with `flyctl secrets set`
- Wrong `REDIS_HOST` → Check Redis Cloud dashboard

### Ollama Not Responding

**Check Ollama:**
```bash
flyctl ssh console --app cv-enhancer-ollama
ollama list
```

**Pull model if missing:**
```bash
ollama pull llama3.2:1b
```

### Puppeteer Connection Failed

**Check Puppeteer:**
```bash
flyctl logs --app cv-enhancer-puppeteer
```

**Verify endpoint:**
```bash
flyctl secrets list --app cv-enhancer-backend | grep PUPPETEER
```

### Database Connection Issues

**Test MongoDB connection:**
```bash
# From backend logs
flyctl logs --app cv-enhancer-backend | grep -i mongo
```

**Verify connection string format:**
- Should start with `mongodb+srv://`
- Password should be URL-encoded if it contains special characters

### Redis Connection Issues

**Test Redis:**
```bash
flyctl logs --app cv-enhancer-backend | grep -i redis
```

**Verify Redis Cloud:**
- Check Redis Cloud dashboard
- Ensure database is active
- Verify password is correct

---

## Quick Reference Commands

```bash
# Deploy backend
flyctl deploy --app cv-enhancer-backend

# View logs
flyctl logs --app cv-enhancer-backend

# Check status
flyctl status --app cv-enhancer-backend

# Set secret
flyctl secrets set KEY="value" --app cv-enhancer-backend

# List secrets
flyctl secrets list --app cv-enhancer-backend

# SSH into app
flyctl ssh console --app cv-enhancer-backend

# Restart app
flyctl restart --app cv-enhancer-backend

# Scale app
flyctl scale count 2 --app cv-enhancer-backend
```

---

## Your Public API URL

After deployment, your API will be available at:

**Base URL:** `https://cv-enhancer-backend.fly.dev/v1`

**Public Endpoints:**
- `GET /health` - Health check
- `POST /v1/auth/register` - Register user
- `POST /v1/auth/login` - Login
- `POST /v1/auth/refresh` - Refresh token

**Share this URL with your frontend engineer!**

---

## Next Steps

1. ✅ Backend deployed
2. ✅ Ollama deployed (free AI)
3. ✅ Puppeteer deployed
4. ✅ GitHub Actions set up
5. 📝 Share API URL with frontend engineer
6. 🎉 You're done!

---

## Support

- **Fly.io Docs:** https://fly.io/docs
- **Fly.io Discord:** https://fly.io/discord
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **Redis Cloud Docs:** https://redis.com/docs/cloud/

---

**Last Updated:** 2024-12-31
**Version:** 1.0.0
