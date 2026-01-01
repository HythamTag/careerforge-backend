# CV Enhancer - Quick Deploy Checklist

Use this checklist to ensure you complete all deployment steps.

## ✅ Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] Fly.io account created
- [ ] Fly.io CLI installed (`flyctl version` works)

## ✅ Step 1: Cloud Services

- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster created (M0 free tier)
- [ ] Database user created
- [ ] Network access configured (0.0.0.0/0)
- [ ] MongoDB connection string saved
- [ ] Redis Cloud account created
- [ ] Redis database created (30MB free tier)
- [ ] Redis connection details saved (host, port, password)

## ✅ Step 2: Dockerfile

- [ ] `backend/Dockerfile` created
- [ ] `backend/.dockerignore` created
- [ ] Dockerfile tested locally (optional)

## ✅ Step 3: Backend Deployment

- [ ] Logged into Fly.io (`flyctl auth login`)
- [ ] Backend app initialized (`flyctl launch` in backend folder)
- [ ] `fly.toml` updated with correct configuration
- [ ] All secrets set:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=8080`
  - [ ] `MONGODB_URI` (from MongoDB Atlas)
  - [ ] `REDIS_HOST` (from Redis Cloud)
  - [ ] `REDIS_PORT` (from Redis Cloud)
  - [ ] `REDIS_PASSWORD` (from Redis Cloud)
  - [ ] `JWT_SECRET` (random secure string)
  - [ ] `CORS_ALLOWED_ORIGINS` (frontend domain)
- [ ] Backend deployed (`flyctl deploy`)
- [ ] Health check passed (`curl https://your-app.fly.dev/health`)

## ✅ Step 4: Ollama Deployment

- [ ] `docker/Dockerfile.ollama` created
- [ ] Ollama app initialized (`flyctl launch` in docker folder)
- [ ] Ollama `fly.toml` configured
- [ ] Volume created for models (`flyctl volumes create`)
- [ ] Ollama deployed
- [ ] Model pulled (`ollama pull llama3.2:1b`)
- [ ] Backend connected to Ollama (OLLAMA_HOST secret set)

## ✅ Step 5: Puppeteer Deployment

- [ ] `docker/Dockerfile.puppeteer` created
- [ ] Puppeteer app initialized
- [ ] Puppeteer deployed
- [ ] Backend connected to Puppeteer (PUPPETEER_WS_ENDPOINT secret set)

## ✅ Step 6: GitHub Actions

- [ ] Fly.io API token created
- [ ] Token added to GitHub Secrets (`FLY_API_TOKEN`)
- [ ] `.github/workflows/deploy.yml` created
- [ ] Tested auto-deployment (push to main branch)

## ✅ Step 7: Worker Deployment (Optional)

- [ ] `backend/Dockerfile.worker` created
- [ ] Worker app initialized
- [ ] Worker secrets configured (same as backend)
- [ ] Worker deployed

## ✅ Step 8: Testing

- [ ] Health endpoint works
- [ ] User registration works
- [ ] User login works
- [ ] API returns JWT token
- [ ] Logs show no errors

## ✅ Final Steps

- [ ] API URL saved: `https://cv-enhancer-backend.fly.dev/v1`
- [ ] Frontend engineer notified with API URL
- [ ] Public endpoints documented
- [ ] Deployment guide shared

---

## 🚨 Common Issues

**Backend won't start:**
- Check logs: `flyctl logs --app cv-enhancer-backend`
- Verify all secrets are set: `flyctl secrets list --app cv-enhancer-backend`
- Check MongoDB connection string format

**Ollama not working:**
- Verify model is pulled: `flyctl ssh console --app cv-enhancer-ollama` then `ollama list`
- Check OLLAMA_HOST secret points to internal URL

**Auto-deploy not working:**
- Verify FLY_API_TOKEN in GitHub Secrets
- Check GitHub Actions tab for errors
- Ensure workflow file is in `.github/workflows/`

---

**Ready to deploy?** Follow `DEPLOYMENT-GUIDE.md` step by step!
