# 🚀 Quick Deploy Checklist

## Prerequisites
- [ ] GitHub account
- [ ] Railway account ([railway.app](https://railway.app))
- [ ] ngrok account ([ngrok.com](https://ngrok.com))

## Deployment Steps

### 1. Push to GitHub (5 min)
```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/cv-enhancer.git
git push -u origin main
```

### 2. Deploy to Railway (3 min)
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `cv-enhancer`
4. Add MongoDB plugin
5. Add Redis plugin

### 3. Set Environment Variables (2 min)
In Railway dashboard → Variables:
```
NODE_ENV=production
JWT_SECRET=your-secret-key-here
MONGODB_URI=${{MongoDB.MONGO_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

### 4. Expose Local Ollama (5 min)
On your PC:
```bash
# Start Docker
START.bat

# Expose via ngrok
EXPOSE_OLLAMA.bat
```

Copy the 3 ngrok URLs and add to Railway:
```
OLLAMA_PARSER_HOST=https://abc123.ngrok-free.app
OLLAMA_OPTIMIZER_HOST=https://def456.ngrok-free.app
OLLAMA_ATS_HOST=https://ghi789.ngrok-free.app
```

### 5. Test Deployment
```bash
curl https://YOUR-APP.up.railway.app/health
```

## Done! 🎉

Your backend is now live at: `https://YOUR-APP.up.railway.app`

Share this URL with your frontend developer!

---

## Auto-Deploy
Every time you push to GitHub, Railway automatically redeploys:
```bash
git add .
git commit -m "New feature"
git push
# Railway deploys automatically!
```

---

## Keep Your PC On
Remember: Your PC must be running for AI features to work (Ollama is local).

For 24/7 availability, consider upgrading to DigitalOcean with your student credits.
