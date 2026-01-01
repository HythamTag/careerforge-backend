# 🚀 Railway Deployment Guide

## Architecture
```
GitHub → Railway (Backend + MongoDB + Redis)
              ↓
         Your PC (Ollama + GPU via ngrok)
```

---

## Step 1: Install ngrok

1. Go to [ngrok.com](https://ngrok.com)
2. Sign up (free account)
3. Download ngrok for Windows
4. Run: `ngrok config add-authtoken YOUR_TOKEN`

---

## Step 2: Push to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/cv-enhancer.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your `cv-enhancer` repository
5. Railway will auto-detect and deploy!

---

## Step 4: Add MongoDB & Redis

In Railway dashboard:

1. Click **"New"** → **"Database"** → **"Add MongoDB"**
2. Click **"New"** → **"Database"** → **"Add Redis"**
3. Railway auto-creates connection URLs

---

## Step 5: Configure Environment Variables

In Railway → Your Service → **Variables**, add:

```env
# Node
NODE_ENV=production
PORT=5000

# MongoDB (auto-filled by Railway)
MONGODB_URI=${{MongoDB.MONGO_URL}}

# Redis (auto-filled by Railway)
REDIS_URL=${{Redis.REDIS_URL}}

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Ollama (will be filled after Step 6)
OLLAMA_PARSER_HOST=https://YOUR-PARSER-URL.ngrok-free.app
OLLAMA_OPTIMIZER_HOST=https://YOUR-OPTIMIZER-URL.ngrok-free.app
OLLAMA_ATS_HOST=https://YOUR-ATS-URL.ngrok-free.app

# Storage (local for now)
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./uploads
```

---

## Step 6: Expose Your Local Ollama

On your PC:

1. **Start Docker services:**
   ```bash
   START.bat
   ```

2. **Run the ngrok script:**
   ```bash
   EXPOSE_OLLAMA.bat
   ```

3. **Copy the HTTPS URLs** from the ngrok windows

4. **Paste them into Railway** environment variables (from Step 5)

---

## Step 7: Deploy Worker (Optional)

If you want the worker on Railway too:

1. In Railway, click **"New Service"**
2. Select same GitHub repo
3. Set **Start Command**: `cd backend && node -r module-alias/register src/shared/messaging/workers/unified.worker.js`
4. Use same environment variables

---

## Auto-Deploy on Git Push

Railway automatically redeploys when you push to `main`:

```bash
git add .
git commit -m "Updated feature"
git push origin main
# Railway deploys automatically! 🎉
```

---

## Testing Your Deployment

1. Get your Railway URL: `https://YOUR-APP.up.railway.app`
2. Test health: `https://YOUR-APP.up.railway.app/health`
3. Share with frontend dev!

---

## Important Notes

⚠️ **Your PC must be ON** for AI features to work (Ollama runs locally)

⚠️ **ngrok URLs change** on free tier when you restart (use paid ngrok for static URLs)

✅ **Railway free tier**: 500 hours/month (enough for demos)

---

## Troubleshooting

### Railway deployment fails
- Check build logs in Railway dashboard
- Ensure `package.json` has correct scripts

### Can't connect to Ollama
- Verify ngrok is running (`EXPOSE_OLLAMA.bat`)
- Check Railway environment variables match ngrok URLs
- Test ngrok URL directly: `https://YOUR-URL.ngrok-free.app/api/tags`

### MongoDB connection error
- Ensure MongoDB plugin is added in Railway
- Check `MONGODB_URI` variable is set correctly

---

## Next Steps

- [ ] Set up custom domain (Railway supports this)
- [ ] Add SSL certificate (Railway auto-provides)
- [ ] Monitor logs in Railway dashboard
- [ ] Consider upgrading ngrok for static URLs
